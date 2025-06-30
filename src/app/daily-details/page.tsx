'use client';

import { useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { calculateInvestment } from '@/utils/calculator';
import { CalculatorParams } from '@/types/calculator';
import { STAKING_PERIODS, RELEASE_PERIODS, DEFAULT_PARAMS } from '@/constants/calculator';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  ArrowTrendingUpIcon,
  BanknotesIcon,
  ChartBarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import LanguageSwitch from '@/components/LanguageSwitch';
import { Suspense } from 'react';

function DailyDetailsContent() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  
  // 从URL参数获取计算参数，确保有有效的默认值
  const amount = Number(searchParams.get('amount')) || 0;
  const stakingPeriod = Number(searchParams.get('stakingPeriod')) || STAKING_PERIODS[0];
  const releasePeriod = Number(searchParams.get('releasePeriod')) || RELEASE_PERIODS[0];
  const dailyROI = Number(searchParams.get('dailyROI')) || DEFAULT_PARAMS.defaultDailyROI;
  const platformFee = Number(searchParams.get('platformFee')) || DEFAULT_PARAMS.defaultPlatformFee;

  // 验证参数是否有效
  const isValidAmount = amount > 0 && !isNaN(amount);
  const isValidStakingPeriod = STAKING_PERIODS.includes(stakingPeriod as typeof STAKING_PERIODS[number]);
  const isValidReleasePeriod = RELEASE_PERIODS.includes(releasePeriod as typeof RELEASE_PERIODS[number]);

  const params: CalculatorParams = {
    investmentAmount: isValidAmount ? amount : 0,
    stakingPeriod: (isValidStakingPeriod ? stakingPeriod : STAKING_PERIODS[0]) as typeof STAKING_PERIODS[number],
    releasePeriod: (isValidReleasePeriod ? releasePeriod : RELEASE_PERIODS[0]) as typeof RELEASE_PERIODS[number],
    dailyROI: dailyROI > 0 ? dailyROI : DEFAULT_PARAMS.defaultDailyROI,
    platformFee: platformFee >= 0 ? platformFee : DEFAULT_PARAMS.defaultPlatformFee
  };

  // 如果金额无效，显示错误信息
  if (!isValidAmount) {
    return (
      <main className="min-h-screen p-4 md:p-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <Link
              href="/"
              className="flex items-center text-indigo-600 hover:text-indigo-700"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              {t('calculator.details.back')}
            </Link>
            <LanguageSwitch />
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mr-3" />
              <div>
                <h3 className="text-lg font-medium text-red-800">
                  {t('calculator.details.invalidParams', '参数无效')}
                </h3>
                <p className="mt-1 text-sm text-red-700">
                  {t('calculator.details.invalidAmountMessage', '请输入有效的投资金额')}
                </p>
                <Link
                  href="/"
                  className="mt-3 inline-block text-sm font-medium text-red-600 hover:text-red-700"
                >
                  {t('calculator.details.backToCalculator', '返回计算器')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const result = calculateInvestment(params);

  // 格式化数字，处理可能的 undefined 或 NaN
  const formatNumber = (num: number | undefined, decimals: number = 2): string => {
    if (num === undefined || num === null || isNaN(num)) {
      return '0';
    }
    return num.toFixed(decimals);
  };

  return (
    <main className="min-h-screen p-4 md:p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <Link
            href="/"
            className="flex items-center text-indigo-600 hover:text-indigo-700"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            {t('calculator.details.back')}
          </Link>
          <LanguageSwitch />
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* 投资概览 */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold mb-4">{t('calculator.details.overview')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-indigo-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <BanknotesIcon className="h-8 w-8 text-indigo-600 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">{t('calculator.input.investment')}</p>
                    <p className="text-xl font-bold">{formatNumber(params.investmentAmount, 0)} USDT</p>
                  </div>
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <ChartBarIcon className="h-8 w-8 text-green-600 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">{t('calculator.input.stakingPeriod')}</p>
                    <p className="text-xl font-bold">{params.stakingPeriod} {t('calculator.input.days')}</p>
                  </div>
                </div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <ArrowTrendingUpIcon className="h-8 w-8 text-blue-600 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">{t('calculator.input.releasePeriod')}</p>
                    <p className="text-xl font-bold">{params.releasePeriod} {t('calculator.input.days')}</p>
                  </div>
                </div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <ArrowTrendingUpIcon className="h-8 w-8 text-purple-600 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">{t('calculator.result.totalRelease')}</p>
                    <p className="text-xl font-bold">{formatNumber(result.totalReleaseANT, 2)} ANT</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 每日详情表格 */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 table-fixed">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-[80px] px-2 sm:px-4 py-2 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-normal">
                    {t('calculator.details.day')}
                  </th>
                  <th className="w-[120px] px-2 sm:px-4 py-2 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-normal">
                    {t('calculator.details.releaseANT')}
                  </th>
                  <th className="w-[120px] px-2 sm:px-4 py-2 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-normal">
                    {t('calculator.details.reinvestANT')}
                  </th>
                  <th className="w-[120px] px-2 sm:px-4 py-2 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-normal">
                    {t('calculator.details.reinvestRelease')}
                  </th>
                  <th className="w-[120px] px-2 sm:px-4 py-2 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-normal">
                    {t('calculator.details.maturityRelease')}
                  </th>
                  <th className="w-[120px] px-2 sm:px-4 py-2 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-normal">
                    {t('calculator.details.totalANT')}
                  </th>
                  <th className="w-[80px] px-2 sm:px-4 py-2 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-normal">
                    {t('calculator.details.roi')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {result.dailyDetails && result.dailyDetails.length > 0 ? (
                  result.dailyDetails.map((detail) => (
                    <tr key={detail.day} className="hover:bg-gray-50">
                      <td className="px-2 sm:px-4 py-2.5 text-xs sm:text-sm font-medium text-gray-900 whitespace-nowrap text-center">
                        {detail.day}
                      </td>
                      <td className="px-2 sm:px-4 py-2.5 text-xs sm:text-sm text-gray-500 whitespace-nowrap font-mono">
                        {formatNumber(detail.releaseANT, 4)}
                      </td>
                      <td className="px-2 sm:px-4 py-2.5 text-xs sm:text-sm text-gray-500 whitespace-nowrap font-mono">
                        {formatNumber(detail.reinvestANT, 4)}
                      </td>
                      <td className="px-2 sm:px-4 py-2.5 text-xs sm:text-sm text-gray-500 whitespace-nowrap font-mono">
                        {formatNumber(detail.reinvestRelease, 4)}
                      </td>
                      <td className="px-2 sm:px-4 py-2.5 text-xs sm:text-sm text-gray-500 whitespace-nowrap font-mono">
                        {formatNumber(detail.maturityRelease, 4)}
                      </td>
                      <td className="px-2 sm:px-4 py-2.5 text-xs sm:text-sm text-gray-500 whitespace-nowrap font-mono font-medium text-indigo-600">
                        {formatNumber(detail.totalANT, 4)}
                      </td>
                      <td className="px-2 sm:px-4 py-2.5 text-xs sm:text-sm text-gray-500 whitespace-nowrap font-mono font-medium text-green-600">
                        {formatNumber(detail.roi, 2)}%
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      {t('calculator.details.noData', '暂无数据')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function DailyDetails() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    }>
      <DailyDetailsContent />
    </Suspense>
  );
} 