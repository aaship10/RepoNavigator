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
    Fetches all relevant files from a GitHub repository using the high-speed Git Tree API.
    Returns a dictionary: {"path/to/file.js": "file content string"}
    """
    repo_path = extract_repo_path(github_url)
    
    try:
        repo = gh.get_repo(repo_path)
        # 🟢 THE FIX: Grab the entire repo structure in ONE API call
        tree = repo.get_git_tree(repo.default_branch, recursive=True)
    except GithubException as e:
        raise ValueError(f"Could not access repository. Check URL or Token. Error: {e.data.get('message')}")

    file_data = {}
    items = tree.tree
    total_estimated = len(items) 
    processed = 0

    for element in items:
        processed += 1
        
        # We only care about files ("blob"), we skip folders ("tree")
        if element.type != "blob":
            continue

        # Replicate your folder exclusion logic (checking the path string directly)
        path_lower = element.path.lower()
        if path_lower.startswith('.') or any(f"/{ignored}/" in f"/{path_lower}" for ignored in ["node_modules", "venv", ".venv", "dist", "build", "public", "assets"]):
            continue
            
        if not is_valid_source_file(element.path):
            continue

        # Update progress callback for valid files
        if progress_callback:
            percent = min(60, int((processed / total_estimated) * 60))
            progress_callback(percent, f"Fetching {element.path[:30]}...")

        try:
            # Fetch the actual content for valid files
            file_obj = repo.get_contents(element.path)
            decoded_content = base64.b64decode(file_obj.content).decode('utf-8')
            file_data[element.path] = decoded_content
        except (UnicodeDecodeError, AttributeError):
            print(f"Skipping unreadable file: {element.path}")
        except Exception as e:
            print(f"Error fetching {element.path}: {e}")

    return file_data

def fetch_repo_commits(github_url: str, limit: int = 10) -> list:
    """Fetches the latest commits for the timeline slider."""
    repo_path = extract_repo_path(github_url)
    try:
        repo = gh.get_repo(repo_path)
        commits = repo.get_commits()[:limit]
        return [
            {
                "sha": c.sha[:7],           # Short hash for UI
                "full_sha": c.sha,          # Full hash for API calls
                "message": c.commit.message.split('\n')[0][:50], # Short message
                "date": c.commit.author.date.isoformat() if c.commit.author else ""
            }
            for c in commits
        ]
    except Exception as e:
        print(f"Error fetching commits: {e}")
        return []

def fetch_commit_stats(github_url: str, sha: str) -> dict:
    """Fetches line additions/deletions for a specific commit."""
    repo_path = extract_repo_path(github_url)
    try:
        repo = gh.get_repo(repo_path)
        commit = repo.get_commit(sha)
        return {
            "message": commit.commit.message,
            "added": commit.stats.additions,
            "removed": commit.stats.deletions
        }
    except Exception as e:
        return {"message": "Unknown commit", "added": 0, "removed": 0}

def fetch_commit_files_delta(github_url: str, sha: str) -> dict:
    """
    Fetches ONLY the files that were added or modified in a specific commit.
    Returns both the OLD state (from parent commit) and NEW state (from this commit)
    to allow for targeted graph diffing.
    """
    repo_path = extract_repo_path(github_url)
    try:
        repo = gh.get_repo(repo_path)
        commit = repo.get_commit(sha)
        
        parent_sha = commit.parents[0].sha if commit.parents else None
        
        old_files = {}
        new_files = {}
        
        for f in commit.files:
            if not is_valid_source_file(f.filename):
                continue
                
            if f.status in ["added", "modified"]:
                try:
                    content = repo.get_contents(f.filename, ref=sha)
                    new_files[f.filename] = base64.b64decode(content.content).decode('utf-8')
                except Exception as e:
                    print(f"Error fetching new ref {f.filename}: {e}")
                    
            if parent_sha and f.status in ["removed", "modified"]:
                try:
                    content = repo.get_contents(f.filename, ref=parent_sha)
                    old_files[f.filename] = base64.b64decode(content.content).decode('utf-8')
                except Exception as e:
                     print(f"Error fetching old ref {f.filename}: {e}")
                    
        return {
            "message": commit.commit.message,
            "added_count": commit.stats.additions,
            "removed_count": commit.stats.deletions,
            "old_files": old_files,
            "new_files": new_files
        }
    except Exception as e:
        print(f"Error fetching commit files delta for {sha}: {e}")
        return {"old_files": {}, "new_files": {}, "message": "Unknown", "added_count": 0, "removed_count": 0}