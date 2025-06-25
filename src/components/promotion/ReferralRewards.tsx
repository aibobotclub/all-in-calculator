'use client';

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ChartBarIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import {
  DEFAULT_PROMOTION_PARAMS
} from '@/constants/calculator';
import { ReferralInvestment, calculateReferralRewards } from '@/utils/calculator';

interface LevelData {
  accounts: number;
  investment: number;
}

interface DailyData {
  day: number;
  rewards: number[];
  totalReward: number;
  accumulatedReward: number;
  maturityReward?: number;
}

const MAX_LEVELS = 20;
const DEFAULT_INVESTMENT = 1000;

export default function ReferralRewards() {
  const { t } = useTranslation();
  const router = useRouter();
  const [directReferrals, setDirectReferrals] = useState<number>(1);
  const [directInvestment, setDirectInvestment] = useState<number>(DEFAULT_INVESTMENT);
  const [levelsData, setLevelsData] = useState<LevelData[]>(
    Array(MAX_LEVELS).fill({ accounts: 0, investment: DEFAULT_INVESTMENT })
  );
  const [dailyData, setDailyData] = useState<DailyData[]>([]);

  // 根据直推数量更新层级数据
  const handleDirectReferralsChange = (value: number) => {
    const newValue = Math.max(1, Math.min(20, value));
    setDirectReferrals(newValue);
    setLevelsData(prev => 
      prev.map((level, index) => 
        index < newValue - 1
          ? { ...level, accounts: 1 }
          : { ...level, accounts: 0 }
      )
    );
  };

  // 更新特定层级的数据
  const handleLevelDataChange = (index: number, field: keyof LevelData, value: number) => {
    setLevelsData(prev => 
      prev.map((level, i) => 
        i === index
          ? { ...level, [field]: value }
          : level
      )
    );
  };

  // 计算奖励
  const handleCalculate = () => {
    const data: DailyData[] = [];
    // 创建包含直推账户的完整层级数据
    const fullLevelsData = [
      { accounts: directReferrals, investment: directInvestment },
      ...levelsData.slice(0, directReferrals - 1)
    ];

    // 转换为ReferralInvestment格式
    const investments: ReferralInvestment[] = fullLevelsData.map((level, index) => ({
      level: index + 1,
      totalInvestment: level.accounts * level.investment
    }));

    // 计算每层的奖励
    const rewardResults = calculateReferralRewards(investments);

    // 计算每天的奖励
    for (let day = 1; day <= DEFAULT_PROMOTION_PARAMS.defaultStakingPeriod; day++) {
      // 计算每层的奖励
      const rewards = rewardResults.map(result => result.dailyReward);
      const totalReward = rewards.reduce((sum, reward) => sum + reward, 0);
      const accumulatedReward = day === 1 
        ? totalReward 
        : data[day - 2].accumulatedReward + totalReward;

      data.push({
        day,
        rewards,
        totalReward,
        accumulatedReward
      });
    }

    setDailyData(data);
  };

  // 计算统计数据
  const stats = useMemo(() => {
    if (dailyData.length === 0) return null;

    const yearData = dailyData.slice(0, 365);
    const yearlyReward = yearData.reduce((sum, day) => sum + day.totalReward, 0);
    const monthlyReward = yearlyReward / 12;
    const dailyAverage = dailyData[0].totalReward;
    const totalReward = dailyData[DEFAULT_PROMOTION_PARAMS.defaultStakingPeriod - 1].accumulatedReward;

    return {
      dailyAverage,
      monthlyReward,
      yearlyReward,
      totalReward
    };
  }, [dailyData]);

  const handleViewDetails = () => {
    const queryParams = new URLSearchParams({
      directReferrals: directReferrals.toString(),
      directInvestment: directInvestment.toString(),
      levelsData: JSON.stringify(levelsData.map(level => ({
        accounts: level.accounts,
        investment: level.investment
      })))
    }).toString();
    
    router.push(`/promotion/referral-details?${queryParams}`);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        {t('promotion.referral.tabTitle')}
      </h2>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white shadow overflow-hidden rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="space-y-4">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('promotion.referral.directAccounts')}
                </label>
                <div className="flex items-center shadow-sm rounded-lg overflow-hidden">
                  <button
                    onClick={() => handleDirectReferralsChange(Math.max(1, directReferrals - 1))}
                    className="px-3 py-2.5 bg-gray-50 text-gray-600 border border-r-0 border-gray-300 hover:bg-gray-100 active:bg-gray-200 focus:outline-none"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={directReferrals}
                    onChange={(e) => handleDirectReferralsChange(Number(e.target.value))}
                    className="block w-full text-center border-gray-300 focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                    style={{ borderRadius: 0, minWidth: 0 }}
                  />
                  <button
                    onClick={() => handleDirectReferralsChange(Math.min(20, directReferrals + 1))}
                    className="px-3 py-2.5 bg-gray-50 text-gray-600 border border-l-0 border-gray-300 hover:bg-gray-100 active:bg-gray-200 focus:outline-none"
                  >
                    +
                  </button>
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  {t('promotion.referral.accountsRange').replace('min', '1')}
                </div>
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('promotion.referral.directInvestment')} (ASC)
                </label>
                <div className="flex items-center shadow-sm rounded-lg overflow-hidden">
                  <button
                    onClick={() => setDirectInvestment(Math.max(100, directInvestment - 100))}
                    className="px-3 py-2.5 bg-gray-50 text-gray-600 border border-r-0 border-gray-300 hover:bg-gray-100 active:bg-gray-200 focus:outline-none whitespace-nowrap"
                  >
                    -100
                  </button>
                  <input
                    type="number"
                    min="100"
                    step="100"
                    value={directInvestment}
                    onChange={(e) => setDirectInvestment(Number(e.target.value))}
                    className="block w-full text-center border-gray-300 focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                    style={{ borderRadius: 0, minWidth: 0 }}
                  />
                  <button
                    onClick={() => setDirectInvestment(directInvestment + 100)}
                    className="px-3 py-2.5 bg-gray-50 text-gray-600 border border-l-0 border-gray-300 hover:bg-gray-100 active:bg-gray-200 focus:outline-none whitespace-nowrap"
                  >
                    +100
                  </button>
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  {t('promotion.referral.minInvestment').replace('amount', '100')}
                </div>
              </div>
            </div>

            {directReferrals > 1 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  {t('promotion.referral.downlineAccounts')}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {levelsData.slice(0, directReferrals - 1).map((level, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">
                        {t('promotion.referral.levelN').replace('n', (index + 2).toString())}
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">
                            {t('promotion.referral.accounts')}
                          </label>
                          <div className="flex items-center shadow-sm rounded-md overflow-hidden">
                            <button
                              onClick={() => handleLevelDataChange(index, 'accounts', Math.max(0, level.accounts - 1))}
                              className="px-2 py-2 bg-gray-50 text-gray-600 border border-r-0 border-gray-300 hover:bg-gray-100 active:bg-gray-200 focus:outline-none"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="0"
                              value={level.accounts}
                              onChange={(e) => handleLevelDataChange(index, 'accounts', Number(e.target.value))}
                              className="block w-full text-center border-gray-300 focus:ring-teal-500 focus:border-teal-500 text-sm"
                              style={{ borderRadius: 0, minWidth: 0 }}
                            />
                            <button
                              onClick={() => handleLevelDataChange(index, 'accounts', level.accounts + 1)}
                              className="px-2 py-2 bg-gray-50 text-gray-600 border border-l-0 border-gray-300 hover:bg-gray-100 active:bg-gray-200 focus:outline-none"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">
                            {t('promotion.referral.investment')} (ASC)
                          </label>
                          <div className="flex items-center shadow-sm rounded-md overflow-hidden">
                            <button
                              onClick={() => handleLevelDataChange(index, 'investment', Math.max(100, level.investment - 100))}
                              className="px-2 py-2 bg-gray-50 text-gray-600 border border-r-0 border-gray-300 hover:bg-gray-100 active:bg-gray-200 focus:outline-none whitespace-nowrap"
                            >
                              -100
                            </button>
                            <input
                              type="number"
                              min="100"
                              step="100"
                              value={level.investment}
                              onChange={(e) => handleLevelDataChange(index, 'investment', Number(e.target.value))}
                              className="block w-full text-center border-gray-300 focus:ring-teal-500 focus:border-teal-500 text-sm"
                              style={{ borderRadius: 0, minWidth: 0 }}
                            />
                            <button
                              onClick={() => handleLevelDataChange(index, 'investment', level.investment + 100)}
                              className="px-2 py-2 bg-gray-50 text-gray-600 border border-l-0 border-gray-300 hover:bg-gray-100 active:bg-gray-200 focus:outline-none whitespace-nowrap"
                            >
                              +100
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6">
              <button
                onClick={handleCalculate}
                className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 text-base font-medium"
              >
                {t('promotion.referral.calculate')}
              </button>
            </div>
          </div>
        </div>

        {stats && (
          <>
            <div className="bg-white shadow overflow-hidden rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-green-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">
                      {t('promotion.referral.dailyAverage')}
                    </h4>
                    <p className="text-lg font-semibold text-green-600">
                      {stats.dailyAverage.toFixed(2)} ANT
                    </p>
                  </div>

                  <div className="bg-indigo-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">
                      {t('promotion.referral.monthlyReward')}
                    </h4>
                    <p className="text-lg font-semibold text-indigo-600">
                      {stats.monthlyReward.toFixed(2)} ANT
                    </p>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">
                      {t('promotion.referral.yearlyReward')}
                    </h4>
                    <p className="text-lg font-semibold text-purple-600">
                      {stats.yearlyReward.toFixed(2)} ANT
                    </p>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">
                      {t('promotion.referral.totalReward')}
                    </h4>
                    <p className="text-lg font-semibold text-blue-600">
                      {stats.totalReward.toFixed(2)} ANT
                    </p>
                  </div>
                </div>

                <div className="mt-4 text-sm text-gray-500 italic">
                  {t('promotion.referral.calculationNote')}
                </div>
              </div>
            </div>

            <button
              onClick={handleViewDetails}
              className="flex items-center justify-center w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200"
            >
              <ChartBarIcon className="h-5 w-5 mr-2" />
              {t('promotion.referral.viewDetails')}
            </button>
          </>
        )}
      </div>
    </div>
  );
} 