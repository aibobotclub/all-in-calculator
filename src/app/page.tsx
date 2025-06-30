'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  STAKING_PERIODS,
  RELEASE_PERIODS,
  DEFAULT_PARAMS
} from '@/constants/calculator';
import { calculateInvestment } from '@/utils/calculator';
import { CalculationResult, CalculatorParams } from '@/types/calculator';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import LanguageSwitch from '@/components/LanguageSwitch';
import ReferralRewards from '@/components/promotion/ReferralRewards';
import CommunityRewards from '@/components/promotion/CommunityRewards';

const Chart = dynamic(() => import('@/components/Chart'), { ssr: false });

type MainTabType = 'investment' | 'rewards';
type RewardTabType = 'referral' | 'community';

export default function Home() {
  const { t } = useTranslation();
  const router = useRouter();
  const [mainTab, setMainTab] = useState<MainTabType>('investment');
  const [rewardTab, setRewardTab] = useState<RewardTabType>('referral');
  const [params, setParams] = useState<CalculatorParams>({
    investmentAmount: 1000,
    stakingPeriod: STAKING_PERIODS[0],
    releasePeriod: RELEASE_PERIODS[0],
    dailyROI: DEFAULT_PARAMS.defaultDailyROI,
    platformFee: DEFAULT_PARAMS.defaultPlatformFee
  });

  const [result, setResult] = useState<CalculationResult | null>(null);

  // 从localStorage加载保存的参数
  useEffect(() => {
    const savedParams = localStorage.getItem('calculatorParams');
    if (savedParams) {
      const { dailyROI, platformFee } = JSON.parse(savedParams);
      setParams(prev => ({
        ...prev,
        dailyROI,
        platformFee
      }));
    }
  }, []);

  // 当参数改变时自动计算（可选）
  useEffect(() => {
    if (params.investmentAmount > 0) {
      const calculationResult = calculateInvestment(params);
      setResult(calculationResult);
    } else {
      setResult(null);
    }
  }, [params]);

  const handleCalculate = () => {
    if (params.investmentAmount > 0) {
      const calculationResult = calculateInvestment(params);
      setResult(calculationResult);
    } else {
      setResult(null);
    }
  };

  const handleViewDetails = () => {
    const queryParams = new URLSearchParams({
      amount: params.investmentAmount.toString(),
      stakingPeriod: params.stakingPeriod.toString(),
      releasePeriod: params.releasePeriod.toString(),
      dailyROI: params.dailyROI.toString(),
      platformFee: params.platformFee.toString()
    }).toString();
    
    router.push(`/daily-details?${queryParams}`, { scroll: false });
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* 顶部导航栏 */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">
              All In Calculator
            </h1>
            <div className="flex items-center space-x-6">
              <LanguageSwitch />
              <Link
                href="/settings"
                className="flex items-center text-gray-600 hover:text-teal-600 transition-colors duration-200"
              >
                <Cog6ToothIcon className="h-6 w-6 mr-2" />
                <span className="hidden sm:inline">{t('calculator.settings.title')}</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* 主要 Tab 切换 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setMainTab('investment')}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                ${mainTab === 'investment'
                  ? 'border-teal-500 text-teal-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {t('calculator.tabs.investment')}
            </button>
            <button
              onClick={() => setMainTab('rewards')}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                ${mainTab === 'rewards'
                  ? 'border-teal-500 text-teal-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {t('calculator.tabs.rewards')}
            </button>
          </nav>
        </div>

        {/* Rewards 子 Tab */}
        {mainTab === 'rewards' && (
          <div className="mt-4 px-1">
            <div className="p-1 bg-gray-100 rounded-lg shadow-inner">
              <div className="grid grid-cols-2 gap-1">
                <button
                  onClick={() => setRewardTab('referral')}
                  className={`
                    py-2.5 text-sm font-medium rounded-md transition-all duration-200
                    ${rewardTab === 'referral'
                      ? 'bg-white text-teal-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                    }
                  `}
                >
                  {t('calculator.tabs.referralRewards')}
                </button>
                <button
                  onClick={() => setRewardTab('community')}
                  className={`
                    py-2.5 text-sm font-medium rounded-md transition-all duration-200
                    ${rewardTab === 'community'
                      ? 'bg-white text-teal-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                    }
                  `}
                >
                  {t('calculator.tabs.communityRewards')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 主要内容区域 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {mainTab === 'investment' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Input Section */}
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('calculator.input.investment')}
                  </label>
                  <input
                    type="number"
                    value={params.investmentAmount}
                    onChange={(e) => setParams({ ...params, investmentAmount: Number(e.target.value) })}
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 transition-colors duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('calculator.input.stakingPeriod')}
                  </label>
                  <select
                    value={params.stakingPeriod}
                    onChange={(e) => setParams({ ...params, stakingPeriod: Number(e.target.value) as typeof STAKING_PERIODS[number] })}
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 transition-colors duration-200"
                  >
                    {STAKING_PERIODS.map((period) => (
                      <option key={period} value={period}>
                        {period} {t('calculator.input.days')}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('calculator.input.releasePeriod')}
                  </label>
                  <select
                    value={params.releasePeriod}
                    onChange={(e) => setParams({ ...params, releasePeriod: Number(e.target.value) as typeof RELEASE_PERIODS[number] })}
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 transition-colors duration-200"
                  >
                    {RELEASE_PERIODS.map((period) => (
                      <option key={period} value={period}>
                        {period} {t('calculator.input.days')}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleCalculate}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-400 text-white py-3 px-4 rounded-lg hover:from-emerald-600 hover:to-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
                >
                  {t('calculator.input.calculate')}
                </button>
              </div>
            </div>

            {/* Results Section */}
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
              {result ? (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      {t('calculator.result.ascAmount')}
                    </label>
                    <div className="mt-2 text-3xl font-bold bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">
                      {result.ascAmount.toFixed(2)} ASC
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      {t('calculator.result.totalRelease')}
                    </label>
                    <div className="mt-2 text-3xl font-bold bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">
                      {result.totalReleaseANT.toFixed(2)} ANT
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      {t('calculator.result.monthlyRelease')}
                    </label>
                    <div className="mt-2 text-3xl font-bold bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">
                      {result.monthlyReleaseANT.toFixed(2)} ANT
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      {t('calculator.result.dailyAverage')}
                    </label>
                    <div className="mt-2 text-3xl font-bold bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">
                      {result.dailyAverageANT.toFixed(2)} ANT
                    </div>
                  </div>

                  {result && result.totalReleaseANT > 0 && (
                    <button
                      onClick={handleViewDetails}
                      className="w-full bg-gradient-to-r from-emerald-50 to-teal-50 text-teal-600 py-3 px-4 rounded-lg hover:from-emerald-100 hover:to-teal-100 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-[1.02] shadow-sm"
                    >
                      {t('calculator.result.viewDetails')}
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">{t('calculator.result.enterAmount', '请输入投资金额进行计算')}</p>
                </div>
              )}
            </div>

            {/* Chart Section */}
            {result && (
              <div className="mt-8 bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 lg:col-span-2">
                <Chart data={result.dailyDetails} />
              </div>
            )}
          </div>
        ) : (
          rewardTab === 'referral' ? (
            <ReferralRewards />
          ) : (
            <CommunityRewards />
          )
        )}
      </div>
    </main>
  );
}
