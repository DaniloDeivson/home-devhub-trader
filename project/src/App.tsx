import React, { useState, useEffect } from 'react'; 
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { HomePage } from './pages/HomePage';
import { EditorPage } from './pages/EditorPage';
import { RobotsPage } from './pages/RobotsPage';
import { ProfilePage } from './pages/ProfilePage';
import { CommunityPage } from './pages/CommunityPage';
import { SubscriptionPage } from './pages/SubscriptionPage';
import { AdminPanel } from './pages/AdminPanel';
import { ExpertsPage } from './pages/ExpertsPage';
import { DeveloperSignupPage } from './pages/DeveloperSignupPage';
import { ProprietaryTradingPage } from './pages/ProprietaryTradingPage';
import { ProfitEstrategistaPage } from './pages/ProfitEstrategistaPage';
import { FloatingWhatsAppButton } from './components/FloatingWhatsAppButton';
import { BacktestAnalysisPage } from './pages/BacktestAnalysisPage';
import { StrategyAnalysisPage } from './pages/StrategyAnalysisPage';
import { PublicPlansPage } from './pages/PublicPlansPage';
import DashboardPage from './pages/DashboardPage';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  const { session, loadProfile } = useAuthStore();

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    setIsLoggedIn(!!session);
  }, [session]);
  
  if (!isLoggedIn) {
    return (
      <>
        <Router>
          <Routes>
            <Route path="/plans" element={<PublicPlansPage />} />
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
          <Route path="/" element={<HomePage />} />
          <Route path="/editor/:robotId" element={<EditorPage />} />
          <Route path="/robots" element={<RobotsPage />} />
          <Route path="/community" element={<CommunityPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/subscription" element={<SubscriptionPage />} />
          <Route path="/plans" element={<SubscriptionPage />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/experts" element={<ExpertsPage />} />
          <Route path="/developer-signup" element={<DeveloperSignupPage />} />
          <Route path="/proprietary" element={<ProprietaryTradingPage />} />
          <Route path="/profit-estrategista" element={<ProfitEstrategistaPage />} />
          <Route path="/backtest-analysis" element={<BacktestAnalysisPage />} />
          <Route path="/strategy-analysis" element={<StrategyAnalysisPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
      <FloatingWhatsAppButton />
    </>
  );
}