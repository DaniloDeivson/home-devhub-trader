import React from 'react';
import { Lock, Crown, Zap } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';

interface PlanRestrictedSectionProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  requiredPlan?: 'Pro' | 'Pro 2' | 'Pro 3' | 'Starter';
}

export function PlanRestrictedSection({
  children,
  title,
  description = 'Esta seção está disponível apenas para usuários PRO',
  requiredPlan = 'Pro'
}: PlanRestrictedSectionProps) {
  const { profile } = useAuthStore();
  const navigate = useNavigate();
  
  // Check if user has access based on their plan
  const hasAccess = React.useMemo(() => {
    if (!profile?.plan) return false;
    
    const userPlan = profile.plan.toLowerCase();
    
    if (requiredPlan === 'Pro') {
      return userPlan.includes('pro');
    } else if (requiredPlan === 'Pro 2') {
      return userPlan.includes('pro 2') || userPlan.includes('pro 3');
    } else if (requiredPlan === 'Pro 3') {
      return userPlan.includes('pro 3');
    } else if (requiredPlan === 'Starter') {
      return userPlan.includes('pro') || userPlan.includes('pro 1') || userPlan.includes('pro 2') || userPlan.includes('pro 3');
    }
    
    return false;
  }, [profile?.plan, requiredPlan]);
  
  const handleUpgradeClick = () => {
    navigate('/subscription');
  };
  
  if (hasAccess) {
    return <>{children}</>;
  }
  
  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-medium flex items-center">
          <Lock className="w-5 h-5 text-gray-400 mr-2" />
          {title}
        </h2>
      </div>
      
      <div className="p-8 flex flex-col items-center justify-center text-center">
        <div className="bg-gray-700 p-4 rounded-full mb-4">
          <Lock className="w-12 h-12 text-gray-400" />
        </div>
        
        <h3 className="text-xl font-bold mb-2">Conteúdo Exclusivo PRO</h3>
        <p className="text-gray-400 mb-6 max-w-md">
          {description}
        </p>
        
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 p-4 rounded-lg mb-6 w-full max-w-md">
          <div className="flex items-center mb-2">
            <Crown className="w-5 h-5 text-yellow-400 mr-2" />
            <h4 className="font-medium text-white">Benefícios do Plano PRO</h4>
          </div>
          <ul className="text-sm text-blue-100 space-y-2">
            <li className="flex items-center">
              <Zap className="w-4 h-4 text-yellow-400 mr-2 flex-shrink-0" />
              <span>Acesso a todas as análises avançadas</span>
            </li>
            <li className="flex items-center">
              <Zap className="w-4 h-4 text-yellow-400 mr-2 flex-shrink-0" />
              <span>Análise emocional e perfil de trader</span>
            </li>
            <li className="flex items-center">
              <Zap className="w-4 h-4 text-yellow-400 mr-2 flex-shrink-0" />
              <span>Correlação entre estratégias</span>
            </li>
            <li className="flex items-center">
              <Zap className="w-4 h-4 text-yellow-400 mr-2 flex-shrink-0" />
              <span>Análise de eventos especiais</span>
            </li>
          </ul>
        </div>
        
        <button
          onClick={handleUpgradeClick}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-md flex items-center"
        >
          <Crown className="w-5 h-5 mr-2" />
          Fazer Upgrade para PRO
        </button>
      </div>
    </div>
  );
}