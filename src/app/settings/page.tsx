'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { DEFAULT_PARAMS, PARAMS_RANGE } from '@/constants/calculator';
import LanguageSwitch from '@/components/LanguageSwitch';

export default function Settings() {
  const { t } = useTranslation();
  const [params, setParams] = useState({
    dailyROI: DEFAULT_PARAMS.defaultDailyROI * 100, 
    platformFee: DEFAULT_PARAMS.defaultPlatformFee * 100,
  });

  // 从localStorage加载保存的参数
  useEffect(() => {
    const savedParams = localStorage.getItem('calculatorParams');
    if (savedParams) {
      try {
        const { dailyROI, platformFee } = JSON.parse(savedParams);
        setParams({
          dailyROI: dailyROI * 100,
          platformFee: platformFee * 100,
        });
      } catch (error) {
        console.error('Failed to parse saved params:', error);
      }
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('calculatorParams', JSON.stringify({
      dailyROI: params.dailyROI / 100,
      platformFee: params.platformFee / 100,
    }));
    window.history.back();
  };

  return (
    <main className="min-h-screen p-4 md:p-8 bg-gray-50">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <Link
            href="/"
            className="flex items-center text-indigo-600 hover:text-indigo-700"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            {t('calculator.settings.back')}
          </Link>
          <LanguageSwitch />
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-6">{t('calculator.settings.title')}</h1>

          {/* 可调参数 */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('calculator.settings.dailyROI')} ({PARAMS_RANGE.dailyROI.min * 100}% - {PARAMS_RANGE.dailyROI.max * 100}%)
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="range"
                  min={PARAMS_RANGE.dailyROI.min * 100}
                  max={PARAMS_RANGE.dailyROI.max * 100}
                  step="0.05"
                  value={params.dailyROI}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    setParams({ ...params, dailyROI: Math.min(Math.max(value, PARAMS_RANGE.dailyROI.min * 100), PARAMS_RANGE.dailyROI.max * 100) });
                  }}
                  className="w-full"
                />
                <span className="text-sm font-medium text-gray-900 min-w-[60px]">
                  {params.dailyROI.toFixed(2)}%
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('calculator.settings.platformFee')} ({PARAMS_RANGE.platformFee.min * 100}% - {PARAMS_RANGE.platformFee.max * 100}%)
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="range"
                  min={PARAMS_RANGE.platformFee.min * 100}
                  max={PARAMS_RANGE.platformFee.max * 100}
                  step="1"
                  value={params.platformFee}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    setParams({ ...params, platformFee: Math.min(Math.max(value, PARAMS_RANGE.platformFee.min * 100), PARAMS_RANGE.platformFee.max * 100) });
                  }}
                  className="w-full"
                />
                <span className="text-sm font-medium text-gray-900 min-w-[60px]">
                  {params.platformFee.toFixed(0)}%
                </span>
              </div>
            </div>

            {/* 固定参数展示 */}
            <div className="mt-8 border-t pt-6">
              <h2 className="text-lg font-semibold mb-4">{t('calculator.settings.fixedParams')}</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">{t('calculator.settings.dailyFrequency')}</h3>
                  <p className="text-lg font-semibold">{DEFAULT_PARAMS.dailyFrequency} {t('calculator.settings.times')}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">{t('calculator.settings.releaseRatio')}</h3>
                  <p className="text-lg font-semibold">{DEFAULT_PARAMS.releaseRatio * 100}%</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">{t('calculator.settings.reinvestRatio')}</h3>
                  <p className="text-lg font-semibold">{DEFAULT_PARAMS.reinvestRatio * 100}%</p>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">{t('calculator.settings.stakingBonus')}</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm text-gray-600">1 {t('calculator.input.days')}</p>
                    <p className="font-semibold">0%</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm text-gray-600">30 {t('calculator.input.days')}</p>
                    <p className="font-semibold">10%</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm text-gray-600">90 {t('calculator.input.days')}</p>
                    <p className="font-semibold">20%</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm text-gray-600">180 {t('calculator.input.days')}</p>
                    <p className="font-semibold">30%</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm text-gray-600">360 {t('calculator.input.days')}</p>
                    <p className="font-semibold">40%</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm text-gray-600">540 {t('calculator.input.days')}</p>
                    <p className="font-semibold">50%</p>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">{t('calculator.settings.burnFee')}</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm text-gray-600">5 {t('calculator.input.days')}</p>
                    <p className="font-semibold">30%</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm text-gray-600">15 {t('calculator.input.days')}</p>
                    <p className="font-semibold">25%</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm text-gray-600">30 {t('calculator.input.days')}</p>
                    <p className="font-semibold">20%</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm text-gray-600">90 {t('calculator.input.days')}</p>
                    <p className="font-semibold">10%</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm text-gray-600">180 {t('calculator.input.days')}</p>
                    <p className="font-semibold">0%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <button
              onClick={handleSave}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              {t('calculator.settings.save')}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
} 