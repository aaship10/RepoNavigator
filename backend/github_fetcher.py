import os
import base64
from github import Github
from github.GithubException import GithubException
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")

# Initialize GitHub client (uses token if available, otherwise anonymous)
gh = Github(GITHUB_TOKEN) if GITHUB_TOKEN else Github()

# Filter lists to prevent blowing up the AI context window or crashing the parser
IGNORED_DIRS = {'node_modules', 'dist', 'build', '.git', '__pycache__', 'venv', 'env', 'coverage', '.next'}
IGNORED_EXTS = {'.png', '.jpg', '.jpeg', '.gif', '.ico', '.pdf', '.zip', '.tar', '.gz', '.mp4', '.svg', '.woff', '.ttf'}

def extract_repo_path(url: str) -> str:
    """Converts 'https://github.com/expressjs/express' into 'expressjs/express'"""
    parts = url.rstrip('/').split('/')
    return f"{parts[-2]}/{parts[-1]}"

def fetch_repo_files(github_url: str) -> dict:
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
    
    while contents:
        file_obj = contents.pop(0)
        
        if file_obj.type == "dir":
            if file_obj.name not in IGNORED_DIRS:
                contents.extend(repo.get_contents(file_obj.path))
        else:
            # It's a file. Check extension.
            ext = os.path.splitext(file_obj.name)[1].lower()
            if ext not in IGNORED_EXTS:
                try:
                    # GitHub API returns file content as Base64. We must decode it.
                    decoded_content = base64.b64decode(file_obj.content).decode('utf-8')
                    file_data[file_obj.path] = decoded_content
                except (UnicodeDecodeError, AttributeError):
                    # Skip files that aren't valid UTF-8 text (e.g., weird binaries we missed)
                    print(f"Skipping unreadable file: {file_obj.path}")

    return file_data