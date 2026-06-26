from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import xgboost as xgb
import shap
import pandas as pd
import numpy as np
import httpx
import re

app = FastAPI(title="AI Code Reviewer API")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load Model
model = xgb.XGBClassifier()
model.load_model("models/xgboost_bug_predictor.json")

# Initialize SHAP explainer
# Since XGBoost uses tree models, we can use TreeExplainer
explainer = shap.TreeExplainer(model)

class PRRequest(BaseModel):
    github_url: str

class FeatureImportance(BaseModel):
    feature: str
    impact: float

class PRResponse(BaseModel):
    bug_probability: float
    risk_level: str
    metrics: dict
    shap_values: list[FeatureImportance]

def parse_github_url(url: str):
    """Extracts owner, repo, and PR number from a standard GitHub PR URL."""
    match = re.search(r"github\.com/([^/]+)/([^/]+)/pull/(\d+)", url)
    if not match:
        raise ValueError("Invalid GitHub PR URL. Format should be: https://github.com/owner/repo/pull/123")
    return match.groups()

async def fetch_pr_data(owner: str, repo: str, pr_number: str):
    """Fetches PR data from GitHub API."""
    headers = {
        "User-Agent": "AI-Code-Reviewer",
        "Accept": "application/vnd.github.v3+json",
    }
    async with httpx.AsyncClient(timeout=15.0) as client:
        # Fetch PR details (additions, deletions, commits)
        url = f"https://api.github.com/repos/{owner}/{repo}/pulls/{pr_number}"
        try:
            response = await client.get(url, headers=headers)
        except httpx.RequestError as e:
            raise HTTPException(status_code=502, detail=f"Failed to connect to GitHub: {str(e)}")
        
        if response.status_code == 403:
            raise HTTPException(status_code=429, detail="GitHub API rate limit exceeded. Try again later.")
        if response.status_code != 200:
            raise HTTPException(status_code=404, detail="PR not found or repository is private.")
        
        pr_data = response.json()
        
        return {
            "lines_added": pr_data.get("additions", 0),
            "lines_deleted": pr_data.get("deletions", 0),
            "files_changed": pr_data.get("changed_files", 0),
            "comments_count": pr_data.get("review_comments", 0),
            "commit_count": pr_data.get("commits", 0)
        }

@app.post("/api/analyze-pr", response_model=PRResponse)
async def analyze_pr(request: PRRequest):
    try:
        owner, repo, pr_number = parse_github_url(request.github_url)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Fetch data from GitHub
    metrics = await fetch_pr_data(owner, repo, pr_number)
    
    # Prepare features for model (must match training feature order)
    feature_names = ['lines_added', 'lines_deleted', 'files_changed', 'comments_count', 'commit_count']
    features_df = pd.DataFrame([metrics])[feature_names]
    
    # Predict Probability
    prob = model.predict_proba(features_df)[0][1] # Probability of class 1 (buggy)
    
    # Calculate SHAP values
    shap_vals = explainer.shap_values(features_df)
    
    # Prepare explainability response
    # For binary classification, shap_vals is usually an array of shape (n_samples, n_features)
    # or a list of arrays. For xgb, it's (n_samples, n_features)
    if isinstance(shap_vals, list):
        shap_array = shap_vals[1][0] # class 1
    else:
        shap_array = shap_vals[0]
        
    feature_impacts = [
        FeatureImportance(feature=f_name, impact=float(shap_val))
        for f_name, shap_val in zip(feature_names, shap_array)
    ]
    
    # Sort by absolute impact
    feature_impacts.sort(key=lambda x: abs(x.impact), reverse=True)
    
    if prob > 0.7:
        risk = "High"
    elif prob > 0.4:
        risk = "Medium"
    else:
        risk = "Low"

    return PRResponse(
        bug_probability=float(prob),
        risk_level=risk,
        metrics=metrics,
        shap_values=feature_impacts
    )

@app.get("/api/health")
def health_check():
    return {"status": "ok"}
