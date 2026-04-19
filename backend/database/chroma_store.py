import os
import json
import chromadb
from chromadb.utils import embedding_functions

# 1. Initialize a persistent client so your vectors survive Uvicorn reloads!
# It will create a hidden folder called 'chroma_data' in your backend directory.
CHROMA_DATA_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "chroma_data")
chroma_client = chromadb.PersistentClient(path=CHROMA_DATA_PATH)

# Use Chroma's default embedding model (all-MiniLM-L6-v2) 
# It is fast, runs locally, is completely free, and doesn't require an API key.
default_ef = embedding_functions.DefaultEmbeddingFunction()

def get_repo_collection_name(repo_id: str) -> str:
    """
    ChromaDB collection names have strict rules: 
    Must contain 3-63 characters, start/end with an alphanumeric character, 
    and contain only alphanumeric characters, underscores or hyphens.
    """
    safe_name = "".join([c if c.isalnum() else "_" for c in repo_id])
    return safe_name.lower().strip("_")

def store_file_insight(repo_id: str, file_path: str, ai_insights: dict):
    """
    Takes the rich JSON from Gemini, splits the short search string from the massive 
    metadata payload, and saves it to the isolated repo collection.
    """
    collection_name = get_repo_collection_name(repo_id)
    
    # Get or create the isolated collection for this specific repo
    collection = chroma_client.get_or_create_collection(
        name=collection_name, 
        embedding_function=default_ef
    )
    
    # 2. CREATE THE DENSE SEARCH STRING (Keeps it under 500 tokens!)
    # We gracefully use .get() in case the LLM hallucinates and misses a key
    role = ai_insights.get("architectural_role", "")
    concepts = ", ".join(ai_insights.get("searchable_concepts", []))
    queries = ", ".join(ai_insights.get("potential_query_matches", []))
    
    search_string = f"Role: {role}\nConcepts: {concepts}\nQuestions: {queries}"
    
    # 3. STORE THE MASSIVE JSON IN METADATA
    # Chroma metadata requires values to be flat strings, ints, or floats.
    metadata_payload = {
        "file_path": file_path,
        "full_architectural_profile": json.dumps(ai_insights)
    }
    
    # 4. INSERT OR UPDATE IN CHROMADB
    # Using upsert means if you re-analyze a repo, it updates the files instead of duplicating them
    collection.upsert(
        documents=[search_string],
        metadatas=[metadata_payload],
        ids=[file_path] 
    )
    print(f"✅ Stored vector for: {file_path}")

def search_global_query(repo_id: str, query: str, top_k: int = 5) -> list:
    """
    Searches the isolated repo collection for the closest architectural matches
    to the user's natural language question.
    """
    collection_name = get_repo_collection_name(repo_id)
    
    try:
        collection = chroma_client.get_collection(name=collection_name, embedding_function=default_ef)
    except ValueError:
        # If the collection doesn't exist, they haven't analyzed the repo yet.
        print(f"⚠️ Collection {collection_name} not found. Has the repo been analyzed?")
        return []

    # Perform the semantic search
    results = collection.query(
        query_texts=[query],
        n_results=min(top_k, collection.count()) # Safety check: Don't ask for 5 if there are only 3 files in the DB!
    )
    
    retrieved_files = []
    
    # Check if we found anything
    if not results['metadatas'] or not results['metadatas'][0]:
        return retrieved_files
        
    # Unpack the metadata to send to Llama 3
    for metadata in results['metadatas'][0]:
        retrieved_files.append({
            "file_path": metadata["file_path"],
            "summary_json": json.loads(metadata["full_architectural_profile"])
        })
        
    return retrieved_files