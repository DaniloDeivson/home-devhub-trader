import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Render app immediately without waiting for Supabase initialization
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);