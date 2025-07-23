import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Users, Crown, Zap, Search, 
  MoreVertical, Check, X, RefreshCw, AlertTriangle,
  PlusCircle, MinusCircle, Edit, UserPlus, Download,
  Trash2, CreditCard, ExternalLink, Phone
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase';
import { Navbar } from '../components/Navbar';

interface User {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  plan: string;
  status: 'active' | 'suspended' | 'expired';
  token_balance: number;
  last_sign_in_at: string;
}

interface Plan {
  id: string;
  name: string;
  tokenAllocation: number;
  robotLimit: number;
  description: string;
}

export function AdminPanel() {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [tokenAmount, setTokenAmount] = useState('10');
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isAddingTokens, setIsAddingTokens] = useState(false);
  const [showAddTokensDirectModal, setShowAddTokensDirectModal] = useState(false);
  const [directEmail, setDirectEmail] = useState('');
  const [directAmount, setDirectAmount] = useState('10');
  const [showDeleteUserModal, setShowDeleteUserModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showChangePlanModal, setShowChangePlanModal] = useState(false);
  const [userToChangePlan, setUserToChangePlan] = useState<User | null>(null);
  const [isChangingPlan, setIsChangingPlan] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('');

  // Available plans
  const plans: Plan[] = [
    {
      id: 'free',
      name: 'Free',
      tokenAllocation: 100,
      robotLimit: 5,
      description: 'Basic plan with limited features'
    },
    {
      id: 'pro1',
      name: 'PRO 1',
      tokenAllocation: 5000,
      robotLimit: 25,
      description: 'For beginners with more tokens and robots'
    },
    {
      id: 'pro2',
      name: 'PRO 2',
      tokenAllocation: 12500,
      robotLimit: 100,
      description: 'Professional plan with advanced features'
    },
    {
      id: 'pro3',
      name: 'PRO 3',
      tokenAllocation: 30000,
      robotLimit: 999,
      description: 'Premium plan with unlimited robots'
    }
  ];

  // Check if user is authorized
  const authorizedEmails = ['pedropardal04@gmail.com', 'profitestrategista@gmail.com'];
  
  useEffect(() => {
    if (profile?.email && authorizedEmails.includes(profile.email)) {
      loadUsers();
    }
  }, [profile]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get all users from profiles table
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, name, phone, token_balance, plan, plan_status, updated_at');

      if (profilesError) throw profilesError;

      // Transform the data
      const combinedUsers = profiles.map(profile => ({
        id: profile.id,
        email: profile.email,
        name: profile.name || profile.email.split('@')[0],
        phone: profile.phone || null,
        plan: profile.plan || 'Free',
        status: profile.plan_status || 'active',
        token_balance: profile.token_balance || 0,
        last_sign_in_at: profile.updated_at
      }));

      setUsers(combinedUsers);
    } catch (err) {
      console.error('Error loading users:', err);
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      setIsDeleting(true);
      setError(null);

      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No valid authentication session');
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: userToDelete.id })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `HTTP error! status: ${response.status}` }));
        throw new Error(errorData.error || `Failed to delete user (Status: ${response.status})`);
      }

      let data;
      try {
        data = await response.json();
      } catch (e) {
        throw new Error('Invalid response from server');
      }
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to delete user');
      }
      
      // Update local state
      setUsers(users.filter(user => user.id !== userToDelete.id));
      
      setSuccess(`User ${userToDelete.email} deleted successfully`);
      setTimeout(() => setSuccess(null), 3000);
      setShowDeleteUserModal(false);
      setUserToDelete(null);
    } catch (err) {
      console.error('Error deleting user:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete user');
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddTokens = async () => {
    if (!selectedUser) return;
    
    try {
      setIsAddingTokens(true);
      const amount = parseInt(tokenAmount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Please enter a valid token amount');
      }

      // Update token balance in database
      const { error } = await supabase
        .from('profiles')
        .update({ 
          token_balance: (selectedUser.token_balance || 0) + amount 
        })
        .eq('id', selectedUser.id);

      if (error) throw error;

      // Update local state
      const updatedUsers = users.map(user => 
        user.id === selectedUser.id 
          ? { ...user, token_balance: (user.token_balance || 0) + amount }
          : user
      );
      setUsers(updatedUsers);

      setSuccess(`Added ${amount} tokens to ${selectedUser.email}`);
      setTimeout(() => setSuccess(null), 3000);
      setShowTokenModal(false);
      setSelectedUser(null);
      setTokenAmount('10');
    } catch (err) {
      console.error('Error adding tokens:', err);
      setError(err instanceof Error ? err.message : 'Failed to add tokens');
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsAddingTokens(false);
    }
  };

  const handleAddTokensDirect = async () => {
    try {
      setIsAddingTokens(true);
      const amount = parseInt(directAmount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Please enter a valid token amount');
      }

      if (!directEmail) {
        throw new Error('Please enter an email address');
      }

      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No valid authentication session');
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/add-tokens`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: directEmail, amount })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `HTTP error! status: ${response.status}` }));
        throw new Error(errorData.error || `Failed to add tokens (Status: ${response.status})`);
      }

      let data;
      try {
        data = await response.json();
      } catch (e) {
        throw new Error('Invalid response from server');
      }
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to add tokens');
      }

      setSuccess(`Added ${amount} tokens to ${directEmail}`);
      setTimeout(() => setSuccess(null), 3000);
      setShowAddTokensDirectModal(false);
      setDirectEmail('');
      setDirectAmount('10');
      
      // Refresh user list
      await loadUsers();
    } catch (err) {
      console.error('Error adding tokens directly:', err);
      setError(err instanceof Error ? err.message : 'Failed to add tokens');
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsAddingTokens(false);
    }
  };

  const handleChangePlan = async () => {
    if (!userToChangePlan || !selectedPlan) return;
    
    try {
      setIsChangingPlan(true);
      
      const plan = plans.find(p => p.id === selectedPlan);
      if (!plan) {
        throw new Error('Invalid plan selected');
      }

      // Update plan in database
      const { error } = await supabase
        .from('profiles')
        .update({ 
          plan: plan.name,
          plan_status: 'active',
          plan_renewal_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
        .eq('id', userToChangePlan.id);

      if (error) throw error;

      // Update local state
      const updatedUsers = users.map(user => 
        user.id === userToChangePlan.id 
          ? { 
              ...user, 
              plan: plan.name,
              status: 'active'
            }
          : user
      );
      setUsers(updatedUsers);

      setSuccess(`Changed ${userToChangePlan.email}'s plan to ${plan.name}`);
      setTimeout(() => setSuccess(null), 3000);
      setShowChangePlanModal(false);
      setUserToChangePlan(null);
      setSelectedPlan('');
    } catch (err) {
      console.error('Error changing plan:', err);
      setError(err instanceof Error ? err.message : 'Failed to change plan');
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsChangingPlan(false);
    }
  };

  const openTokenModal = (user: User) => {
    setSelectedUser(user);
    setShowTokenModal(true);
  };

  const openChangePlanModal = (user: User) => {
    setUserToChangePlan(user);
    setSelectedPlan(plans.find(p => p.name === user.plan)?.id || 'free');
    setShowChangePlanModal(true);
  };

  const openDeleteUserModal = (user: User) => {
    setUserToDelete(user);
    setShowDeleteUserModal(true);
  };

  const handleChangePlanStatus = async (userId: string, newStatus: 'active' | 'suspended') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ plan_status: newStatus })
        .eq('id', userId);

      if (error) throw error;

      // Update local state
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, status: newStatus }
          : user
      ));
      
      setSuccess(`User status updated to ${newStatus}`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error updating user status:', err);
      setError(err instanceof Error ? err.message : 'Failed to update user status');
      setTimeout(() => setError(null), 3000);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const filteredUsers = users
    .filter(user => 
      (filter === 'all' || user.status === filter) &&
      (user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
       user.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

  if (!profile?.email || !authorizedEmails.includes(profile.email)) {
    return (
      <div className="min-h-screen bg-[#1E1E1E] text-white flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-gray-400 mb-4">You don't have permission to access this page.</p>
          <button
            onClick={() => navigate('/robots')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md"
          >
            Back to Robots
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1E1E1E] text-white">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/robots')}
              className="p-2 hover:bg-gray-800 rounded-full"
              title="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold">Admin Panel</h1>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowAddTokensDirectModal(true)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md flex items-center space-x-2"
            >
              <Zap className="w-4 h-4" />
              <span>Add Tokens</span>
            </button>
            
            <button
              onClick={() => {}}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-md flex items-center space-x-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add User</span>
            </button>
            
            <button
              onClick={() => {}}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-md flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Export Data</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-medium">Users</h3>
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <div className="flex items-center space-x-4">
              <div>
                <p className="text-2xl font-bold">{users.length}</p>
                <p className="text-sm text-gray-400">Total Users</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{users.filter(u => u.status === 'active').length}</p>
                <p className="text-sm text-gray-400">Active Users</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-medium">Subscriptions</h3>
              <Crown className="w-5 h-5 text-yellow-500" />
            </div>
            <div className="flex items-center space-x-4">
              <div>
                <p className="text-2xl font-bold">{users.filter(u => u.plan !== 'Free').length}</p>
                <p className="text-sm text-gray-400">Paid Plans</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{users.filter(u => u.plan === 'Free').length}</p>
                <p className="text-sm text-gray-400">Free Plans</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-medium">Token Usage</h3>
              <Zap className="w-5 h-5 text-yellow-500" />
            </div>
            <div className="flex items-center space-x-4">
              <div>
                <p className="text-2xl font-bold">{users.reduce((sum, user) => sum + (user.token_balance || 0), 0).toLocaleString()}</p>
                <p className="text-sm text-gray-400">Total Tokens</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{users.length > 0 ? (users.reduce((sum, user) => sum + (user.token_balance || 0), 0) / users.length).toFixed(0) : 0}</p>
                <p className="text-sm text-gray-400">Avg per User</p>
              </div>
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 p-4 bg-green-500 bg-opacity-10 border border-green-500 rounded-md flex items-center">
            <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
            <p className="text-green-500">{success}</p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-500 bg-opacity-10 border border-red-500 rounded-md flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" />
            <p className="text-red-500">{error}</p>
          </div>
        )}

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex-1 w-full md:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4 w-full md:w-auto">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as 'all' | 'active' | 'suspended')}
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Users</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>

            <button
              onClick={loadUsers}
              className="p-2 hover:bg-gray-800 rounded-md border border-gray-700"
              title="Refresh"
            >
              <RefreshCw className={`w-5 h-5 text-gray-400 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-gray-900">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Plan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Tokens</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Last Login</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-gray-400">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-500 bg-opacity-20 text-blue-400">
                          {user.plan}
                        </span>
                        <button
                          onClick={() => openChangePlanModal(user)}
                          className="ml-2 p-1 hover:bg-gray-700 rounded-full"
                          title="Change plan"
                        >
                          <Edit className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        user.status === 'active'
                          ? 'bg-green-500 bg-opacity-20 text-green-400'
                          : 'bg-red-500 bg-opacity-20 text-red-400'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {user.token_balance.toLocaleString()}
                        <button 
                          onClick={() => openTokenModal(user)}
                          className="ml-2 p-1 hover:bg-gray-700 rounded-full"
                          title="Add tokens"
                        >
                          <PlusCircle className="w-4 h-4 text-green-400" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-400">
                      {user.phone || 'Not provided'}
                    </td>
                    <td className="px-6 py-4 text-gray-400">
                      {formatDate(user.last_sign_in_at)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          className="p-1.5 hover:bg-gray-700 rounded"
                          title="Edit user"
                        >
                          <Edit className="w-4 h-4 text-gray-400" />
                        </button>
                        {user.status === 'active' ? (
                          <button 
                            onClick={() => handleChangePlanStatus(user.id, 'suspended')}
                            className="p-1.5 hover:bg-gray-700 rounded"
                            title="Suspend user"
                          >
                            <MinusCircle className="w-4 h-4 text-red-400" />
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleChangePlanStatus(user.id, 'active')}
                            className="p-1.5 hover:bg-gray-700 rounded"
                            title="Activate user"
                          >
                            <Check className="w-4 h-4 text-green-400" />
                          </button>
                        )}
                        <button 
                          onClick={() => openDeleteUserModal(user)}
                          className="p-1.5 hover:bg-gray-700 rounded"
                          title="Delete user"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Tokens Modal */}
      {showTokenModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg max-w-md w-full p-6 relative">
            <button 
              onClick={() => {
                setShowTokenModal(false);
                setSelectedUser(null);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="text-center mb-6">
              <div className="flex items-center justify-center mb-4">
                <Zap className="w-12 h-12 text-yellow-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-100">
                Add Tokens
              </h2>
              <p className="mt-2 text-gray-400">
                Add tokens to {selectedUser.name}'s account
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Current Balance
                </label>
                <div className="px-3 py-2 bg-gray-700 rounded-md text-white">
                  {selectedUser.token_balance.toLocaleString()} tokens
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Token Amount
                </label>
                <input
                  type="number"
                  value={tokenAmount}
                  onChange={(e) => setTokenAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => {
                    setShowTokenModal(false);
                    setSelectedUser(null);
                  }}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-white"
                  disabled={isAddingTokens}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddTokens}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white flex items-center"
                  disabled={isAddingTokens}
                >
                  {isAddingTokens ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Add Tokens'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Tokens Direct Modal */}
      {showAddTokensDirectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg max-w-md w-full p-6 relative">
            <button 
              onClick={() => setShowAddTokensDirectModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
              disabled={isAddingTokens}
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="text-center mb-6">
              <div className="flex items-center justify-center mb-4">
                <Zap className="w-12 h-12 text-yellow-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-100">
                Add Tokens by Email
              </h2>
              <p className="mt-2 text-gray-400">
                Add tokens to a user's account by email
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  User Email
                </label>
                <input
                  type="email"
                  value={directEmail}
                  onChange={(e) => setDirectEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Token Amount
                </label>
                <input
                  type="number"
                  value={directAmount}
                  onChange={(e) => setDirectAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowAddTokensDirectModal(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-white"
                  disabled={isAddingTokens}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddTokensDirect}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white flex items-center"
                  disabled={isAddingTokens || !directEmail || !directAmount}
                >
                  {isAddingTokens ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Add Tokens'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {showDeleteUserModal && userToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg max-w-md w-full p-6 relative">
            <button 
              onClick={() => {
                setShowDeleteUserModal(false);
                setUserToDelete(null);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
              disabled={isDeleting}
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="text-center mb-6">
              <div className="flex items-center justify-center mb-4">
                <Trash2 className="w-12 h-12 text-red-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-100">
                Delete User
              </h2>
              <p className="mt-2 text-gray-400">
                Are you sure you want to delete {userToDelete.email}?
              </p>
            </div>

            <div className="bg-red-900 bg-opacity-20 border border-red-800 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" />
                <p className="text-red-400 text-sm">
                  This action cannot be undone. All user data, including robots, versions, and settings will be permanently deleted.
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={() => {
                  setShowDeleteUserModal(false);
                  setUserToDelete(null);
                }}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-white"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md text-white flex items-center"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete User
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Plan Modal */}
      {showChangePlanModal && userToChangePlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg max-w-md w-full p-6 relative">
            <button 
              onClick={() => {
                setShowChangePlanModal(false);
                setUserToChangePlan(null);
                setSelectedPlan('');
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
              disabled={isChangingPlan}
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="text-center mb-6">
              <div className="flex items-center justify-center mb-4">
                <CreditCard className="w-12 h-12 text-blue-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-100">
                Change Plan
              </h2>
              <p className="mt-2 text-gray-400">
                Update subscription plan for {userToChangePlan.email}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Current Plan
                </label>
                <div className="px-3 py-2 bg-gray-700 rounded-md text-white">
                  {userToChangePlan.plan}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  New Plan
                </label>
                <select
                  value={selectedPlan}
                  onChange={(e) => setSelectedPlan(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {plans.map(plan => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} - {plan.tokenAllocation.toLocaleString()} tokens, {plan.robotLimit} robots
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => {
                    setShowChangePlanModal(false);
                    setUserToChangePlan(null);
                    setSelectedPlan('');
                  }}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-white"
                  disabled={isChangingPlan}
                >
                  Cancel
                </button>
                <button
                  onClick={handleChangePlan}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white flex items-center"
                  disabled={isChangingPlan || !selectedPlan}
                >
                  {isChangingPlan ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Change Plan'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}