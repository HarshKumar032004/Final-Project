import { config } from './src/config/env';
import { PlanType } from './src/types/enums';
const PLAN_PRICE_MAP: Record<string, string> = {
  [PlanType.STARTER]:    process.env.STRIPE_PRICE_STARTER    ?? 'price_starter_placeholder',
  [PlanType.PRO]:        process.env.STRIPE_PRICE_PRO        ?? 'price_pro_placeholder',
  [PlanType.ENTERPRISE]: process.env.STRIPE_PRICE_ENTERPRISE ?? 'price_enterprise_placeholder',
};
console.log(PLAN_PRICE_MAP);
