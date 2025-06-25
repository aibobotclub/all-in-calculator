'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import {
  DEFAULT_PROMOTION_PARAMS,
  DEFAULT_PARAMS,
  REFERRAL_REWARDS
} from '@/constants/calculator';
import { calculateInvestment } from '@/utils/calculator';

interface LevelData {
  accounts: number;
  investment: number;
}

interface DailyData {
  day: number;
  rewards: number[];
  totalReward: number;
  accumulatedReward: number;
  teamANT: number;
}

interface TeamData {
  level: number;
  accounts: number;
  investment: number;
  dailyANT: number;
  reinvestRecords: { amount: number; maturityDay: number; dailyReturn: number }[];
}

function ReferralDetailsContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [teamData, setTeamData] = useState<TeamData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // 从URL参数中获取数据
  useEffect(() => {
    try {
      const directReferrals = Number(searchParams.get('directReferrals')) || 1;
      const directInvestment = Number(searchParams.get('directInvestment')) || 1000;
      const levelsData: LevelData[] = JSON.parse(searchParams.get('levelsData') || '[]');

      // 创建包含直推账户的完整层级数据
      const fullLevelsData = [
        { accounts: directReferrals, investment: directInvestment },
        ...levelsData.slice(0, directReferrals - 1)
      ];

      // 计算每层的初始投资和每日ANT释放量
      const levelOutputs: TeamData[] = fullLevelsData.map((level, index) => {
        if (level.accounts === 0) return {
          level: index + 1,
          accounts: 0,
          investment: level.investment,
          dailyANT: 0,
          reinvestRecords: []
        };

        const totalInvestment = level.accounts * level.investment;
        const result = calculateInvestment({
          investmentAmount: totalInvestment,
          stakingPeriod: DEFAULT_PROMOTION_PARAMS.defaultStakingPeriod,
          releasePeriod: DEFAULT_PROMOTION_PARAMS.defaultReleasePeriod,
          dailyROI: DEFAULT_PARAMS.defaultDailyROI,
          platformFee: DEFAULT_PARAMS.defaultPlatformFee
        });

        return {
          level: index + 1,
          accounts: level.accounts,
          investment: level.investment,
          dailyANT: result.dailyAverageANT,
          reinvestRecords: []
        };
      });

      setTeamData(levelOutputs);

      // 计算540天数据，考虑复投累计
      const data: DailyData[] = [];
      for (let day = 1; day <= 540; day++) {
        // 更新每层的复投记录和每日ANT产出
        levelOutputs.forEach(output => {
          if (output.accounts === 0) return;

          // 计算当天的原始收益
          const dailyReturn = output.dailyANT;
          const reinvestANT = dailyReturn * DEFAULT_PARAMS.reinvestRatio;

          // 添加新的复投记录
          if (reinvestANT > 0) {
            const reinvestResult = calculateInvestment({
              investmentAmount: reinvestANT,
              stakingPeriod: DEFAULT_PROMOTION_PARAMS.defaultStakingPeriod,
              releasePeriod: DEFAULT_PROMOTION_PARAMS.defaultReleasePeriod,
              dailyROI: DEFAULT_PARAMS.defaultDailyROI,
              platformFee: DEFAULT_PARAMS.defaultPlatformFee
            });
            output.reinvestRecords.push({
              amount: reinvestANT,
              maturityDay: day + 30,
              dailyReturn: reinvestResult.dailyAverageANT
            });
          }

          // 更新复投记录，移除到期的记录
          output.reinvestRecords = output.reinvestRecords.filter(record => record.maturityDay > day);

          // 更新每日ANT产出（原始 + 所有复投产生的）
          output.dailyANT = output.dailyANT + output.reinvestRecords.reduce((sum, record) => sum + record.dailyReturn, 0);
        });

        // 计算每层的奖励
        const rewards = levelOutputs.map(output => {
          const rewardRate = (20 - (output.level - 1)) * 0.01;
          return output.dailyANT * rewardRate;
        });

        const totalReward = rewards.reduce((sum, reward) => sum + reward, 0);
        const accumulatedReward = day === 1 
          ? totalReward 
          : data[day - 2].accumulatedReward + totalReward;

        const teamANT = levelOutputs.reduce((sum, output) => sum + output.dailyANT, 0);

        data.push({
          day,
          rewards,
          totalReward,
          accumulatedReward,
          teamANT
        });
      }

      setDailyData(data);
    } catch (error) {
      console.error('Error processing data:', error);
      setDailyData([]);
      setTeamData([]);
    }
  }, [searchParams]);

  // 分页相关计算
  const totalPages = Math.ceil(dailyData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentData = dailyData.slice(startIndex, endIndex);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          <span className="hidden sm:inline">{t('common.back')}</span>
        </button>
        <h1 className="text-2xl font-bold">{t('promotion.referral.detailsTitle')}</h1>
      </div>

      {/* 团队质押概览 */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-xl font-semibold mb-4">{t('promotion.referral.teamOverview')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {teamData.map((data) => (
              <div key={data.level} className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-500 mb-2">
                  {t('promotion.referral.levelN', { n: data.level })}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-xs text-gray-500">{t('promotion.referral.accounts')}</div>
                    <div className="text-sm font-medium">{data.accounts}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">{t('promotion.referral.totalInvestment')}</div>
                    <div className="text-sm font-medium">{(data.accounts * data.investment).toLocaleString()} USDT</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">{t('promotion.referral.rewardRate')}</div>
                    <div className="text-sm font-medium">
                      {(REFERRAL_REWARDS[data.level as keyof typeof REFERRAL_REWARDS] * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 分页控制 */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
        <div className="px-4 py-3 sm:px-6 flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700">{t('common.itemsPerPage')}</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="rounded border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {t('common.prev')}
            </button>
            <span className="text-sm text-gray-700">
              {t('common.pageInfo', { current: currentPage, total: totalPages })}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {t('common.next')}
            </button>
          </div>
        </div>
      </div>

      {/* 每日奖励详情 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {currentData.map((data, index) => (
          <div
            key={index}
            className={`bg-white rounded-lg shadow overflow-hidden ${
              data.day % 30 === 0 ? 'ring-2 ring-indigo-500' : ''
            }`}
          >
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <div className="text-lg font-semibold text-gray-900">
                  {t('promotion.referral.dayN', { n: data.day })}
                </div>
                {data.day % 30 === 0 && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                    {t('promotion.referral.maturityDay')}
                  </span>
                )}
              </div>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-500">{t('promotion.referral.teamANT')}</div>
                  <div className="text-lg font-medium text-gray-900">{data.teamANT.toFixed(2)} ANT</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">{t('promotion.referral.dailyReward')}</div>
                  <div className="text-lg font-medium text-green-600">{data.totalReward.toFixed(2)} ANT</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">{t('promotion.referral.accumulatedReward')}</div>
                  <div className="text-lg font-medium text-blue-600">{data.accumulatedReward.toFixed(2)} ANT</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
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