# import os
# import posixpath
# from pathlib import Path

# import posixpath
# from pathlib import Path

# # 1. The files we actually care about for architecture mapping
# ALLOWED_EXTENSIONS = {".py", ".js", ".jsx", ".ts", ".tsx", ".go", ".java", ".cpp", ".h"}

# # 2. Directories that add noise and should be completely ignored
# IGNORED_DIRS = {
#     "node_modules", "venv", ".venv", "__pycache__", ".git", 
#     ".github", "dist", "build", "out", "target", "public", "assets"
# }

# # 3. Exact filenames that are pure configuration/metadata
# IGNORED_FILES = {
#     "package.json", "package-lock.json", "yarn.lock", "pnpm-lock.yaml",
#     "dockerfile", "docker-compose.yml", "readme.md", "license", ".gitignore"
# }

# # 4. Suffixes/Patterns to catch config files even if they end in .js
# IGNORED_PATTERNS = {
#     ".config.js", ".config.ts", ".setup.js", ".setup.ts", 
#     ".min.js", ".test.js", ".spec.js"
# }

# def is_valid_source_file(filepath: str) -> bool:
#     """
#     Determines if a file should be included in the graph and sent to the LLM.
#     """
#     path = Path(filepath)
#     filename = path.name.lower()
    
#     # Tier 1: Check if it's in an ignored directory or a hidden folder
#     for part in path.parts:
#         if part in IGNORED_DIRS or part.startswith('.'):
#             return False
            
#     # Tier 2: Check if it's an explicitly ignored exact file
#     if filename in IGNORED_FILES:
#         return False
        
#     # Tier 3: Check for configuration patterns (e.g., tailwind.config.js)
#     if any(filename.endswith(pattern) for pattern in IGNORED_PATTERNS):
#         return False
            
#     # Tier 4: Finally, check if it has a supported language extension
#     if path.suffix.lower() not in ALLOWED_EXTENSIONS:
#         return False
        
#     return True

# # ... (keep your normalize_import_path and get_module_name functions below) ...

# def normalize_import_path(base_file: str, imported_path: str) -> str:
#     """
#     Converts a relative import (e.g., '../models/user') into an absolute 
#     project path (e.g., 'backend/models/user.py') so node IDs match exactly.
#     """
#     # If it's already an absolute-looking path in the project
#     if not imported_path.startswith("."):
#         # For a hackathon MVP, assume non-relative imports correspond to root folders
#         return imported_path.strip("/")

#     # Handle relative paths
#     base_dir = posixpath.dirname(base_file)
    
#     # Resolve the relative path (posixpath handles ".." correctly)
#     resolved_path = posixpath.normpath(posixpath.join(base_dir, imported_path))
    
#     return resolved_path

# def get_module_name(filepath: str) -> str:
#     """
#     Extracts the parent folder name to use for "Module Clustering".
#     Example: 'backend/api/auth.py' -> 'api'
#     """
#     parts = Path(filepath).parts
#     if len(parts) > 1:
#         return parts[-2] # The immediate parent directory
#     return "root"



import posixpath
from pathlib import Path

# --- FILTERING CONSTANTS ---
ALLOWED_EXTENSIONS = {".py", ".js", ".jsx", ".ts", ".tsx", ".go", ".java", ".cpp", ".h"}
IGNORED_DIRS = {"node_modules", "venv", ".venv", "__pycache__", "dist", "build", "out", "target", "public", "assets"}
IGNORED_FILES = {
    "package.json", "package-lock.json", "yarn.lock", "pnpm-lock.yaml",
    "dockerfile", "docker-compose.yml", "readme.md", "license", "requirements.txt", "index.html"
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