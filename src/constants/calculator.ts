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

// 推荐奖励相关常量
export const REFERRAL_LEVELS = 20; // 总共20代

export const REFERRAL_REWARDS = {
  1: 0.15,  // 第一代 15%
  2: 0.10,  // 第二代 10%
  3: 0.10,  // 第三代 10%
  ...Array.from({ length: 17 }, (_, i) => ({ [i + 4]: 0.02 })).reduce((acc, curr) => ({ ...acc, ...curr }), {}) // 4-20代 2%
} as const;

export const DEFAULT_REFERRAL_INVESTMENT = [100, 500, 1000, 10000] as const;

// 社区等级奖励相关常量
export const COMMUNITY_LEVELS = {
  V1: {
    requirements: {
      paths: 1,
      pathAmount: 20000,
      downlineV: null,
      downlineCount: 0
    },
    rewardRange: {
      min: 0.01, // 1%
      max: 0.10  // 10%
    }
  },
  V2: {
    requirements: {
      paths: 2,
      pathAmount: [20000, 30000],
      downlineV: null,
      downlineCount: 0
    },
    rewardRange: {
      min: 0.11, // 11%
      max: 0.20  // 20%
    }
  },
  V3: {
    requirements: {
      paths: 0,
      pathAmount: 0,
      downlineV: 'V2',
      downlineCount: 2
    },
    rewardRange: {
      min: 0.21, // 21%
      max: 0.30  // 30%
    }
  },
  V4: {
    requirements: {
      paths: 0,
      pathAmount: 0,
      downlineV: 'V3',
      downlineCount: 2
    },
    rewardRange: {
      min: 0.31, // 31%
      max: 0.40  // 40%
    }
  },
  V5: {
    requirements: {
      paths: 0,
      pathAmount: 0,
      downlineV: 'V4',
      downlineCount: 3
    },
    rewardRange: {
      min: 0.41, // 41%
      max: 0.50  // 50%
    }
  },
  V6: {
    requirements: {
      paths: 0,
      pathAmount: 0,
      downlineV: 'V5',
      downlineCount: 3
    },
    rewardRange: {
      min: 0.51, // 51%
      max: 0.60  // 60%
    }
  },
  V7: {
    requirements: {
      paths: 0,
      pathAmount: 0,
      downlineV: 'V6',
      downlineCount: 3
    },
    rewardRange: {
      min: 0.61, // 61%
      max: 0.70  // 70%
    }
  },
  V8: {
    requirements: {
      paths: 0,
      pathAmount: 0,
      downlineV: 'V7',
      downlineCount: 3
    },
    rewardRange: {
      min: 0.71, // 71%
      max: 0.80  // 80%
    }
  },
  V9: {
    requirements: {
      paths: 1,
      pathAmount: 1600000,
      downlineV: 'V8',
      downlineCount: 2
    },
    rewardRange: {
      min: 0.81, // 81%
      max: 0.90  // 90%
    }
  }
} as const;

// 同级奖励范围
export const SAME_LEVEL_REWARD_RANGE = {
  min: 0.05, // 5%
  max: 0.10  // 10%
} as const;

// 默认参数
export const DEFAULT_PROMOTION_PARAMS = {
  defaultStakingPeriod: 540,  // 默认质押540天
  defaultReleasePeriod: 5,    // 默认5天释放
  defaultSameLevelReward: 0.05, // 默认同级奖励5%
  communityLevelRewards: {
    V1: 0.01,  // 1%
    V2: 0.11,  // 11%
    V3: 0.21,  // 21%
    V4: 0.31,  // 31%
    V5: 0.41,  // 41%
    V6: 0.51,  // 51%
    V7: 0.61,  // 61%
    V8: 0.71,  // 71%
    V9: 0.81   // 81%
  }
} as const;

export const DEFAULT_INVESTMENT = 1000; 