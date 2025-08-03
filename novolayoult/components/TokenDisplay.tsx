import React, { useEffect } from 'react';
import { Zap } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase';
import { useLanguageStore } from '../stores/languageStore';

interface TokenDisplayProps {
  showLabel?: boolean;
  className?: string;
}

export function TokenDisplay({ showLabel = true, className = '' }: TokenDisplayProps) {
  const { profile, loadProfile } = useAuthStore();
  const { t } = useLanguageStore();
  const tokenBalance = profile?.token_balance || 0;

  // Refresh token balance periodically with error handling and retries
  useEffect(() => {
    const refreshTokens = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          console.warn('No active session found');
          return;
        }

        // Retry logic for fetching token balance
        const maxRetries = 3;
        for (let i = 0; i < maxRetries; i++) {
          try {
            const { data, error } = await supabase
              .from('profiles')
              .select('token_balance')
              .eq('id', session.user.id)
              .single();
              
            if (error) throw error;
            
            if (data && profile?.token_balance !== data.token_balance) {
              loadProfile();
            }
            break;
          } catch (error) {
            console.error(`Error refreshing token balance (attempt ${i + 1}):`, error);
            if (i === maxRetries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
          }
        }
      } catch (error) {
        console.error('Failed to refresh token balance after retries:', error);
      }
    };

    // Refresh token balance every 30 seconds
    const interval = setInterval(refreshTokens, 30000);
    
    // Refresh once on mount
    refreshTokens();
    
    return () => clearInterval(interval);
  }, [loadProfile, profile?.token_balance]);

  const handleBuyTokens = () => {
    const message = "Olá vim do DevHub Trader e quero mais informações e ajuda para comprar tokens";
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/5511975333355?text=${encodedMessage}`, '_blank');
  };

  return (
    <div 
      className={`flex items-center ${className} cursor-pointer hover:text-blue-300 text-sm lg:text-base`}
      onClick={handleBuyTokens}
      title={tokenBalance < 1000 ? "Você precisa de pelo menos 1000 tokens para análises" : "Buy more tokens"}
    >
      <Zap className="w-3 h-3 lg:w-4 lg:h-4 text-yellow-500 mr-1" />
      {showLabel ? (
        <span className="text-xs lg:text-sm">
          <span className={`font-medium ${tokenBalance < 1000 ? 'text-red-400' : ''}`}>
            {tokenBalance.toLocaleString()}
          </span> {t('tokens.balance')}
        </span>
      ) : (
        <span className={`font-medium text-xs lg:text-sm ${tokenBalance < 1000 ? 'text-red-400' : ''}`}>
          {tokenBalance.toLocaleString()}
        </span>
      )}
    </div>
  );
}