# ==============================================================================
# FASTAPI PREDICTION ENGINE
# Offloads massive mathematical compute (Scikit-Learn) from Node.js
# ==============================================================================

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from datetime import datetime
from dateutil.relativedelta import relativedelta

app = FastAPI(title="Carbon ML Prediction Service API")

# --- Pydantic Data Models ---
class HistoricalPoint(BaseModel):
    month: str = Field(..., description="Format: YYYY-MM")
    co2e: float

class PredictRequest(BaseModel):
    historicalData: List[HistoricalPoint]
    monthsToPredict: int = Field(default=3, gt=0, le=24)

class PredictResponse(BaseModel):
    predictedData: List[HistoricalPoint]

# --- Core Algorithm ---
@app.post("/api/predict", response_model=PredictResponse)
async def predict_emissions(request: PredictRequest):
    historical = request.historicalData
    N = len(historical)

    # Need at least 2 points for a baseline regression slope
    if N < 2:
        return PredictResponse(predictedData=[])

    # Convert into a Pandas DataFrame
    df = pd.DataFrame([h.model_dump() for h in historical])
    
    # We use numerical sequence arrays as features (X = 0, 1, 2...)
    # and historical emission data as targets (y)
    X = np.arange(N).reshape(-1, 1)
    y = df['co2e'].values

    # Train Scikit-Learn Model
    model = LinearRegression()
    model.fit(X, y)

    # Generate future X indices [N, N+1, N+2 ...]
    future_X = np.arange(N, N + request.monthsToPredict).reshape(-1, 1)
    
    # Forward project
    predictions = model.predict(future_X)

    # Reconstruct the string dates (YYYY-MM)
    predicted_data = []
    
    # Safely parse the last known month
    last_known_str = historical[-1].month
    try:
        last_date = datetime.strptime(last_known_str, "%Y-%m")
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid date format: {last_known_str}. Must be YYYY-MM")

    for i in range(request.monthsToPredict):
        # Step forward exact exact months
        next_date = last_date + relativedelta(months=(i + 1))
        next_month_str = next_date.strftime("%Y-%m")
        
        # Guard against mathematically negative emissions
        predicted_co2e = max(0.0, float(predictions[i]))
        
        predicted_data.append(HistoricalPoint(
            month=next_month_str,
            co2e=round(predicted_co2e, 4)
        ))

    return PredictResponse(predictedData=predicted_data)

# Run server directly via: uvicorn main:app --reload --port 8000
