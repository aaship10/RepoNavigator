import os
import json
from google import genai
from google.genai import types
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY is missing from .env file")

genai.configure(api_key=GEMINI_API_KEY)

# Force Gemini to return guaranteed JSON
generation_config = {
    "temperature": 0.1, # Low temp for factual, deterministic analysis
    "response_mime_type": "application/json",
}

# Using 1.5 Flash for massive context and speed
model = genai.GenerativeModel(
    model_name="gemini-2.5-flash", 
    generation_config=generation_config
)

async def generate_file_insights(file_path: str, file_content: str, dependencies: list) -> dict:
    """
    Sends file context to Gemini 2.5 Flash to extract a quick summary.
    Used strictly for the real-time React UI sidebar when a node is clicked.
    """
    prompt = f"""
    Act as a Senior Software Architect analyzing a codebase.
    File Path: {file_path}
    Files this file depends on (Imports): {dependencies}
    Code:
    ```
    {file_content}
    ```
    Analyze the code and return a JSON object with EXACTLY the following structure:
    {{
        "summary": "A 2-3 sentence plain-language summary of what this file does and its role in the architecture.",
        "functions": [
            {{"name": "functionName", "purpose": "What it does and what other functions/files it calls"}}
        ],
        "data_flow": "A brief explanation of how primary variables or data objects move through this file."
    }}
    """
    try:
        response = await client.aio.models.generate_content(
            model='gemini-flash-latest',
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.1,
                response_mime_type="application/json",
            )
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"Gemini UI Insights Error for {file_path}: {e}")
        return {
            "summary": "AI summary currently unavailable.",
            "functions": [],
            "data_flow": "Data flow analysis unavailable."
        }


async def generate_rag_summary(file_path: str, file_content: str) -> dict:
    """
    THE MASTER PROMPT.
    Used strictly during the Background Ingestion to populate ChromaDB with rich, searchable metadata.
    """
    prompt = f"""
    You are a senior software architect performing deep codebase documentation for an AI-powered
    developer tool. Your output will be stored in a vector database and used to answer precise
    engineering questions about this codebase.

    You are analyzing the following file:

    FILE PATH: {file_path}
    FILE CONTENT:
    ```
    {file_content}
    ```

    ════════════════════════════════════════
    YOUR TASK
    ════════════════════════════════════════

    Generate a RAG-optimized architectural summary. This is NOT a brief description.
    It must be dense with searchable engineering concepts so that semantic similarity
    search can match it against questions like:
      - "How is authentication handled?"
      - "Where is API rate limiting enforced?"
      - "What manages the database connection pool?"
      - "How does error propagation work in this service?"

    ════════════════════════════════════════
    MANDATORY OUTPUT SCHEMA (Return ONLY valid JSON)
    ════════════════════════════════════════

    {{
      "file_path": "{file_path}",

      "architectural_role": "One sentence: What is the single responsibility of this file in the overall system?",

      "primary_responsibilities": [
        "Specific responsibility 1 (e.g., 'Validates incoming JWT tokens on protected routes')",
        "Specific responsibility 2",
        "Specific responsibility 3"
      ],

      "exposed_interface": {{
        "exported_functions": [
          {{
            "name": "functionName",
            "signature": "functionName(param1: Type, param2: Type) → ReturnType",
            "purpose": "What does this function DO and WHY would another file call it?"
          }}
        ],
        "exported_classes": [
          {{
            "name": "ClassName",
            "purpose": "What architectural problem does this class solve?",
            "key_methods": ["method1()", "method2()"]
          }}
        ],
        "exported_constants_or_configs": [
          {{
            "name": "CONSTANT_NAME",
            "purpose": "What does this config value control system-wide?"
          }}
        ]
      }},

      "dependencies": {{
        "internal_imports": [
          {{
            "path": "relative/path/to/module",
            "why": "What capability does this file borrow from that module?"
          }}
        ],
        "external_packages": [
          {{
            "package": "package-name",
            "why": "What specific feature of this package is used here?"
          }}
        ],
        "external_apis": [
          {{
            "name": "API Name",
            "purpose": "Why it is called (Detect any third-party or external APIs called by the code e.g., Stripe, AWS, external HTTP requests). If none, leave empty."
          }}
        ],
        "functions_used": [
          {{
            "name": "Function Name",
            "purpose": "What this function does and why it is called"
          }}
        ]
      }},

      "data_flow": {{
        "inputs": "What data enters this file? From where? In what shape?",
        "transformations": "What does this file DO to that data? Describe the core logic in plain English.",
        "outputs": "What data leaves this file? To where? In what shape?"
      }},

      "state_management": "Does this file hold state (variables, caches, DB connections, sessions)? Describe it. Set to null if stateless.",

      "error_handling_strategy": "How does this file handle failures? Does it throw, return error objects, call next(err), log silently? Be specific.",

      "side_effects": [
        "Any database writes, external API calls, file system operations, event emissions, or global mutations this file causes"
      ],

      "searchable_concepts": [
        "A flat list of 10-20 engineering keywords and phrases that describe what this file does.",
        "Examples: JWT validation, middleware chain, bcrypt hashing, rate limiting, database connection pooling,",
        "REST endpoint registration, session persistence, CORS configuration, tree traversal, event emitter pattern"
      ],

      "cross_cutting_concerns": "Does this file implement logging, auth, caching, error handling, or validation that affects the WHOLE system? Describe it.",

      "potential_query_matches": [
        "Write 5 example natural-language questions a developer might ask that this file's content can answer.",
        "Example: 'How are user passwords stored?', 'What protects private API routes?'"
      ]
    }}

    ════════════════════════════════════════
    QUALITY RULES
    ════════════════════════════════════════

    1. Be SPECIFIC. Not "handles authentication" → "verifies Bearer tokens using jsonwebtoken's verify() against the JWT_SECRET env variable and attaches decoded user payload to req.user"
    2. Every exported function must have a purpose written as if explaining it to a developer who has NEVER seen this codebase.
    3. The searchable_concepts array is your most important RAG signal. Pack it with every architectural keyword, design pattern, and technology verb you can extract.
    4. potential_query_matches must be written in natural developer language — the exact phrasing a developer would type into a search box.
    5. Return ONLY valid JSON. No markdown, no preamble, no explanation outside the JSON.
    """
    
    try:
        response = await client.aio.models.generate_content(
            model='gemini-flash-latest',
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.1,
                response_mime_type="application/json",
            )
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"Gemini RAG Ingestion Error for {file_path}: {e}")
        # Safe fallback structure to prevent ChromaDB insertion from failing entirely
        return {
            "file_path": file_path,
            "architectural_role": "Unanalyzable due to AI error.",
            "searchable_concepts": [],
            "potential_query_matches": []
        }