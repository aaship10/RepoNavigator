import networkx as nx
from typing import List, Tuple, Dict, Any

# Update the parameters to accept all_files
def build_global_graph(dependencies: List[Tuple[str, str]], all_files: List[str]) -> nx.DiGraph:
    G = nx.DiGraph()
    # 1. Add every single file as a node first
    G.add_nodes_from(all_files)
    # 2. Then connect them with edges
    G.add_edges_from(dependencies)
    return G

def get_impact_scores(G: nx.DiGraph) -> Dict[str, int]:
    """
    Calculates the 'Risk' or 'Impact' of a file.
    Uses in-degree (raw count of how many other files import this one).
    """
    # G.in_degree() returns an iterator of (node, dependency_count)
    return {node: count for node, count in G.in_degree()}

def extract_ego_graph_data(G: nx.DiGraph, selected_file: str) -> Dict[str, Any]:
    """
    Extracts the 1st-degree neighborhood (Ego Graph) of the selected file 
    and formats the data structure exactly as React Flow expects it.
    """
    if selected_file not in G:
        return {"nodes": [], "edges": []}

    # Extract the subgraph (radius=1 means direct imports + direct dependents)
    # undirected=False ensures we respect the direction of the imports
    ego = nx.ego_graph(G, selected_file, radius=1, undirected=False)
    
    # Get impact scores for formatting the nodes
    impact_scores = get_impact_scores(G)
    
    nodes = []
    for node in ego.nodes():
        # Determine a basic type for frontend color-coding
        node_type = "default"
        if node == selected_file:
            node_type = "center" # The file the user actually clicked
        elif G.out_degree(node) == 0:
            node_type = "utility" # Doesn't depend on anything else
            
        nodes.append({
            "id": node,
            "data": {
                "label": node.split('/')[-1], # Just show 'auth.py' on the visual node
                "fullPath": node,             # Keep the full path for API calls
                "impactScore": impact_scores.get(node, 0),
                "type": node_type
            }
        })
        
    edges = []
    for source, target in ego.edges():
        edges.append({
            "id": f"e-{source}-{target}",
            "source": source,
            "target": target,
            "animated": True # Makes the data flow look active in React Flow!
        })
        
    return {"nodes": nodes, "edges": edges}

def get_onboarding_path(G: nx.DiGraph, limit: int = 10) -> List[str]:
    """
    Generates a recommended reading order.
    Attempts a Topological Sort, with a safe fallback for circular imports.
    """
    if len(G.nodes) == 0:
        return []

    try:
        # A perfect Directed Acyclic Graph (DAG) can be sorted logically
        # from foundation to complex logic.
        path = list(nx.topological_sort(G))
        # Return the bottom foundational files first, or reverse it based on preference
        return list(reversed(path))[:limit] 
        
    except nx.NetworkXUnfeasible:
        # HACKATHON LIFESAVER: Circular dependencies detected!
        # Fallback: Sort files by their out-degree (files that import the least).
        # These are usually standalone utilities or config files. Good starting points.
        sorted_nodes = sorted(G.nodes(), key=lambda n: G.out_degree(n))
        return sorted_nodes[:limit]

def identify_entry_points(G: nx.DiGraph) -> List[str]:
    """
    Finds files that are likely entry points (e.g., main.py, index.js).
    Heuristic: High out-degree (imports a lot) but low/zero in-degree (nothing imports it).
    """
    entry_points = []
    for node in G.nodes():
        if G.in_degree(node) == 0 and G.out_degree(node) > 0:
            # You can also add string matching here: if 'main' in node or 'index' in node
            entry_points.append(node)
    return entry_points