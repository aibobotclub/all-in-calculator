'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { ArrowLeftIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import LanguageSwitch from '@/components/LanguageSwitch';
import {
  DEFAULT_PROMOTION_PARAMS,
  DEFAULT_PARAMS,
  TOKEN_PRICES
} from '@/constants/calculator';
import { calculateInvestment } from '@/utils/calculator';

interface DailyReward {
  day: number;
  teamOutput: number;
  reward: number;
  accumulatedReward: number;
  totalStakingASC: number;
}

interface ReinvestRecord {
  amount: number; // ANT amount
  maturityDay: number;
  dailyReturn: number;
}

const PAGE_SIZE_OPTIONS = [20, 50, 100];

export default function CommunityDetails() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const [rewardList, setRewardList] = useState<DailyReward[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  
  const level = searchParams.get('level') || 'V1';
  const initialStakingUSDT = Number(searchParams.get('totalStaking')) || 0;
  const initialStakingASC = initialStakingUSDT / TOKEN_PRICES.ASC; // 转换为ASC
  const rewardRate = Number(searchParams.get('rewardRate')) || 0;

  useEffect(() => {
    // 初始投资计算
    const result = calculateInvestment({
      investmentAmount: initialStakingUSDT,
      stakingPeriod: DEFAULT_PROMOTION_PARAMS.defaultStakingPeriod,
      releasePeriod: DEFAULT_PROMOTION_PARAMS.defaultReleasePeriod,
      dailyROI: DEFAULT_PARAMS.defaultDailyROI,
      platformFee: DEFAULT_PARAMS.defaultPlatformFee
    });

    const rewards: DailyReward[] = [];
    let accumulatedReward = 0;
    let reinvestRecords: ReinvestRecord[] = [];
    let currentStakingASC = initialStakingASC;
    
    // 计算初始质押的每日ANT产出
    let baseOutput = result.dailyAverageANT;

    for (let day = 1; day <= 540; day++) {
      // 1. 处理到期的复投
      const maturedRecords = reinvestRecords.filter(record => record.maturityDay === day);
      const maturedANT = maturedRecords.reduce((sum, record) => sum + record.amount, 0);
      
      // 2. 更新总质押量和基础产出
      if (maturedANT > 0) {
        // 将到期的ANT转换为ASC (通过USDT转换)
        const maturedUSDT = maturedANT * TOKEN_PRICES.ANT;
        const maturedASC = maturedUSDT / TOKEN_PRICES.ASC;
        currentStakingASC += maturedASC;
        
        // 重新计算基础产出
        const newResult = calculateInvestment({
          investmentAmount: currentStakingASC * TOKEN_PRICES.ASC, // 转换回USDT计算
          stakingPeriod: DEFAULT_PROMOTION_PARAMS.defaultStakingPeriod,
          releasePeriod: DEFAULT_PROMOTION_PARAMS.defaultReleasePeriod,
          dailyROI: DEFAULT_PARAMS.defaultDailyROI,
          platformFee: DEFAULT_PARAMS.defaultPlatformFee
        });
        baseOutput = newResult.dailyAverageANT;
      }

      // 3. 移除到期的复投记录
      reinvestRecords = reinvestRecords.filter(record => record.maturityDay > day);

      // 4. 计算当天的总产出和新的复投
      const reinvestOutput = reinvestRecords.reduce((sum, record) => sum + record.dailyReturn, 0);
      const totalDailyOutput = baseOutput + reinvestOutput;
      
      // 5. 处理新的复投 (ANT直接复投)
      const reinvestANT = totalDailyOutput * DEFAULT_PARAMS.reinvestRatio; // 30%进入复投
      if (reinvestANT > 0) {
        const reinvestResult = calculateInvestment({
          investmentAmount: reinvestANT * TOKEN_PRICES.ANT, // 转换为USDT计算
          stakingPeriod: DEFAULT_PROMOTION_PARAMS.defaultStakingPeriod,
          releasePeriod: DEFAULT_PROMOTION_PARAMS.defaultReleasePeriod,
          dailyROI: DEFAULT_PARAMS.defaultDailyROI,
          platformFee: DEFAULT_PARAMS.defaultPlatformFee
        });
        reinvestRecords.push({
          amount: reinvestANT, // 存储ANT数量
          maturityDay: day + 30, // 30天后到期
          dailyReturn: reinvestResult.dailyAverageANT
        });
      }

      // 6. 计算当天的奖励
      const dailyReward = totalDailyOutput * rewardRate;
      accumulatedReward += dailyReward;
      
      rewards.push({
        day,
        teamOutput: totalDailyOutput,
        reward: dailyReward,
        accumulatedReward,
        totalStakingASC: currentStakingASC
      });
    }

    setRewardList(rewards);
  }, [initialStakingUSDT, rewardRate]);

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
    setCurrentPage(1); // 重置到第一页
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
              {t('promotion.community.detailsTitle', { level })}
            </h2>

            {/* 社区概览 - 移动端变为2x2网格 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
              <div className="bg-indigo-50 rounded-lg p-3 md:p-4">
                <h3 className="text-xs md:text-sm font-medium text-gray-500 mb-1">
                  {t('promotion.community.initialStaking')}
                </h3>
                <p className="text-sm md:text-lg font-semibold text-indigo-600 break-words">
                  {initialStakingASC.toLocaleString()} ASC
                </p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 md:p-4">
                <h3 className="text-xs md:text-sm font-medium text-gray-500 mb-1">
                  {t('promotion.community.currentStaking')}
                </h3>
                <p className="text-sm md:text-lg font-semibold text-blue-600 break-words">
                  {(rewardList.length > 0 ? rewardList[rewardList.length - 1].totalStakingASC : initialStakingASC).toLocaleString()} ASC
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-3 md:p-4">
                <h3 className="text-xs md:text-sm font-medium text-gray-500 mb-1">
                  {t('promotion.community.level')}
                </h3>
                <p className="text-sm md:text-lg font-semibold text-green-600">
                  {level}
                </p>
              </div>
              <div className="bg-purple-50 rounded-lg p-3 md:p-4">
                <h3 className="text-xs md:text-sm font-medium text-gray-500 mb-1">
                  {t('promotion.community.rewardRate')}
                </h3>
                <p className="text-sm md:text-lg font-semibold text-purple-600">
                  {(rewardRate * 100).toFixed(1)}%
                </p>
              </div>
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
                      <div className="text-xs text-gray-500">{t('promotion.community.day')}</div>
                      <div className="font-medium">{item.day}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">{t('promotion.community.totalStaking')}</div>
                      <div className="font-medium">{item.totalStakingASC.toLocaleString()} ASC</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">{t('promotion.community.teamOutput')}</div>
                      <div className="font-medium">{item.teamOutput.toFixed(2)} ANT</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">{t('promotion.community.dailyReward')}</div>
                      <div className="font-medium">{item.reward.toFixed(2)} ANT</div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-xs text-gray-500">{t('promotion.community.accumulatedReward')}</div>
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
                      {t('promotion.community.day')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('promotion.community.totalStaking')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('promotion.community.teamOutput')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('promotion.community.dailyReward')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('promotion.community.accumulatedReward')}
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
                        {item.totalStakingASC.toLocaleString()} ASC
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.teamOutput.toFixed(2)} ANT
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.reward.toFixed(2)} ANT
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
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
                  {t('common.previous')}
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
                      <span className="sr-only">{t('common.previous')}</span>
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