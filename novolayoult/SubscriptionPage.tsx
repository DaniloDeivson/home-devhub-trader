import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Crown, Check, Star, Shield, Zap, Apple as WhatsApp } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { TokenDisplay } from '../components/TokenDisplay';
import { Navbar } from '../components/Navbar';

interface Plan {
  id: string;
  name: string;
  price: string;
  features: string[];
  isPopular?: boolean;
}

export function SubscriptionPage() {
  const navigate = useNavigate();
  const { profile } = useAuthStore();

  // Get subscription data from profile
  const currentPlan = {
    name: profile?.plan || 'Free Forever',
    status: profile?.plan_status || 'active',
    renewalDate: profile?.plan_renewal_date || new Date().toISOString(),
    tokenBalance: profile?.token_balance || 0
  };

  const plans: Plan[] = [
    {
      id: 'free-forever',
      name: 'Free Forever',
      price: 'R$ 0,00',
      features: [
        'Até 3 robôs de trading',
        '3 robôs gratuitos inclusos',
        '1.000 tokens mensais',
        'Análise simples de backtest',
        'Community access',
        'CSVs para análise'
      ]
    },
    {
      id: 'pro1',
      name: 'Pro 1',
      price: 'R$ 259,80/month',
      features: [
        'Até 25 robôs de trading',
        'IA para gerar robôs',
        '20.000 tokens mensais',
        'Análise completa de backtest',
        'Montagem de portfólios automática',
        'Community access'
      ]
    },
    {
      id: 'pro2',
      name: 'Pro 2',
      price: 'R$ 499,80/month',
      features: [
        'Até 100 robôs de trading',
        'IA para gerar robôs',
        '50.000 tokens mensais',
        'Análise avançada de backtest',
        'Montagem de portfólios automática',
        'Suporte dedicado'
      ],
      isPopular: true
    },
    {
      id: 'pro3',
      name: 'Pro 3',
      price: 'R$ 999,80/month',
      features: [
        'Até 500 robôs de trading',
        'IA para gerar robôs',
        '100.000 tokens mensais',
        'Análise avançada de backtest',
        'Montagem de portfólios automática',
        'Suporte dedicado'
      ]
    },
    {
      id: 'pro4',
      name: 'Pro 4',
      price: 'R$ 1.999,80/month',
      features: [
        'Robôs ilimitados',
        'IA para gerar robôs',
        'Análise avançada de backtest',
        'Montagem de portfólios automática',
        'Dedicated support',
        '100,000 tokens/month',
        'API access',
        'Custom indicators',
        'White-label options'
      ]
    }
  ];

  // Get token allocation based on plan
  const getTokenAllocation = () => {
    switch (currentPlan.name) {
      case 'Free Forever': return 1000;
      case 'Pro 1': return 20000;
      case 'Pro 2': return 50000;
      case 'Pro 3': return 100000;
      default: return 1000;
    }
  };

  const tokenAllocation = getTokenAllocation();

  const handleBuyTokens = () => {
    window.open('https://buy.stripe.com/fZe5nX2320AB4EgfZC', '_blank');
  };

  const handleUpgradeClick = (planId: string) => {
    // Determine which plan to upgrade to
    let message = "Olá vim do DevHub Trader e quero mais informações e ajuda para criar robôs";
    
    switch(planId) {
      case 'starter':
        message = `Olá vim do DevHub Trader e quero mais informações e ajuda para fazer upgrade para o plano Starter (R$ 259,80/mês).`;
        break;
      case 'pro':
        message = `Olá vim do DevHub Trader e quero mais informações e ajuda para fazer upgrade para o plano Pro (R$ 499,80/mês).`;
        break;
      case 'pro2':
        message = `Olá vim do DevHub Trader e quero mais informações e ajuda para fazer upgrade para o plano Pro 2 (R$ 999,80/mês).`;
        break;
      default:
        message = `Olá vim do DevHub Trader e quero mais informações e ajuda para fazer upgrade do meu plano atual (${currentPlan.name}).`;
    }
    
    // Encode the message for WhatsApp
    const encodedMessage = encodeURIComponent(message);
    
    // Open WhatsApp with the pre-filled message
    window.open(`https://wa.me/5511975333355?text=${encodedMessage}`, '_blank');
  };

  const handleDowngradeClick = () => {
    // Create downgrade message
    const message = `Olá vim do DevHub Trader e quero mais informações e ajuda para fazer downgrade do meu plano atual (${currentPlan.name}).`;
    
    // Encode the message for WhatsApp
    const encodedMessage = encodeURIComponent(message);
    
    // Open WhatsApp with the pre-filled message
    window.open(`https://wa.me/5511975333355?text=${encodedMessage}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#1E1E1E] text-white">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/robots')}
              className="p-2 hover:bg-gray-800 rounded-full"
              title="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold">Subscription & Tokens</h1>
          </div>
        </div>

        {/* Current Plan Status */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Crown className="w-6 h-6 text-yellow-500" />
              <h2 className="text-xl font-semibold">Current Plan</h2>
            </div>
            <span className="px-3 py-1 bg-green-600 bg-opacity-20 text-green-400 rounded-full text-sm">
              {currentPlan.status === 'active' ? 'Active' : 'Inactive'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-400 mb-1">Plan</p>
              <p className="text-lg font-medium">{currentPlan.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Status</p>
              <p className="text-lg font-medium">{currentPlan.status}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Next Renewal</p>
              <p className="text-lg font-medium">{new Date(currentPlan.renewalDate).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Token Balance</p>
              <p className="text-lg font-medium flex items-center">
                <TokenDisplay showLabel={false} />
                <span className="ml-1">tokens</span>
              </p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-700 flex justify-between">
            <button 
              onClick={handleDowngradeClick}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md flex items-center"
            >
              <WhatsApp className="w-4 h-4 mr-2" />
              Downgrade Plan
            </button>
            <button 
              onClick={() => handleUpgradeClick('')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md flex items-center"
            >
              <WhatsApp className="w-4 h-4 mr-2" />
              Upgrade Plan
            </button>
          </div>
        </div>

        {/* Available Plans */}
        <h2 className="text-xl font-semibold mb-6">Available Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {plans.map((plan) => (
            <div 
              key={plan.id}
              className={`bg-gray-800 rounded-lg p-6 relative ${
                plan.isPopular ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              {plan.isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-600 rounded-full text-sm font-medium">
                  Most Popular
                </div>
              )}

              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                {plan.id === 'pro' && <Star className="w-5 h-5 text-yellow-500" />}
                {plan.id === 'pro2' && <Shield className="w-5 h-5 text-purple-500" />}
              </div>

              <p className="text-2xl font-bold mb-4">{plan.price}</p>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-gray-300">
                    <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button 
                onClick={() => currentPlan.name === plan.name ? null : handleUpgradeClick(plan.id)}
                className={`w-full py-2 rounded-md flex items-center justify-center ${
                  currentPlan.name === plan.name
                    ? 'bg-green-600 hover:bg-green-700'
                    : plan.isPopular
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                {currentPlan.name === plan.name ? 'Current Plan' : (
                  <>
                    <WhatsApp className="w-4 h-4 mr-2" />
                    Upgrade
                  </>
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Token Reload */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Zap className="w-6 h-6 text-yellow-500" />
              <h2 className="text-xl font-semibold">Token Reload</h2>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-4 md:mb-0">
              <p className="text-lg mb-2">Need more tokens?</p>
              <p className="text-gray-400">Purchase additional tokens to continue using AI features</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <p className="text-2xl font-bold">R$ 299,80</p>
                <p className="text-sm text-gray-400">per reload</p>
              </div>
              <button 
                onClick={handleBuyTokens}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md flex items-center"
              >
                <WhatsApp className="w-4 h-4 mr-2" />
                Buy Tokens
              </button>
            </div>
          </div>
        </div>

        {/* Token Usage */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Zap className="w-6 h-6 text-yellow-500" />
              <h2 className="text-xl font-semibold">Token Usage</h2>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">Monthly Allocation</span>
                <span className="font-medium">{tokenAllocation.toLocaleString()} tokens</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full" 
                  style={{ width: `${Math.min(100, (currentPlan.tokenBalance / tokenAllocation) * 100)}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-700 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-1">Available</p>
                <p className="text-xl font-medium">{currentPlan.tokenBalance.toLocaleString()}</p>
              </div>
              <div className="bg-gray-700 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-1">Used This Month</p>
                <p className="text-xl font-medium">{Math.max(0, tokenAllocation - currentPlan.tokenBalance).toLocaleString()}</p>
              </div>
              <div className="bg-gray-700 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-1">Resets In</p>
                <p className="text-xl font-medium">23 days</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}