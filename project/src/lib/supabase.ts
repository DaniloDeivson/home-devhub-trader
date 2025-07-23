import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create Supabase client with retries and timeouts
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    debug: true
  },
  global: {
    headers: { 
      'x-application-name': 'devhub-trader',
      'X-Client-Info': 'supabase-js/2.39.7'
    },
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Test connection function with improved retry logic and error handling
export async function testSupabaseConnection(retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const { error } = await supabase.auth.getSession();
      if (!error) {
        console.log('Successfully connected to Supabase');
        return true;
      }
      console.warn(`Connection attempt ${i + 1} failed: ${error.message}`);
      if (i < retries - 1) {
        const backoffDelay = delay * Math.pow(2, i);
        console.log(`Retrying in ${backoffDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }
    } catch (error) {
      console.error('Supabase connection error:', error);
      if (i < retries - 1) {
        const backoffDelay = delay * Math.pow(2, i);
        console.log(`Retrying in ${backoffDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }
    }
  }
  console.error('Failed to establish Supabase connection after all retries');
  return false;
}

// Initialize connection with improved error handling
export async function initializeSupabase() {
  try {
    // Test the connection with retries
    const isConnected = await testSupabaseConnection();
    if (!isConnected) {
      console.error('Failed to establish Supabase connection after retries');
      return false;
    }

    // Get current session with error handling
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('Session error:', sessionError.message);
      return false;
    }

    // Setup auth state change listener with error handling
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      try {
        if (event === 'SIGNED_OUT') {
          console.log('User signed out, clearing cache');
          // Add any cleanup logic here
        } else if (event === 'SIGNED_IN') {
          console.log('User signed in, refreshing data');
          // Add any refresh logic here
        }
      } catch (error) {
        console.error('Error in auth state change handler:', error);
      }
    });

    return true;
  } catch (error) {
    console.error('Failed to initialize Supabase:', error);
    return false;
  }
}