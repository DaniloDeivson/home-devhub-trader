import React, { useState, useEffect } from 'react';
import { User, Mail, Camera, X, ArrowLeft, Bell, Crown, Zap, Phone } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { InvitesList } from '../components/InvitesList';
import { TokenDisplay } from '../components/TokenDisplay';

export function ProfilePage() {
  const navigate = useNavigate();
  const { profile, updateProfile } = useAuthStore();
  const [name, setName] = useState(profile?.name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setPhone(profile.phone || '');
      setAvatarUrl(profile.avatar_url || '');
    }
  }, [profile]);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setIsUploading(true);
      setError(null);

      const file = event.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Please upload an image file');
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Image size should be less than 5MB');
      }

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile
      await updateProfile({
        avatar_url: publicUrl
      });

      setAvatarUrl(publicUrl);
      setSuccess('Profile photo updated successfully');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      setError(error instanceof Error ? error.message : 'Error uploading image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      await updateProfile({
        name: name.trim(),
        phone: phone.trim() || null
      });
      setSuccess('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error instanceof Error ? error.message : 'Error updating profile');
    }
  };

  const handleRemovePhoto = async () => {
    try {
      setError(null);
      
      // Update profile with no avatar
      await updateProfile({
        avatar_url: null
      });

      setAvatarUrl('');
      setSuccess('Profile photo removed successfully');
    } catch (error) {
      console.error('Error removing avatar:', error);
      setError(error instanceof Error ? error.message : 'Error removing photo');
    }
  };

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-[#1E1E1E] text-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gray-900 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate(-1)}
                className="mr-4 p-2 hover:bg-gray-800 rounded-full transition-colors"
                title="Back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-semibold flex items-center">
                <User className="w-5 h-5 mr-2" />
                Profile Settings
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/subscription')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md flex items-center space-x-2"
              >
                <Crown className="w-4 h-4" />
                <span>Subscription</span>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {error && (
              <div className="mb-4 p-3 bg-red-500 bg-opacity-10 border border-red-500 rounded-md text-red-500">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-500 bg-opacity-10 border border-green-500 rounded-md text-green-500">
                {success}
              </div>
            )}

            {/* Subscription Status */}
            <div className="mb-8 bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Crown className="w-5 h-5 text-yellow-500" />
                  <h2 className="text-lg font-medium">{profile.plan || 'Free Forever'}</h2>
                </div>
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-500 bg-opacity-20 text-green-400">
                  {profile.plan_status || 'Active'}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Next Billing</p>
                  <p className="font-medium">{profile.plan_renewal_date ? new Date(profile.plan_renewal_date).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Token Balance</p>
                  <div className="flex items-center">
                    <Zap className="w-4 h-4 text-yellow-500 mr-1" />
                    <p className="font-medium">{profile.token_balance?.toLocaleString() || 0} tokens</p>
                  </div>
                </div>
                <div>
                  <button
                    onClick={() => navigate('/subscription')}
                    className="text-blue-400 hover:text-blue-300 text-sm"
                  >
                    View Details →
                  </button>
                </div>
              </div>
            </div>

            {/* Invites Section */}
            <div className="mb-8">
              <div className="flex items-center mb-4">
                <Bell className="w-5 h-5 text-blue-400 mr-2" />
                <h2 className="text-lg font-medium">Pending Invites</h2>
              </div>
              <InvitesList />
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-start space-x-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                    {avatarUrl ? (
                      <img 
                        src={avatarUrl} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-12 h-12 text-gray-400" />
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-2 cursor-pointer hover:bg-blue-700">
                    <Camera className="w-4 h-4" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                      disabled={isUploading}
                    />
                  </label>
                </div>

                <div className="flex-1">
                  <h3 className="text-lg font-medium">Profile Photo</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Upload a photo to make your profile more personal
                  </p>
                  <div className="mt-3 flex space-x-3">
                    <label className="px-4 py-2 bg-blue-600 text-white rounded-md cursor-pointer hover:bg-blue-700">
                      Upload New
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarUpload}
                        disabled={isUploading}
                      />
                    </label>
                    {avatarUrl && (
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Email Display */}
              <div>
                <label className="block text-sm font-medium text-gray-300">
                  Email Address
                </label>
                <div className="mt-1 flex items-center space-x-2 px-3 py-2 bg-gray-900 rounded-md">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-300">{profile.email}</span>
                </div>
              </div>

              {/* Phone Input */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-300">
                  Phone Number
                </label>
                <div className="mt-1 relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+55 (11) 98765-4321"
                  />
                </div>
              </div>

              {/* Name Input */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300">
                  Display Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your name"
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}