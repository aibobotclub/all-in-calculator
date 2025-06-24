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