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

const Chart = dynamic(() => import('@/components/Chart'), { ssr: false });

export default function Home() {
  const { t } = useTranslation();
  const router = useRouter();
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

  const handleCalculate = () => {
    const calculationResult = calculateInvestment(params);
    setResult(calculationResult);
  };

  const handleViewDetails = () => {
    const queryParams = new URLSearchParams({
      amount: params.investmentAmount.toString(),
      stakingPeriod: params.stakingPeriod.toString(),
      releasePeriod: params.releasePeriod.toString(),
      dailyROI: params.dailyROI.toString(),
      platformFee: params.platformFee.toString()
    }).toString();
    
    router.push(`/daily-details?${queryParams}`);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* 顶部导航栏 */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {t('calculator.title')}
            </h1>
            <div className="flex items-center space-x-6">
              <LanguageSwitch />
              <Link
                href="/settings"
                className="flex items-center text-gray-600 hover:text-indigo-600 transition-colors duration-200"
              >
                <Cog6ToothIcon className="h-6 w-6 mr-2" />
                <span className="hidden sm:inline">{t('calculator.settings.title')}</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* 主要内容区域 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-colors duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('calculator.input.stakingPeriod')}
                </label>
                <select
                  value={params.stakingPeriod}
                  onChange={(e) => setParams({ ...params, stakingPeriod: Number(e.target.value) as typeof STAKING_PERIODS[number] })}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-colors duration-200"
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
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-colors duration-200"
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
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-4 rounded-lg hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-[1.02]"
              >
                {t('calculator.input.calculate')}
              </button>
            </div>
          </div>

          {/* Results Section */}
          {result && (
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    {t('calculator.result.ascAmount')}
                  </label>
                  <div className="mt-2 text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    {result.ascAmount.toFixed(2)} ASC
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    {t('calculator.result.totalRelease')}
                  </label>
                  <div className="mt-2 text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    {result.totalReleaseANT.toFixed(2)} ANT
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    {t('calculator.result.monthlyRelease')}
                  </label>
                  <div className="mt-2 text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    {result.monthlyReleaseANT.toFixed(2)} ANT
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    {t('calculator.result.dailyAverage')}
                  </label>
                  <div className="mt-2 text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    {result.dailyAverageANT.toFixed(2)} ANT
                  </div>
                </div>

                <button
                  onClick={handleViewDetails}
                  className="w-full bg-indigo-50 text-indigo-600 py-3 px-4 rounded-lg hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-[1.02]"
                >
                  {t('calculator.result.viewDetails')}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Chart Section */}
        {result && (
          <div className="mt-8 bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
            <Chart data={result.dailyDetails} />
          </div>
        )}
      </div>
    </main>
  );
}
