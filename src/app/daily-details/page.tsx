'use client';

import { useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { calculateInvestment } from '@/utils/calculator';
import { CalculatorParams } from '@/types/calculator';
import { STAKING_PERIODS, RELEASE_PERIODS } from '@/constants/calculator';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  ArrowTrendingUpIcon,
  BanknotesIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import LanguageSwitch from '@/components/LanguageSwitch';

export default function DailyDetails() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  
  // 从URL参数获取计算参数
  const stakingPeriod = Number(searchParams.get('stakingPeriod')) || STAKING_PERIODS[0];
  const releasePeriod = Number(searchParams.get('releasePeriod')) || RELEASE_PERIODS[0];

  const params: CalculatorParams = {
    investmentAmount: Number(searchParams.get('amount')) || 0,
    stakingPeriod: stakingPeriod as typeof STAKING_PERIODS[number],
    releasePeriod: releasePeriod as typeof RELEASE_PERIODS[number],
    dailyROI: Number(searchParams.get('dailyROI')) || 0,
    platformFee: Number(searchParams.get('platformFee')) || 0
  };

  const result = calculateInvestment(params);

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
                    <p className="text-xl font-bold">{params.investmentAmount} USDT</p>
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
                    <p className="text-xl font-bold">{result.totalReleaseANT.toFixed(2)} ANT</p>
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
                {result.dailyDetails.map((detail) => (
                  <tr key={detail.day} className="hover:bg-gray-50">
                    <td className="px-2 sm:px-4 py-2.5 text-xs sm:text-sm font-medium text-gray-900 whitespace-nowrap text-center">
                      {detail.day}
                    </td>
                    <td className="px-2 sm:px-4 py-2.5 text-xs sm:text-sm text-gray-500 whitespace-nowrap font-mono">
                      {detail.releaseANT.toFixed(4)}
                    </td>
                    <td className="px-2 sm:px-4 py-2.5 text-xs sm:text-sm text-gray-500 whitespace-nowrap font-mono">
                      {detail.reinvestRelease.toFixed(4)}
                    </td>
                    <td className="px-2 sm:px-4 py-2.5 text-xs sm:text-sm text-gray-500 whitespace-nowrap font-mono">
                      {detail.maturityRelease.toFixed(4)}
                    </td>
                    <td className="px-2 sm:px-4 py-2.5 text-xs sm:text-sm text-gray-500 whitespace-nowrap font-mono font-medium text-indigo-600">
                      {detail.totalANT.toFixed(4)}
                    </td>
                    <td className="px-2 sm:px-4 py-2.5 text-xs sm:text-sm text-gray-500 whitespace-nowrap font-mono font-medium text-green-600">
                      {detail.roi.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
} 