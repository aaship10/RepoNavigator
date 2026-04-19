from typing import Dict, List, Tuple
from tree_sitter import Language, Parser, Query, QueryCursor
import tree_sitter_python as tspython
import tree_sitter_javascript as tsjavascript

# Use the helper we verified earlier
from utils.helpers import normalize_import_path 

# --- 1. INITIALIZE LANGUAGES & PARSERS ---
PY_LANG = Language(tspython.language())
JS_LANG = Language(tsjavascript.language())

py_parser = Parser(PY_LANG)
js_parser = Parser(JS_LANG)

# --- 2. DEPENDENCY QUERIES ---
PY_DEP_QUERY = Query(PY_LANG, """
    (import_statement name: (dotted_name) @import)
    (import_from_statement module_name: (dotted_name) @from_import)
""")

JS_DEP_QUERY = Query(JS_LANG, """
    (import_statement source: (string) @import)
    (call_expression
        function: (identifier) @func (#eq? @func "require")
        arguments: (arguments (string) @req))
""")

# --- 3. FUNCTION QUERIES (added for get_file_functions) ---
PY_FUNC_QUERY = Query(PY_LANG, """
    (function_definition name: (identifier) @func_name)
""")

JS_FUNC_QUERY = Query(JS_LANG, """
    (function_declaration name: (identifier) @func_name)
    (variable_declarator
        name: (identifier) @func_name
        value: [(arrow_function) (function_expression)])
    (method_definition name: (property_identifier) @func_name)
    (assignment_expression
        left: (member_expression property: (property_identifier) @func_name)
        right: [(arrow_function) (function_expression)])
    (pair
        key: (property_identifier) @func_name
        value: [(arrow_function) (function_expression)])
""")

# --- 4. DEPENDENCY EXTRACTION (Unchanged & Perfected) ---
def extract_dependencies(file_data: Dict[str, str], progress_callback=None) -> List[Tuple[str, str]]:
    """
    Returns a list of (source_path, target_path) tuples representing
    internal import relationships across all files in the repo.
    """
    dependencies = []
    file_paths = set(file_data.keys())
    total_files = len(file_paths)

    for idx, (source_path, content) in enumerate(file_data.items()):
        if progress_callback:
            # Scale progress: Parsing is roughly 60-90%
            percent = 60 + int((idx / (total_files if total_files > 0 else 1)) * 30)
            progress_callback(percent, f"Analyzing {source_path[:30]}...")

        ext = source_path.split('.')[-1].lower()
        found_modules = []
        source_bytes = content.encode('utf-8')

        if ext == 'py':
            tree = py_parser.parse(source_bytes)
            cursor = QueryCursor(PY_DEP_QUERY)
            matches = cursor.matches(tree.root_node)
        elif ext in ['js', 'ts', 'jsx', 'tsx']:
            tree = js_parser.parse(source_bytes)
            cursor = QueryCursor(JS_DEP_QUERY)
            matches = cursor.matches(tree.root_node)
        else:
            return []

        for pattern_idx, captures in matches:
            for capture_name, nodes in captures.items():
                if capture_name == "func":
                    continue
                if not isinstance(nodes, list):
                    nodes = [nodes]
                for node in nodes:
                    raw_import = node.text.decode('utf-8').strip("'\"")
                    found_modules.append(raw_import)

        for module in found_modules:
            if ext in ['js', 'ts', 'jsx', 'tsx'] and not module.startswith('.'):
                continue 

            resolved_path = normalize_import_path(source_path, module)
            
            target_path = None
            for check_ext in ['.js', '.jsx', '.ts', '.tsx', '.py']:
                if resolved_path in file_paths:
                    target_path = resolved_path
                    break
                elif f"{resolved_path}{check_ext}" in file_paths:
                    target_path = f"{resolved_path}{check_ext}"
                    break
            
            if target_path and target_path != source_path:
                dependencies.append((source_path, target_path))

    return dependencies


# --- 5. FUNCTION EXTRACTION (added) ---
def get_file_functions(file_path: str, content: str) -> List[Dict]:
    """
    Returns a list of dicts: [{"name": str, "line": int}, ...]
    Extracts all function/method definitions from a file using tree-sitter.
    """
    ext = file_path.split('.')[-1].lower()
    source_bytes = content.encode('utf-8')
    seen_names = set()
    functions = []

    try:
        if ext == 'py':
            tree = py_parser.parse(source_bytes)
            query = PY_FUNC_QUERY
        elif ext in ['js', 'ts', 'jsx', 'tsx']:
            tree = js_parser.parse(source_bytes)
            query = JS_FUNC_QUERY
        else:
            return []

        cursor = QueryCursor(query)
        matches = cursor.matches(tree.root_node)

        for pattern_idx, captures in matches:
            for capture_name, nodes in captures.items():
                if not isinstance(nodes, list):
                    nodes = [nodes]
                for node in nodes:
                    name = node.text.decode('utf-8')
                    # Dedup by name — keep first (outermost) occurrence
                    if name not in seen_names:
                        seen_names.add(name)
                        functions.append({
                            "name": name,
                            "line": node.start_point[0] + 1,  # 1-indexed
                        })

    except Exception as e:
        print(f"[parser] Function extraction error in {file_path}: {e}")

    return functions


# Python stdlib top-level module names (common subset — enough to filter noise)
_PY_STDLIB = {
    "os", "sys", "re", "io", "abc", "ast", "copy", "csv", "math", "json",
    "time", "uuid", "enum", "typing", "types", "string", "struct", "base64",
    "hashlib", "hmac", "logging", "pathlib", "functools", "itertools",
    "collections", "contextlib", "dataclasses", "datetime", "traceback",
    "threading", "multiprocessing", "subprocess", "socket", "ssl", "http",
    "urllib", "email", "html", "xml", "sqlite3", "pickle", "shutil",
    "tempfile", "glob", "fnmatch", "stat", "platform", "signal", "gc",
    "weakref", "inspect", "dis", "token", "tokenize", "keyword", "builtins",
    "warnings", "unittest", "doctest", "pdb", "profile", "timeit", "random",
    "secrets", "statistics", "decimal", "fractions", "cmath", "array",
    "queue", "heapq", "bisect", "textwrap", "pprint", "reprlib", "codecs",
    "getpass", "getopt", "argparse", "configparser", "tomllib", "zipfile",
    "tarfile", "gzip", "bz2", "lzma", "zlib", "concurrent", "asyncio",
    "selectors", "xmlrpc", "wsgiref", "ftplib", "imaplib", "poplib",
    "smtplib", "telnetlib", "uuid", "ipaddress", "binascii", "quopri",
}


# --- 6. API / EXTERNAL PACKAGE EXTRACTION (added) ---
def get_file_apis(file_path: str, content: str) -> List[Dict]:
    """
    Returns a list of dicts: [{"name": str, "line": int}, ...]
    Extracts external package/API imports — filters out:
      - relative imports (start with '.' for JS, or are internal paths for Python)
      - Python stdlib modules
    """
    ext = file_path.split('.')[-1].lower()
    source_bytes = content.encode('utf-8')
    seen = set()
    apis = []

    try:
        if ext == 'py':
            tree = py_parser.parse(source_bytes)
            cursor = QueryCursor(PY_DEP_QUERY)
            matches = cursor.matches(tree.root_node)

            for pattern_idx, captures in matches:
                for capture_name, nodes in captures.items():
                    if not isinstance(nodes, list):
                        nodes = [nodes]
                    for node in nodes:
                        raw = node.text.decode('utf-8').strip("'\"")
                        # Top-level package name (e.g. "google.genai" -> "google")
                        top = raw.split('.')[0]
                        line = node.start_point[0] + 1
                        # Skip stdlib and relative/internal imports
                        if top and top not in _PY_STDLIB and not top.startswith('.') and top not in seen:
                            seen.add(top)
                            apis.append({"name": raw, "line": line})

        elif ext in ['js', 'ts', 'jsx', 'tsx']:
            tree = js_parser.parse(source_bytes)
            cursor = QueryCursor(JS_DEP_QUERY)
            matches = cursor.matches(tree.root_node)

            for pattern_idx, captures in matches:
                for capture_name, nodes in captures.items():
                    if capture_name == "func":
                        continue
                    if not isinstance(nodes, list):
                        nodes = [nodes]
                    for node in nodes:
                        raw = node.text.decode('utf-8').strip("'\"")
                        line = node.start_point[0] + 1
                        # Skip relative imports (start with . or /)
                        if raw and not raw.startswith('.') and not raw.startswith('/') and raw not in seen:
                            seen.add(raw)
                            apis.append({"name": raw, "line": line})

    except Exception as e:
        print(f"[parser] API extraction error in {file_path}: {e}")

    return apis


# --- 7. RAG SKELETONIZER (Unchanged) ---
def generate_code_skeleton(file_content: str, filepath: str) -> str:
    """
    Strips out function bodies and implementation details to save LLM tokens.
    Returns a string containing ONLY imports, classes, and function signatures.
    """
    ext = filepath.split('.')[-1].lower()
    source_bytes = file_content.encode('utf-8')

    # Define queries to target the architectural API surface
    if ext == 'py':
        tree = py_parser.parse(source_bytes)
        query = Query(PY_LANG, """
            (import_statement) @import
            (import_from_statement) @import
            (class_definition) @class
            (function_definition) @func
        """)
    elif ext in ['js', 'ts', 'jsx', 'tsx']:
        tree = js_parser.parse(source_bytes)
        query = Query(JS_LANG, """
            (import_statement) @import
            (export_statement) @export
            (class_declaration) @class
            (function_declaration) @func
            (lexical_declaration (variable_declarator value: (arrow_function))) @arrow
        """)
    else:
        # Fallback: Just return the top of the file if it's an unknown language
        return "\n".join(file_content.split('\n')[:20]) + "\n... [BODY TRUNCATED]"

    cursor = QueryCursor(query)
    matches = cursor.matches(tree.root_node)

    skeleton_lines = []
    seen_signatures = set()

    for pattern_idx, captures in matches:
        for capture_name, nodes in captures.items():
            if not isinstance(nodes, list):
                nodes = [nodes]
            
            for node in nodes:
                text = node.text.decode('utf-8')
                
                # For classes and functions, we only want the FIRST line (the signature)
                if capture_name in ['class', 'func', 'arrow']:
                    signature = text.split('\n')[0].strip()
                    
                    # Add visual indicators that the body was stripped
                    if '{' in signature:
                        signature = signature.split('{')[0].strip() + ' { ... }'
                    elif signature.endswith(':'):
                        signature = signature + ' ...'
                    else:
                        signature = signature + ' ...'
                        
                    if signature not in seen_signatures:
                        skeleton_lines.append(signature)
                        seen_signatures.add(signature)
                
                # For imports/exports, keep the whole line
                else:
                    first_line = text.split('\n')[0].strip()
                    if first_line not in seen_signatures:
                        skeleton_lines.append(first_line)
                        seen_signatures.add(first_line)

    # If the file is extremely small or mostly variables, fallback to raw code
    if not skeleton_lines:
        return file_content

    return "\n".join(skeleton_lines)