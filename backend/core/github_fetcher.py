import os
import base64
from github import Github
from github.GithubException import GithubException
from dotenv import load_dotenv

# 1. Import your strict filter
from utils.helpers import is_valid_source_file

# Load environment variables
load_dotenv()
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")

# Initialize GitHub client (uses token if available, otherwise anonymous)
gh = Github(GITHUB_TOKEN) if GITHUB_TOKEN else Github()

def extract_repo_path(url: str) -> str:
    """Converts 'https://github.com/expressjs/express' into 'expressjs/express'"""
    parts = url.rstrip('/').split('/')
    return f"{parts[-2]}/{parts[-1]}"

def fetch_repo_files(github_url: str, progress_callback=None) -> dict:
    """
    Fetches all relevant files from a GitHub repository.
    Returns a dictionary: {"path/to/file.js": "file content string"}
    """
    repo_path = extract_repo_path(github_url)
    
    try:
        repo = gh.get_repo(repo_path)
    except GithubException as e:
        raise ValueError(f"Could not access repository. Check URL or Token. Error: {e.data.get('message')}")

    file_data = {}
    
    # We use a BFS (Breadth-First Search) queue to walk the directory tree
    contents = repo.get_contents("")
    
    total_estimated = len(contents) # Rough start
    processed = 0

    while contents:
        file_obj = contents.pop(0)
        processed += 1
        
        if progress_callback:
            # Scale progress: Cloning/Fetching is roughly 0-60%
            percent = min(60, int((processed / (processed + len(contents) + 1)) * 60))
            progress_callback(percent, f"Fetching {file_obj.path[:30]}...")
        
        if file_obj.type == "dir":
            # FAST FAIL: Prevent wasting GitHub API calls on massive junk directories
            dir_name = file_obj.name.lower()
            if dir_name.startswith('.') or dir_name in ["node_modules", "venv", ".venv", "dist", "build", "public", "assets"]:
                continue
            contents.extend(repo.get_contents(file_obj.path))
            
        else:
            # 2. THE STRICT FILTER: Reject configs, readmes, and non-code files
            if not is_valid_source_file(file_obj.path):
                continue
                
            # If it passes, decode and save it
            try:
                # GitHub API returns file content as Base64. We must decode it.
                decoded_content = base64.b64decode(file_obj.content).decode('utf-8')
                file_data[file_obj.path] = decoded_content
            except (UnicodeDecodeError, AttributeError):
                # Skip files that aren't valid UTF-8 text
                print(f"Skipping unreadable file: {file_obj.path}")

    return file_data