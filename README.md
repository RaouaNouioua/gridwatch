# ⚡ GridWatch: Hourly Load Forecasting & Anomaly Detection

[![Python](https://img.shields.io/badge/Python-3.9+-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.2+-61DAFB.svg)](https://reactjs.org)
[![XGBoost](https://img.shields.io/badge/XGBoost-2.0+-orange.svg)](https://xgboost.ai)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A production-ready machine learning system for forecasting hourly electricity demand and detecting anomalies in smart grid operations. Built with XGBoost, Isolation Forest, FastAPI, and React.

**🔗 [Live Demo](https://gridwatch-demo.onrender.com)** *(Add your deployment link here)*

---

## 📊 Project Overview

GridWatch predicts next-hour electricity demand for PJM Interconnection (serving 65M+ people across 13 US states) with **99.2% accuracy** and detects two distinct types of operational anomalies.

### Key Features
- ⚡ **Hourly Load Forecasting**: XGBoost model predicts demand with ±344 MW MAE
- 🚨 **Dual-Layer Anomaly Detection**: Identifies both demand extremes and pattern breaks
- 🎯 **Feature Engineering**: 16 engineered features including lag variables and rolling statistics
- 📈 **Interactive Dashboard**: Real-time visualization of predictions and anomalies
- 🔧 **Production-Ready API**: FastAPI backend with Swagger documentation

---

## 🎯 Model Performance

| Metric | Value | Interpretation |
|--------|-------|----------------|
| **R² Score** | 0.9923 | Model explains 99.23% of demand variance |
| **MAE** | ±344 MW | Average prediction error < 1% of mean load |
| **RMSE** | 572 MW | Root mean square error |
| **MAPE** | 1.11% | Mean absolute percentage error |

---

## 🔬 Key Finding: Two Distinct Anomaly Types

This project revealed a critical insight for grid operations—there are **two fundamentally different types of anomalies** requiring different detection strategies:

### Type A: Demand Extremes ✅ (Detected by Isolation Forest)
- **Examples**: July 2006 heat wave (57,084 MW), July 2011 peak (60,689 MW)
- **Characteristic**: Absolute load values are statistically extreme
- **Risk**: Physical grid stress, potential blackouts
- **Detection**: Isolation Forest flags with 100% consistency

### Type B: Pattern Breaks ❌ (Detected by XGBoost Residuals)
- **Examples**: New Year's Eve 1 AM (8,645 MW error), Polar vortex (8,827 MW error)
- **Characteristic**: Load values are normal, but expected pattern breaks
- **Risk**: Forecasting failure → misallocated generation → economic loss
- **Detection**: Requires monitoring prediction residuals in real-time

> **💡 Insight**: A complete grid monitoring system requires **both** Isolation Forest (for supply-side extremes) **and** residual monitoring (for demand-side surprises).

---

## 📈 Feature Importance

The model's predictive power is dominated by recent history:

| Feature | Importance | Insight |
|---------|------------|---------|
| `lag_1_hour` | 73.08% | "What happened 1 hour ago is the best predictor" |
| `lag_24_hour` | 13.64% | "Yesterday's same hour adds daily context" |
| `lag_2_hour` | 5.12% | Short-term momentum |
| `hour` | 1.51% | Time-of-day patterns |
| `lag_3_hour` | 1.50% | Recent trajectory |

**Key Takeaway**: Lag features account for **94.5%** of total importance—electricity demand behaves like momentum.

---

## 🏗️ Architecture
┌─────────────────────────────────────────────────────────────────┐
│ SYSTEM ARCHITECTURE │
├─────────────────────────────────────────────────────────────────┤
│ │
│ PJM Hourly Data (145,000 hours) │
│ │ │
│ ▼ │
│ Feature Engineering (16 features) │
│ │ │
│ ┌────────┴────────┐ │
│ │ │ │
│ ▼ ▼ │
│ XGBoost Isolation Forest │
│ (Forecast) (Anomaly Detection) │
│ │ │ │
│ ▼ ▼ │
│ Predictions Type A Anomalies │
│ (R²=0.992) (Heat waves) │
│ │ │ │
│ └────────┬────────┘ │
│ │ │
│ ▼ │
│ Compare Residuals → Type B Anomalies (Pattern breaks) │
│ │ │
│ ▼ │
│ FastAPI Backend (REST API) │
│ │ │
│ ▼ │
│ React Dashboard (Visualization) │
│ │
└─────────────────────────────────────────────────────────────────┘

text

---

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+
- Git

### Backend Setup

```bash
# Clone repository
git clone https://github.com/yourusername/gridwatch.git
cd gridwatch/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy model files from /models to /backend/models
cp ../models/*.pkl ./models/
cp ../models/feature_config.json ./models/

# Run FastAPI server
uvicorn app:app --reload --port 8000
API will be available at http://localhost:8000

Swagger Docs: http://localhost:8000/docs

Health Check: http://localhost:8000/health

Frontend Setup
bash
cd ../frontend

# Install dependencies
npm install

# Run development server
npm run dev
Dashboard will be available at http://localhost:5173

📡 API Endpoints
Method	Endpoint	Description
GET	/health	Health check
POST	/predict	Predict load for next hour
POST	/predict/range	Predict for multiple hours
GET	/features/importance	Get feature importance
POST	/detect/anomaly	Check if current hour is anomalous
Example Request
json
POST /predict
{
    "timestamp": "2024-01-15T14:00:00",
    "lag_1_hour": 51200.0,
    "lag_24_hour": 49800.0,
    "hour": 14,
    "month": 1,
    "dayofweek": 0
}
Example Response
json
{
    "timestamp": "2024-01-15T14:00:00",
    "predicted_load_mw": 52327.5,
    "is_anomaly": false,
    "anomaly_score": 0.124,
    "confidence_interval": {
        "lower": 51754.5,
        "upper": 52900.5
    }
}
🛠️ Technologies Used
Machine Learning
XGBoost: Gradient boosting for forecasting

Isolation Forest: Unsupervised anomaly detection

Scikit-learn: Feature preprocessing and evaluation

Pandas/NumPy: Data manipulation

Backend
FastAPI: REST API framework

Pydantic: Data validation

Uvicorn: ASGI server

Joblib: Model serialization

Frontend
React 18: UI framework

Recharts: Data visualization

Axios: API client

Tailwind CSS: Styling

📂 Dataset
Source: PJM Interconnection Hourly Energy Consumption
Period: 2002-2018 (145,366 hours)
Location: PJM RTO (13 states, 65M+ customers)
Kaggle: robikscube/hourly-energy-consumption

🎓 Key Learnings
Momentum dominates forecasting: 94.5% of predictive power from lag features

Two anomaly types require different detection: Statistical outliers ≠ prediction failures

1:00 AM is the hardest hour to predict: Pattern breaks after unusual events

Heat waves are detectable, holidays are not: Isolation Forest catches extremes, misses context shifts

🔮 Future Improvements
Add weather data integration (temperature, humidity)

Implement LSTM neural network for comparison

Add real-time streaming via WebSockets

Deploy to AWS/GCP with CI/CD pipeline

Add user authentication and alert thresholds
