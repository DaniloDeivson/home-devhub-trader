import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Code2, Menu, X, User, LogOut, Settings, 
  BarChart2, Users, Crown, Zap, HelpCircle, 
  Briefcase, Building, ExternalLink, Package,
  FileSpreadsheet, BarChart
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { TokenDisplay } from './TokenDisplay';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useLanguageStore } from '../stores/languageStore';

export function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { signOut, profile } = useAuthStore();
  const { t } = useLanguageStore();

  // Check if user is authorized for admin panel
  const authorizedEmails = ['pedropardal04@gmail.com', 'profitestrategista@gmail.com'];
  const isAdminAuthorized = profile?.email && authorizedEmails.includes(profile.email);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleExternalLink = (url: string, e: React.MouseEvent) => {
    e.preventDefault();
    window.open(url, '_blank');
  };

  const menuItems = [
    { path: '/robots', label: t('nav.robots'), icon: <Code2 className="w-5 h-5" />, external: false },
    { 
      path: 'https://profitestrategista.com.br/login', 
      label: t('nav.community'), 
      icon: <Users className="w-5 h-5" />, 
      external: true 
    },
    { path: '/experts', label: t('nav.experts'), icon: <Briefcase className="w-5 h-5" />, external: false },
    { 
      path: 'https://profitestrategista.com.br/mesa-proprietaria', 
      label: 'Mesa Proprietária', 
      icon: <Building className="w-5 h-5" />, 
      external: true 
    },
    { path: '/backtest-analysis', label: 'Backtest Analysis', icon: <FileSpreadsheet className="w-5 h-5" />, external: false },
  ];

  return (
    <nav className="bg-gray-900 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center cursor-pointer" onClick={() => navigate('/')}>
              <Code2 className="h-8 w-8 text-blue-500" />
              <span className="ml-2 text-xl font-bold text-white">DevHub Trader</span>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:block ml-10">
              <div className="flex items-center space-x-4">
                {menuItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={(e) => {
                      if (item.external) {
                        handleExternalLink(item.path, e);
                      } else {
                        navigate(item.path);
                        setIsMenuOpen(false);
                      }
                    }}
                    className={`px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-2 ${
                      isActive(item.path) && !item.external
                        ? 'bg-gray-800 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                    {item.external && <ExternalLink className="w-3 h-3 ml-1" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Right side items */}
          <div className="flex items-center space-x-4">

            
            {/* Token Display */}
            <div className="hidden md:flex">
              <TokenDisplay />
            </div>
            
            {/* Language Switcher */}
            <div className="hidden md:flex">
              <LanguageSwitcher />
            </div>
            
            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded-md"
              >
                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                  {profile?.avatar_url ? (
                    <img 
                      src={profile.avatar_url} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </button>
              
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg py-1 z-50">
                  <div className="px-4 py-2 border-b border-gray-700">
                    <p className="text-sm font-medium truncate">{profile?.name || 'User'}</p>
                    <p className="text-xs text-gray-400 truncate">{profile?.email}</p>
                    <div className="mt-1 flex items-center">
                      <TokenDisplay showLabel={false} />
                      <span className="ml-1 text-xs text-gray-400">tokens</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      navigate('/profile');
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center"
                  >
                    <User className="w-4 h-4 mr-2" />
                    {t('nav.profile')}
                  </button>
                  <button
                    onClick={() => {
                      navigate('/subscription');
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    {t('nav.subscription')}
                  </button>
                  {isAdminAuthorized && (
                    <button
                      onClick={() => {
                        navigate('/admin');
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Admin Panel
                    </button>
                  )}
                  <button
                    onClick={() => signOut()}
                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    {t('nav.signOut')}
                  </button>
                </div>
              )}
            </div>
            
            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none"
              >
                {isMenuOpen ? (
                  <X className="block h-6 w-6" />
                ) : (
                  <Menu className="block h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {menuItems.map((item) => (
              <button
                key={item.path}
                onClick={(e) => {
                  if (item.external) {
                    handleExternalLink(item.path, e);
                  } else {
                    navigate(item.path);
                    setIsMenuOpen(false);
                  }
                }}
                className={`w-full text-left px-3 py-2 rounded-md text-base font-medium flex items-center space-x-3 ${
                  isActive(item.path) && !item.external
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.external && <ExternalLink className="w-3 h-3 ml-1" />}
              </button>
            ))}
            
            {/* Opcionais Button in Mobile Menu */}
            <button
              onClick={(e) => handleExternalLink('https://profitestrategista.com.br/robots', e)}
              className="w-full text-left px-3 py-2 rounded-md text-base font-medium flex items-center space-x-3 bg-green-600 hover:bg-green-700 text-white"
            >
              <Package className="w-5 h-5" />
              <span>Opcionais</span>
              <ExternalLink className="w-3 h-3 ml-1" />
            </button>
            
            <div className="pt-4 pb-3 border-t border-gray-700">
              <div className="flex items-center justify-between px-3">
                <TokenDisplay />
                <LanguageSwitcher />
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}