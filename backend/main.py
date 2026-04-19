from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import networkx as nx
from pydantic import BaseModel
import asyncio

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
from services.ai_service import generate_file_insights, generate_rag_summary 
from services.rag_service import answer_global_query, stream_global_query
from database.chroma_store import store_file_insight

app = FastAPI(title="Repo Navigator API")

# Configure CORS
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure CORS
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
            
            # 🛑 THE FIX: Sleep for 15 seconds to bypass Gemini's Free Tier Rate Limits
            print(f"Sleeping for 15s to avoid 429 Quota Errors...")
            await asyncio.sleep(15) 
            
        except Exception as e:
            if "429" in str(e):
                print(f"🛑 Rate limit hit (429)! Skipping remaining files for now to avoid ban.")
                break
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
        
        # 6. KICK OFF CHROMADB INGESTION IN THE BACKGROUND!
        background_tasks.add_task(process_and_store_summaries, repo_key, files)
        
        return {
            "status": "success",
            "github_url": request.github_url,
            "repo_id": repo_key,
            "total_files": len(files),
            "entry_points": entry_points,
            "file_tree": list(files.keys()),
            "edges": list(G.edges())
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/file-details/{repo_id}", response_model=FileDetailsResponse)
async def get_file_details(repo_id: str, file_path: str):
    """Called when a user clicks a file in the sidebar"""
    
    if repo_id not in SESSION_GRAPHS:
        raise HTTPException(status_code=404, detail="Repo not analyzed yet. Please analyze the URL first.")
        
    G = SESSION_GRAPHS[repo_id]
    
    # 1. Get the Ego Graph data formatted for React Flow
    graph_data = extract_ego_graph_data(G, file_path)

    # 2. Extract specific dependencies for this file
    file_dependencies = [
        edge["target"] for edge in graph_data["edges"] 
        if edge["source"] == file_path
    ]

    # 3. Fetch directly from local ChromaDB!
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
        "onboarding_path": get_onboarding_path(G)
    }


# --- THE NEW GLOBAL RAG ENDPOINT ---
class GlobalQueryRequest(BaseModel):
    query: str

@app.post("/ask-global/{repo_id}")
async def ask_global_question(repo_id: str, request: GlobalQueryRequest):
    """The endpoint for the conversational chatbot UI (Streaming version)"""
    
    if repo_id not in SESSION_FILES or repo_id not in SESSION_GRAPHS:
        raise HTTPException(status_code=404, detail="Repository code not found in memory. Please click 'Analyze' first.")
        
    # Create the generator for StreamingResponse
    async def event_generator():
        async for chunk in stream_global_query(
            repo_id=repo_id, 
            user_query=request.query, 
            raw_files_dict=SESSION_FILES[repo_id],
            G=SESSION_GRAPHS[repo_id]
        ):
            yield f"data: {chunk}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

# --- REPORT GENERATION ENDPOINTS ---

from core.github_fetcher import gh
from services.report_service import get_github_report_stats, generate_report_insights

@app.get("/api/report/stats")
async def get_report_stats(owner: str, repo: str):
    try:
        stats = get_github_report_stats(gh, owner, repo)
        return {"status": "success", "data": stats}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/report/insights")
async def post_report_insights(request: dict):
    try:
        insights = await generate_report_insights(request)
        return {"status": "success", "data": insights}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


