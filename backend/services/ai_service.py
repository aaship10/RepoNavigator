import os
import json
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY is missing from .env file")

genai.configure(api_key=GEMINI_API_KEY)

# Initialize the model (using 1.5 Flash for massive context and speed)
# Forcing JSON output guarantees the frontend gets a clean object every time.
generation_config = {
    "temperature": 0.2,  # Low temp for factual, deterministic analysis
    "response_mime_type": "application/json",
}

model = genai.GenerativeModel(
    model_name="gemini-flash-latest",
    generation_config=generation_config
)

async def generate_file_insights(file_path: str, file_content: str, dependencies: list) -> dict:
    """
    Sends file context to Gemini 1.5 Flash to extract summary, call graphs, and data flow.
    Must be called with 'await' from your FastAPI route.
    """
    
    # We pass the dependencies to give the AI "structural awareness" 
    # beyond just the raw code.
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
        # Using generate_content_async to prevent blocking the FastAPI event loop
        response = await model.generate_content_async(prompt)
        
        # Parse the JSON string returned by the model into a Python dict
        return json.loads(response.text)
        
    except Exception as e:
        print(f"Error calling Gemini API for {file_path}: {str(e)}")
        # Safe fallback so your React frontend doesn't crash during the live demo
        return {
            "summary": "AI summary currently unavailable.",
            "functions": [],
            "data_flow": "Data flow analysis unavailable."
        }