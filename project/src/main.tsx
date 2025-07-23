import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initializeSupabase } from './lib/supabase';

// Initialize Supabase before rendering
initializeSupabase().then((initialized) => {
  if (!initialized) {
    console.error('Failed to initialize Supabase');
    // Render a fallback UI instead of the main app
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <div className="min-h-screen bg-[#1E1E1E] text-white flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Connection Error</h1>
            <p className="text-gray-400 mb-4">Unable to connect to the server. Please check your internet connection and try again.</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md"
            >
              Retry
            </button>
          </div>
        </div>
      </StrictMode>
    );
    return;
  }
  
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
});