import posixpath
from pathlib import Path

# --- FILTERING CONSTANTS ---
ALLOWED_EXTENSIONS = {".py", ".js", ".jsx", ".ts", ".tsx", ".go", ".java", ".cpp", ".h", ".html", "readme.md"}
IGNORED_DIRS = {"node_modules", "venv", ".venv", "__pycache__", "dist", "build", "out", "target", "public", "assets"}
IGNORED_FILES = {
    "package.json", "package-lock.json", "yarn.lock", "pnpm-lock.yaml", "dockerfile", "docker-compose.yml", "license", "requirements.txt"
}
IGNORED_PATTERNS = {
    ".config.js", ".config.ts", ".config.mjs", ".setup.js", ".setup.ts"
}

# --- 1. THE STRICT FILTER ---
def is_valid_source_file(filepath: str) -> bool:
    """Aggressively filters out anything that isn't pure business logic."""
    path = Path(filepath)
    filename = path.name.lower()
    
    for part in path.parts:
        if part.startswith('.') or part in IGNORED_DIRS:
            return False
            
    if filename in IGNORED_FILES:
        return False
        
    if any(filename.endswith(pattern) for pattern in IGNORED_PATTERNS):
        return False
            
    if path.suffix.lower() not in ALLOWED_EXTENSIONS:
        return False
        
    return True

# --- 2. PATH NORMALIZATION ---
def normalize_import_path(base_file: str, imported_path: str) -> str:
    """
    Converts a relative import (e.g., '../models/user') into an absolute 
    project path (e.g., 'backend/models/user.py') so node IDs match exactly.
    """
    if not imported_path.startswith("."):
        return imported_path.strip("/")

    base_dir = posixpath.dirname(base_file)
    resolved_path = posixpath.normpath(posixpath.join(base_dir, imported_path))
    return resolved_path

# --- 3. CLUSTERING HELPER ---
def get_module_name(filepath: str) -> str:
    """
    Extracts the parent folder name to use for "Module Clustering".
    Example: 'backend/api/auth.py' -> 'api'
    """
    parts = Path(filepath).parts
    if len(parts) > 1:
        return parts[-2]
    return "root"