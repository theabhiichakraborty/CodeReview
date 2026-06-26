# CHANGELOG — Bug Fixes

**Date:** 2026-06-26

---

## Backend (`backend/main.py`)

### 1. Missing `User-Agent` Header on GitHub API Requests
- **Problem:** GitHub API requires a `User-Agent` header. Without it, requests are rejected with a 403 error.
- **Fix:** Added `User-Agent: AI-Code-Reviewer` and `Accept: application/vnd.github.v3+json` headers to all outgoing GitHub requests.

### 2. No Request Timeout
- **Problem:** If GitHub was slow or unresponsive, the `httpx` client would hang indefinitely, blocking the server.
- **Fix:** Added `timeout=15.0` seconds to the `httpx.AsyncClient`.

### 3. No GitHub Rate Limit Handling
- **Problem:** When GitHub returns a 403 (rate limit exceeded), the backend returned a generic 404 "PR not found" error, misleading the user.
- **Fix:** Added explicit handling for HTTP 403 → returns a 429 response with `"GitHub API rate limit exceeded. Try again later."`.

### 4. Unhandled Network Errors
- **Problem:** If the GitHub API was unreachable (DNS failure, connection refused), the server would crash with an unhandled exception.
- **Fix:** Wrapped the request in a `try/except httpx.RequestError` block, returning a 502 with a descriptive message.

---

## Backend (`backend/train_model.py`)

### 5. Deprecated `use_label_encoder` Parameter
- **Problem:** `XGBClassifier(use_label_encoder=False)` is deprecated in modern XGBoost and emits a warning during training.
- **Fix:** Removed the `use_label_encoder` parameter entirely.

---

## Frontend (`frontend/src/App.jsx`)

### 6. `String.replace()` Only Replaces First Underscore
- **Problem:** `key.replace('_', ' ')` only replaces the **first** underscore. For example, `commit_count` → `commit count` works, but `lines_added` was fine only by luck.
- **Fix:** Changed to `key.replaceAll('_', ' ')` with a `formatKey()` helper that also capitalizes each word.

### 7. Non-Existent Tailwind CSS Animation Classes
- **Problem:** Classes `animate-in`, `fade-in`, and `slide-in-from-bottom-4` do not exist in Tailwind CSS v4. They require the `tailwindcss-animate` plugin, which was not installed.
- **Fix:** Removed the broken animation classes from the results section.

### 8. SHAP Bar Scaling Was Hardcoded
- **Problem:** SHAP bar widths were calculated as `Math.abs(impact) * 20`, which produced tiny, nearly invisible bars for small SHAP values and oversized bars for large ones.
- **Fix:** Bars are now normalized relative to the maximum SHAP value: `(|impact| / maxImpact) * 100%`, so the largest bar always fills the full width.

### 9. Poor Error Handling for Network Failures
- **Problem:** If the backend server was not running, `fetch()` threw a `TypeError` with no useful message, showing a confusing error to the user.
- **Fix:** Added a specific `TypeError` catch that displays: `"Cannot connect to backend. Make sure the API server is running on port 8000."`. Also added a styled error container.

---

## Frontend (`frontend/index.html`)

### 10. Incorrect Page Title
- **Problem:** The `<title>` tag was set to `"frontend"` (the Vite scaffold default).
- **Fix:** Changed to `"AI Code Reviewer"`.
