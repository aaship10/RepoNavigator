import os
import json
import networkx as nx
from groq import AsyncGroq
from dotenv import load_dotenv

# Import our core utilities
from core.parser import generate_code_skeleton
from database.chroma_store import search_global_query

# Load environment variables
load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY is missing from .env file")

# Initialize the Groq Async Client
client = AsyncGroq(api_key=GROQ_API_KEY)

# ==========================================
# THE "CHATTY" STREAMING PROMPT
# ==========================================
STREAM_SYSTEM_PROMPT = """
You are CodeCure AI's Conversational Architect. 
Your goal is to provide deep, insightful, and readable explanations of the codebase.

FORMATTING RULES:
1. USE MARKDOWN: Always use bullet points, bold text for file names, and code blocks for snippets.
2. BE CONVERSATIONAL: Explain logic like you are talking to a peer developer.
3. CITATIONS: Always mention which files you are referencing (e.g., `src/auth.js`).
4. STRUCTURE: Use clear headings for different parts of your explanation.

CORE OPERATING RULES:
- Use ONLY the provided context. 
- If you don't know the answer, say "I don't have enough context to answer that fully yet."
- Focus on architectural patterns and data flow.
"""

# ==========================================
# THE "HOSTAGE" SYSTEM PROMPT (Legacy/JSON)
# ==========================================
SYSTEM_PROMPT = """
You are CodeCure AI's Codebase Intelligence Engine — a strict, context-bound code analyst.
You have been provided with skeletonized code chunks retrieved from a vector database search.
Your ONLY job is to answer the user's question using EXCLUSIVELY the provided context.

CORE OPERATING RULES:
1. CONTEXT SUPREMACY: Every claim MUST be traceable to the provided chunks.
2. ZERO HALLUCINATIONS: Do NOT use general programming knowledge. If it's not in the chunks, don't invent it.
3. HONEST INCOMPLETENESS: If the chunks lack the answer, respond with "INSUFFICIENT_CONTEXT" in the confidence_level.
4. FILE ATTRIBUTION: Cite specific file paths (e.g., "As seen in backend/auth.py...").
5. STRUCTURAL FAITHFULNESS: Do not infer missing logic from stripped function bodies.
6. API DETECTION: Detect any third-party or external APIs called by the code (e.g., Stripe, AWS, external HTTP requests). If none, return an empty array.
7. EXTERNAL INVOCATIONS: Identify the key functions that this file INVOKES or USES from other files or libraries. Do not include functions defined within the file itself here.

MANDATORY JSON OUTPUT SCHEMA:
{
  "thought_process": ["Step 1...", "Step 2..."],
  "confidence_level": "HIGH | MEDIUM | LOW | INSUFFICIENT_CONTEXT",
  "confidence_reason": "Why this level was assigned",
  "final_answer": {
    "summary": "2-3 sentence direct answer",
    "detailed_breakdown": [
      {
        "aspect": "Concept name",
        "explanation": "Detailed explanation",
        "source_file": "path/to/file",
        "evidence": "Function or class name"
      }
    ],
    "external_apis": [
      {
        "name": "API Name",
        "purpose": "Why it is called"
      }
    ],
    "functions_used": [
      {
        "name": "Function Name",
        "purpose": "What this function does and why it is called"
      }
    ],
    "cross_file_flow": "How logic flows across files (or null)",
    "limitations": "What cannot be answered"
  },
  "files_referenced": [
    {"path": "path/to/file", "role_in_answer": "What this file contributed"}
  ],
  "follow_up_suggestions": ["Suggested next question"]
}
"""

async def answer_global_query(repo_id: str, user_query: str, raw_files_dict: dict, G: nx.DiGraph) -> dict:
    """
    Executes the full RAG pipeline: Retrieves summaries from Chroma -> 
    Uses Graph Engine for dependencies -> Skeletonizes -> Injects to Llama 3.
    """
    
    print(f"🔍 Searching ChromaDB for: '{user_query}'...")
    
    # 1. RETRIEVE PRIMARY FILES FROM CHROMADB
    retrieved_docs = search_global_query(repo_id, user_query, top_k=3)
    
    # Fast-fail if the database is empty or no matches found
    if not retrieved_docs:
        return {
            "confidence_level": "INSUFFICIENT_CONTEXT",
            "final_answer": {"summary": "I don't have any analyzed files for this repository yet. Please run the Analysis first."},
        }

    # 2. 🧠 THE FIX: GRAB DEPENDENCIES USING THE GRAPH ENGINE
    files_to_inject = set()
    
    for doc in retrieved_docs:
        primary_file = doc["file_path"]
        files_to_inject.add(primary_file)
        
        # Ask NetworkX: What does this file depend on? (Up to 2 levels deep for safety)
        if primary_file in G.nodes:
            subgraph = nx.ego_graph(G, primary_file, radius=2)
            files_to_inject.update(subgraph.nodes)

    # 3. CONSTRUCT THE CONTEXT PAYLOAD
    context_blocks = []
    
    print(f"🔗 Expanded from {len(retrieved_docs)} Chroma hits to {len(files_to_inject)} total files (including dependencies).")
    
    for file_path in files_to_inject:
        # Grab raw code and skeletonize it
        raw_code = raw_files_dict.get(file_path, "")
        if not raw_code:
            continue
            
        skeleton = generate_code_skeleton(raw_code, file_path)
        
        # Build the exact format Llama 3 expects
        block = f"--- FILE: {file_path} ---\n[SKELETON]:\n{skeleton}\n---"
        context_blocks.append(block)
        
    full_context_string = "\n\n".join(context_blocks)
    
    # 4. BUILD THE USER PROMPT
    user_prompt = f"""
    CONTEXT FILES RETRIEVED (Including Downstream Dependencies):
    {full_context_string}
    
    USER QUESTION: {user_query}
    
    Respond STRICTLY in JSON format matching the schema in your system instructions.
    """
    
    print(f"🧠 Injecting {len(files_to_inject)} file skeletons into Llama 3.3...")
    
    # 5. CALL GROQ (LLAMA 3.3)
    try:
        chat_completion = await client.chat.completions.create(
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt}
            ],
            model="llama-3.3-70b-versatile", 
            response_format={"type": "json_object"}, 
            temperature=0.1, 
        )
        
        response_string = chat_completion.choices[0].message.content
        return json.loads(response_string)
        
    except Exception as e:
        print(f"❌ Error in RAG pipeline: {str(e)}")
        return {
            "confidence_level": "LOW",
            "final_answer": {"summary": f"The AI engine encountered an error while reasoning: {str(e)}"},
        }

async def stream_global_query(repo_id: str, user_query: str, raw_files_dict: dict, G: nx.DiGraph):
    """
    Async generator that streams Markdown chunks from Llama 3.3.
    """
    # 1. RETRIEVE PRIMARY FILES
    retrieved_docs = search_global_query(repo_id, user_query, top_k=3)
    if not retrieved_docs:
        yield "data: I haven't analyzed this repository yet. Please run the analysis first.\n\n"
        return

    # 2. EXPAND CONTEXT USING GRAPH
    files_to_inject = set()
    for doc in retrieved_docs:
        primary_file = doc["file_path"]
        files_to_inject.add(primary_file)
        if primary_file in G.nodes:
            subgraph = nx.ego_graph(G, primary_file, radius=2)
            files_to_inject.update(subgraph.nodes)

    # 3. BUILD CONTEXT STRING
    context_blocks = []
    for file_path in files_to_inject:
        raw_code = raw_files_dict.get(file_path, "")
        if not raw_code: continue
        skeleton = generate_code_skeleton(raw_code, file_path)
        context_blocks.append(f"--- FILE: {file_path} ---\n{skeleton}\n---")
    
    full_context_string = "\n\n".join(context_blocks)

    # 4. CALL GROQ WITH STREAMING
    user_prompt = f"CONTEXT:\n{full_context_string}\n\nUSER QUESTION: {user_query}\n\nRespond in clean Markdown."
    
    try:
        stream = await client.chat.completions.create(
            messages=[
                {"role": "system", "content": STREAM_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt}
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.2,
            stream=True,
        )

        async for chunk in stream:
            if chunk.choices and chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content
                
    except Exception as e:
        yield f"\n\n❌ **Error during streaming:** {str(e)}"