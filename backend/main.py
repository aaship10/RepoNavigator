from fastapi import FastAPI, HTTPException, BackgroundTasks, Query as QueryParam
from fastapi.middleware.cors import CORSMiddleware
import networkx as nx
from pydantic import BaseModel
import asyncio

# Schemas
from schemas import AnalyzeRequest, AnalyzeResponse, FileDetailsResponse

# Core Graph & Parsing Logic
from core.github_fetcher import fetch_repo_files
from core.parser import extract_dependencies, get_file_functions, get_file_apis
from core.graph_engine import (
    build_global_graph,
    extract_ego_graph_data,
    identify_entry_points,
    get_onboarding_path,
)

# AI & Database Services
from services.ai_service import generate_file_insights, generate_rag_summary 
from services.rag_service import answer_global_query
from database.chroma_store import store_file_insight

app = FastAPI(title="RepoNav API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- IN-MEMORY DATABASE (Hackathon Lifesaver) ---
SESSION_GRAPHS = {}
SESSION_FILES = {}

def _get_session(repo_id: str):
    if repo_id not in SESSION_GRAPHS:
        raise HTTPException(
            status_code=404,
            detail=f"Session '{repo_id}' not found. Run /analyze first."
        )
    return SESSION_GRAPHS[repo_id], SESSION_FILES[repo_id]

# --- BACKGROUND INGESTION TASK ---
async def process_and_store_summaries(repo_id: str, raw_files: dict):
    """Runs in the background so the user doesn't wait for the /analyze endpoint"""
    print(f"⚙️ Starting deep RAG ingestion for {repo_id}...")
    
    for file_path, file_content in raw_files.items():
        try:
            # Generate the massive summary and push it to ChromaDB
            detailed_summary_json = await generate_rag_summary(file_path, file_content)
            store_file_insight(repo_id, file_path, detailed_summary_json)
            
            # 🛑 THE FIX: Sleep for 5 seconds to bypass Gemini's Free Tier Rate Limits
            print(f"Sleeping for 5s to avoid 429 Quota Errors...")
            await asyncio.sleep(5) 
            
        except Exception as e:
            print(f"⚠️ Failed to ingest {file_path}: {e}")
            
    print(f"✅ RAG ingestion complete for {repo_id}!")


@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze_repo(request: AnalyzeRequest, background_tasks: BackgroundTasks):
    try:
        files = fetch_repo_files(request.github_url)
        
        # 2. Extract dependencies
        dependencies = extract_dependencies(files)
        
        # 3. Build Graph
        G = build_global_graph(dependencies, list(files.keys()))
        
        # 4. Save to memory
        repo_key = request.github_url.rstrip('/').split('/')[-1]
        SESSION_GRAPHS[repo_key] = G
        SESSION_FILES[repo_key] = files
        
        # 5. Get Entry Points
        entry_points = identify_entry_points(G)
        
        # 6. KICK OFF CHROMADB INGESTION IN THE BACKGROUND!
        background_tasks.add_task(process_and_store_summaries, repo_key, files)
        
        return {
            "status": "success",
            "repo_id": repo_key,
            "total_files": len(files),
            "entry_points": entry_points,
            "file_tree": list(files.keys()) 
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/file-details/{repo_id}", response_model=FileDetailsResponse)
async def get_file_details(
    repo_id: str,
    file_path: str = QueryParam(..., description="Relative path of the file in the repo"),
):
    G, files = _get_session(repo_id)

    raw_code = files.get(file_path)
    if raw_code is None:
        raise HTTPException(
            status_code=404,
            detail=f"File '{file_path}' not found in session '{repo_id}'."
        )

    # 1. Ego subgraph (graph_engine — already working perfectly)
    graph_data = extract_ego_graph_data(G, file_path)

    # 2. Extract specific dependencies for this file
    file_dependencies = [
        edge["target"] for edge in graph_data["edges"] 
        if edge["source"] == file_path
    ]

    # 3. Get functions from local parser (added back)
    local_functions = get_file_functions(file_path, raw_code)
    final_functions = [
        {"name": f["name"], "line": f["line"], "purpose": ""}
        for f in local_functions
    ]

    # 4. Get external APIs/packages used in this file
    final_apis = get_file_apis(file_path, raw_code)

    # 5. Fetch directly from local ChromaDB!
    from database.chroma_store import chroma_client, get_repo_collection_name
    import json
    
    try:
        collection_name = get_repo_collection_name(repo_id)
        collection = chroma_client.get_collection(name=collection_name)
        
        # We saved the file_path as the exact ID in ChromaDB earlier
        result = collection.get(ids=[file_path])
        
        if result and result['metadatas'] and len(result['metadatas']) > 0:
            # Extract the massive JSON we saved during ingestion
            saved_json = json.loads(result['metadatas'][0]["full_architectural_profile"])
            
            # Format it to match what your React frontend is expecting
            ai_insights = {
                "summary": saved_json.get("architectural_role", "Role not defined."),
                "functions": saved_json.get("exposed_interface", {}).get("exported_functions", []),
                "data_flow": saved_json.get("data_flow", {}).get("transformations", "No data flow tracked.")
            }

            # Merge AI purposes into final_functions
            ai_map = {
                f["name"].lower().strip(): f.get("purpose", "")
                for f in ai_insights.get("functions", [])
            }
            final_functions = [
                {
                    "name": f["name"],
                    "line": f["line"],
                    "purpose": ai_map.get(f["name"].lower().strip(), "")
                }
                for f in local_functions
            ]

            print(f"⚡ FAST RETRIEVAL: Loaded {file_path} from local DB in 5ms!")
        else:
            raise ValueError("File not yet processed into database.")
            
    except Exception as e:
        print(f"⚠️ ChromaDB cache miss for {file_path}: {e}")
        ai_insights = {
            "summary": "Summary not available. Has the repo finished analyzing?",
            "functions": [],
            "data_flow": ""
        }

    return {
        "graph": graph_data,
        "ai_insights": ai_insights,
        "functions": final_functions,
        "apis": final_apis,
        "onboarding_path": get_onboarding_path(G)
    }


# --- THE NEW GLOBAL RAG ENDPOINT ---
class GlobalQueryRequest(BaseModel):
    query: str

@app.post("/ask-global/{repo_id}")
async def ask_global_question(repo_id: str, request: GlobalQueryRequest):
    """The endpoint for the conversational chatbot UI"""
    
    if repo_id not in SESSION_FILES or repo_id not in SESSION_GRAPHS:
        raise HTTPException(status_code=404, detail="Repository code not found in memory. Please click 'Analyze' first.")
        
    # Pass the query, raw files, AND the graph G to get those downstream dependencies!
    ai_response = await answer_global_query(
        repo_id=repo_id, 
        user_query=request.query, 
        raw_files_dict=SESSION_FILES[repo_id],
        G=SESSION_GRAPHS[repo_id] 
    )
    
    return ai_response