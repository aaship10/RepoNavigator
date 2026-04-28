import asyncio
import json
import warnings
from fastapi import FastAPI, HTTPException, BackgroundTasks, Query as QueryParam
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import networkx as nx
from pydantic import BaseModel

# Suppress the deprecation warning for the demo
warnings.filterwarnings("ignore", category=FutureWarning)
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import Depends

# Schemas
from schemas import AnalyzeRequest, AnalyzeResponse, FileDetailsResponse

# Core Graph & Parsing Logic
from core.github_fetcher import fetch_repo_files, fetch_repo_commits, fetch_commit_stats, fetch_commit_files_delta
from core.parser import extract_dependencies, get_file_functions, get_file_apis
from core.graph_engine import (
    build_global_graph,
    extract_ego_graph_data,
    identify_entry_points,
    get_onboarding_path,
)

# AI & Database Services
from services.ai_service import generate_rag_summary 
from services.rag_service import answer_global_query, stream_global_query, client as groq_client
from services.evolution_service import calculate_graph_delta, generate_evolution_narrative
from database.chroma_store import (
    store_file_insight, 
    chroma_client, 
    get_repo_collection_name
)

# Auth & Database
from db import Base, engine, get_db
from models import User, History
from auth import (
    get_password_hash, 
    verify_password, 
    create_access_token, 
    get_current_user, 
    get_current_user_optional
)

Base.metadata.create_all(bind=engine)

app = FastAPI(title="RepoNav API", version="1.0.0")

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

# --- IN-MEMORY DATABASE (Hackathon Lifesaver) ---
SESSION_GRAPHS = {}
SESSION_FILES = {}
SESSION_URLS = {} # ADDED: To store the URL for commit fetching

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
            
            # Sleep for 15 seconds to bypass Gemini's Free Tier Rate Limits
            print(f"Sleeping for 15s to avoid 429 Quota Errors...")
            await asyncio.sleep(15) 
            
        except Exception as e:
            if "429" in str(e):
                print(f"🛑 Rate limit hit (429)! Skipping remaining files for now to avoid ban.")
                break
            print(f"⚠️ Failed to ingest {file_path}: {e}")
            
    print(f"✅ RAG ingestion complete for {repo_id}!")


# --- AUTH & HISTORY SCHEMAS ---
class UserCreate(BaseModel):
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

# --- AUTH ENDPOINTS ---
@app.post("/signup", response_model=Token)
def signup(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    new_user = User(email=user.email, hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access_token = create_access_token(data={"sub": new_user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/login", response_model=Token)
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    access_token = create_access_token(data={"sub": db_user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/history")
def get_user_history(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    history_records = db.query(History).filter(History.user_id == current_user.id).order_by(History.timestamp.desc()).all()
    return [
        {
            "id": h.id,
            "repo_url": h.repo_url,
            "repo_name": h.repo_name,
            "timestamp": h.timestamp,
        }
        for h in history_records
    ]


@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze_repo(
    request: AnalyzeRequest, 
    background_tasks: BackgroundTasks,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    try:
        files = fetch_repo_files(request.github_url)
        
        # Extract dependencies
        dependencies = extract_dependencies(files)
        
        # Build Graph
        G = build_global_graph(dependencies, list(files.keys()))
        
        # Save to memory
        repo_key = request.github_url.rstrip('/').split('/')[-1]
        SESSION_GRAPHS[repo_key] = G
        SESSION_FILES[repo_key] = files
        SESSION_URLS[repo_key] = request.github_url # Save URL for Time Machine
        
        # Get Entry Points
        entry_points = identify_entry_points(G)
        
        # Kick off background task
        background_tasks.add_task(process_and_store_summaries, repo_key, files)
        
        # Record history if logged in
        if current_user:
            from datetime import datetime
            
            existing_history = db.query(History).filter(
                History.user_id == current_user.id,
                History.repo_url == request.github_url
            ).first()

            if existing_history:
                # Bump the timestamp so it jumps to the top
                existing_history.timestamp = datetime.utcnow()
            else:
                history_entry = History(
                    user_id=current_user.id,
                    repo_url=request.github_url,
                    repo_name=repo_key
                )
                db.add(history_entry)
                
            db.commit()

        return {
            "status": "success",
            "github_url": request.github_url,
            "repo_id": repo_key,
            "total_files": len(files),
            "entry_points": entry_points,
            "file_tree": list(files.keys()),
            "edges": list(G.edges()),
            "onboarding_path": get_onboarding_path(G)
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ---------------------------------------------------------
# NEW TIME MACHINE ENDPOINTS
# ---------------------------------------------------------
@app.get("/repo/{repo_id}/commits")
async def get_commits(repo_id: str):
    if repo_id not in SESSION_URLS:
        raise HTTPException(status_code=404, detail="Repo URL not found in session. Please run /analyze first.")
    return fetch_repo_commits(SESSION_URLS[repo_id], limit=10)

@app.get("/repo/{repo_id}/commit-insights/{sha}")
async def get_commit_insights(repo_id: str, sha: str):
    if repo_id not in SESSION_URLS:
        raise HTTPException(status_code=404, detail="Repo URL not found.")
    
    # 1. Fetch the raw files that changed directly from the GitHub commit ref!
    github_url = SESSION_URLS[repo_id]
    delta = fetch_commit_files_delta(github_url, sha)
    
    # 2. Build Mini-Graphs locally for just these affected files
    # Old State
    dep_old = extract_dependencies(delta["old_files"])
    G_old = build_global_graph(dep_old, list(delta["old_files"].keys()))
    
    # New State
    dep_new = extract_dependencies(delta["new_files"])
    G_new = build_global_graph(dep_new, list(delta["new_files"].keys()))
    
    # 3. Use Evolution Service to calculate structural deltas
    delta_data = calculate_graph_delta(G_old, G_new)
    
    # Let's keep the additions/removals around for the UI to display diff numbers
    delta_data["message"] = delta["message"]
    delta_data["added_lines"] = delta["added_count"]
    delta_data["removed_lines"] = delta["removed_count"]
    
    # 4. Generate professional architectural diary narrative
    narrative = await generate_evolution_narrative(delta_data, groq_client, "llama-3.3-70b-versatile")
    if "unavailable" in narrative.lower(): # fallback if AI fails
        narrative = "I made some architectural adjustments to the codebase, shifting dependencies and modifying core file structures."

    return {
        "diffSummary": {
            "added": delta["added_count"],
            "removed": delta["removed_count"]
        },
        "narrative": narrative
    }


@app.get("/file-details/{repo_id}", response_model=FileDetailsResponse)
async def get_file_details(repo_id: str, file_path: str):
    """Optimized: Fetches insights directly from ChromaDB for zero-latency sidebar"""
    
    if repo_id not in SESSION_GRAPHS:
        raise HTTPException(status_code=404, detail="Repo not analyzed yet.")
        
    G = SESSION_GRAPHS[repo_id]
    graph_data = extract_ego_graph_data(G, file_path)
    
    # 2. Extract AST properties locally to merge with AI results later
    file_content = SESSION_FILES.get(repo_id, {}).get(file_path, "")
    local_functions = get_file_functions(file_path, file_content)
    final_apis = get_file_apis(file_path, file_content)

    # Prepare safe local fallbacks in case AI is still generating
    files = SESSION_FILES.get(repo_id, {})
    raw_code = files.get(file_path, "")
    local_functions = get_file_functions(file_path, raw_code)
    final_apis = get_file_apis(file_path, raw_code)
    
    try:
        collection_name = get_repo_collection_name(repo_id)
        collection = chroma_client.get_collection(name=collection_name)
        result = collection.get(ids=[file_path])
        
        if result and result['metadatas'] and len(result['metadatas']) > 0:
            saved_json = json.loads(result['metadatas'][0]["full_architectural_profile"])
            ai_insights = {
                "summary": saved_json.get("architectural_role", "Role not defined."),
                "functions": saved_json.get("exposed_interface", {}).get("exported_functions", []),
                "functions_used": saved_json.get("dependencies", {}).get("functions_used", []),
                "data_flow": saved_json.get("data_flow", {}).get("transformations", "No data flow tracked."),
                "external_apis": saved_json.get("dependencies", {}).get("external_apis", [])
            }

            # Merge AI purposes into final_functions
            ai_map = {
                f["name"].lower().strip(): f.get("purpose", "")
                for f in ai_insights.get("functions", [])
            }
            final_functions = [
                {
                    "name": f["name"],
                    "line": f.get("line", 0),
                    "purpose": ai_map.get(f["name"].lower().strip(), "")
                }
                for f in local_functions
            ]

            print(f"⚡ FAST RETRIEVAL: Loaded {file_path} from local DB.")
        else:
            raise ValueError("Metadata empty.")
            
    except Exception as e:
        print(f"⚠️ Cache miss for {file_path}: {e}")
        ai_insights = {
            "summary": "Summary pending background analysis...",
            "functions": [],
            "functions_used": [],
            "external_apis": [],
            "data_flow": ""
        }
        final_functions = local_functions

    return {
        "graph": graph_data,
        "ai_insights": ai_insights,
        "functions": final_functions,
        "apis": final_apis,
        "onboarding_path": get_onboarding_path(G, file_path)
    }


@app.get("/repo-evolution/{repo_id}")
async def get_repo_evolution(repo_id: str):
    """Compares current architecture against a mock past state for the timeline slider"""
    if repo_id not in SESSION_GRAPHS:
        raise HTTPException(status_code=404, detail="Repo not analyzed.")

    G_current = SESSION_GRAPHS[repo_id]
    nodes = list(G_current.nodes)
    
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
    """The main RAG Chatbot endpoint (Streaming version)"""
    if repo_id not in SESSION_FILES or repo_id not in SESSION_GRAPHS:
        raise HTTPException(status_code=404, detail="Repository not found.")
        
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


