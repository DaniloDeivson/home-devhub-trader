import React, { useState, useEffect } from 'react'; 
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { initializeSupabase } from './lib/supabase';
import { HomePage } from './pages/HomePage';
import { EditorPage } from './pages/EditorPage';
import { RobotsPage } from './pages/RobotsPage';
import { ProfilePage } from './pages/ProfilePage';
import { CommunityPage } from './pages/CommunityPage';
import { SubscriptionPage } from './pages/SubscriptionPage';
import { AdminPanel } from './pages/AdminPanel';
import { DashboardPage } from './pages/DashboardPage';
import { FloatingWhatsAppButton } from './components/FloatingWhatsAppButton';
import { BacktestAnalysisPage } from './pages/BacktestAnalysisPage';
import { StrategyAnalysisPage } from './pages/StrategyAnalysisPage';
import { PublicPlansPage } from './pages/PublicPlansPage';
import { FAQPage } from './pages/FAQPage';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  
  const { session, loadProfile } = useAuthStore();

  // Initialize Supabase when component mounts
  useEffect(() => {
    const initialize = async () => {
      try {
        const initialized = await initializeSupabase();
        if (!initialized) {
          console.warn('Supabase initialization failed, but continuing...');
        }
        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing Supabase:', error);
        setInitError(error instanceof Error ? error.message : 'Initialization failed');
        setIsInitialized(true); // Continue even if initialization fails
      }
    };
    
    initialize();
  }, []);

  useEffect(() => {
    if (isInitialized) {
      loadProfile().catch(error => {
        console.error('Error loading profile:', error);
        // Don't block the app if profile loading fails
      });
    }
  }, [loadProfile, isInitialized]);

  useEffect(() => {
    setIsLoggedIn(!!session);
  }, [session]);
  
  // Show loading screen while initializing
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-[#1E1E1E] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white">Carregando...</p>
        </div>
      </div>
    );
  }
  
  // Show error screen if there's a critical initialization error
  if (initError && initError.includes('Missing Supabase environment variables')) {
    return (
      <div className="min-h-screen bg-[#1E1E1E] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Configuração Necessária</h2>
          <p className="text-gray-400 mb-4">
            Para usar a aplicação, você precisa configurar as variáveis de ambiente do Supabase.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }
  
  if (!isLoggedIn) {
    return (
      <>
        <Router>
          <Routes>
            <Route path="/plans" element={<PublicPlansPage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="*" element={<HomePage />} />
          </Routes>
        </Router>
        <FloatingWhatsAppButton />
      </>
    );
  }

  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/robots" replace />} />
          <Route path="/editor/:robotId" element={<EditorPage />} />
          <Route path="/robots" element={<RobotsPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/subscription" element={<SubscriptionPage />} />
          <Route path="/plans" element={<SubscriptionPage />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/backtest-analysis" element={<BacktestAnalysisPage />} />
          <Route path="/strategy-analysis" element={<StrategyAnalysisPage />} />
          <Route path="*" element={<Navigate to="/robots" replace />} />
        </Routes>
      </Router>
      <FloatingWhatsAppButton />
    </>
  );
}