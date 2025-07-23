import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface SharingInvite {
  id: string;
  robot_name: string;
  email: string;
  permission: 'view' | 'edit';
  created_at: string;
  expires_at: string;
  accepted_at: string | null;
  is_active: boolean;
}

interface SharedRobot {
  id: string;
  robot_name: string;
  permission: 'view' | 'edit';
  created_at: string;
}

interface SharingState {
  invites: SharingInvite[];
  sharedRobots: SharedRobot[];
  isLoading: boolean;
  error: string | null;
  createInvite: (params: { robotName: string; email: string; permission: 'view' | 'edit' }) => Promise<void>;
  loadInvites: (robotName: string) => Promise<void>;
  loadSharedRobots: () => Promise<void>;
  revokeInvite: (inviteId: string) => Promise<void>;
  checkExistingInvite: (robotName: string, email: string) => Promise<SharingInvite | null>;
}

export const useSharingStore = create<SharingState>((set, get) => ({
  invites: [],
  sharedRobots: [],
  isLoading: false,
  error: null,

  loadSharedRobots: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('No authenticated user');
      }

      const { data: sharedRobots, error } = await supabase
        .from('shared_robots')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      set({ sharedRobots: sharedRobots || [] });
    } catch (error) {
      console.error('Error loading shared robots:', error);
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  checkExistingInvite: async (robotName: string, email: string) => {
    if (!robotName?.trim() || !email?.trim()) {
      return null;
    }

    const { data, error } = await supabase
      .from('sharing_invites')
      .select('*')
      .eq('robot_name', robotName.trim())
      .eq('email', email.trim())
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error checking existing invite:', error);
      return null;
    }

    return data;
  },

  createInvite: async ({ robotName, email, permission }) => {
    set({ isLoading: true, error: null });
    try {
      const trimmedRobotName = robotName?.trim();
      const trimmedEmail = email?.trim();

      if (!trimmedRobotName) {
        throw new Error('Robot name cannot be empty');
      }

      if (!trimmedEmail) {
        throw new Error('Email cannot be empty');
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Check for existing active invite
      const existingInvite = await get().checkExistingInvite(trimmedRobotName, trimmedEmail);
      
      // If there's an existing invite, revoke it first
      if (existingInvite) {
        await get().revokeInvite(existingInvite.id);
      }

      const { data, error } = await supabase
        .from('sharing_invites')
        .insert({
          robot_name: trimmedRobotName,
          email: trimmedEmail,
          permission,
          created_by: user.id,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
        })
        .select()
        .single();

      if (error) throw error;
      
      const { invites } = get();
      set({ invites: [...invites, data] });

      // Check if user exists in auth.users
      const { data: existingUser } = await supabase.auth.admin.getUserByEmail(trimmedEmail);

      if (existingUser?.user) {
        await supabase
          .from('shared_robots')
          .upsert({
            robot_name: trimmedRobotName,
            user_id: existingUser.user.id,
            permission,
            created_by: user.id
          });
      }
    } catch (error) {
      console.error('Error creating invite:', error);
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  loadInvites: async (robotName: string) => {
    set({ isLoading: true, error: null });
    try {
      const trimmedRobotName = robotName?.trim();
      if (!trimmedRobotName) {
        set({ invites: [] });
        return;
      }

      const { data: invites, error } = await supabase
        .from('sharing_invites')
        .select('*')
        .eq('robot_name', trimmedRobotName)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ invites: invites || [] });
    } catch (error) {
      console.error('Error loading invites:', error);
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  revokeInvite: async (inviteId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data: invite } = await supabase
        .from('sharing_invites')
        .select('robot_name, email')
        .eq('id', inviteId)
        .single();

      if (invite) {
        // Get user ID from auth.users
        const { data: userData } = await supabase.auth.admin.getUserByEmail(invite.email);
        
        if (userData?.user) {
          // Remove shared access if it exists
          await supabase
            .from('shared_robots')
            .delete()
            .match({
              robot_name: invite.robot_name,
              user_id: userData.user.id
            });
        }
      }

      const { error } = await supabase
        .from('sharing_invites')
        .update({ is_active: false })
        .eq('id', inviteId);

      if (error) throw error;
      
      const { invites } = get();
      set({ invites: invites.filter(invite => invite.id !== inviteId) });
    } catch (error) {
      console.error('Error revoking invite:', error);
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
}));