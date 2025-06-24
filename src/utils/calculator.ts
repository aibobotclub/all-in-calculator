import { CalculatorParams, CalculationResult, DailyDetail } from '@/types/calculator';
import {
  STAKING_PERIOD_BONUS,
  RELEASE_PERIOD_BURN_FEE,
  DEFAULT_PARAMS,
  TOKEN_PRICES
} from '@/constants/calculator';

interface DailyReturn {
  originalReturn: number;
  releaseSchedule: number[];
}

interface ReinvestRecord {
  amount: number; // 复投本金
  maturityDay: number; // 到期日
  dailyReturn: number; // 每日产生的收益
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
  const ascAmount = investmentAmount / TOKEN_PRICES.ASC;
  
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
  let reinvestRecords: ReinvestRecord[] = [];
  
  // 计算每日详情
  const dailyDetails: DailyDetail[] = [];
  let totalReleaseANT = 0; // 总收益（不包括本金）
  let totalMaturityReleaseANT = 0; // 总到期释放（包括本金）
  let totalReleaseWithoutMaturity = 0; // 不包括本金释放的总收益（用于计算平均值）

  for (let day = 1; day <= stakingPeriod; day++) {
    // 计算当天的原始收益
    const reinvestANT = totalDailyReturn * DEFAULT_PARAMS.reinvestRatio; // 30%进入复投
    const releaseBeforeBurn = totalDailyReturn * DEFAULT_PARAMS.releaseRatio; // 70%进入释放
    const releaseAfterBurn = releaseBeforeBurn * (1 - burnFee);
    
    // 创建释放计划（平均分配到释放周期的每一天）
    const releaseSchedule = new Array(releasePeriod).fill(releaseAfterBurn / releasePeriod);
    
    // 记录今天的原始收益和释放计划
    dailyReturns.push({
      originalReturn: totalDailyReturn,
      releaseSchedule
    });

    // 添加今天的复投记录（30天后释放本金）
    if (reinvestANT > 0) {
      // 计算复投每日产生的收益（利润*次数）
      const reinvestDailyReturn = reinvestANT * dailyROI * DEFAULT_PARAMS.dailyFrequency;
      reinvestRecords.push({
        amount: reinvestANT,
        maturityDay: day + 30,
        dailyReturn: reinvestDailyReturn
      });
    }

    // 计算当天的总释放量
    let dayReleaseANT = 0;
    
    // 1. 计算之前天数的释放计划在今天的释放量
    for (let i = 0; i < dailyReturns.length; i++) {
      const releaseDay = day - i - 1; // 第几天的释放
      if (releaseDay >= 0 && releaseDay < releasePeriod) {
        dayReleaseANT += dailyReturns[i].releaseSchedule[releaseDay];
      }
    }

    // 2. 计算复投产生的收益和到期释放
    let reinvestDailyReturn = 0;
    let reinvestMaturityRelease = 0;

    // 遍历所有复投记录
    for (const record of reinvestRecords) {
      // 累加复投产生的每日收益
      reinvestDailyReturn += record.dailyReturn;
      
      // 如果复投到期，释放本金
      if (record.maturityDay === day) {
        reinvestMaturityRelease += record.amount;
      }
    }
    
    // 移除到期的复投记录
    reinvestRecords = reinvestRecords.filter(record => record.maturityDay > day);

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