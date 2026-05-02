import joblib
import json
import numpy as np
import pandas as pd
from pathlib import Path

MODEL_DIR = Path(__file__).parent / "models"

# Load models
xgb_model = joblib.load(MODEL_DIR / "xgboost_model.pkl")
scaler = joblib.load(MODEL_DIR / "scaler.pkl")
iso_forest = joblib.load(MODEL_DIR / "isolation_forest.pkl")

# Load config
with open(MODEL_DIR / "feature_config.json", "r") as f:
    config = json.load(f)

FEATURE_COLS = config["feature_columns"]

def predict_load(features: dict) -> tuple:
    """Predict load and detect anomaly."""
    # Convert to DataFrame with correct feature order
    feature_values = [[features[col] for col in FEATURE_COLS]]
    X = pd.DataFrame(feature_values, columns=FEATURE_COLS)
    
    # Predict load
    prediction = xgb_model.predict(X)[0]
    
    # Detect anomaly
    X_scaled = scaler.transform(X)
    anomaly_score = iso_forest.decision_function(X_scaled)[0]
    is_anomaly = iso_forest.predict(X_scaled)[0] == -1
    
    return float(prediction), bool(is_anomaly), float(anomaly_score)

def get_feature_importance() -> list:
    """Return feature importance as list of dicts."""
    importance = xgb_model.feature_importances_
    return [
        {"feature": feat, "importance": float(imp)}
        for feat, imp in sorted(
            zip(FEATURE_COLS, importance), 
            key=lambda x: x[1], 
            reverse=True
        )
    ]