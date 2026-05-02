
# GridWatch Model Card

## Model Information
- **Model Type**: XGBoost Regressor
- **Training Date**: 2026-04-10
- **Training Samples**: 116,158 hours
- **Test Samples**: 29,040 hours
- **Features**: 16 features

## Performance Metrics
| Metric | Value |
|--------|-------|
| MAE | 344 MW |
| RMSE | 572 MW |
| MAPE | 1.11% |
| R² | 0.9923 |

## Feature Importance (Top 5)
| Feature | Importance |
|---------|------------|
| lag_1_hour | 73.08% |
| lag_24_hour | 13.64% |
| lag_2_hour | 5.12% |
| hour | 1.51% |
| lag_3_hour | 1.50% |

## Anomaly Detection
- **Algorithm**: Isolation Forest
- **Contamination**: 2.0%
- **Anomalies Detected**: 2,904 hours

## Key Findings
1. Lag features account for 94.5% of predictive power
2. Model achieves 99.2% R² under normal conditions
3. Two distinct anomaly types identified:
   - Type A: Demand extremes (heat waves) → Isolation Forest detects
   - Type B: Pattern breaks (holidays, polar vortex) → Residual monitoring required

## Files
- `xgboost_model.pkl` - XGBoost model (joblib format)
- `isolation_forest.pkl` - Isolation Forest model
- `scaler.pkl` - StandardScaler for feature normalization
- `feature_config.json` - Feature configuration and metadata
