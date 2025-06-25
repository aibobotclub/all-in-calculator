'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import LanguageSwitch from '@/components/LanguageSwitch';
import ReferralRewards from '@/components/promotion/ReferralRewards';
import CommunityRewards from '@/components/promotion/CommunityRewards';

type Tab = 'referral' | 'community';

export default function Promotion() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>('referral');

  return (
    <main className="min-h-screen p-4 md:p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <Link
            href="/"
            className="flex items-center text-indigo-600 hover:text-indigo-700"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            {t('promotion.back')}
          </Link>
          <LanguageSwitch />
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('referral')}
                className={`w-1/2 py-4 px-1 text-center border-b-2 text-sm font-medium ${
                  activeTab === 'referral'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {t('promotion.referral.title')}
              </button>
              <button
                onClick={() => setActiveTab('community')}
                className={`w-1/2 py-4 px-1 text-center border-b-2 text-sm font-medium ${
                  activeTab === 'community'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {t('promotion.community.title')}
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'referral' ? (
              <ReferralRewards />
            ) : (
              <CommunityRewards />
            )}
          </div>
        </div>
      </div>
    </main>
  );
} 