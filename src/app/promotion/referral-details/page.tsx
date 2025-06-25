'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { ArrowLeftIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import LanguageSwitch from '@/components/LanguageSwitch';
import {
  DEFAULT_PROMOTION_PARAMS,
  DEFAULT_PARAMS,
  TOKEN_PRICES,
  REFERRAL_REWARDS
} from '@/constants/calculator';
import { calculateInvestment } from '@/utils/calculator';

interface LevelData {
  level: number;
  accounts: number;
  investment: number;
  rewardRate: number;
}

interface DailyReward {
  day: number;
  teamOutput: number;
  levelOutputs: number[];
  levelRewards: number[];
  totalReward: number;
  accumulatedReward: number;
  totalStakingASC: number;
}

interface ReinvestRecord {
  amount: number; // ANT amount
  maturityDay: number;
  dailyReturn: number;
  level: number;
}

interface LevelDataFromParams {
  accounts: number;
  investment: number;
}

const PAGE_SIZE_OPTIONS = [20, 50, 100];

function ReferralDetailsContent() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const [rewardList, setRewardList] = useState<DailyReward[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // 从URL参数中获取数据并计算奖励
  useEffect(() => {
    const directReferrals = Number(searchParams.get('directReferrals')) || 1;
    const directInvestment = Number(searchParams.get('directInvestment')) || 1000;
    const levelsDataStr = searchParams.get('levelsData') || '[]';
    const levelsData: LevelData[] = JSON.parse(levelsDataStr).map((data: LevelDataFromParams, index: number) => ({
      level: index + 2,
      accounts: data.accounts,
      investment: data.investment,
      rewardRate: REFERRAL_REWARDS[(index + 2) as keyof typeof REFERRAL_REWARDS] || 0
    }));

    // 添加直推层级数据
    const allLevelsData: LevelData[] = [
      {
        level: 1,
        accounts: directReferrals,
        investment: directInvestment,
        rewardRate: REFERRAL_REWARDS[1]
      },
      ...levelsData
    ];

    const rewards: DailyReward[] = [];
    const levelReinvestRecords: ReinvestRecord[][] = allLevelsData.map(() => []);
    const levelStakingASC: number[] = allLevelsData.map(level => level.accounts * level.investment);
    
    // 计算每个层级的初始投资和每日ANT产出
    const levelBaseOutputs = allLevelsData.map(level => {
      if (level.accounts === 0) return 0;
      const totalInvestmentUSDT = level.accounts * level.investment * TOKEN_PRICES.ASC;
      const result = calculateInvestment({
        investmentAmount: totalInvestmentUSDT,
        stakingPeriod: DEFAULT_PROMOTION_PARAMS.defaultStakingPeriod,
        releasePeriod: DEFAULT_PROMOTION_PARAMS.defaultReleasePeriod,
        dailyROI: DEFAULT_PARAMS.defaultDailyROI,
        platformFee: DEFAULT_PARAMS.defaultPlatformFee
      });
      return result.dailyAverageANT;
    });

    for (let day = 1; day <= DEFAULT_PROMOTION_PARAMS.defaultStakingPeriod; day++) {
      const levelOutputs: number[] = [];
      const levelRewards: number[] = [];
      
      // 计算每个层级的产出和奖励
      allLevelsData.forEach((level, levelIndex) => {
        // 1. 处理到期的复投
        const maturedRecords = levelReinvestRecords[levelIndex].filter(record => record.maturityDay === day);
        const maturedANT = maturedRecords.reduce((sum, record) => sum + record.amount, 0);

        // 2. 更新质押量和基础产出
        if (maturedANT > 0) {
          const maturedUSDT = maturedANT * TOKEN_PRICES.ANT;
          const maturedASC = maturedUSDT / TOKEN_PRICES.ASC;
          levelStakingASC[levelIndex] += maturedASC;

          // 重新计算基础产出
          const newResult = calculateInvestment({
            investmentAmount: levelStakingASC[levelIndex] * TOKEN_PRICES.ASC,
            stakingPeriod: DEFAULT_PROMOTION_PARAMS.defaultStakingPeriod,
            releasePeriod: DEFAULT_PROMOTION_PARAMS.defaultReleasePeriod,
            dailyROI: DEFAULT_PARAMS.defaultDailyROI,
            platformFee: DEFAULT_PARAMS.defaultPlatformFee
          });
          levelBaseOutputs[levelIndex] = newResult.dailyAverageANT;
        }

        // 3. 移除到期的复投记录
        levelReinvestRecords[levelIndex] = levelReinvestRecords[levelIndex].filter(record => record.maturityDay > day);

        // 4. 计算当天的总产出
        const reinvestOutput = levelReinvestRecords[levelIndex].reduce((sum, record) => sum + record.dailyReturn, 0);
        const totalDailyOutput = levelBaseOutputs[levelIndex] + reinvestOutput;
        levelOutputs.push(totalDailyOutput);

        // 5. 处理新的复投
        const reinvestANT = totalDailyOutput * DEFAULT_PARAMS.reinvestRatio;
        if (reinvestANT > 0) {
          const reinvestResult = calculateInvestment({
            investmentAmount: reinvestANT * TOKEN_PRICES.ANT,
            stakingPeriod: DEFAULT_PROMOTION_PARAMS.defaultStakingPeriod,
            releasePeriod: DEFAULT_PROMOTION_PARAMS.defaultReleasePeriod,
            dailyROI: DEFAULT_PARAMS.defaultDailyROI,
            platformFee: DEFAULT_PARAMS.defaultPlatformFee
          });
          levelReinvestRecords[levelIndex].push({
            amount: reinvestANT,
            maturityDay: day + 30,
            dailyReturn: reinvestResult.dailyAverageANT,
            level: level.level
          });
        }

        // 6. 计算当天的奖励 (每日释放 + 复投产出) * 奖励比例
        const dailyReward = totalDailyOutput * level.rewardRate;
        levelRewards.push(dailyReward);
      });

      const totalReward = levelRewards.reduce((sum, reward) => sum + reward, 0);
      const totalStakingASC = levelStakingASC.reduce((sum, staking) => sum + staking, 0);
      const teamOutput = levelOutputs.reduce((sum, output) => sum + output, 0);

      rewards.push({
        day,
        teamOutput,
        levelOutputs,
        levelRewards,
        totalReward,
        accumulatedReward: day === 1 ? totalReward : rewards[day - 2].accumulatedReward + totalReward,
        totalStakingASC
      });
    }

    setRewardList(rewards);
  }, [searchParams]); // 只依赖 searchParams

  // 计算总页数
  const totalPages = Math.ceil(rewardList.length / pageSize);
  
  // 获取当前页的数据
  const getCurrentPageData = () => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return rewardList.slice(start, end);
  };

  // 页码变化处理
  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // 每页显示数量变化处理
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  // 渲染页码按钮
  const renderPageButtons = () => {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
      .filter(page => 
        page === 1 || 
        page === totalPages || 
        (page >= currentPage - 2 && page <= currentPage + 2)
      )
      .map((page, index, array) => {
        if (index > 0 && array[index - 1] !== page - 1) {
          return [
            <span key={`ellipsis-${page}`} className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
              ...
            </span>,
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                currentPage === page
                  ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                  : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
              }`}
            >
              {page}
            </button>
          ];
        }
        return (
          <button
            key={page}
            onClick={() => handlePageChange(page)}
            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
              currentPage === page
                ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
            }`}
          >
            {page}
          </button>
        );
      });
  };

  // 从URL参数中获取数据
  const directReferrals = Number(searchParams.get('directReferrals')) || 1;
  const directInvestment = Number(searchParams.get('directInvestment')) || 1000;
  const levelsDataStr = searchParams.get('levelsData') || '[]';
  const levelsData: LevelData[] = JSON.parse(levelsDataStr).map((data: LevelDataFromParams, index: number) => ({
    level: index + 2,
    accounts: data.accounts,
    investment: data.investment,
    rewardRate: REFERRAL_REWARDS[(index + 2) as keyof typeof REFERRAL_REWARDS] || 0
  }));

  // 添加直推层级数据
  const allLevelsData: LevelData[] = [
    {
      level: 1,
      accounts: directReferrals,
      investment: directInvestment,
      rewardRate: REFERRAL_REWARDS[1]
    },
    ...levelsData
  ];

  return (
    <main className="min-h-screen p-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-4 md:mb-8">
          <Link
            href="/promotion"
            className="flex items-center text-indigo-600 hover:text-indigo-700"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            <span className="hidden sm:inline">{t('promotion.back')}</span>
          </Link>
          <LanguageSwitch />
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-3 py-4 sm:px-4 md:px-6 md:py-5">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-8">
              {t('promotion.referral.detailsTitle')}
            </h2>

            {/* 团队概览 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
              {allLevelsData.map((level) => (
                level.accounts > 0 && (
                  <div key={level.level} className="bg-indigo-50 rounded-lg p-3 md:p-4">
                    <h3 className="text-xs md:text-sm font-medium text-gray-500 mb-1">
                      {t('promotion.referral.levelN').replace('n', level.level.toString())}
                    </h3>
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500">
                        {t('promotion.referral.accounts')}: {level.accounts}
                      </p>
                      <p className="text-xs text-gray-500">
                        {t('promotion.referral.investment')}: {level.investment} ASC
                      </p>
                      <p className="text-xs text-gray-500">
                        {t('promotion.referral.rewardRate')}: {(level.rewardRate * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                )
              ))}
            </div>

            {/* 分页控制 */}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 space-y-2 sm:space-y-0">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">{t('common.pageSize')}</span>
                <select
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  {PAGE_SIZE_OPTIONS.map(size => (
                    <option key={size} value={size}>
                      {size} {t('common.itemsPerPage')}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">
                  {t('common.totalItems', { total: rewardList.length })}
                </span>
              </div>
            </div>

            {/* 移动端卡片布局 */}
            <div className="block md:hidden">
              {getCurrentPageData().map((item) => (
                <div 
                  key={item.day}
                  className={`mb-3 rounded-lg p-3 ${item.day % 30 === 0 ? 'bg-indigo-50' : 'bg-gray-50'}`}
                >
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-xs text-gray-500">{t('promotion.referral.day')}</div>
                      <div className="font-medium">{item.day}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">{t('promotion.referral.teamANT')}</div>
                      <div className="font-medium">{item.teamOutput.toFixed(2)} ANT</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">{t('promotion.referral.dailyReward')}</div>
                      <div className="font-medium text-green-600">{item.totalReward.toFixed(2)} ANT</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">{t('promotion.referral.accumulatedReward')}</div>
                      <div className="font-medium text-indigo-600">{item.accumulatedReward.toFixed(2)} ANT</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 桌面端表格布局 */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('promotion.referral.day')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('promotion.referral.teamANT')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('promotion.referral.dailyReward')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('promotion.referral.accumulatedReward')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getCurrentPageData().map((item) => (
                    <tr key={item.day} className={item.day % 30 === 0 ? 'bg-indigo-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.day}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.teamOutput.toFixed(2)} ANT
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                        {item.totalReward.toFixed(2)} ANT
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-600">
                        {item.accumulatedReward.toFixed(2)} ANT
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 分页控件 */}
            <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
              <div className="flex justify-between flex-1 sm:hidden">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('common.prev')}
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="relative ml-3 inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('common.next')}
                </button>
              </div>
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    {t('common.showing')} <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span>{' '}
                    {t('common.to')}{' '}
                    <span className="font-medium">
                      {Math.min(currentPage * pageSize, rewardList.length)}
                    </span>{' '}
                    {t('common.of')}{' '}
                    <span className="font-medium">{rewardList.length}</span>{' '}
                    {t('common.results')}
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">{t('common.prev')}</span>
                      <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                    {renderPageButtons()}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">{t('common.next')}</span>
                      <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function ReferralDetails() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    }>
      <ReferralDetailsContent />
    </Suspense>
  );
}