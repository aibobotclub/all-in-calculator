import { StakingPeriod, ReleasePeriod } from '@/constants/calculator';

export interface TokenPrices {
  ANT: number;  // ANT价格（USDT）
  ASC: number;  // ASC价格（USDT）
}

export interface CalculatorParams {
  investmentAmount: number;  // USDT投资金额
  stakingPeriod: StakingPeriod;    // 质押周期（天）
  releasePeriod: ReleasePeriod;    // 释放周期（天）
  dailyROI: number;         // 每日收益率
  platformFee: number;      // 平台手续费
}

export interface DailyDetail {
  day: number;              // 第几天
  releaseANT: number;      // 每日释放ANT
  reinvestANT: number;     // 每日复投ANT
  reinvestRelease: number; // 复投产生的释放ANT
  maturityRelease: number; // 到期释放ANT（包括本金）
  totalANT: number;        // 当日总收益（不包括本金）
  roi: number;             // 收益率（包括所有收入）
}

export interface CalculationResult {
  totalReleaseANT: number;    // 总收益（不包括本金）
  totalMaturityReleaseANT: number; // 总到期释放（包括本金）
  monthlyReleaseANT: number;  // 月收益（不包括本金）
  dailyAverageANT: number;    // 平均日收益（不包括本金）
  dailyDetails: DailyDetail[]; // 每日详情
  ascAmount: number;          // ASC数量
}

// 推荐奖励相关类型
export interface ReferralReward {
  level: number;          // 代数 1-20
  accounts: number;       // 账户数
  investment: number;     // 每个账户投资金额
  stakingPeriod: StakingPeriod; // 质押周期
  releasePeriod: ReleasePeriod; // 释放周期
}

export interface ReferralRewardResult {
  level: number;
  dailyANT: number;
  rewardRate: number;
  dailyReward: number;
}

// 社区奖励相关类型
export type CommunityLevel = 'V1' | 'V2' | 'V3' | 'V4' | 'V5' | 'V6' | 'V7' | 'V8' | 'V9';

export interface CommunityRequirements {
  paths: number;           // 路径数
  pathAmount: number | number[]; // 路径金额要求
  downlineV: CommunityLevel | null; // 下线等级要求
  downlineCount: number;   // 下线数量要求
}

export interface CommunityRewardRange {
  min: number;
  max: number;
}

export interface CommunityLevelConfig {
  requirements: CommunityRequirements;
  rewardRange: CommunityRewardRange;
}

export interface CommunityRewardResult {
  level: CommunityLevel;
  totalStaking: number;   // 总质押量
  rewardRate: number;     // 奖励比例
  dailyReward: number;    // 每日奖励
  isQualified: boolean;   // 是否达标
  missingRequirements?: {
    paths?: number;
    pathAmount?: number;
    downlineV?: CommunityLevel;
    downlineCount?: number;
  };
} 