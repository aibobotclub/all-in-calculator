export const STAKING_PERIODS = [1, 30, 90, 180, 360, 540] as const;
export const RELEASE_PERIODS = [5, 15, 30, 90, 180] as const;

export type StakingPeriod = typeof STAKING_PERIODS[number];
export type ReleasePeriod = typeof RELEASE_PERIODS[number];

export const STAKING_PERIOD_BONUS: Record<StakingPeriod, number> = {
  1: 0,      // 0%
  30: 0.1,   // 10%
  90: 0.2,   // 20%
  180: 0.3,  // 30%
  360: 0.4,  // 40%
  540: 0.5   // 50%
};

export const RELEASE_PERIOD_BURN_FEE: Record<ReleasePeriod, number> = {
  5: 0.3,    // 30%
  15: 0.25,  // 25%
  30: 0.2,   // 20%
  90: 0.1,   // 10%
  180: 0     // 0%
};

export const DEFAULT_PARAMS = {
  dailyFrequency: 2,      // 每日收益次数
  releaseRatio: 0.7,      // 70%进入释放
  reinvestRatio: 0.3,     // 30%进入复投
  defaultDailyROI: 0.007, // 默认每日收益率0.7%
  defaultPlatformFee: 0.05 // 默认平台手续费5%
} as const;

export const PARAMS_RANGE = {
  dailyROI: {
    min: 0.002,           // 最小0.2%
    max: 0.01             // 最大1%
  },
  platformFee: {
    min: 0.05,           // 最小5%
    max: 0.1             // 最大10%
  }
} as const;

export const TOKEN_PRICES = {
  ANT: 1.0,  // 1 ANT = 1 USDT
  ASC: 1.0   // 1 ASC = 1 USDT
} as const; 