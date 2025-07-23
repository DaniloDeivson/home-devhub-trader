import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { ErrorLogService } from '../services/ErrorLogService';

interface Robot {
  id: string;
  name: string;
  owner_id: string;
  created_at?: string;
  updated_at?: string;
  current_version_id?: string;
}

interface RobotVersion {
  id: string;
  robot_id: string;
  version_name: string;
  code: string;
  description?: string;
  tags?: string[];
  created_at: string;
  created_by?: string;
  is_deleted?: boolean;
  updated_at?: string;
}

interface RobotState {
  robots: Robot[];
  sharedRobots: Robot[];
  currentRobot: Robot | null;
  versions: RobotVersion[];
  currentVersion: RobotVersion | null;
  isLoading: boolean;
  error: string | null;
  robotLimit: number;
  loadRobots: () => Promise<void>;
  loadSharedRobots: () => Promise<void>;
  loadVersions: (robotId: string) => Promise<RobotVersion[]>;
  createRobot: (name: string) => Promise<Robot | null>;
  createVersion: (robotId: string, versionName: string, code: string, description?: string, tags?: string[]) => Promise<RobotVersion | null>;
  updateVersion: (versionId: string, updates: Partial<RobotVersion>) => Promise<void>;
  deleteVersion: (versionId: string) => Promise<void>;
  renameVersion: (versionId: string, newName: string) => Promise<void>;
  deleteRobot: (robotId: string) => Promise<void>;
  updateRobotVersion: (robotId: string, versionId: string) => Promise<void>;
  getVersionCount: (robotId: string) => Promise<number>;
  renameRobot: (robotId: string, newName: string) => Promise<void>;
  getRobotLimit: () => Promise<number>;
  shareRobot: (robotId: string, permission: 'read' | 'write', email?: string) => Promise<string>;
}

export const useRobotStore = create<RobotState>((set, get) => ({
  robots: [],
  sharedRobots: [],
  currentRobot: null,
  versions: [],
  currentVersion: null,
  isLoading: false,
  error: null,
  robotLimit: 5, // Default limit for free plan

  loadRobots: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error('No authenticated session');
      }

      const { data: robots, error } = await supabase
        .from('robots')
        .select('*')
        .eq('owner_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ robots: robots || [] });
      
      // Load robot limit based on user's plan
      await get().getRobotLimit();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load robots';
      set({ error: message });
      ErrorLogService.logError(error, 'loadRobots');
    } finally {
      set({ isLoading: false });
    }
  },

  loadSharedRobots: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error('No authenticated session');
      }

      const { data: sharedRobots, error } = await supabase
        .from('shared_robots')
        .select(`
          robots:robot_name (
            id,
            name,
            owner_id,
            created_at,
            updated_at,
            current_version_id
          )
        `)
        .eq('user_id', session.user.id);

      if (error) throw error;
      set({ sharedRobots: sharedRobots?.map(sr => sr.robots) || [] });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load shared robots';
      set({ error: message });
      ErrorLogService.logError(error, 'loadSharedRobots');
    } finally {
      set({ isLoading: false });
    }
  },

  loadVersions: async (robotId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data: versions, error } = await supabase
        .from('robot_versions')
        .select('*')
        .eq('robot_id', robotId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ versions: versions || [] });
      return versions || [];
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load versions';
      set({ error: message });
      ErrorLogService.logError(error, 'loadVersions');
      return [];
    } finally {
      set({ isLoading: false });
    }
  },

  getVersionCount: async (robotId: string) => {
    try {
      const { count, error } = await supabase
        .from('robot_versions')
        .select('*', { count: 'exact', head: true })
        .eq('robot_id', robotId)
        .eq('is_deleted', false);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      ErrorLogService.logError(error, 'getVersionCount');
      return 0;
    }
  },

  getRobotLimit: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error('No authenticated session');
      }

      // Get user's plan from profiles table
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;

      let limit = 5; // Default limit for free plan
      
      // Set limit based on plan
      if (profile?.plan) {
        switch (profile.plan) {
          case 'Free':
            limit = 5;
            break;
          case 'PRO 1':
            limit = 25;
            break;
          case 'PRO 2':
            limit = 100;
            break;
          case 'PRO 3':
            limit = 999; // Effectively unlimited
            break;
          default:
            limit = 5;
        }
      }
      
      set({ robotLimit: limit });
      return limit;
    } catch (error) {
      console.error('Error getting robot limit:', error);
      return get().robotLimit; // Return current limit if there's an error
    }
  },

  createRobot: async (name: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error('No authenticated session');
      }

      // Check if user has reached their robot limit
      const { robots, robotLimit } = get();
      if (robots.length >= robotLimit) {
        throw new Error(`You have reached your limit of ${robotLimit} robots. Please upgrade your plan to create more robots.`);
      }

      // Create robot first
      const { data: robot, error: robotError } = await supabase
        .from('robots')
        .insert({
          name,
          owner_id: session.user.id
        })
        .select()
        .single();

      if (robotError) throw robotError;
      if (!robot) throw new Error('Failed to create robot');

      // Create initial version (Version 1)
      const { data: version, error: versionError } = await supabase
        .from('robot_versions')
        .insert({
          robot_id: robot.id,
          version_name: 'Versão 1',
          code: `// ${robot.name}
// Versão 1

var
  precoEntrada, precoSaida: float;
begin
  // Lógica principal do robô
  // Clique para começar a editar
end;`,
          description: 'Versão inicial',
          tags: ['tendencia'],
          created_by: session.user.id
        })
        .select()
        .single();

      if (versionError) throw versionError;

      // Set this version as the current version
      const { error: updateError } = await supabase
        .from('robots')
        .update({ current_version_id: version.id })
        .eq('id', robot.id);

      if (updateError) throw updateError;

      // Update local state
      set(state => ({
        robots: [robot, ...state.robots],
        currentRobot: robot,
        versions: [version],
        currentVersion: version
      }));

      return robot;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create robot';
      set({ error: message });
      ErrorLogService.logError(error, 'createRobot');
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  renameRobot: async (robotId: string, newName: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data: robot, error: updateError } = await supabase
        .from('robots')
        .update({ name: newName })
        .eq('id', robotId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Update local state
      set(state => ({
        robots: state.robots.map(r => r.id === robotId ? { ...r, name: newName } : r),
        currentRobot: state.currentRobot?.id === robotId ? { ...state.currentRobot, name: newName } : state.currentRobot
      }));

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to rename robot';
      set({ error: message });
      ErrorLogService.logError(error, 'renameRobot');
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  createVersion: async (robotId: string, versionName: string, code: string, description?: string, tags?: string[]) => {
    set({ isLoading: true, error: null });
    try {
      // Check if version name already exists for this robot
      const { data: existingVersions, error: checkError } = await supabase
        .from('robot_versions')
        .select('version_name')
        .eq('robot_id', robotId)
        .eq('version_name', versionName)
        .eq('is_deleted', false);

      if (checkError) throw checkError;

      if (existingVersions && existingVersions.length > 0) {
        throw new Error('Version name already exists for this robot');
      }

      const { data: version, error } = await supabase
        .from('robot_versions')
        .insert({
          robot_id: robotId,
          version_name: versionName,
          code,
          description,
          tags
        })
        .select()
        .single();

      if (error) throw error;
      if (!version) throw new Error('Failed to create version');

      // Update the robot's current_version_id
      await supabase
        .from('robots')
        .update({ current_version_id: version.id })
        .eq('id', robotId);

      set(state => ({
        versions: [version, ...state.versions],
        currentVersion: version
      }));

      return version;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create version';
      set({ error: message });
      ErrorLogService.logError(error, 'createVersion');
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateVersion: async (versionId: string, updates: Partial<RobotVersion>) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('robot_versions')
        .update(updates)
        .eq('id', versionId);

      if (error) throw error;

      set(state => ({
        versions: state.versions.map(v => 
          v.id === versionId ? { ...v, ...updates } : v
        ),
        currentVersion: state.currentVersion?.id === versionId 
          ? { ...state.currentVersion, ...updates }
          : state.currentVersion
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update version';
      set({ error: message });
      ErrorLogService.logError(error, 'updateVersion');
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteVersion: async (versionId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('robot_versions')
        .update({ is_deleted: true })
        .eq('id', versionId);

      if (error) throw error;

      set(state => ({
        versions: state.versions.filter(v => v.id !== versionId),
        currentVersion: state.currentVersion?.id === versionId ? null : state.currentVersion
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete version';
      set({ error: message });
      ErrorLogService.logError(error, 'deleteVersion');
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  renameVersion: async (versionId: string, newName: string) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('robot_versions')
        .update({ version_name: newName })
        .eq('id', versionId);

      if (error) throw error;

      set(state => ({
        versions: state.versions.map(v => 
          v.id === versionId ? { ...v, version_name: newName } : v
        ),
        currentVersion: state.currentVersion?.id === versionId 
          ? { ...state.currentVersion, version_name: newName }
          : state.currentVersion
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to rename version';
      set({ error: message });
      ErrorLogService.logError(error, 'renameVersion');
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteRobot: async (robotId: string) => {
    set({ isLoading: true, error: null });
    try {
      // Delete the robot (trigger will handle cleanup)
      const { error } = await supabase
        .from('robots')
        .delete()
        .eq('id', robotId);

      if (error) throw error;

      // Update local state
      set(state => ({
        robots: state.robots.filter(r => r.id !== robotId),
        currentRobot: state.currentRobot?.id === robotId ? null : state.currentRobot,
        versions: state.versions.filter(v => v.robot_id !== robotId),
        currentVersion: state.currentVersion?.robot_id === robotId ? null : state.currentVersion
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete robot';
      set({ error: message });
      ErrorLogService.logError(error, 'deleteRobot');
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateRobotVersion: async (robotId: string, versionId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('robots')
        .update({ current_version_id: versionId })
        .eq('id', robotId);

      if (error) throw error;

      set(state => ({
        robots: state.robots.map(r => 
          r.id === robotId ? { ...r, current_version_id: versionId } : r
        ),
        currentRobot: state.currentRobot?.id === robotId 
          ? { ...state.currentRobot, current_version_id: versionId }
          : state.currentRobot
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update robot version';
      set({ error: message });
      ErrorLogService.logError(error, 'updateRobotVersion');
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  shareRobot: async (robotId: string, permission: 'read' | 'write', email?: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error('No authenticated session');
      }

      // Get robot name
      const { data: robot, error: robotError } = await supabase
        .from('robots')
        .select('name')
        .eq('id', robotId)
        .single();

      if (robotError) throw robotError;
      if (!robot) throw new Error('Robot not found');

      // Generate a unique token
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

      // Set expiration to 7 days from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // Create shared link
      const { data: link, error: linkError } = await supabase
        .from('shared_links')
        .insert({
          robot_name: robot.name,
          permission: permission === 'read' ? 'view' : 'edit',
          created_by: session.user.id,
          expires_at: expiresAt.toISOString(),
          token: token,
          is_active: true
        })
        .select()
        .single();

      if (linkError) throw linkError;

      return token;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to share robot';
      set({ error: message });
      ErrorLogService.logError(error, 'shareRobot');
      throw error;
    } finally {
      set({ isLoading: false });
    }
  }
}));