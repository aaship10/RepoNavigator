# from fastapi import FastAPI, HTTPException, BackgroundTasks
# from fastapi.responses import StreamingResponse
# from fastapi.middleware.cors import CORSMiddleware
# import networkx as nx
# from pydantic import BaseModel
# import asyncio

# # Schemas
# from schemas import AnalyzeRequest, AnalyzeResponse, FileDetailsResponse

# # Core Graph & Parsing Logic
# from core.github_fetcher import fetch_repo_files
# from core.parser import extract_dependencies
# from core.graph_engine import (
#     build_global_graph, 
#     extract_ego_graph_data, 
#     identify_entry_points,
#     get_onboarding_path
# )

# # AI & Database Services
# from services.ai_service import generate_file_insights, generate_rag_summary 
# from services.rag_service import answer_global_query, stream_global_query
# from database.chroma_store import store_file_insight

# app = FastAPI(title="Repo Navigator API")

# # Configure CORS
# origins = [
#     "http://localhost:5173",
#     "http://localhost:3000",
#     "http://127.0.0.1:5173",
#     "http://127.0.0.1:3000",
# ]

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=origins,
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # Configure CORS
# origins = [
#     "http://localhost:5173",
#     "http://localhost:3000",
#     "http://127.0.0.1:5173",
#     "http://127.0.0.1:3000",
# ]

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=origins,
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # --- CRITICAL: CORS Setup ---
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"], 
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # --- IN-MEMORY DATABASE (Hackathon Lifesaver) ---
# SESSION_GRAPHS = {}
# SESSION_FILES = {}

# # --- BACKGROUND INGESTION TASK ---
# async def process_and_store_summaries(repo_id: str, raw_files: dict):
#     """Runs in the background so the user doesn't wait for the /analyze endpoint"""
#     print(f"⚙️ Starting deep RAG ingestion for {repo_id}...")
    
#     for file_path, file_content in raw_files.items():
#         try:
#             # Generate the massive summary and push it to ChromaDB
#             detailed_summary_json = await generate_rag_summary(file_path, file_content)
#             store_file_insight(repo_id, file_path, detailed_summary_json)
            
#             # 🛑 THE FIX: Sleep for 15 seconds to bypass Gemini's Free Tier Rate Limits
#             print(f"Sleeping for 15s to avoid 429 Quota Errors...")
#             await asyncio.sleep(15) 
            
#         except Exception as e:
#             if "429" in str(e):
#                 print(f"🛑 Rate limit hit (429)! Skipping remaining files for now to avoid ban.")
#                 break
#             print(f"⚠️ Failed to ingest {file_path}: {e}")
            
#     print(f"✅ RAG ingestion complete for {repo_id}!")


# @app.post("/analyze", response_model=AnalyzeResponse)
# async def analyze_repo(request: AnalyzeRequest, background_tasks: BackgroundTasks):
#     try:
#         print(f"Fetching files for: {request.github_url}...")
        
#         # 1. Fetch raw code
#         files = fetch_repo_files(request.github_url)
        
#         # 2. Extract dependencies
#         dependencies = extract_dependencies(files)
        
#         # 3. Build Graph
#         G = build_global_graph(dependencies, list(files.keys()))
        
#         # 4. Save to memory
#         repo_key = request.github_url.rstrip('/').split('/')[-1]
#         SESSION_GRAPHS[repo_key] = G
#         SESSION_FILES[repo_key] = files
        
#         # 5. Get Entry Points
#         entry_points = identify_entry_points(G)
        
#         # 6. KICK OFF CHROMADB INGESTION IN THE BACKGROUND!
#         background_tasks.add_task(process_and_store_summaries, repo_key, files)
        
#         return {
#             "status": "success",
#             "repo_id": repo_key,
#             "total_files": len(files),
#             "entry_points": entry_points,
#             "file_tree": list(files.keys()),
#             "edges": list(G.edges())
#         }
#     except Exception as e:
#         raise HTTPException(status_code=400, detail=str(e))


# @app.get("/file-details/{repo_id}", response_model=FileDetailsResponse)
# async def get_file_details(repo_id: str, file_path: str):
#     """Called when a user clicks a file in the sidebar"""
    
#     if repo_id not in SESSION_GRAPHS:
#         raise HTTPException(status_code=404, detail="Repo not analyzed yet. Please analyze the URL first.")
        
#     G = SESSION_GRAPHS[repo_id]
    
#     # 1. Get the Ego Graph data formatted for React Flow
#     graph_data = extract_ego_graph_data(G, file_path)

#     # 2. Extract specific dependencies for this file
#     file_dependencies = [
#         edge["target"] for edge in graph_data["edges"] 
#         if edge["source"] == file_path
#     ]

#     # 3. Fetch directly from local ChromaDB!
#     from database.chroma_store import chroma_client, get_repo_collection_name
#     import json
    
#     try:
#         collection_name = get_repo_collection_name(repo_id)
#         collection = chroma_client.get_collection(name=collection_name)
        
#         # We saved the file_path as the exact ID in ChromaDB earlier
#         result = collection.get(ids=[file_path])
        
#         if result and result['metadatas'] and len(result['metadatas']) > 0:
#             # Extract the massive JSON we saved during ingestion
#             saved_json = json.loads(result['metadatas'][0]["full_architectural_profile"])
            
#             # Format it to match what your React frontend is expecting
#             ai_insights = {
#                 "summary": saved_json.get("architectural_role", "Role not defined."),
#                 "functions": saved_json.get("exposed_interface", {}).get("exported_functions", []),
#                 "data_flow": saved_json.get("data_flow", {}).get("transformations", "No data flow tracked.")
#             }
#             print(f"⚡ FAST RETRIEVAL: Loaded {file_path} from local DB in 5ms!")
#         else:
#             raise ValueError("File not yet processed into database.")
            
#     except Exception as e:
#         print(f"⚠️ ChromaDB cache miss for {file_path}: {e}")
#         ai_insights = {
#             "summary": "Summary not available. Has the repo finished analyzing?",
#             "functions": [],
#             "data_flow": ""
#         }

#     return {
#         "graph": graph_data,
#         "ai_insights": ai_insights,
#         "onboarding_path": get_onboarding_path(G)
#     }


# # --- THE NEW GLOBAL RAG ENDPOINT ---
# class GlobalQueryRequest(BaseModel):
#     query: str

# @app.post("/ask-global/{repo_id}")
# async def ask_global_question(repo_id: str, request: GlobalQueryRequest):
#     """The endpoint for the conversational chatbot UI (Streaming version)"""
    
#     if repo_id not in SESSION_FILES or repo_id not in SESSION_GRAPHS:
#         raise HTTPException(status_code=404, detail="Repository code not found in memory. Please click 'Analyze' first.")
        
#     # Create the generator for StreamingResponse
#     async def event_generator():
#         async for chunk in stream_global_query(
#             repo_id=repo_id, 
#             user_query=request.query, 
#             raw_files_dict=SESSION_FILES[repo_id],
#             G=SESSION_GRAPHS[repo_id]
#         ):
#             yield f"data: {chunk}\n\n"

#     return StreamingResponse(event_generator(), media_type="text/event-stream")



from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import networkx as nx
from pydantic import BaseModel
from typing import List
import asyncio
import json

# Schemas
from schemas import AnalyzeRequest, AnalyzeResponse, FileDetailsResponse

# Core Graph & Parsing Logic
from core.github_fetcher import fetch_repo_files
from core.parser import extract_dependencies, generate_code_skeleton
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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- IN-MEMORY DATABASE ---
SESSION_GRAPHS = {}
SESSION_FILES = {}

# --- BACKGROUND INGESTION TASK ---
async def process_and_store_summaries(repo_id: str, raw_files: dict):
    print(f"⚙️ Starting deep RAG ingestion for {repo_id}...")
    for file_path, file_content in raw_files.items():
        try:
            detailed_summary_json = await generate_rag_summary(file_path, file_content)
            store_file_insight(repo_id, file_path, detailed_summary_json)
            print(f"Sleeping for 15s to avoid 429 Quota Errors...")
            await asyncio.sleep(15) 
        except Exception as e:
            if "429" in str(e):
                print(f"🛑 Rate limit hit (429)! Skipping remaining files.")
                break
            print(f"⚠️ Failed to ingest {file_path}: {e}")
    print(f"✅ RAG ingestion complete for {repo_id}!")


@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze_repo(request: AnalyzeRequest, background_tasks: BackgroundTasks):
    try:
        print(f"Fetching files for: {request.github_url}...")
        files = fetch_repo_files(request.github_url)
        dependencies = extract_dependencies(files)
        G = build_global_graph(dependencies, list(files.keys()))
        repo_key = request.github_url.rstrip('/').split('/')[-1]
        SESSION_GRAPHS[repo_key] = G
        SESSION_FILES[repo_key] = files
        entry_points = identify_entry_points(G)
        background_tasks.add_task(process_and_store_summaries, repo_key, files)
        return {
            "status": "success",
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
    if repo_id not in SESSION_GRAPHS:
        raise HTTPException(status_code=404, detail="Repo not analyzed yet.")
        
    G = SESSION_GRAPHS[repo_id]
    graph_data = extract_ego_graph_data(G, file_path)

    from database.chroma_store import chroma_client, get_repo_collection_name
    
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

    # Build ego-scoped onboarding path:
    # Get the 1-hop neighbourhood of the clicked file and sort it topologically
    ego = nx.ego_graph(G, file_path, radius=1, undirected=False) if file_path in G else nx.DiGraph()
    try:
        ego_path = list(reversed(list(nx.topological_sort(ego))))
    except nx.NetworkXUnfeasible:
        ego_path = sorted(ego.nodes(), key=lambda n: G.out_degree(n))

    # Put the clicked file first so it's always card #1
    if file_path in ego_path:
        ego_path.remove(file_path)
    ego_scoped_path = [file_path] + ego_path[:9]  # max 10 cards

    return {
        "graph": graph_data,
        "ai_insights": ai_insights,
        "onboarding_path": ego_scoped_path   # list of file-path strings
    }


# --- GLOBAL RAG ENDPOINT ---
class GlobalQueryRequest(BaseModel):
    query: str

@app.post("/ask-global/{repo_id}")
async def ask_global_question(repo_id: str, request: GlobalQueryRequest):
    if repo_id not in SESSION_FILES or repo_id not in SESSION_GRAPHS:
        raise HTTPException(status_code=404, detail="Repository not in memory. Please analyze first.")
    async def event_generator():
        async for chunk in stream_global_query(
            repo_id=repo_id, 
            user_query=request.query, 
            raw_files_dict=SESSION_FILES[repo_id],
            G=SESSION_GRAPHS[repo_id]
        ):
            yield f"data: {chunk}\n\n"
    return StreamingResponse(event_generator(), media_type="text/event-stream")


# --- ONBOARDING PATH ENDPOINT ---
# Accepts a specific list of file paths (ego-scoped from the clicked node)
class OnboardingRequest(BaseModel):
    file_paths: List[str]

@app.post("/onboarding-path/{repo_id}")
async def get_onboarding_cards(repo_id: str, request: OnboardingRequest):
    """
    Takes the ego-scoped file list for a clicked node and asks Groq
    to produce a step-by-step reading order with descriptions.
    """
    if repo_id not in SESSION_FILES:
        raise HTTPException(status_code=404, detail="Repo not analyzed yet.")

    files = SESSION_FILES[repo_id]
    path_files = [fp for fp in request.file_paths if fp in files]

    if not path_files:
        return {"cards": []}

    # Skeletonize each file to save tokens
    context_blocks = []
    for i, fp in enumerate(path_files):
        raw = files.get(fp, "")
        if not raw:
            continue
        skeleton = generate_code_skeleton(raw, fp)
        context_blocks.append(f"--- FILE {i + 1}: {fp} ---\n{skeleton}\n---")

    context_string = "\n\n".join(context_blocks)

    system_prompt = """You are a senior software architect onboarding a new developer into a codebase.
You are given a list of files centred around one entry point, in dependency order.
For each file write a short onboarding card.

Return ONLY valid JSON — no markdown, no backticks, no extra text.
Schema:
{
  "cards": [
    {
      "file": "exact/path/as/given",
      "step": 1,
      "desc": "One sentence: what this file does.",
      "why": "One sentence: why read it at this step."
    }
  ]
}
The array must have exactly one entry per file, in the same order as provided."""

    user_prompt = f"Files to explain (in reading order):\n\n{context_string}\n\nGenerate the JSON cards now."

    try:
        from groq import AsyncGroq
        from dotenv import load_dotenv
        import os
        load_dotenv()
        groq_client = AsyncGroq(api_key=os.getenv("GROQ_API_KEY"))

        completion = await groq_client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user",   "content": user_prompt}
            ],
            model="llama-3.3-70b-versatile",
            response_format={"type": "json_object"},
            temperature=0.2,
        )
        result = json.loads(completion.choices[0].message.content)
        return result

    except Exception as e:
        print(f"⚠️ Onboarding AI error: {e}")
        return {
            "cards": [
                {"file": fp, "step": i + 1, "desc": "Analysis pending.", "why": ""}
                for i, fp in enumerate(path_files)
            ]
        }