from typing import Dict, List, Tuple

from tree_sitter import Language, Parser, Query, QueryCursor
import tree_sitter_python as tspython
import tree_sitter_javascript as tsjavascript

# --- IMPORT YOUR HELPER HERE ---
from utils.helpers import normalize_import_path 

# 1. Initialize Languages
PY_LANG = Language(tspython.language())
JS_LANG = Language(tsjavascript.language())

# 2. Create Parsers
py_parser = Parser(PY_LANG)
js_parser = Parser(JS_LANG)

# 3. Define Queries
PY_QUERY = Query(PY_LANG, """
    (import_statement name: (dotted_name) @import)
    (import_from_statement module_name: (dotted_name) @from_import)
""")

JS_QUERY = Query(JS_LANG, """
    (import_statement source: (string) @import)
    (call_expression
        function: (identifier) @func (#eq? @func "require")
        arguments: (arguments (string) @req))
""")

def extract_dependencies(file_data: Dict[str, str]) -> List[Tuple[str, str]]:
    dependencies = []
    file_paths = list(file_data.keys())

    for source_path, content in file_data.items():
        ext = source_path.split('.')[-1].lower()
        found_modules = []
        
        source_bytes = content.encode('utf-8')

        # Run Tree-sitter
        if ext == 'py':
            tree = py_parser.parse(source_bytes)
            cursor = QueryCursor(PY_QUERY)
            matches = cursor.matches(tree.root_node)
            
        elif ext in ['js', 'ts', 'jsx', 'tsx']:
            tree = js_parser.parse(source_bytes)
            cursor = QueryCursor(JS_QUERY)
            matches = cursor.matches(tree.root_node)
            
        else:
            continue

        # Extract raw import strings
        for pattern_idx, captures in matches:
            for capture_name, nodes in captures.items():
                if capture_name == "func":
                    continue
                
                if not isinstance(nodes, list):
                    nodes = [nodes]

                for node in nodes:
                    raw_import = node.text.decode('utf-8').strip("'\"")
                    found_modules.append(raw_import)

        # ==========================================
        # THE NEW CODE GOES EXACTLY HERE
        # ==========================================
        for module in found_modules:
            # Skip standard library or node_modules imports (like 'react' or 'fastapi')
            # For Python, we might still want absolute imports, so we adjust the logic slightly:
            if ext in ['js', 'ts', 'jsx', 'tsx'] and not module.startswith('.'):
                continue 

            # USE YOUR HELPER TO GET THE EXACT PATH!
            resolved_path = normalize_import_path(source_path, module)
            
            # Check if the resolved path exists in our file list with any allowed extension
            target_path = None
            for check_ext in ['.js', '.jsx', '.ts', '.tsx', '.py']:
                # The helper might have returned a path that already has an extension
                if resolved_path in file_paths:
                    target_path = resolved_path
                    break
                # Or it might be missing the extension (common in React)
                elif f"{resolved_path}{check_ext}" in file_paths:
                    target_path = f"{resolved_path}{check_ext}"
                    break
            
            if target_path and target_path != source_path:
                dependencies.append((source_path, target_path))

    return dependencies