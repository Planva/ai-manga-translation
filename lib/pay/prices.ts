// lib/pay/prices.ts
export const STRIPE_PRICES = {
    // --- Packs (one-time) ---
    PACK_STARTER: 'price_1S2ujAKk3VWBlTPNAfpjzWxL',  // $6.90
    PACK_STANDARD:'price_1S3GdEKk3VWBlTPNIgBz1INn',  // $19.90
    PACK_BULK:    'price_1S2un1Kk3VWBlTPNDIzuk2A2',  // $24.90
  
    // --- Subscriptions ---
    SUB_MONTHLY:  'price_1S2upkKk3VWBlTPNw7m86g4k',  // $9.90 / mo
    SUB_YEARLY:   'price_1S2ur1Kk3VWBlTPN5CtsBQxl',  // $199.9 / yr
  } as const;
  
  export type KnownPriceId = typeof STRIPE_PRICES[keyof typeof STRIPE_PRICES];
  
  /**
   * 兜底映射（如果你没在 Stripe 的 Price.metadata 里写）。
   * - pack: 一次性加这么多积分
   * - sub: 订阅每周期加这么多积分（invoice.payment_succeeded 时入账）
   */
  export const FALLBACK_PRICE_META: Record<KnownPriceId, { type: 'pack'|'sub'; credits?: number; credits_per_cycle?: number; }> = {
    [STRIPE_PRICES.PACK_STARTER]:  { type: 'pack', credits: 300 },
    [STRIPE_PRICES.PACK_STANDARD]: { type: 'pack', credits: 1000 },
    [STRIPE_PRICES.PACK_BULK]:     { type: 'pack', credits: 1200 },
  
    [STRIPE_PRICES.SUB_MONTHLY]:   { type: 'sub',  credits_per_cycle: 1200 },
    // 年付可按 12 个月： 2200 * 12 = 26400
    [STRIPE_PRICES.SUB_YEARLY]:    { type: 'sub',  credits_per_cycle: 16000 },
  };
  