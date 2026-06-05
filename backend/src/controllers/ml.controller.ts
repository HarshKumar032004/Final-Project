import { Request, Response } from 'express';
import prisma from '../config/database';
import { sendSuccess } from '../utils/response.utils';
import { asyncHandler } from '../middleware/errorHandler.middleware';
import { predictFutureEmissions } from '../services/ml.service';

interface RawEmissionGroup {
  month: string;
  scope: string;
  totalco2e: number;
}

export const getPredictions = asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.user!.companyId;

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

  const historicalData = Array.from(monthMap.values()).map(h => ({
    ...h,
    total: parseFloat(h.total.toFixed(4)),
  }));

  const trainingData = historicalData.map((h) => ({
    month: h.month,
    co2e: h.total,
  }));

  const predictedData = await predictFutureEmissions(trainingData, 3);

  sendSuccess(res, { predictedData }, 'AI Predictions retrieved');
});
