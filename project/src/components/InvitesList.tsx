import React, { useState, useEffect } from 'react';
import { Check, X, AlertTriangle, User } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Invite {
  id: string;
  robot_name: string;
  permission: 'view' | 'edit';
  created_at: string;
  created_by: string;
  created_by_email?: string;
  expires_at: string;
}

export function InvitesList() {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInvites();
  }, []);

  const loadInvites = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // First, get the invites
      const { data: invitesData, error: invitesError } = await supabase
        .from('sharing_invites')
        .select(`
          id,
          robot_name,
          permission,
          created_at,
          created_by,
          expires_at
        `)
        .eq('email', user.email)
        .eq('is_active', true)
        .is('accepted_at', null)
        .order('created_at', { ascending: false });

      if (invitesError) throw invitesError;
      if (!invitesData) return;

      // Then, get the creator emails from the profiles table
      const creatorIds = [...new Set(invitesData.map(invite => invite.created_by))];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', creatorIds);

      if (profilesError) throw profilesError;

      // Create a map of user IDs to emails
      const emailMap = new Map(
        (profilesData || []).map(profile => [profile.id, profile.email])
      );

      // Combine the data
      const invitesWithCreator = invitesData.map(invite => ({
        ...invite,
        created_by_email: emailMap.get(invite.created_by)
      }));

      setInvites(invitesWithCreator);
    } catch (error) {
      console.error('Error loading invites:', error);
      setError(error instanceof Error ? error.message : 'Failed to load invites');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvite = async (invite: Invite) => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Accept the invite
      const { error: acceptError } = await supabase
        .from('sharing_invites')
        .update({ 
          accepted_at: new Date().toISOString(),
          is_active: false 
        })
        .eq('id', invite.id);

      if (acceptError) throw acceptError;

      // Add to shared_robots
      const { error: shareError } = await supabase
        .from('shared_robots')
        .insert({
          robot_name: invite.robot_name,
          user_id: user.id,
          permission: invite.permission,
          created_by: invite.created_by
        });

      if (shareError) throw shareError;

      // Remove from local state
      setInvites(invites.filter(i => i.id !== invite.id));
    } catch (error) {
      console.error('Error accepting invite:', error);
      setError(error instanceof Error ? error.message : 'Failed to accept invite');
    }
  };

  const handleDeclineInvite = async (inviteId: string) => {
    try {
      const { error } = await supabase
        .from('sharing_invites')
        .update({ 
          is_active: false,
          accepted_at: null
        })
        .eq('id', inviteId);

      if (error) throw error;
      
      // Remove from local state
      setInvites(invites.filter(i => i.id !== inviteId));
    } catch (error) {
      console.error('Error declining invite:', error);
      setError(error instanceof Error ? error.message : 'Failed to decline invite');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-500 bg-opacity-10 border border-red-500 rounded-md text-red-500 flex items-center">
        <AlertTriangle className="w-5 h-5 mr-2" />
        <span>{error}</span>
      </div>
    );
  }

  if (invites.length === 0) {
    return (
      <div className="text-center py-4 text-gray-400">
        No pending invites
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {invites.map((invite) => (
        <div 
          key={invite.id}
          className="bg-gray-800 rounded-lg p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-gray-400" />
              </div>
              <div>
                <h3 className="font-medium">{invite.created_by_email}</h3>
                <p className="text-sm text-gray-400">invited you to collaborate</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handleAcceptInvite(invite)}
                className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
                title="Accept invite"
              >
                <Check className="w-4 h-4 mr-1" />
                Accept
              </button>
              <button
                onClick={() => handleDeclineInvite(invite.id)}
                className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
                title="Decline invite"
              >
                <X className="w-4 h-4 mr-1" />
                Decline
              </button>
            </div>
          </div>

          <div className="bg-gray-900 rounded p-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-blue-400">{invite.robot_name}</h4>
                <p className="text-sm text-gray-400">
                  {invite.permission === 'edit' ? 'Editor access' : 'Viewer access'}
                </p>
              </div>
              <p className="text-xs text-gray-500">
                Expires {new Date(invite.expires_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}