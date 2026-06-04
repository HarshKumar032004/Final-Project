// ==============================================================================
// AI PREDICTION CLIENT
// Transmits historical aggregates to the Python FastAPI Scikit-Learn worker.
// ==============================================================================

import { config } from '../config/env';
import logger from '../utils/logger';

export interface DataPoint {
  month: string; // Format: 'YYYY-MM'
  co2e: number;
}

/**
 * Acts as an HTTP Client to the Python ML Microservice.
 * Provides graceful degradation so the dashboard doesn't crash if ML is down.
 */
export const predictFutureEmissions = async (
  historicalData: DataPoint[],
  monthsToPredict = 3
): Promise<DataPoint[]> => {
  if (historicalData.length < 2) return [];

  try {
    const targetUrl = `${config.microservices.pythonUrl}/api/predict`;
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ historicalData, monthsToPredict }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Python service HTTP ${response.status}: ${errText}`);
    }

    const { predictedData } = await response.json() as { predictedData: DataPoint[] };
    return predictedData;
  } catch (error) {
    // Critical: Do not crash the analytics dashboard request
    logger.error('[MLService] Failed to fetch forecast from Python microservice:', error);
    return [];
  }
};

