import asyncio
import json
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import networkx as nx
from pydantic import BaseModel

# Schemas
from schemas import AnalyzeRequest, AnalyzeResponse, FileDetailsResponse

# Core Graph & Parsing Logic
from core.github_fetcher import fetch_repo_files
from core.parser import extract_dependencies
from core.graph_engine import (
    build_global_graph, 
    extract_ego_graph_data, 
    identify_entry_points,
    get_onboarding_path
)

# AI & Database Services
from services.ai_service import generate_rag_summary 
from services.rag_service import answer_global_query, client as groq_client
from services.evolution_service import calculate_graph_delta, generate_evolution_narrative
from database.chroma_store import (
    store_file_insight, 
    delete_repo_collection, 
    chroma_client, 
    get_repo_collection_name
)

app = FastAPI(title="Repo Navigator API")

# --- CRITICAL: CORS Setup ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- IN-MEMORY DATABASE (Hackathon Lifesaver) ---
SESSION_GRAPHS = {}
SESSION_FILES = {}

# --- BACKGROUND INGESTION TASK ---
async def process_and_store_summaries(repo_id: str, raw_files: dict):
    """Runs in the background so the user doesn't wait for the /analyze endpoint"""
    print(f"⚙️ Starting deep RAG ingestion for {repo_id}...")
    
    for file_path, file_content in raw_files.items():
        try:
            # Generate the massive summary and push it to ChromaDB
            detailed_summary_json = await generate_rag_summary(file_path, file_content)
            store_file_insight(repo_id, file_path, detailed_summary_json)
            
            # 🛑 THE FIX: Sleep for 5s to bypass Gemini Free Tier Rate Limits
            print(f"Sleeping for 5s to avoid 429 Quota Errors...")
            await asyncio.sleep(5) 
            
        except Exception as e:
            print(f"⚠️ Failed to ingest {file_path}: {e}")
            
    print(f"✅ RAG ingestion complete for {repo_id}!")


@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze_repo(request: AnalyzeRequest, background_tasks: BackgroundTasks):
    try:
        print(f"Fetching files for: {request.github_url}...")
        
        # 1. Fetch raw code
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
        
        # 6. 🧹 THE WIPER: Delete old collection before starting fresh ingestion
        delete_repo_collection(repo_key)
        
        # 7. KICK OFF CHROMADB INGESTION IN THE BACKGROUND!
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
async def get_file_details(repo_id: str, file_path: str):
    """Optimized: Fetches insights directly from ChromaDB for zero-latency sidebar"""
    
    if repo_id not in SESSION_GRAPHS:
        raise HTTPException(status_code=404, detail="Repo not analyzed yet.")
        
    G = SESSION_GRAPHS[repo_id]
    graph_data = extract_ego_graph_data(G, file_path)

    # 1. Attempt to fetch from Local Vector DB
    try:
        collection_name = get_repo_collection_name(repo_id)
        collection = chroma_client.get_collection(name=collection_name)
        result = collection.get(ids=[file_path])
        
        if result and result['metadatas'] and len(result['metadatas']) > 0:
            saved_json = json.loads(result['metadatas'][0]["full_architectural_profile"])
            ai_insights = {
                "summary": saved_json.get("architectural_role", "Role not defined."),
                "functions": saved_json.get("exposed_interface", {}).get("exported_functions", []),
                "data_flow": saved_json.get("data_flow", {}).get("transformations", "No data flow tracked.")
            }
            print(f"⚡ FAST RETRIEVAL: Loaded {file_path} from local DB.")
        else:
            raise ValueError("Metadata empty.")
            
    except Exception as e:
        print(f"⚠️ Cache miss for {file_path}: {e}")
        ai_insights = {
            "summary": "Summary pending background analysis...",
            "functions": [],
            "data_flow": ""
        }

    return {
        "graph": graph_data,
        "ai_insights": ai_insights,
        "onboarding_path": get_onboarding_path(G)
    }


@app.get("/repo-evolution/{repo_id}")
async def get_repo_evolution(repo_id: str):
    """Compares current architecture against a mock past state for the timeline slider"""
    if repo_id not in SESSION_GRAPHS:
        raise HTTPException(status_code=404, detail="Repo not analyzed.")

    G_current = SESSION_GRAPHS[repo_id]
    nodes = list(G_current.nodes)
    
    # MOCK: Simulate evolution by showing a state with 3 fewer files
    G_old = G_current.subgraph(nodes[:-3]) if len(nodes) > 3 else G_current

    delta = calculate_graph_delta(G_old, G_current)
    narrative = await generate_evolution_narrative(delta, groq_client, "llama-3.3-70b-versatile")

    return {
        "timeline_summary": narrative,
        "delta": delta,
        "snapshots": [
            {"commit": "baseline", "nodes": len(G_old.nodes), "edges": len(G_old.edges)},
            {"commit": "current", "nodes": len(G_current.nodes), "edges": len(G_current.edges)}
        ]
    }


class GlobalQueryRequest(BaseModel):
    query: str

@app.post("/ask-global/{repo_id}")
async def ask_global_question(repo_id: str, request: GlobalQueryRequest):
    """The main RAG Chatbot endpoint"""
    if repo_id not in SESSION_FILES or repo_id not in SESSION_GRAPHS:
        raise HTTPException(status_code=404, detail="Repository not found.")
        
    return await answer_global_query(
        repo_id=repo_id, 
        user_query=request.query, 
        raw_files_dict=SESSION_FILES[repo_id],
        G=SESSION_GRAPHS[repo_id] 
    )