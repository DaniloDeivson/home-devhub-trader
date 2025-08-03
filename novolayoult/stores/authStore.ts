import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface Profile {
  id: string;
  name: string | null;
  avatar_url: string | null;
  email: string;
  phone?: string | null;
  token_balance?: number;
  plan?: string;
  plan_status?: string;
  plan_renewal_date?: string;
}

interface AuthState {
  isLoading: boolean;
  session: any | null;
  profile: Profile | null;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, phone?: string) => Promise<void>;
  signOut: () => Promise<void>;
  loadProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  updateTokenBalance: (amount: number) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isLoading: true,
  session: null,
  profile: null,

  signInWithEmail: async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Email ou senha incorretos');
        }
        throw error;
      }
      await get().loadProfile();
    } catch (error) {
      throw error;
    }
  },

  signUpWithEmail: async (email: string, password: string, phone?: string) => {
    try {
      // Create new user
      const { data: { user }, error: signUpError } = await supabase.auth.signUp({ 
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            name: email.split('@')[0],
            phone: phone || null
          }
        }
      });

      if (signUpError) {
        // Check for user already registered error
        if (signUpError.message?.includes('User already registered') || 
            signUpError.message?.includes('already been taken')) {
          throw new Error('Este email já está cadastrado. Por favor, faça login.');
        }
        throw signUpError;
      }

      if (!user) {
        throw new Error('Erro ao criar usuário. Tente novamente.');
      }

      // Auto sign in after registration
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) throw signInError;

      // Set default token balance for new users
      await supabase
        .from('profiles')
        .update({ 
          token_balance: 200, 
          plan: 'Free Forever', 
          plan_status: 'active',
          phone: phone || null
        })
        .eq('id', user.id);

      // Load profile after sign in
      await get().loadProfile();

      return { user };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    set({ session: null, profile: null });
  },

  loadProfile: async () => {
    try {
      // Check if supabase is properly configured
      if (!supabase || typeof supabase.auth?.getSession !== 'function') {
        console.warn('Supabase not properly configured');
        set({ isLoading: false, session: null, profile: null });
        return;
      }
      
      const { data: { session } } = await supabase.auth.getSession();
      set({ session });
      
      if (session?.user) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.error('Error loading profile:', error);
          // Don't throw error, just log it
        }
        set({ profile });
      }
      set({ isLoading: false });
    } catch (error) {
      console.error('Error loading profile:', error);
      set({ isLoading: false });
    }
  },

  updateProfile: async (updates: Partial<Profile>) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('No authenticated session');

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', session.user.id);

      if (error) throw error;

      // Reload profile to get updated data
      await get().loadProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },

  updateTokenBalance: async (amount: number) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('No authenticated session');

      const { profile } = get();
      if (!profile) throw new Error('Profile not loaded');

      const currentBalance = profile.token_balance || 0;
      const newBalance = currentBalance + amount;

      const { error } = await supabase
        .from('profiles')
        .update({ token_balance: newBalance })
        .eq('id', session.user.id);

      if (error) throw error;

      // Update local state
      set({ profile: { ...profile, token_balance: newBalance } });
    } catch (error) {
      console.error('Error updating token balance:', error);
      throw error;
    }
  }
}));