from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class PredictionRequest(BaseModel):
    timestamp: datetime
    lag_1_hour: float
    lag_2_hour: float
    lag_3_hour: float
    lag_24_hour: float
    lag_48_hour: float
    lag_168_hour: float
    rolling_mean_24h: float
    rolling_std_24h: float
    rolling_mean_7d: float
    hour: int
    dayofweek: int
    quarter: int
    month: int
    year: int
    dayofyear: int
    is_weekend: int

class PredictionResponse(BaseModel):
    timestamp: datetime
    predicted_load_mw: float
    is_anomaly: bool
    anomaly_score: float
    confidence_interval: dict

class FeatureImportanceResponse(BaseModel):
    features: List[dict]

class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    scaler_loaded: bool
    anomaly_detector_loaded: bool