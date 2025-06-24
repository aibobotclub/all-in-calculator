import { useTranslation } from 'react-i18next';
import { changeLanguage } from '@/i18n/config';
import { GlobeAltIcon } from '@heroicons/react/24/outline';

export default function LanguageSwitch() {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'zh' : 'en';
    changeLanguage(newLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center text-gray-600 hover:text-gray-900"
    >
      <GlobeAltIcon className="h-6 w-6 mr-2" />
      <span>{i18n.language === 'en' ? '中文' : 'English'}</span>
    </button>
  );
} 