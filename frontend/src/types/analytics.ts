// Analytics Dashboard — TypeScript Interface Definitions
// ============================================================

export interface HistoricalDataPoint {
  month: string; // Format: 'YYYY-MM'
  total: number;
  details: {
    SCOPE_1?: number;
    SCOPE_2?: number;
    SCOPE_3?: number;
  };
}

export interface PredictedDataPoint {
  month: string; // Format: 'YYYY-MM'
  co2e: number;
}

export interface AnalyticsDashboardData {
  historicalData: HistoricalDataPoint[];
  predictedData: PredictedDataPoint[];
}

// Merged chart datum — spans historical + prediction on same X-axis
export interface ChartDatum {
  month: string;
  historical?: number;
  predicted?: number;
}

export interface ScopeBreakdownDatum {
  name: string;
  value: number;
  color: string;
}
