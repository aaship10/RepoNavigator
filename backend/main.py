from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.cors import CORSMiddleware
import networkx as nx

# Your existing fetcher and new schemas
from core.github_fetcher import fetch_repo_files
from schemas import AnalyzeRequest, AnalyzeResponse, FileDetailsResponse

# The core graph logic
from core.parser import extract_dependencies
from core.graph_engine import (
    build_global_graph, 
    extract_ego_graph_data, 
    identify_entry_points,
    get_onboarding_path
)

# Your Gemini AI Service
from services.ai_service import generate_file_insights 

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


@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze_repo(request: AnalyzeRequest):
    try:
        print(f"🚀 [main.py] Incoming analysis request for URL: {request.github_url}")
        
        # 1. Fetch raw code
        files = fetch_repo_files(request.github_url)
        
        file_keys = list(files.keys())
        print(f"✅ [main.py] Successfully fetched {len(file_keys)} files.")
        print(f"📄 [main.py] Sample files (first 3): {file_keys[:3]}")

        # 2. Extract dependencies
        dependencies = extract_dependencies(files)
        
        # 3. Build Graph
        # G = build_global_graph(dependencies)
        # Pass the list of all file paths into the graph builder
        G = build_global_graph(dependencies, list(files.keys()))
        
        # 4. Save to memory for the next API calls
        repo_key = request.github_url.rstrip('/').split('/')[-1]
        SESSION_GRAPHS[repo_key] = G
        SESSION_FILES[repo_key] = files
        
        # 5. Get Entry Points
        entry_points = identify_entry_points(G)
        
        return {
            "status": "success",
            "repo_id": repo_key,
            "total_files": len(files),
            "entry_points": entry_points,
            "file_tree": file_keys,
            "edges": [[src, tgt] for src, tgt in dependencies]
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
    
    # 2. Extract specific dependencies for this file to feed to Gemini
    # We look at the generated edges to see what this specific file imports
    file_dependencies = [
        edge["target"] for edge in graph_data["edges"] 
        if edge["source"] == file_path
    ]
    
    # 3. Get the raw code from our session memory
    raw_code = SESSION_FILES[repo_id].get(file_path, "Code not found.")
    
    # 4. 🧠 Call Gemini 1.5 Flash
    print(f"Asking Gemini to analyze {file_path}...")
    ai_insights = await generate_file_insights(file_path, raw_code, file_dependencies)
    
    return {
        "graph": graph_data,
        "ai_insights": ai_insights,
        "onboarding_path": get_onboarding_path(G)
    }

# Run this server using: uvicorn main:app --reload