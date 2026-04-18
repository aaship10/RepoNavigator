from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from github_fetcher import fetch_repo_files

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

# Define the expected JSON payload
class AnalyzeRequest(BaseModel):
    github_url: str

@app.post("/analyze")
async def analyze_repo(request: AnalyzeRequest):
    try:
        print(f"🚀 [main.py] Incoming analysis request for URL: {request.github_url}")
        files = fetch_repo_files(request.github_url)
        
        file_keys = list(files.keys())
        print(f"✅ [main.py] Successfully fetched {len(file_keys)} files.")
        print(f"📄 [main.py] Sample files (first 3): {file_keys[:3]}")

        # For this step, we just return the count and keys to verify it works.
        # Returning all file contents in the JSON might lag the browser.
        return {
            "status": "success",
            "file_count": len(files),
            "files_found": file_keys,
            # We will pass 'files' to the Tree-sitter analyzer in the next step
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Run this server using: uvicorn main:app --reload