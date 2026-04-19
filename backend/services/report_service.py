import datetime
import json
from github import Github, GithubException
from services.ai_service import client, types

def get_github_report_stats(gh: Github, owner: str, repo_name: str) -> dict:
    repo_path = f"{owner}/{repo_name}"
    try:
        repo = gh.get_repo(repo_path)
    except GithubException as e:
        raise ValueError(f"Could not access repository {repo_path}: {e}")

    now = datetime.datetime.now(datetime.timezone.utc)
    
    # 1. Overview
    overview = {
        "name": repo.full_name,
        "description": repo.description or "No description provided.",
        "website": repo.homepage or "None",
        "topics": repo.get_topics() or [],
        "primary_language": repo.language or "None",
        "license": repo.license.name if repo.license else "None",
        "report_date": now.strftime("%Y-%m-%d")
    }
    
    # 2. Basic Stats
    # Note: open_issues_count includes PRs in GitHub API. We need to approximate or leave it.
    # To get actual open issues and PRs efficiently:
    pulls = repo.get_pulls(state='open')
    open_prs_count = pulls.totalCount
    open_issues_count = repo.open_issues_count - open_prs_count  # GitHub counts PRs as issues

    stats = {
        "stars": repo.stargazers_count,
        "forks": repo.forks_count,
        "watchers": repo.subscribers_count,
        "open_issues": open_issues_count,
        "open_prs": open_prs_count
    }

    # 3. Timestamps & Health
    pushed_at = repo.pushed_at.replace(tzinfo=datetime.timezone.utc) if repo.pushed_at else now
    created_at = repo.created_at.replace(tzinfo=datetime.timezone.utc) if repo.created_at else now
    updated_at = repo.updated_at.replace(tzinfo=datetime.timezone.utc) if repo.updated_at else now
    
    days_since_push = (now - pushed_at).days
    if days_since_push < 30:
        health_status = "ACTIVE"
        health_desc = "Recent commits indicate active ongoing development."
    elif days_since_push < 180:
        health_status = "MAINTAINED"
        health_desc = "Receives periodic updates and maintenance."
    elif days_since_push < 365:
        health_status = "SLOW-MOVING"
        health_desc = "Very infrequent updates. Project might be reaching maturity or losing momentum."
    else:
        health_status = "ABANDONED"
        health_desc = "No code changes in over a year. High risk of bit-rot."

    health = {
        "created_at": created_at.strftime("%Y-%m-%d"),
        "updated_at": updated_at.strftime("%Y-%m-%d"),
        "pushed_at": pushed_at.strftime("%Y-%m-%d"),
        "days_since_push": days_since_push,
        "status": health_status,
        "status_explanation": health_desc
    }

    # 4. Language Breakdown
    try:
        langs = repo.get_languages()
        total_bytes = sum(langs.values()) or 1
        languages = [{"name": k, "bytes": v, "share": round((v/total_bytes)*100, 1)} for k, v in langs.items()][:5]
    except:
        languages = []

    # 5. Commit History (Last 90 days approximation)
    ninety_days_ago = now - datetime.timedelta(days=90)
    try:
        recent_commits = repo.get_commits(since=ninety_days_ago)
        recent_commits_count = recent_commits.totalCount
    except:
        recent_commits_count = 0

    history = {
        "commits_last_90d": recent_commits_count,
        "period": f"{ninety_days_ago.strftime('%Y-%m-%d')} to {now.strftime('%Y-%m-%d')}"
    }

    # 6. Issue Tracking
    issue_tracking = {
        "open_issues": open_issues_count,
        "total_issues": repo.open_issues_count + (getattr(repo, 'network_count', 0)), # Approximate/skip deep fetch to save time
    }

    # 7. Pull Requests
    pull_requests = {
        "open_prs": open_prs_count
    }

    # 8. Top Contributors
    try:
        contribs = repo.get_contributors()
        total_contrib_commits = sum([c.contributions for c in contribs[:10]]) or 1
        top_contributors = [
            {"rank": i+1, "username": c.login, "commits": c.contributions, "share": round((c.contributions/total_contrib_commits)*100, 1)}
            for i, c in enumerate(contribs[:5])
        ]
        bus_factor = "High Risk (Single Dev)" if len(top_contributors) == 1 or (top_contributors and top_contributors[0]["share"] > 80) else "Healthy Distribution"
    except:
        top_contributors = []
        bus_factor = "Unknown"

    # 9. Community Profile
    try:
        # Hack to get community health boolean flags quickly
        has_license = bool(repo.license)
        # Check files for common community standards
        root_files = [f.path.lower() for f in repo.get_contents("")]
        has_coc = any("code_of_conduct" in f for f in root_files)
        has_contrib = any("contributing" in f for f in root_files)
        has_issue_template = any("issue_template" in f or ".github/issue_template" in f for f in root_files)
        has_pr_template = any("pull_request_template" in f or ".github/pull_request_template" in f for f in root_files)
        has_security = any("security" in f for f in root_files)

        score = sum([has_license, has_coc, has_contrib, has_issue_template, has_pr_template, has_security])
        community_health = {
            "License": has_license,
            "Code of Conduct": has_coc,
            "Contributing Guide": has_contrib,
            "Issue Template": has_issue_template,
            "PR Template": has_pr_template,
            "Security Policy": has_security,
            "Score": score
        }
    except:
        community_health = {"Score": 0}

    # 10. Traffic (Will fail if no admin access)
    traffic = {}
    try:
        views = repo.get_views_traffic()
        clones = repo.get_clones_traffic()
        traffic = {
            "page_views_total": views.get("count", 0),
            "page_views_unique": views.get("uniques", 0),
            "clones_total": clones.get("count", 0),
            "clones_unique": clones.get("uniques", 0),
            "error": None
        }
    except GithubException as e:
        if e.status in [403, 404]:
            traffic = {"error": "N/A - Requires Admin Access"}
        else:
            traffic = {"error": "N/A - Data Unavailable"}

    return {
        "overview": overview,
        "stats": stats,
        "health": health,
        "languages": languages,
        "history": history,
        "issues": issue_tracking,
        "pulls": pull_requests,
        "top_contributors": top_contributors,
        "bus_factor": bus_factor,
        "community_health": community_health,
        "traffic": traffic
    }


async def generate_report_insights(stats_json: dict) -> dict:
    """
    Feeds the stats to Gemini to generate plain English interpretations and an Executive Summary.
    """
    prompt = f"""
    You are an expert technical auditor analyzing a GitHub repository algorithmically.
    You will be provided with a JSON dump of raw GitHub metrics for a codebase.
    
    RAW METRICS JSON:
    {json.dumps(stats_json, indent=2)}
    
    Your task is to write:
    1. Short, precise plain-text interpretations (1-2 sentences) for specific statistical sections.
    2. A professional Executive Summary (4-6 sentences) suitable for a non-technical stakeholder.
    3. A list of exactly 2 Key Strengths and exactly 2 Key Risks based STRICTLY on the numbers provided.
    
    Output exactly this JSON structure, with nothing else:
    {{
       "interpretations": {{
          "stats": "1-2 sentences on popularity and community size.",
          "languages": "1 sentence characterizing the tech stack.",
          "history": "1-2 sentences on commit cadence and engagement.",
          "community": "1 sentence on the project's open-source maturity."
       }},
       "executive_summary": "4-6 sentences outlining overall health, activity, engagement, and noting major risks/strengths.",
       "key_strengths": ["Strength 1", "Strength 2"],
       "key_risks": ["Risk 1", "Risk 2"]
    }}
    """
    
    try:
        # We use Flash 2.5 because it's fast and handles complex prompt parsing easily
        response = await client.aio.models.generate_content(
            model='gemini-flash-latest',
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.2,
                response_mime_type="application/json",
            )
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"Failed to generate report insights: {e}")
        return {
           "interpretations": {
              "stats": "Analysis unavailable.",
              "languages": "Analysis unavailable.",
              "history": "Analysis unavailable.",
              "community": "Analysis unavailable."
           },
           "executive_summary": "The AI insight generator is currently unavailable or hit a rate limit. Please rely on the raw metrics provided in the report above.",
           "key_strengths": ["Data unavailable", "Data unavailable"],
           "key_risks": ["Data unavailable", "Data unavailable"]
        }
