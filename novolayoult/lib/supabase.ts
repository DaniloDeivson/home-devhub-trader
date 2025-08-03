import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create a default client even if env vars are missing
let supabase: any = null;

try {
  // Validate environment variables
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Missing Supabase environment variables. Some features may not work.');
    // Create a mock client to prevent crashes
    supabase = {
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: new Error('Supabase not configured') }),
        signUp: () => Promise.resolve({ data: { user: null, session: null }, error: new Error('Supabase not configured') }),
        signOut: () => Promise.resolve({ error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
      },
      from: () => ({
        select: () => Promise.resolve({ data: [], error: null }),
        insert: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
        update: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
        delete: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') })
      })
    };
  } else {
    // Create Supabase client with retries and timeouts
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        debug: false // Disable debug to reduce console noise
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
  }
} catch (error) {
  console.error('Error creating Supabase client:', error);
  // Create a mock client as fallback
  supabase = {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: new Error('Supabase not configured') }),
      signUp: () => Promise.resolve({ data: { user: null, session: null }, error: new Error('Supabase not configured') }),
      signOut: () => Promise.resolve({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
    },
    from: () => ({
      select: () => Promise.resolve({ data: [], error: null }),
      insert: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
      update: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
      delete: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') })
    })
  };
}

export { supabase };

// Test connection function with improved error handling
export async function testSupabaseConnection(retries = 2, delay = 1000) {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase not configured, skipping connection test');
    return false;
  }
  
  for (let i = 0; i < retries; i++) {
    try {
      const { error } = await supabase.auth.getSession();
      if (!error) {
        console.log('Successfully connected to Supabase');
        return true;
      }
      console.warn(`Connection attempt ${i + 1} failed: ${error.message}`);
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    } catch (error) {
      console.error('Supabase connection error:', error);
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  console.error('Failed to establish Supabase connection after all retries');
  return false;
}

// Initialize connection with improved error handling
export async function initializeSupabase() {
  try {
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('Supabase environment variables not found');
      return false;
    }
    
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
      // Don't return false here, continue with initialization
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