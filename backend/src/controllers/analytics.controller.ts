// =============================================================================
// ANALYTICS CONTROLLER
// Handles deep data aggregations and bridges to the ML Prediction engine.
// =============================================================================

import { Request, Response } from 'express';
import prisma from '../config/database';
import { sendSuccess } from '../utils/response.utils';
import { asyncHandler } from '../middleware/errorHandler.middleware';
import { predictFutureEmissions } from '../services/ml.service';
import { PlanType } from '../types/enums';

/**
 * Interface corresponding to the Raw Postgres Query output
 */
interface RawEmissionGroup {
  month: string;
  scope: string;
  totalco2e: number; // Postgres aggregations return lowercase column names by default in some drivers if unquoted
}

// ─── GET /analytics/dashboard ────────────────────────────────────────────────
export const getDashboardAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.user!.companyId;

  // 1. Fetch exactly 12 months using high-performance Postgres $queryRaw
  // We use to_char to natively bucket rows by YYYY-MM
  const rawData = await prisma.$queryRaw<RawEmissionGroup[]>`
    SELECT 
      to_char("dateLogged", 'YYYY-MM') as "month",
      "scope",
      SUM("calculatedCO2e") as "totalco2e"
    FROM "emission_records"
    WHERE "companyId" = ${companyId}
      AND "dateLogged" >= CURRENT_DATE - INTERVAL '12 months'
    GROUP BY 1, 2
    ORDER BY 1 ASC;
  `;

  // 2. Transform the raw flat rows into a structured object indexed by month
  // E.g. { '2023-01': { month: '2023-01', total: 150, details: { SCOPE_1: 100, SCOPE_2: 50 } } }
  const monthMap = new Map<string, { month: string; total: number; details: Record<string, number> }>();

  rawData.forEach((row) => {
    if (!monthMap.has(row.month)) {
      monthMap.set(row.month, { month: row.month, total: 0, details: {} });
    }
    
    const entry = monthMap.get(row.month)!;
    const value = typeof row.totalco2e === 'object' && row.totalco2e !== null 
      ? Number((row.totalco2e as any).toString())
      : Number(row.totalco2e);

    entry.details[row.scope] = parseFloat(value.toFixed(4));
    entry.total += value;
  });

  // Convert map to sorted array
  const historicalData = Array.from(monthMap.values()).map(h => ({
    ...h,
    total: parseFloat(h.total.toFixed(4)),
  }));

  // 3. Prepare data for the ML model (requires simple {month, co2e} shape)
  const trainingData = historicalData.map((h) => ({
    month: h.month,
    co2e: h.total,
  }));

  const subscription = await prisma.subscription.findUnique({
    where: { companyId },
    select: { planType: true },
  });

  // 4. Run simple time-series forecasting (next 3 months) ONLY if Pro/Enterprise
  let predictedData: any[] = [];
  if (subscription?.planType !== PlanType.STARTER) {
    predictedData = await predictFutureEmissions(trainingData, 3);
  }

  sendSuccess(res, { historicalData, predictedData }, 'Analytics & Predictions retrieved');
});
