from pydantic import BaseModel
from typing import List, Dict, Any

# ==========================================
# 1. REQUEST MODELS
# ==========================================
class AnalyzeRequest(BaseModel):
    github_url: str

# ==========================================
# 2. RESPONSE MODELS: /analyze Endpoint
# ==========================================
class AnalyzeResponse(BaseModel):
    status: str
    github_url: str
    repo_id: str
    total_files: int
    entry_points: List[str]
    file_tree: List[str]
    edges: List[List[str]]  # [[source, target], ...] — full dependency edge list

# ==========================================
# 3. GRAPH DATA MODELS (Matches graph_engine.py & React Flow)
# ==========================================
class NodeData(BaseModel):
    label: str
    fullPath: str
    impactScore: int
    type: str

class GraphNode(BaseModel):
    id: str
    data: NodeData

class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    animated: bool

class GraphData(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]

# ==========================================
# 4. AI INSIGHTS MODELS (Matches ai_service.py)
# ==========================================
class AIFunctionDetail(BaseModel):
    name: str
    purpose: str

class ExternalAPI(BaseModel):
    name: str
    purpose: str

class AIInsights(BaseModel):
    summary: str
    functions: List[AIFunctionDetail]
    functions_used: List[AIFunctionDetail] = []
    external_apis: List[ExternalAPI] = []
    data_flow: str

# ==========================================
# 5. RESPONSE MODELS: /file-details Endpoint
# ==========================================

class FunctionInfo(BaseModel):
    name: str
    line: int
    purpose: str

class ApiInfo(BaseModel):
    name: str
    line: int

class FileDetailsResponse(BaseModel):
    graph: GraphData
    ai_insights: AIInsights
    functions: List[FunctionInfo]
    apis: List[ApiInfo]
    onboarding_path: List[str]