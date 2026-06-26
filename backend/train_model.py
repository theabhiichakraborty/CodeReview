import pandas as pd
import numpy as np
import xgboost as xgb
import joblib
import os
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report

def generate_synthetic_data(num_samples=10000):
    """
    Generates a synthetic dataset for PR bug prediction.
    Features:
    - lines_added: int
    - lines_deleted: int
    - files_changed: int
    - comments_count: int
    - commit_count: int
    - is_buggy: binary target
    """
    np.random.seed(42)
    
    # Generate random features
    lines_added = np.random.exponential(scale=100, size=num_samples).astype(int)
    lines_deleted = np.random.exponential(scale=50, size=num_samples).astype(int)
    files_changed = np.random.poisson(lam=3, size=num_samples) + 1
    comments_count = np.random.poisson(lam=2, size=num_samples)
    commit_count = np.random.poisson(lam=1.5, size=num_samples) + 1

    # Define a heuristic for bugs (e.g., massive PRs with few comments are risky)
    # The higher this risk_score, the higher the probability of a bug
    risk_score = (lines_added * 0.05) + (files_changed * 2.0) + (lines_deleted * 0.02) - (comments_count * 1.5) + (commit_count * 0.5)
    
    # Add some noise
    risk_score += np.random.normal(loc=0, scale=10, size=num_samples)
    
    # Convert score to probability using sigmoid
    probability = 1 / (1 + np.exp(-risk_score / 20))
    
    # Generate labels based on probability
    is_buggy = np.random.binomial(n=1, p=probability)

    df = pd.DataFrame({
        'lines_added': lines_added,
        'lines_deleted': lines_deleted,
        'files_changed': files_changed,
        'comments_count': comments_count,
        'commit_count': commit_count,
        'is_buggy': is_buggy
    })
    
    return df

def train_model():
    print("Generating synthetic dataset...")
    df = generate_synthetic_data(5000)
    
    X = df.drop(columns=['is_buggy'])
    y = df['is_buggy']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("Training XGBoost model...")
    model = xgb.XGBClassifier(
        n_estimators=100,
        max_depth=5,
        learning_rate=0.1,
        random_state=42,
        eval_metric='logloss'
    )
    
    model.fit(X_train, y_train)
    
    # Evaluate
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    print(f"Model Accuracy: {accuracy:.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))
    
    # Save the model
    os.makedirs('models', exist_ok=True)
    model_path = os.path.join('models', 'xgboost_bug_predictor.json')
    model.save_model(model_path)
    print(f"Model saved to {model_path}")

if __name__ == "__main__":
    train_model()
