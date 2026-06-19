import networkx as nx
from sqlalchemy.orm import Session
import json

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

    # 3. Calculate Structural Metrics safely
    density_old = nx.density(G_old) if len(G_old.nodes) > 0 else 0
    density_new = nx.density(G_new) if len(G_new.nodes) > 0 else 0

    metrics = {
        "complexity_delta": density_new - density_old,
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

async def get_or_generate_evolution(commit_sha: str, delta_data: dict, client, model_name: str, db: Session):
    """
    Checks if the Architect's Diary entry already exists in SQLite. 
    If yes, returns it instantly. If no, calls Groq and caches it.
    """
    # Try to import your database model safely
    try:
        from models import CommitInsight
        
        # 1. Look for a cached entry in SQLite
        cached_insight = db.query(CommitInsight).filter(CommitInsight.commit_sha == commit_sha).first()
        if cached_insight and cached_insight.narrative:
            print(f"⚡ Cache Hit! Serving evolution narrative for {commit_sha} from DB.")
            return cached_insight.narrative
    except ImportError:
        print("⚠️ Warning: CommitInsight model not found in models.py, skipping DB read.")
        cached_insight = None

    print(f"🤖 Cache Miss. Requesting live LLM analysis for {commit_sha}...")
    
    # 2. If not found, run the Groq narrative generation
    narrative = await generate_evolution_narrative(delta_data, client, model_name)
    
    # 3. Save the new narrative back to SQLite
    try:
        from models import CommitInsight
        if cached_insight:
            cached_insight.narrative = narrative
        else:
            new_entry = CommitInsight(
                commit_sha=commit_sha,
                repo_id=delta_data.get('repo_id', 'unknown'),
                narrative=narrative,
                delta_json=json.dumps(delta_data)
            )
            db.add(new_entry)
        db.commit()
    except Exception as e:
        print(f"⚠️ Could not cache to database (might need DB migration): {e}")
        db.rollback()

    return narrative

async def generate_evolution_narrative(delta_data: dict, client, model_name: str):
    """
    Sends the structural delta to Groq/Llama to get a human-readable explanation.
    """
    prompt = f"""
    Act as a Senior Architect explaining a code evolution.
    
    COMMIT MESSAGE: {delta_data.get('message', 'N/A')}
    
    CHANGES DETECTED:
    - Lines Added: {delta_data.get('added_lines', 0)}
    - Lines Removed: {delta_data.get('removed_lines', 0)}
    - Files Added: {delta_data.get('added_files', [])}
    - Files Removed: {delta_data.get('removed_files', [])}
    - New Connections: {len(delta_data.get('added_dependencies', []))}
    - Complexity Change: {delta_data.get('metrics', {}).get('complexity_delta', 0.0):.4f}
    
    Provide a 2-paragraph 'Architect's Diary' entry. 
    Paragraph 1: Summarize the primary structural shift, referencing the commit message, files, and lines. 
    Paragraph 2: Identify one potential architectural risk/outcome (e.g., circular dependencies, tighter coupling, or isolation).
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