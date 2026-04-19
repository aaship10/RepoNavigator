import networkx as nx

def calculate_graph_delta(G_old: nx.DiGraph, G_new: nx.DiGraph):
    """
    Compares two architectural snapshots and returns the structural changes.
    """
    # 1. Identify Node Changes (Files Added/Removed)
    old_nodes = set(G_old.nodes)
    new_nodes = set(G_new.nodes)
    
    added_files = list(new_nodes - old_nodes)
    removed_files = list(old_nodes - new_nodes)

    # 2. Identify Edge Changes (Dependency Shifts)
    old_edges = set(G_old.edges)
    new_edges = set(G_new.edges)
    
    added_deps = [{"source": u, "target": v} for u, v in (new_edges - old_edges)]
    removed_deps = [{"source": u, "target": v} for u, v in (old_edges - new_edges)]

    # 3. Calculate Structural Metrics
    metrics = {
        "complexity_delta": nx.density(G_new) - nx.density(G_old),
        "new_hub_files": sorted(
            G_new.degree, key=lambda x: x[1], reverse=True
        )[:3] # Top 3 most connected files in new version
    }

    return {
        "added_files": added_files,
        "removed_files": removed_files,
        "added_dependencies": added_deps,
        "removed_dependencies": removed_deps,
        "metrics": metrics
    }

async def generate_evolution_narrative(delta_data: dict, client, model_name: str):
    """
    Sends the structural delta to Groq/Llama to get a human-readable explanation.
    """
    prompt = f"""
    Act as a Senior Architect explaining a code evolution.
    
    CHANGES DETECTED:
    - Files Added: {delta_data['added_files']}
    - Files Removed: {delta_data['removed_files']}
    - New Connections: {len(delta_data['added_dependencies'])}
    - Complexity Change: {delta_data['metrics']['complexity_delta']:.4f}
    
    Provide a 2-paragraph 'Architect's Diary' entry. 
    Paragraph 1: Summarize the primary structural shift. 
    Paragraph 2: Identify one potential risk (e.g., circular dependencies, increased coupling, or a file becoming a bottleneck).
    """
    
    try:
        completion = await client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model=model_name,
            temperature=0.2
        )
        return completion.choices[0].message.content
    except Exception as e:
        return f"Evolution narrative unavailable: {str(e)}"