export const STAKING_PERIODS = [1, 30, 60, 90, 180, 360] as const;
export const RELEASE_PERIODS = [7, 15, 30, 60] as const;

export type StakingPeriod = typeof STAKING_PERIODS[number];
export type ReleasePeriod = typeof RELEASE_PERIODS[number];

export const STAKING_PERIOD_BONUS: Record<StakingPeriod, number> = {
  1: 0,
  30: 0.1,    // 10%
  60: 0.2,    // 20%
  90: 0.3,    // 30%
  180: 0.4,   // 40%
  360: 0.5    // 50%
};

export const RELEASE_PERIOD_BURN_FEE: Record<ReleasePeriod, number> = {
  7: 0.3,    // 30%
  15: 0.2,   // 20%
  30: 0.1,   // 10%
  60: 0      // 0%
};

export const DEFAULT_PARAMS = {
  dailyFrequency: 1,      // 每日收益次数
  releaseRatio: 0.7,      // 70%进入释放
  reinvestRatio: 0.3,     // 30%进入复投
  defaultDailyROI: 0.01,  // 默认每日收益率1%
  defaultPlatformFee: 0.1 // 默认平台手续费10%
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