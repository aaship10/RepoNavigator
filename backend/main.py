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


import asyncio
import json
from fastapi.responses import StreamingResponse

@app.post("/analyze")
async def analyze_repo(request: AnalyzeRequest):
    async def generate():
        try:
            yield f"data: {json.dumps({'type': 'progress', 'value': 5, 'message': 'Initializing...'})}\n\n"
            await asyncio.sleep(0.1) # Small breathe for SSE
            
            # Progress callback for core functions
            def progress(val, msg):
                # We can't really yield from inside the deep functions easily with sync calls, 
                # so we'll just gather and yield here if we made them generators, 
                # OR we just pass a wrapper.
                pass

            # 1. Fetch raw code
            # Since fetch_repo_files is sync, we'll run it in a way that allows us to see progress 
            # if we had made it a generator. For now, let's just do it in stages.
            
            yield f"data: {json.dumps({'type': 'progress', 'value': 10, 'message': 'Connecting to GitHub...'})}\n\n"
            
            # For a hackathon, we can provide a slightly more granular simulation of stages 
            # while the sync function runs, OR refactor to generators.
            # I refactored the functions to take callbacks. Let's use them.
            
            def send_progress(val, msg):
                # This is tricky because fetch_repo_files is sync. 
                # In a real app we'd use async, but here we'll just yield after it's done or use a thread.
                # To keep it simple, I'll just yield at major milestones.
                pass

            files = fetch_repo_files(request.github_url, progress_callback=lambda v, m: None) 
            # Wait, I want to SEE progress. I'll yield between stages.
            
            yield f"data: {json.dumps({'type': 'progress', 'value': 40, 'message': f'Downloaded {len(files)} files...'})}\n\n"
            await asyncio.sleep(0.1)

            # 2. Extract dependencies
            yield f"data: {json.dumps({'type': 'progress', 'value': 60, 'message': 'Parsing Abstract Syntax Trees...'})}\n\n"
            dependencies = extract_dependencies(files)
            
            yield f"data: {json.dumps({'type': 'progress', 'value': 85, 'message': 'Building dependency graph...'})}\n\n"

            # 3. Build Graph
            G = build_global_graph(dependencies, list(files.keys()))
            
            # 4. Save to memory
            repo_key = request.github_url.rstrip('/').split('/')[-1]
            SESSION_GRAPHS[repo_key] = G
            SESSION_FILES[repo_key] = files
            
            # 5. Get Entry Points
            entry_points = identify_entry_points(G)
            
            final_data = {
                "status": "success",
                "repo_id": repo_key,
                "total_files": len(files),
                "entry_points": entry_points,
                "file_tree": list(files.keys()),
                "edges": [[src, tgt] for src, tgt in dependencies]
            }
            
            yield f"data: {json.dumps({'type': 'data', 'payload': final_data})}\n\n"
            yield f"data: {json.dumps({'type': 'progress', 'value': 100, 'message': 'Analysis Complete'})}\n\n"

        except Exception as e:
            print(f"❌ [main.py] Analysis failed: {e}")
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


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