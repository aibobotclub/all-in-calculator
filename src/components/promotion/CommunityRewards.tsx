'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  COMMUNITY_LEVELS,
  DEFAULT_PROMOTION_PARAMS,
  DEFAULT_PARAMS
} from '@/constants/calculator';
import { CommunityLevel } from '@/types/calculator';
import { ChartBarIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { calculateInvestment } from '@/utils/calculator';

// 固定的等级质押要求
const LEVEL_REQUIREMENTS = {
  V1: { community1: 20000, community2: 0, community3: 0, total: 20000 },
  V2: { community1: 20000, community2: 30000, community3: 0, total: 50000 },
  V3: { community1: 'V2', community2: 'V2', community3: 0, total: 100000 },
  V4: { community1: 'V3', community2: 'V3', community3: 0, total: 200000 },
  V5: { community1: 'V4', community2: 'V4', community3: 'V4', total: 600000 },
  V6: { community1: 'V5', community2: 'V5', community3: 'V5', total: 1800000 },
  V7: { community1: 'V6', community2: 'V6', community3: 'V6', total: 5400000 },
  V8: { community1: 'V7', community2: 'V7', community3: 'V7', total: 16200000 },
  V9: { community1: 'V8', community2: 'V8', community3: '1600000', total: 48600000 }
} as const;

// 提取奖励区间
const REWARD_RANGES = Object.entries(COMMUNITY_LEVELS).reduce((acc, [level, data]) => {
  acc[level] = data.rewardRange;
  return acc;
}, {} as {[key: string]: {min: number; max: number}});

interface DailyData {
  day: number;
  teamOutput: number;
  reward: number;
  accumulatedReward: number;
}

// 计算540天的每日数据
const calculate540DaysData = (totalStaking: number, rewardRate: number): DailyData[] => {
  const data: DailyData[] = [];
  let accumulatedReward = 0;

  // 使用calculator.ts中的计算逻辑
  const result = calculateInvestment({
    investmentAmount: totalStaking,
    stakingPeriod: DEFAULT_PROMOTION_PARAMS.defaultStakingPeriod,
    releasePeriod: DEFAULT_PROMOTION_PARAMS.defaultReleasePeriod,
    dailyROI: DEFAULT_PARAMS.defaultDailyROI,
    platformFee: DEFAULT_PARAMS.defaultPlatformFee
  });

  const dailyOutput = result.dailyAverageANT;

  for (let day = 1; day <= 540; day++) {
    const dailyReward = dailyOutput * rewardRate;
    accumulatedReward += dailyReward;
    
    data.push({
      day,
      teamOutput: dailyOutput,
      reward: dailyReward,
      accumulatedReward
    });
  }

  return data;
};

// 从540天数据中计算统计信息
const calculateStats = (data: DailyData[]) => {
  // 计算年度数据（前365天）
  const yearData = data.slice(0, 365);
  const yearlyReward = yearData.reduce((sum, day) => sum + day.reward, 0);
  const yearlyAvgOutput = yearData.reduce((sum, day) => sum + day.teamOutput, 0) / 365;

  // 计算月度数据（年度平均）
  const monthlyReward = yearlyReward / 12;
  const monthlyAvgOutput = yearlyAvgOutput;

  // 计算总体数据
  const totalReward = data[539].accumulatedReward; // 最后一天的累计奖励
  const totalAvgOutput = data.reduce((sum, day) => sum + day.teamOutput, 0) / 540;

  return {
    monthlyAvgOutput,
    monthlyReward,
    yearlyAvgOutput,
    yearlyReward,
    totalAvgOutput,
    totalReward
  };
};

export default function CommunityRewards() {
  const { t } = useTranslation();
  const router = useRouter();
  const [selectedLevel, setSelectedLevel] = useState<CommunityLevel>('V1');
  const [rewardRate, setRewardRate] = useState<number>(0);

  const requirements = LEVEL_REQUIREMENTS[selectedLevel];
  const currentRange = REWARD_RANGES[selectedLevel];

  // 计算540天数据和统计信息
  const dailyData = useMemo(() => 
    calculate540DaysData(requirements.total, rewardRate),
    [requirements.total, rewardRate]
  );

  const stats = useMemo(() => 
    calculateStats(dailyData),
    [dailyData]
  );

  useEffect(() => {
    const savedParams = localStorage.getItem('calculatorParams');
    if (savedParams) {
      try {
        const { communityRewardRate } = JSON.parse(savedParams);
        if (communityRewardRate) {
          setRewardRate(communityRewardRate);
        }
      } catch (error) {
        console.error('Failed to parse saved params:', error);
      }
    }
  }, []);

  const handleRateChange = (value: number) => {
    const range = REWARD_RANGES[selectedLevel];
    const rate = Math.min(Math.max(range.min, value), range.max);
    
    setRewardRate(rate);
    const savedParams = localStorage.getItem('calculatorParams') || '{}';
    try {
      const params = JSON.parse(savedParams);
      localStorage.setItem('calculatorParams', JSON.stringify({
        ...params,
        communityRewardRate: rate
      }));
    } catch (error) {
      console.error('Failed to save params:', error);
    }
  };

  const handleViewDetails = () => {
    const queryParams = new URLSearchParams({
      level: selectedLevel,
      totalStaking: requirements.total.toString(),
      rewardRate: rewardRate.toString()
    }).toString();
    
    router.push(`/promotion/community-details?${queryParams}`);
  };

  const getRequirementText = (level: CommunityLevel) => {
    const req = LEVEL_REQUIREMENTS[level];
    const renderCommunity = (num: number, value: string | number) => {
      if (!value) return null;
      return (
        <div key={num} className="flex items-center text-sm text-gray-700">
          <span className="font-medium">{t('promotion.community.communityN', { n: num })}: </span>
          <span className="ml-2">
            {typeof value === 'string' && value.startsWith('V') 
              ? t('promotion.community.levelRequirement', { level: value })
              : t('promotion.community.stakingRequirement', { amount: Number(value).toLocaleString() })}
          </span>
        </div>
      );
    };

    return (
      <div className="space-y-2">
        {renderCommunity(1, req.community1)}
        {renderCommunity(2, req.community2)}
        {renderCommunity(3, req.community3)}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        {t('promotion.community.tabTitle')}
      </h2>
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white shadow overflow-hidden rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700">
                {t('promotion.community.level')}
              </label>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value as CommunityLevel)}
                className="ml-4 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                {Object.keys(COMMUNITY_LEVELS).map((level) => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  {t('promotion.community.rewardRate')}
                </label>
                <span className="text-sm text-gray-500">
                  {t('promotion.community.range')}: {Math.round(currentRange.min * 100)}% - {Math.round(currentRange.max * 100)}%
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <input
                  type="range"
                  min={Math.round(currentRange.min * 100)}
                  max={Math.round(currentRange.max * 100)}
                  step="1"
                  value={Math.round(rewardRate * 100)}
                  onChange={(e) => handleRateChange(Number(e.target.value) / 100)}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <input
                  type="number"
                  min={Math.round(currentRange.min * 100)}
                  max={Math.round(currentRange.max * 100)}
                  step="1"
                  value={Math.round(rewardRate * 100)}
                  onChange={(e) => handleRateChange(Number(e.target.value) / 100)}
                  className="w-20 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                <span className="text-sm text-gray-500">%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow overflow-hidden rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              {t('promotion.community.requirements')}
            </h3>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              {getRequirementText(selectedLevel)}
              <div className="mt-4 text-sm text-gray-500 italic">
                {t('promotion.community.calculationNote')}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-500 mb-1">
                  {t('promotion.community.dailyAverage')}
                </h4>
                <p className="text-lg font-semibold text-green-600">
                  {stats.totalAvgOutput.toFixed(2)} ANT / {t('promotion.community.day')}
                </p>
              </div>

              <div className="bg-indigo-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-500 mb-1">
                  {t('promotion.community.monthlyReward')}
                </h4>
                <p className="text-lg font-semibold text-indigo-600">
                  {stats.monthlyReward.toFixed(2)} ANT
                </p>
              </div>

              <div className="bg-purple-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-500 mb-1">
                  {t('promotion.community.yearlyReward')}
                </h4>
                <p className="text-lg font-semibold text-purple-600">
                  {stats.yearlyReward.toFixed(2)} ANT
                </p>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-500 mb-1">
                  {t('promotion.community.totalReward')}
                </h4>
                <p className="text-lg font-semibold text-blue-600">
                  {stats.totalReward.toFixed(2)} ANT
                </p>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleViewDetails}
          className="flex items-center justify-center w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200"
        >
          <ChartBarIcon className="h-5 w-5 mr-2" />
          {t('promotion.community.viewDetails')}
        </button>
      </div>
    </div>
  );
} 