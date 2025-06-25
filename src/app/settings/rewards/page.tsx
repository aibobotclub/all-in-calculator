'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { COMMUNITY_LEVELS, REFERRAL_REWARDS } from '@/constants/calculator';
import { CommunityLevel } from '@/types/calculator';
import LanguageSwitch from '@/components/LanguageSwitch';

export default function RewardsSettings() {
  const { t } = useTranslation();
  const [communityRewardRates, setCommunityRewardRates] = useState<{[key in CommunityLevel]?: number}>({});
  const [referralRewardRates, setReferralRewardRates] = useState<{[key: number]: number}>(REFERRAL_REWARDS);

  useEffect(() => {
    // 加载保存的奖励比例
    const savedParams = localStorage.getItem('calculatorParams');
    if (savedParams) {
      try {
        const params = JSON.parse(savedParams);
        if (params.communityRewardRates) {
          setCommunityRewardRates(params.communityRewardRates);
        }
        if (params.referralRewardRates) {
          setReferralRewardRates(params.referralRewardRates);
        }
      } catch (error) {
        console.error('Failed to parse saved params:', error);
      }
    }
  }, []);

  const handleCommunityRateChange = (level: CommunityLevel, value: number) => {
    const range = COMMUNITY_LEVELS[level].rewardRange;
    const rate = Math.min(Math.max(range.min, value), range.max);
    
    setCommunityRewardRates(prev => {
      const newRates = { ...prev, [level]: rate };
      // 保存到localStorage
      const savedParams = localStorage.getItem('calculatorParams') || '{}';
      try {
        const params = JSON.parse(savedParams);
        localStorage.setItem('calculatorParams', JSON.stringify({
          ...params,
          communityRewardRates: newRates
        }));
      } catch (error) {
        console.error('Failed to save params:', error);
      }
      return newRates;
    });
  };

  const handleReferralRateChange = (level: number, value: number) => {
    setReferralRewardRates(prev => {
      const newRates = { ...prev, [level]: value };
      // 保存到localStorage
      const savedParams = localStorage.getItem('calculatorParams') || '{}';
      try {
        const params = JSON.parse(savedParams);
        localStorage.setItem('calculatorParams', JSON.stringify({
          ...params,
          referralRewardRates: newRates
        }));
      } catch (error) {
        console.error('Failed to save params:', error);
      }
      return newRates;
    });
  };

  return (
    <main className="min-h-screen p-4 md:p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            {t('settings.rewards.title')}
          </h1>
          <LanguageSwitch />
        </div>

        {/* 推荐奖励设置 */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              {t('settings.rewards.referralTitle')}
            </h2>
            <div className="space-y-4">
              {Object.entries(referralRewardRates).map(([level, rate]) => (
                <div key={level} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {t('settings.rewards.referralLevelN', { n: level })}
                    </label>
                    <span className="text-sm text-gray-500">
                      {(rate * 100).toFixed(0)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    step="1"
                    value={rate * 100}
                    onChange={(e) => handleReferralRateChange(Number(level), Number(e.target.value) / 100)}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 社区奖励设置 */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              {t('settings.rewards.communityTitle')}
            </h2>
            <div className="space-y-6">
              {(Object.entries(COMMUNITY_LEVELS) as [CommunityLevel, typeof COMMUNITY_LEVELS[CommunityLevel]][]).map(([level, config]) => (
                <div key={level} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {level} {t('settings.rewards.rewardRate')}
                    </label>
                    <span className="text-sm text-gray-500">
                      {t('settings.rewards.range')}: {(config.rewardRange.min * 100).toFixed(0)}% - {(config.rewardRange.max * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <input
                      type="range"
                      min={config.rewardRange.min * 100}
                      max={config.rewardRange.max * 100}
                      step="0.1"
                      value={(communityRewardRates[level] || config.rewardRange.min) * 100}
                      onChange={(e) => handleCommunityRateChange(level, Number(e.target.value) / 100)}
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <input
                      type="number"
                      min={config.rewardRange.min * 100}
                      max={config.rewardRange.max * 100}
                      step="0.1"
                      value={(communityRewardRates[level] || config.rewardRange.min) * 100}
                      onChange={(e) => handleCommunityRateChange(level, Number(e.target.value) / 100)}
                      className="w-20 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                    <span className="text-sm text-gray-500">%</span>
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    {t('settings.rewards.requirements')}: 
                    {config.requirements.paths > 0 && (
                      <span className="ml-1">
                        {t('settings.rewards.paths')}: {config.requirements.paths}, 
                        {t('settings.rewards.pathAmount')}: {
                          Array.isArray(config.requirements.pathAmount) 
                            ? config.requirements.pathAmount.join(', ') 
                            : config.requirements.pathAmount
                        } USDT
                      </span>
                    )}
                    {config.requirements.downlineV && (
                      <span className="ml-1">
                        {t('settings.rewards.downline')}: {config.requirements.downlineCount} {config.requirements.downlineV}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 