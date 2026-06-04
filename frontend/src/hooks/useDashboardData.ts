import { useState, useEffect } from 'react';
import type { AxiosError } from 'axios';
import apiClient from '@/services/apiClient';
import type { AnalyticsDashboardData, ScopeBreakdownDatum, ChartDatum } from '@/types/analytics';

export interface UseDashboardResult {
  data: AnalyticsDashboardData | null;
  chartData: ChartDatum[];
  scopeBreakdown: ScopeBreakdownDatum[];
  totalYTD: number;
  highestScope: { name: string; percentage: number };
  forecastTotal: number;
  isLoading: boolean;
  error: string | null;
}

interface ApiSuccessResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface ApiErrorResponse {
  message?: string;
}

export function useDashboardData(): UseDashboardResult {
  const [data, setData] = useState<AnalyticsDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        setIsLoading(true);
        const response = await apiClient.get<ApiSuccessResponse<AnalyticsDashboardData>>('/analytics/dashboard');
        const payload = response.data?.data;
        const normalizedData: AnalyticsDashboardData = {
          historicalData: Array.isArray(payload?.historicalData) ? payload.historicalData : [],
          predictedData: Array.isArray(payload?.predictedData) ? payload.predictedData : [],
        };
        
        if (!cancelled) {
          setData(normalizedData);
          setError(null);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const axiosError = err as AxiosError<ApiErrorResponse>;
          console.error('Failed to parse analytics payload', err);
          setError(
            axiosError.response?.data?.message ||
              (err instanceof Error ? err.message : undefined) ||
              'Failed to connect to analytics datastore.'
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, []);

  const historicalData = data?.historicalData ?? [];
  const predictedData = data?.predictedData ?? [];

  // Compute aggregated properties if data is available
  const totalYTD = historicalData.reduce((acc, curr) => acc + curr.total, 0);

  const forecastTotal = predictedData.reduce((acc, curr) => acc + curr.co2e, 0);

  let highestScope = { name: 'Scope 1', percentage: 0 };
  let scopeBreakdown: ScopeBreakdownDatum[] = [];

  if (historicalData.length > 0) {
    const latest = historicalData[historicalData.length - 1];
    
    // Ensure that Scope 1/2/3 fallback to 0 if undefined
    const s1 = latest.details.SCOPE_1 ?? 0;
    const s2 = latest.details.SCOPE_2 ?? 0;
    const s3 = latest.details.SCOPE_3 ?? 0;
    const monthTotal = latest.total > 0 ? latest.total : 1; // prevent div by zero

    scopeBreakdown = [
      { name: 'Scope 1', value: Math.round((s1 / monthTotal) * 100), color: '#10b981' },
      { name: 'Scope 2', value: Math.round((s2 / monthTotal) * 100), color: '#3b82f6' },
      { name: 'Scope 3', value: Math.round((s3 / monthTotal) * 100), color: '#8b5cf6' },
    ];

    highestScope = scopeBreakdown.reduce((prev, current) => 
      (prev.percentage > current.value) ? prev : { name: current.name, percentage: current.value }, 
      { name: 'None', percentage: 0 }
    );
  }

  // Pre-process for Recharts (merge historical and predicted)
  const chartData: ChartDatum[] = [];
  historicalData.forEach(item => {
    chartData.push({
      month: item.month,
      historical: item.total,
      predicted: undefined,
    });
  });
  
  // Stitch intersection logically in the chart series using Recharts connected points
  predictedData.forEach(item => {
    chartData.push({
      month: item.month,
      historical: undefined,
      predicted: item.co2e,
    });
  });

  return {
    data,
    chartData,
    scopeBreakdown,
    totalYTD,
    highestScope,
    forecastTotal,
    isLoading,
    error,
  };
}
