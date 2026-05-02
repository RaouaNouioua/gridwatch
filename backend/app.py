from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import numpy as np

from schemas import (
    PredictionRequest, 
    PredictionResponse, 
    FeatureImportanceResponse,
    HealthResponse
)
from model_loader import predict_load, get_feature_importance, xgb_model, scaler, iso_forest

app = FastAPI(
    title="GridWatch API",
    description="Hourly Load Forecasting & Anomaly Detection for Smart Grids",
    version="1.0.0"
)

# CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/", tags=["Root"])
async def root():
    return {
        "message": "GridWatch API - Hourly Load Forecasting",
        "docs": "/docs",
        "health": "/health"
    }

@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    return HealthResponse(
        status="healthy",
        model_loaded=xgb_model is not None,
        scaler_loaded=scaler is not None,
        anomaly_detector_loaded=iso_forest is not None
    )

@app.post("/predict", response_model=PredictionResponse, tags=["Prediction"])
async def predict(request: PredictionRequest):
    try:
        # Convert request to dict
        features = request.model_dump()
        
        # Make prediction
        prediction, is_anomaly, anomaly_score = predict_load(features)
        
        # Calculate confidence interval (±1 RMSE)
        rmse = 572  # From model evaluation
        
        return PredictionResponse(
            timestamp=request.timestamp,
            predicted_load_mw=float(prediction),
            is_anomaly=is_anomaly,
            anomaly_score=float(anomaly_score),
            confidence_interval={
                "lower": float(prediction - rmse),
                "upper": float(prediction + rmse)
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/features/importance", response_model=FeatureImportanceResponse, tags=["Features"])
async def feature_importance():
    try:
        importance = get_feature_importance()
        return FeatureImportanceResponse(features=importance)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/model/info", tags=["Model"])
async def model_info():
    from model_loader import FEATURE_COLS
    return {
        "model_type": "XGBoost Regressor",
        "features": len(FEATURE_COLS),
        "performance": {
            "mae_mw": 344,
            "rmse_mw": 572,
            "mape_percent": 1.11,
            "r2_score": 0.9923
        }
    }