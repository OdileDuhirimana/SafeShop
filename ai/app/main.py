from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any

app = FastAPI(title="SafeShop AI Service")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RecommendRequest(BaseModel):
    user_id: str | None = None
    history: List[str] = []

class RecommendResponse(BaseModel):
    recommendations: List[Dict[str, Any]]

class FraudRequest(BaseModel):
    order_total: float
    items_count: int
    user_age_days: int

class FraudResponse(BaseModel):
    score: float
    flagged: bool

@app.get("/health")
async def health():
    return {"ok": True}

@app.post("/recommend", response_model=RecommendResponse)
async def recommend(req: RecommendRequest):
    # Placeholder: return generic items; frontend will reconcile by title only
    recs = [
        {"title": "Smartphone X", "reason": "popular"},
        {"title": "Wireless Headphones", "reason": "similar_to_history"},
    ]
    return {"recommendations": recs}

@app.post("/fraud", response_model=FraudResponse)
async def fraud(req: FraudRequest):
    # Very naive heuristic
    score = 0.1
    if req.order_total > 1000:
        score += 0.6
    if req.items_count > 5:
        score += 0.2
    if req.user_age_days < 7:
        score += 0.3
    return {"score": score, "flagged": score >= 0.7}
