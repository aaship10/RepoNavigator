from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from backend.core.github_fetcher import fetch_repo_files

app = FastAPI(title="Repo Navigator API")

# Define the expected JSON payload
class AnalyzeRequest(BaseModel):
    github_url: str

@app.post("/analyze")
async def analyze_repo(request: AnalyzeRequest):
    try:
        print(f"Fetching files for: {request.github_url}...")
        files = fetch_repo_files(request.github_url)
        
        # For this step, we just return the count and keys to verify it works.
        # Returning all file contents in the JSON might lag the browser.
        return {
            "status": "success",
            "file_count": len(files),
            "files_found": list(files.keys()),
            # We will pass 'files' to the Tree-sitter analyzer in the next step
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Run this server using: uvicorn main:app --reload