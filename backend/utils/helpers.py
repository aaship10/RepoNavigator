import os
import posixpath
from pathlib import Path

# The files we actually care about for architecture mapping
ALLOWED_EXTENSIONS = {".py", ".js", ".jsx", ".ts", ".tsx", ".go", ".java", ".cpp", ".h"}

# Directories that add noise and should be completely ignored
IGNORED_DIRS = {
    "node_modules", "venv", ".venv", "__pycache__", ".git", 
    ".github", "dist", "build", "out", "target"
}

def is_valid_source_file(filepath: str) -> bool:
    """
    Determines if a file should be included in the graph.
    """
    path = Path(filepath)
    
    # 1. Check if it's in an ignored directory
    for part in path.parts:
        if part in IGNORED_DIRS or part.startswith('.'):
            return False
            
    # 2. Check if the extension is supported
    if path.suffix not in ALLOWED_EXTENSIONS:
        return False
        
    return True

def normalize_import_path(base_file: str, imported_path: str) -> str:
    """
    Converts a relative import (e.g., '../models/user') into an absolute 
    project path (e.g., 'backend/models/user.py') so node IDs match exactly.
    """
    # If it's already an absolute-looking path in the project
    if not imported_path.startswith("."):
        # For a hackathon MVP, assume non-relative imports correspond to root folders
        return imported_path.strip("/")

    # Handle relative paths
    base_dir = posixpath.dirname(base_file)
    
    # Resolve the relative path (posixpath handles ".." correctly)
    resolved_path = posixpath.normpath(posixpath.join(base_dir, imported_path))
    
    return resolved_path

def get_module_name(filepath: str) -> str:
    """
    Extracts the parent folder name to use for "Module Clustering".
    Example: 'backend/api/auth.py' -> 'api'
    """
    parts = Path(filepath).parts
    if len(parts) > 1:
        return parts[-2] # The immediate parent directory
    return "root"