import React from 'react';
import { Globe } from 'lucide-react';
import { useLanguageStore } from '../stores/languageStore';

interface LanguageSwitcherProps {
  className?: string;
}

export function LanguageSwitcher({ className = '' }: LanguageSwitcherProps) {
  const { language, setLanguage } = useLanguageStore();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'pt' : 'en');
  };

  return (
    <button
      onClick={toggleLanguage}
      className={`flex items-center space-x-1 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-md text-sm text-gray-300 ${className}`}
      title={language === 'en' ? 'Switch to Portuguese' : 'Mudar para Inglês'}
    >
      <Globe className="w-4 h-4" />
      <span>{language === 'en' ? 'PT' : 'EN'}</span>
    </button>
  );
}