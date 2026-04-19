import chromadb
import json

# 1. Connect to your persistent data folder
client = chromadb.PersistentClient(path="./chroma_data")

# 2. List all analyzed repositories (Collections)
collections = client.list_collections()
print(f"📂 Found {len(collections)} analyzed repositories:")

for coll in collections:
    print(f"\n--- Repository: {coll.name} ---")
    
    # 3. Get all entries for this repo
    # We fetch everything: the IDs, the Metadata (summaries), and the Documents
    data = coll.get()
    
    for i in range(len(data['ids'])):
        file_path = data['ids'][i]
        metadata = data['metadatas'][i]
        
        # Parse the JSON string we stored in the 'full_architectural_profile' field
        profile = json.loads(metadata.get("full_architectural_profile", "{}"))
        
        print(f"📍 File: {file_path}")
        print(f"   Role: {profile.get('architectural_role', 'N/A')}")
        print(f"   Concepts: {', '.join(profile.get('searchable_concepts', [])[:5])}...")
        print("-" * 30)