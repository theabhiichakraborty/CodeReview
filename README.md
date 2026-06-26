# 🔍 AI Code Reviewer & Bug Predictor

An AI-powered developer tool that analyzes GitHub Pull Requests and predicts the likelihood of a PR introducing a bug. Built with **FastAPI**, **XGBoost**, and **React**, it provides real-time risk scores with full **SHAP explainability** — so you know *why* a PR is risky, not just *that* it is.

---

## ✨ Features

- **Instant PR Analysis** — Paste any public GitHub PR URL and get a bug-risk prediction in seconds.
- **XGBoost ML Model** — Trained on 5,000+ synthetic PR samples with features like lines added, files changed, and commit count.
- **SHAP Explainability** — Visual breakdown of which features pushed the risk score up or down.
- **Real-time GitHub Integration** — Fetches live PR metadata directly from the GitHub API.
- **Modern Dark-Mode UI** — Sleek React dashboard built with Tailwind CSS v4.

---

## 🏗️ Architecture

```
ai-code-reviewer/
├── backend/                  # Python FastAPI Server
│   ├── main.py               # API endpoints & SHAP integration
│   ├── train_model.py        # Synthetic data generation & XGBoost training
│   └── models/
│       └── xgboost_bug_predictor.json
├── frontend/                 # React + Vite Frontend
│   ├── src/
│   │   ├── App.jsx           # Main dashboard UI
│   │   ├── main.jsx          # Entry point
│   │   └── index.css         # Tailwind CSS
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── CHANGELOG.md              # Bug fixes & improvements log
└── README.md
```

---

## 🛠️ Tech Stack

| Layer        | Technology                              |
|:-------------|:----------------------------------------|
| **Frontend** | React 19, Vite 5, Tailwind CSS v4       |
| **Backend**  | Python, FastAPI, Uvicorn                |
| **ML Model** | XGBoost, Scikit-Learn, SHAP             |
| **Data**     | Pandas, NumPy                           |
| **API**      | GitHub REST API v3, httpx               |

---

## 🚀 Getting Started

### Prerequisites

- Python 3.10+
- Node.js 20+
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/theabhiichakraborty/CodeReview.git
cd CodeReview
```

### 2. Setup Backend

```bash
cd backend
python -m venv venv

# Windows
.\venv\Scripts\Activate.ps1

# macOS/Linux
source venv/bin/activate

pip install fastapi uvicorn xgboost shap scikit-learn pandas httpx
```

### 3. Train the Model (Optional — pre-trained model is included)

```bash
python train_model.py
```

### 4. Start the Backend Server

```bash
uvicorn main:app --port 8000
```

The API will be live at `http://localhost:8000`. Swagger docs available at `http://localhost:8000/docs`.

### 5. Setup & Start Frontend

```bash
cd ../frontend
npm install
npm run dev
```

The dashboard will be live at `http://localhost:5173`.

---

## 📊 How It Works

1. **User submits a GitHub PR URL** via the React dashboard.
2. **FastAPI backend** parses the URL and fetches PR metadata (lines added, files changed, commits, etc.) from the GitHub API.
3. **XGBoost model** predicts the probability of the PR introducing a bug based on 5 engineered features.
4. **SHAP TreeExplainer** calculates the contribution of each feature to the prediction.
5. **Frontend** renders the risk score, PR metrics, and a visual SHAP explainability chart.

---

## 🔑 API Reference

### `POST /api/analyze-pr`

**Request Body:**
```json
{
  "github_url": "https://github.com/owner/repo/pull/123"
}
```

**Response:**
```json
{
  "bug_probability": 0.73,
  "risk_level": "High",
  "metrics": {
    "lines_added": 542,
    "lines_deleted": 38,
    "files_changed": 12,
    "comments_count": 1,
    "commit_count": 3
  },
  "shap_values": [
    { "feature": "lines_added", "impact": 0.182 },
    { "feature": "files_changed", "impact": 0.097 },
    { "feature": "comments_count", "impact": -0.043 },
    { "feature": "commit_count", "impact": 0.021 },
    { "feature": "lines_deleted", "impact": 0.008 }
  ]
}
```

### `GET /api/health`

Returns `{ "status": "ok" }`.

---

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

---

## 👤 Author

**Shreyas Chakraborty**
- GitHub: [@theabhiichakraborty](https://github.com/theabhiichakraborty)
- LinkedIn: [Shreyas Chakraborty](https://www.linkedin.com/in/shreyas-chakraborty-44579b257/)
