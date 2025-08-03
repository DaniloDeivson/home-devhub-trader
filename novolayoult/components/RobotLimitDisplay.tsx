import React from 'react';
import { useRobotStore } from '../stores/robotStore';
import { useAuthStore } from '../stores/authStore';
import { AlertCircle, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguageStore } from '../stores/languageStore';

interface RobotLimitDisplayProps {
  className?: string;
}

export function RobotLimitDisplay({ className = '' }: RobotLimitDisplayProps) {
  const { robots, robotLimit } = useRobotStore();
  const { profile } = useAuthStore();
  const { t, language } = useLanguageStore();
  const navigate = useNavigate();
  
  const robotCount = robots.length;
  const isNearLimit = robotCount >= robotLimit * 0.8;
  const isAtLimit = robotCount >= robotLimit;
  
  const getUsagePercentage = () => {
    return Math.min(100, (robotCount / robotLimit) * 100);
  };

  const handleUpgradeClick = () => {
    navigate('/subscription');
  };

  return (
    <div className={`bg-gray-800 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <h3 className="font-medium text-white">
            {language === 'en' ? 'Robot Quota' : 'Cota de Robôs'}
          </h3>
        </div>
        {profile?.plan && (
          <div className="flex items-center">
            <Crown className="w-4 h-4 text-yellow-500 mr-1" />
            <span className="text-sm text-gray-300">{profile.plan}</span>
          </div>
        )}
      </div>
      
      <div className="mb-2">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-400">
            {robotCount} / {robotLimit} {language === 'en' ? 'robots' : 'robôs'}
          </span>
          <span className={`${isNearLimit ? 'text-yellow-400' : isAtLimit ? 'text-red-400' : 'text-green-400'}`}>
            {getUsagePercentage().toFixed(0)}%
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className={`h-2 rounded-full ${
              isAtLimit 
                ? 'bg-red-500' 
                : isNearLimit 
                  ? 'bg-yellow-500' 
                  : 'bg-green-500'
            }`}
            style={{ width: `${getUsagePercentage()}%` }}
          />
        </div>
      </div>
      
      {isNearLimit && (
        <div className="mt-3">
          {isAtLimit ? (
            <div className="flex items-start text-xs text-red-400 mb-2">
              <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0 mt-0.5" />
              <span>
                {language === 'en' 
                  ? 'You have reached your robot limit. Upgrade your plan to create more robots.'
                  : 'Você atingiu seu limite de robôs. Atualize seu plano para criar mais robôs.'}
              </span>
            </div>
          ) : (
            <div className="flex items-start text-xs text-yellow-400 mb-2">
              <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0 mt-0.5" />
              <span>
                {language === 'en'
                  ? 'You are approaching your robot limit.'
                  : 'Você está se aproximando do seu limite de robôs.'}
              </span>
            </div>
          )}
          
          <button
            onClick={handleUpgradeClick}
            className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-xs font-medium"
          >
            {language === 'en' ? 'Upgrade Plan' : 'Atualizar Plano'}
          </button>
        </div>
      )}
    </div>
  );
}