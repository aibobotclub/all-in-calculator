import { CalculatorParams, CalculationResult, DailyDetail } from '@/types/calculator';
import {
  STAKING_PERIOD_BONUS,
  RELEASE_PERIOD_BURN_FEE,
  DEFAULT_PARAMS,
  TOKEN_PRICES
} from '@/constants/calculator';
import {
  ReferralRewardResult,
  CommunityLevel,
  CommunityRewardResult
} from '@/types/calculator';
import {
  REFERRAL_REWARDS,
  COMMUNITY_LEVELS,
  DEFAULT_PROMOTION_PARAMS
} from '@/constants/calculator';

interface DailyReturn {
  originalReturn: number;
  releaseSchedule: number[];
}

interface ReinvestRecord {
  amount: number; // 复投本金
  maturityDay: number; // 到期日
  dailyReturn: number; // 每日产生的收益
  startDay: number; // 开始产生收益的日期
}

export function calculateInvestment(params: CalculatorParams): CalculationResult {
  const {
    investmentAmount,
    stakingPeriod,
    releasePeriod,
    dailyROI,
    platformFee
  } = params;

  // ASC数量等于USDT投资金额除以ASC价格
  const ascAmount =  investmentAmount/ TOKEN_PRICES.ASC;
  
  // 计算基础日收益
  const baseAmount = investmentAmount * (1 - platformFee);
  const stakingBonus = STAKING_PERIOD_BONUS[stakingPeriod] || 0;
  const burnFee = RELEASE_PERIOD_BURN_FEE[releasePeriod] || 0;
  
  const dailyBaseReturn = baseAmount * dailyROI * DEFAULT_PARAMS.dailyFrequency;
  const dailyBonusReturn = dailyBaseReturn * stakingBonus;
  const totalDailyReturn = dailyBaseReturn + dailyBonusReturn;

  // 记录每日原始收益和其释放计划
  const dailyReturns: DailyReturn[] = [];
  
  // 记录复投记录
  const reinvestRecords: ReinvestRecord[] = [];
  
  // 计算每日详情
  const dailyDetails: DailyDetail[] = [];
  let totalReleaseANT = 0; // 总收益（不包括本金）
  let totalMaturityReleaseANT = 0; // 总到期释放（包括本金）
  let totalReleaseWithoutMaturity = 0; // 不包括本金释放的总收益（用于计算平均值）

  // 计算需要显示的总天数
  // 需要考虑：1. 释放期延续 2. 复投到期时间
  // 最后一次复投在 stakingPeriod-1 天，到期在 stakingPeriod-1+31 天
  const lastReinvestMaturityDay = stakingPeriod > 1 ? stakingPeriod - 1 + 31 : 0;
  const releaseEndDay = stakingPeriod + releasePeriod - 1;
  const totalDays = Math.max(releaseEndDay, lastReinvestMaturityDay, stakingPeriod);

  for (let day = 1; day <= totalDays; day++) {
    // 只在质押期内生成新的收益
    let reinvestANT = 0;
    if (day <= stakingPeriod) {
      // 计算当天的原始收益
      reinvestANT = day < stakingPeriod ? totalDailyReturn * DEFAULT_PARAMS.reinvestRatio : 0; // 质押期最后一天不复投
      const releaseBeforeBurn = day < stakingPeriod 
        ? totalDailyReturn * DEFAULT_PARAMS.releaseRatio 
        : totalDailyReturn; // 质押期最后一天100%释放
      const releaseAfterBurn = releaseBeforeBurn * (1 - burnFee);
      
      // 创建释放计划（平均分配到释放周期的每一天）
      const releaseSchedule = new Array(releasePeriod).fill(releaseAfterBurn / releasePeriod);
      
      // 记录今天的原始收益和释放计划
      dailyReturns.push({
        originalReturn: totalDailyReturn,
        releaseSchedule
      });

      // 添加今天的复投记录（从第二天开始计算，30天后释放本金）
      if (reinvestANT > 0 && day < stakingPeriod) { // 最后一天不再复投
        // 计算复投每日产生的收益（利润*次数）
        const reinvestDailyReturn = reinvestANT * dailyROI * DEFAULT_PARAMS.dailyFrequency * (1 + stakingBonus);
        reinvestRecords.push({
          amount: reinvestANT,
          maturityDay: day + 31, // 从第二天开始算30天，所以是day+31
          dailyReturn: reinvestDailyReturn,
          startDay: day + 1 // 复投收益从第二天开始
        });
      }
    }

    // 计算当天的总释放量
    let dayReleaseANT = 0;
    
    // 1. 计算所有之前天数的释放计划在今天的释放量
    for (let i = 0; i < Math.min(day, stakingPeriod); i++) {
      const sourceDay = i; // 收益产生的天数（0-based）
      const releaseDay = day - i - 1; // 从产生收益那天算起的第几天释放（0-based）
      if (releaseDay >= 0 && releaseDay < releasePeriod && sourceDay < dailyReturns.length) {
        dayReleaseANT += dailyReturns[sourceDay].releaseSchedule[releaseDay];
      }
    }

    // 2. 计算复投产生的收益和到期释放
    let reinvestDailyReturn = 0;
    let reinvestMaturityRelease = 0;

    // 遍历所有复投记录
    for (const record of reinvestRecords) {
      // 只有当前天数大于等于开始日期且未到期时才累加复投产生的每日收益
      if (day >= record.startDay && day < record.maturityDay) {
        reinvestDailyReturn += record.dailyReturn;
      }
      
      // 如果复投到期，释放本金
      if (record.maturityDay === day) {
        reinvestMaturityRelease += record.amount;
      }
    }

          // 3. 如果是质押到期日，释放本金
      let stakingMaturityRelease = 0;
      if (day === stakingPeriod) {
        stakingMaturityRelease = ascAmount;
      }

    // 计算当天的总收益（不包括本金释放）
    const dailyTotalANT = dayReleaseANT + reinvestDailyReturn;
    totalReleaseANT += dailyTotalANT;
    
    // 计算当天的总到期释放（包括本金释放）
    const dailyMaturityReleaseANT = stakingMaturityRelease + reinvestMaturityRelease;
    totalMaturityReleaseANT += dailyMaturityReleaseANT;
    
    // 计算不包括本金释放的总收益（用于计算平均每日收益）
    const dailyTotalWithoutMaturity = dayReleaseANT + reinvestDailyReturn;
    totalReleaseWithoutMaturity += dailyTotalWithoutMaturity;

    // 记录当天详情
    dailyDetails.push({
      day,
      releaseANT: dayReleaseANT, // 当日释放量（来自之前天数的70%释放计划）
      reinvestANT, // 当日30%进入复投的量
      reinvestRelease: reinvestDailyReturn, // 复投产生的每日收益
      maturityRelease: dailyMaturityReleaseANT, // 质押到期释放量 + 复投到期释放量
      totalANT: dailyTotalANT, // 当日总收益（不包括本金）
      roi: ((dailyTotalANT + dailyMaturityReleaseANT) / investmentAmount) * 100 // ROI包含所有收入
    });
  }

  return {
    totalReleaseANT, // 总收益（不包括本金）
    totalMaturityReleaseANT, // 总到期释放（包括本金）
    // 只有质押期大于1天才计算月均收益
    monthlyReleaseANT: stakingPeriod > 1 ? totalReleaseANT / (stakingPeriod / 30) : 0,
    // 平均每日收益不包括本金释放
    dailyAverageANT: totalReleaseWithoutMaturity / stakingPeriod,
    dailyDetails,
    ascAmount
  };
}

export interface ReferralInvestment {
  level: number;          // 代数
  totalInvestment: number; // 该代的总投资金额(ASC)
}

/**
 * 计算推荐奖励
 * @param investments 每代的总投资金额信息
 * @returns 每代的奖励结果
 */
export function calculateReferralRewards(investments: ReferralInvestment[]): ReferralRewardResult[] {
  return investments.map(investment => {
    if (investment.totalInvestment === 0) {
      return {
        level: investment.level,
        dailyANT: 0,
        rewardRate: 0,
        dailyReward: 0
      };
    }

    // 转换ASC到USDT计算
    const investmentUSDT = investment.totalInvestment * TOKEN_PRICES.ASC;
    
    // 计算该代的ANT产出
    const result = calculateInvestment({
      investmentAmount: investmentUSDT,
      stakingPeriod: DEFAULT_PROMOTION_PARAMS.defaultStakingPeriod,
      releasePeriod: DEFAULT_PROMOTION_PARAMS.defaultReleasePeriod,
      dailyROI: DEFAULT_PARAMS.defaultDailyROI,
      platformFee: DEFAULT_PARAMS.defaultPlatformFee
    });

    // 获取该代的奖励比例
    const rewardRate = REFERRAL_REWARDS[investment.level as keyof typeof REFERRAL_REWARDS] || 0;

    // 计算每日奖励（使用dailyAverageANT，因为它已经考虑了复投收益）
    const dailyANT = result.dailyAverageANT;
    const dailyReward = dailyANT * rewardRate;

    return {
      level: investment.level,
      dailyANT,
      rewardRate,
      dailyReward
    };
  });
}

/**
 * 检查社区奖励资格并计算奖励
 * @param level 社区等级
 * @param pathStakings 各路径的质押量
 * @param downlines 下线信息 { level: CommunityLevel, count: number }
 * @param rewardRate 奖励比例
 * @returns 社区奖励结果
 */
export function calculateCommunityReward(
  level: CommunityLevel,
  pathStakings: number[],
  downlines: { level: CommunityLevel; count: number }[],
  rewardRate: number
): CommunityRewardResult {
  const config = COMMUNITY_LEVELS[level];
  const requirements = config.requirements;
  const totalStaking = pathStakings.reduce((sum, staking) => sum + staking, 0);
  
  // 检查路径要求
  const hasEnoughPaths = pathStakings.length >= requirements.paths;
  const pathAmountRequirement = Array.isArray(requirements.pathAmount)
    ? requirements.pathAmount
    : Array(requirements.paths).fill(requirements.pathAmount);
  
  const pathsQualified = pathStakings.every((staking, index) => 
    staking >= (pathAmountRequirement[index] || pathAmountRequirement[0])
  );

  // 检查下线要求
  const downlineRequirement = requirements.downlineV;
  const downlineQualified = downlineRequirement === null || 
    downlines.some(d => d.level === downlineRequirement && d.count >= requirements.downlineCount);

  const isQualified = hasEnoughPaths && pathsQualified && downlineQualified;

  // 计算每日奖励
  const dailyReward = isQualified ? totalStaking * rewardRate : 0;

  // 收集未达标的要求
  const missingRequirements: CommunityRewardResult['missingRequirements'] = {};
  
  if (!hasEnoughPaths) {
    missingRequirements.paths = requirements.paths - pathStakings.length;
  }
  
  if (!pathsQualified) {
    missingRequirements.pathAmount = Math.max(
      ...pathAmountRequirement.map((req, i) => Math.max(0, req - (pathStakings[i] || 0)))
    );
  }
  
  if (!downlineQualified && downlineRequirement) {
    missingRequirements.downlineV = downlineRequirement;
    missingRequirements.downlineCount = requirements.downlineCount - 
      (downlines.find(d => d.level === downlineRequirement)?.count || 0);
  }

  return {
    level,
    totalStaking,
    rewardRate,
    dailyReward,
    isQualified,
    ...(Object.keys(missingRequirements).length > 0 ? { missingRequirements } : {})
  };
}

// 导出默认的奖励比例获取函数
export function getDefaultRewardRate(level: CommunityLevel): number {
  return DEFAULT_PROMOTION_PARAMS.communityLevelRewards[level];
} 