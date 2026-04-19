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

# --- 3. DEPENDENCY EXTRACTION (Unchanged & Perfected) ---
def extract_dependencies(file_data: Dict[str, str], progress_callback=None) -> List[Tuple[str, str]]:
    dependencies = []
    file_paths = list(file_data.keys())
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
            continue

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


# --- 4. NEW: RAG SKELETONIZER ---
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