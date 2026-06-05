import { config } from './src/config/env';
console.log("From process.env:", process.env.STRIPE_PRICE_PRO);
console.log("From config:", config.stripe.prices.pro);
