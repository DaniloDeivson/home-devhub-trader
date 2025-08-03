import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Code2, Mail, Eye, EyeOff, ArrowRight, Terminal, Share2, Zap, Globe, Phone, BarChart2, Bot, Sparkles, TrendingUp, LayoutGrid } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useLanguageStore } from '../stores/languageStore';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { AuthModal } from '../components/AuthModal';

export function HomePage() {
  const navigate = useNavigate();
  const [showLogin, setShowLogin] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const { language, t } = useLanguageStore();

  const handleSignUp = () => {
    setAuthMode('register');
    setShowLogin(true);
  };

  const getPageTitle = () => {
    return language === 'en' 
      ? 'Create and analyze quantitative trading strategies'
      : 'Crie e analise estratégias quantitativas de trading';
  };

  const getPageSubtitle = () => {
    return language === 'en'
      ? 'Complete platform for developing, backtesting and optimizing algorithmic trading strategies. Use AI to create robots, analyze performance and build diversified portfolios.'
      : 'Plataforma completa para desenvolver, testar e otimizar estratégias de trading algorítmico. Use IA para criar robôs, analisar performance e montar portfólios diversificados.';
  };

  return (
    <div className="min-h-screen bg-[#1E1E1E]">
      {/* Navigation */}
      <nav className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <div className="flex items-center">
              <Code2 className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />
              <span className="ml-2 text-lg sm:text-xl font-bold text-white">DevHub Trader</span>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <LanguageSwitcher />
              <button 
                onClick={() => navigate('/faq')}
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                {language === 'en' ? 'FAQ' : 'FAQ'}
              </button>
              <button 
                onClick={() => navigate('/plans')}
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                {language === 'en' ? 'Plans' : 'Planos'}
              </button>
              <button 
                onClick={() => {
                  setAuthMode('login');
                  setShowLogin(true);
                }}
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                {language === 'en' ? 'Login' : 'Entrar'}
              </button>
              <button 
                onClick={() => {
                  setAuthMode('register');
                  setShowLogin(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center"
              >
                {language === 'en' ? 'Sign Up' : 'Cadastrar'} <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
            
            {/* Mobile menu */}
            <div className="md:hidden flex items-center space-x-2">
              <LanguageSwitcher />
              <div className="flex items-center space-x-1">
                <button 
                  onClick={() => {
                    setAuthMode('login');
                    setShowLogin(true);
                  }}
                  className="text-gray-300 hover:text-white px-2 py-1 rounded-md text-sm font-medium"
                >
                  {language === 'en' ? 'Login' : 'Entrar'}
                </button>
                <button 
                  onClick={() => {
                    setAuthMode('register');
                    setShowLogin(true);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm font-medium"
                >
                  {language === 'en' ? 'Sign Up' : 'Cadastrar'}
                </button>
              </div>
            </div>
          </div>
          
          {/* Mobile navigation links */}
          <div className="md:hidden border-t border-gray-700 py-2">
            <div className="flex justify-center space-x-6">
              <button 
                onClick={() => navigate('/faq')}
                className="text-gray-300 hover:text-white text-sm font-medium"
              >
                {language === 'en' ? 'FAQ' : 'FAQ'}
              </button>
              <button 
                onClick={() => navigate('/plans')}
                className="text-gray-300 hover:text-white text-sm font-medium"
              >
                {language === 'en' ? 'Plans' : 'Planos'}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl tracking-tight font-extrabold text-white sm:text-5xl md:text-6xl">
              <span className="block">{getPageTitle()}</span>
              <span className="block text-blue-500">{language === 'en' ? 'with AI assistance' : 'com assistência de IA'}</span>
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-400 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              {getPageSubtitle()}
            </p>
            <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
              <div className="rounded-md shadow">
                <button
                  onClick={() => {
                    setAuthMode('register');
                    setShowLogin(true);
                  }}
                  className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10"
                >
                  {language === 'en' ? 'Start for Free' : 'Comece Gratuitamente'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Features */}
      <div className="py-16 bg-[#252526]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">
              {language === 'en' ? 'Complete Trading Platform' : 'Plataforma Completa de Trading'}
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              {language === 'en' 
                ? 'Everything you need to create, analyze, and optimize your trading strategies in one place'
                : 'Tudo o que você precisa para criar, analisar e otimizar suas estratégias de trading em um só lugar'}
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center justify-center h-16 w-16 rounded-md bg-blue-500 text-white mb-4">
                <Bot className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">
                {language === 'en' ? 'AI-Powered Creation' : 'Criação com IA'}
              </h3>
              <p className="text-gray-400">
                {language === 'en' 
                  ? 'Create trading robots with AI assistance. Just describe your strategy and let AI do the coding.' 
                  : 'Crie robôs de trading com assistência de IA. Apenas descreva sua estratégia e deixe a IA fazer o código.'}
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="flex items-center justify-center h-16 w-16 rounded-md bg-green-500 text-white mb-4">
                <BarChart2 className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">
                {language === 'en' ? 'Strategy Analysis' : 'Análise de Estratégias'}
              </h3>
              <p className="text-gray-400">
                {language === 'en'
                  ? 'Analyze your trading strategies with advanced metrics and AI insights to improve performance.'
                  : 'Analise suas estratégias de trading com métricas avançadas e insights de IA para melhorar o desempenho.'}
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="flex items-center justify-center h-16 w-16 rounded-md bg-purple-500 text-white mb-4">
                <Sparkles className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">
                {language === 'en' ? 'AI Optimization' : 'Otimização com IA'}
              </h3>
              <p className="text-gray-400">
                {language === 'en'
                  ? 'Optimize your existing strategies with AI suggestions for better risk management and returns.'
                  : 'Otimize suas estratégias existentes com sugestões de IA para melhor gerenciamento de risco e retornos.'}
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="flex items-center justify-center h-16 w-16 rounded-md bg-orange-500 text-white mb-4">
                <LayoutGrid className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">
                {language === 'en' ? 'Portfolio Management' : 'Gestão de Portfólio'}
              </h3>
              <p className="text-gray-400">
                {language === 'en'
                  ? 'Create and manage diversified portfolios of trading strategies for optimal performance.'
                  : 'Crie e gerencie portfólios diversificados de estratégias de trading para performance ideal.'}
              </p>
            </div>
          </div>
        </div>
      </div>

   

      {/* Backtest Analysis Section */}
      <div className="py-16 bg-[#252526]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:flex lg:items-center lg:justify-between">
            <div className="lg:w-1/2 mb-8 lg:mb-0 lg:pr-8">
              <h2 className="text-3xl font-bold text-white mb-4">
                {language === 'en' ? 'Advanced Backtest Analysis' : 'Análise Avançada de Backtest'}
              </h2>
              <p className="text-xl text-gray-400 mb-6">
                {language === 'en'
                  ? 'Upload your backtest results and get detailed AI-powered analysis to improve your strategies'
                  : 'Faça upload dos resultados do seu backtest e obtenha análises detalhadas com IA para melhorar suas estratégias'}
              </p>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start">
                  <TrendingUp className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span>
                    {language === 'en'
                      ? 'Comprehensive performance metrics and visualizations'
                      : 'Métricas de desempenho abrangentes e visualizações'}
                  </span>
                </li>
                <li className="flex items-start">
                  <TrendingUp className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span>
                    {language === 'en'
                      ? 'AI-powered strategy strengths and weaknesses analysis'
                      : 'Análise de pontos fortes e fracos da estratégia com IA'}
                  </span>
                </li>
                <li className="flex items-start">
                  <TrendingUp className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span>
                    {language === 'en'
                      ? 'Optimization suggestions tailored to your trading style'
                      : 'Sugestões de otimização adaptadas ao seu estilo de trading'}
                  </span>
                </li>
              </ul>
              <button
                onClick={handleSignUp}
                className="mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-medium inline-flex items-center"
              >
                {language === 'en' ? 'Try Backtest Analysis' : 'Experimente a Análise de Backtest'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
            <div className="lg:w-1/2 bg-gray-800 rounded-lg p-6">
              <div className="aspect-w-16 aspect-h-9 bg-gray-900 rounded-lg flex items-center justify-center">
                <BarChart2 className="w-24 h-24 text-blue-500 opacity-50" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Strategy Creation Section */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:flex lg:items-center lg:justify-between lg:flex-row-reverse">
            <div className="lg:w-1/2 mb-8 lg:mb-0 lg:pl-8">
              <h2 className="text-3xl font-bold text-white mb-4">
                {language === 'en' ? 'Create Trading Robots with AI' : 'Crie Robôs de Trading com IA'}
              </h2>
              <p className="text-xl text-gray-400 mb-6">
                {language === 'en'
                  ? 'Let AI do the heavy lifting. Describe your trading strategy and get a fully functional robot in seconds.'
                  : 'Deixe a IA fazer o trabalho pesado. Descreva sua estratégia de trading e obtenha um robô totalmente funcional em segundos.'}
              </p>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start">
                  <Bot className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span>
                    {language === 'en'
                      ? 'No coding experience required'
                      : 'Nenhuma experiência em programação necessária'}
                  </span>
                </li>
                <li className="flex items-start">
                  <Bot className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span>
                    {language === 'en'
                      ? 'Support for multiple trading platforms and indicators'
                      : 'Suporte para múltiplas plataformas de trading e indicadores'}
                  </span>
                </li>
                <li className="flex items-start">
                  <Bot className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span>
                    {language === 'en'
                      ? 'Customizable risk management and position sizing'
                      : 'Gerenciamento de risco e dimensionamento de posição personalizáveis'}
                  </span>
                </li>
              </ul>
              <button
                onClick={handleSignUp}
                className="mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-medium inline-flex items-center"
              >
                {language === 'en' ? 'Create Your First Robot' : 'Crie Seu Primeiro Robô'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
            <div className="lg:w-1/2 bg-gray-800 rounded-lg p-6">
              <div className="aspect-w-16 aspect-h-9 bg-gray-900 rounded-lg flex items-center justify-center">
                <Code2 className="w-24 h-24 text-blue-500 opacity-50" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 bg-gradient-to-r from-blue-900 to-indigo-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            {language === 'en' ? 'Ready to Transform Your Trading?' : 'Pronto para Transformar seu Trading?'}
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            {language === 'en'
              ? 'Join thousands of traders who are already using DevHub Trader to create, analyze, and optimize their trading strategies.'
              : 'Junte-se a milhares de traders que já estão usando o DevHub Trader para criar, analisar e otimizar suas estratégias de trading.'}
          </p>
          <button
            onClick={() => {
              setAuthMode('register');
              setShowLogin(true);
            }}
            className="px-8 py-4 bg-white text-blue-900 rounded-md font-bold text-lg hover:bg-gray-100 transition-colors"
          >
            {language === 'en' ? 'Get Started Now' : 'Comece Agora'}
          </button>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        initialMode={authMode}
      />
    </div>
  );
}