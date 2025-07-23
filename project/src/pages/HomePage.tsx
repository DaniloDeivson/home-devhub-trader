import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Code2, Mail, Eye, EyeOff, ArrowRight, Terminal, Share2, Zap, Globe, Phone, BarChart2, Bot, Sparkles, TrendingUp, LayoutGrid } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useLanguageStore } from '../stores/languageStore';
import { LanguageSwitcher } from '../components/LanguageSwitcher';

export function HomePage() {
  const navigate = useNavigate();
  const [showLogin, setShowLogin] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { signInWithEmail, signUpWithEmail, isLoading } = useAuthStore();
  const { language, t } = useLanguageStore();

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (email && password) {
      try {
        if (isRegistering) {
          await signUpWithEmail(email, password, phone);
          // No need to show success message since we'll auto-redirect
        } else {
          await signInWithEmail(email, password);
          window.location.href = '/backtest-analysis';
        }
      } catch (error) {
        console.error('Error with authentication:', error);
        setError(error instanceof Error ? error.message : 
          isRegistering ? 'Erro ao cadastrar. Tente novamente.' : 'Erro ao fazer login. Verifique suas credenciais.');
      }
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setPhone('');
    setShowPassword(false);
    setError(null);
    setSuccess(null);
  };

  const getPageTitle = () => {
    return language === 'en' 
      ? 'Develop trading robots directly in your browser'
      : 'Desenvolva robôs de trading direto no seu navegador';
  };

  const getPageSubtitle = () => {
    return language === 'en'
      ? 'Create, edit and share robots for Profit, MetaTrader and NTSL. Collaborate in real-time with your team and keep everything organized in one place.'
      : 'Crie, edite e compartilhe robôs para Profit, MetaTrader e NTSL. Colabore em tempo real com sua equipe e mantenha tudo organizado em um só lugar.';
  };

  return (
    <div className="min-h-screen bg-[#1E1E1E]">
      {/* Navigation */}
      <nav className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Code2 className="w-8 h-8 text-blue-500" />
              <span className="ml-2 text-xl font-bold text-white">DevHub Trader</span>
            </div>
            <div className="flex items-center space-x-4">
              <LanguageSwitcher />
              <button 
                onClick={() => navigate('/plans')}
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                {language === 'en' ? 'Plans' : 'Planos'}
              </button>
              <button 
                onClick={() => {
                  setIsRegistering(false);
                  setShowLogin(true);
                  resetForm();
                }}
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                {language === 'en' ? 'Login' : 'Entrar'}
              </button>
              <button 
                onClick={() => {
                  setIsRegistering(true);
                  setShowLogin(true);
                  resetForm();
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center"
              >
                {language === 'en' ? 'Sign Up' : 'Cadastrar'} <ArrowRight className="w-4 h-4 ml-2" />
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
                    setIsRegistering(true);
                    setShowLogin(true);
                    resetForm();
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
                onClick={() => {
                  setIsRegistering(true);
                  setShowLogin(true);
                  resetForm();
                }}
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
                onClick={() => {
                  setIsRegistering(true);
                  setShowLogin(true);
                  resetForm();
                }}
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
              setIsRegistering(true);
              setShowLogin(true);
              resetForm();
            }}
            className="px-8 py-4 bg-white text-blue-900 rounded-md font-bold text-lg hover:bg-gray-100 transition-colors"
          >
            {language === 'en' ? 'Get Started Now' : 'Comece Agora'}
          </button>
        </div>
      </div>

      {/* Login/Register Modal */}
      {showLogin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#1E1E1E] rounded-lg max-w-md w-full p-8 relative">
            <button 
              onClick={() => {
                setShowLogin(false);
                resetForm();
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              ✕
            </button>
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <Code2 className="w-12 h-12 text-blue-500" />
              </div>
              <h2 className="text-3xl font-bold text-gray-100">
                {isRegistering 
                  ? (language === 'en' ? 'Create Account' : 'Criar Conta')
                  : (language === 'en' ? 'Welcome to DevHub' : 'Bem-vindo ao DevHub')}
              </h2>
              <p className="mt-2 text-gray-400">
                {isRegistering 
                  ? (language === 'en' ? 'Start your development journey' : 'Comece sua jornada de desenvolvimento')
                  : (language === 'en' ? 'Sign in to continue' : 'Entre para continuar')}
              </p>
            </div>
            
            <form onSubmit={handleEmailAuth} className="mt-8 space-y-4">
              {error && (
                <div className="p-3 bg-red-500 bg-opacity-10 border border-red-500 rounded-md text-red-500 text-sm">
                  {error}
                </div>
              )}
              
              {success && (
                <div className="p-3 bg-green-500 bg-opacity-10 border border-green-500 rounded-md text-green-500 text-sm">
                  {success}
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={language === 'en' ? 'your@email.com' : 'seu@email.com'}
                />
              </div>

              {isRegistering && (
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-300">
                    {language === 'en' ? 'Phone' : 'Telefone'}
                  </label>
                  <div className="relative mt-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="+55 (11) 98765-4321"
                    />
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                  {language === 'en' ? 'Password' : 'Senha'}
                </label>
                <div className="mt-1 relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                    placeholder="••••••••"
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button 
                type="submit"
                disabled={isLoading || !email || !password}
                className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Mail className="w-5 h-5 mr-2" />
                {isRegistering 
                  ? (language === 'en' ? 'Register with Email' : 'Cadastrar com Email')
                  : (language === 'en' ? 'Sign in with Email' : 'Entrar com Email')}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-400">
                {isRegistering 
                  ? (language === 'en' ? 'Already have an account?' : 'Já tem uma conta?')
                  : (language === 'en' ? 'Don\'t have an account yet?' : 'Ainda não tem conta?')}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegistering(!isRegistering);
                    resetForm();
                  }}
                  className="text-blue-500 hover:text-blue-400"
                >
                  {isRegistering 
                    ? (language === 'en' ? 'Sign in' : 'Faça login')
                    : (language === 'en' ? 'Sign up' : 'Cadastre-se')}
                </button>
              </p>
              <p className="text-sm text-gray-400 mt-4">
                {language === 'en' 
                  ? 'By continuing, you agree to our'
                  : 'Ao continuar, você concorda com nossos'}{' '}
                <a href="#" className="text-blue-500 hover:text-blue-400">
                  {language === 'en' ? 'Terms of Service' : 'Termos de Serviço'}
                </a> {language === 'en' ? 'and' : 'e'}{' '}
                <a href="#" className="text-blue-500 hover:text-blue-400">
                  {language === 'en' ? 'Privacy Policy' : 'Política de Privacidade'}
                </a>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}