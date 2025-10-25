import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface UserProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
}

export const useUserProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Get fresh user data from Supabase auth
      const { data: { user: freshUser }, error: userError } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!freshUser) throw new Error('User not found');

      // Build profile from auth.users data
      const userProfile: UserProfile = {
        id: freshUser.id,
        email: freshUser.email || null,
        full_name: freshUser.user_metadata?.full_name || null,
        avatar_url: freshUser.user_metadata?.avatar_url || null,
        created_at: freshUser.created_at,
        updated_at: freshUser.updated_at || freshUser.created_at
      };

      setProfile(userProfile);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const updateProfile = async (updates: { full_name?: string; avatar_url?: string }) => {
    if (!user) throw new Error('No user logged in');

    try {
      // Update user metadata via Supabase auth
      const { data, error: updateError } = await supabase.auth.updateUser({
        data: updates
      });

      if (updateError) throw updateError;

      // Refresh profile from updated user data
      if (data.user) {
        const updatedProfile: UserProfile = {
          id: data.user.id,
          email: data.user.email || null,
          full_name: data.user.user_metadata?.full_name || null,
          avatar_url: data.user.user_metadata?.avatar_url || null,
          created_at: data.user.created_at,
          updated_at: data.user.updated_at || data.user.created_at
        };
        setProfile(updatedProfile);
        return { success: true, data: updatedProfile };
      }

      return { success: true };
    } catch (err: any) {
      console.error('Error updating profile:', err);
      return { success: false, error: err.message };
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!user) throw new Error('No user logged in');

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`;

      if (profile?.avatar_url) {
        const oldPath = profile.avatar_url.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('avatars')
            .remove([`${user.id}/${oldPath}`]);
        }
      }

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const updateResult = await updateProfile({ avatar_url: publicUrl });
      return updateResult;
    } catch (err: any) {
      console.error('Error uploading avatar:', err);
      return { success: false, error: err.message };
    }
  };

  const deleteAvatar = async () => {
    if (!user || !profile?.avatar_url) return { success: false, error: 'No avatar to delete' };

    try {
      const oldPath = profile.avatar_url.split('/').pop();
      if (oldPath) {
        await supabase.storage
          .from('avatars')
          .remove([`${user.id}/${oldPath}`]);
      }

      const updateResult = await updateProfile({ avatar_url: null });
      return updateResult;
    } catch (err: any) {
      console.error('Error deleting avatar:', err);
      return { success: false, error: err.message };
    }
  };

  return {
    profile,
    loading,
    error,
    updateProfile,
    uploadAvatar,
    deleteAvatar,
    refetch: fetchProfile
  };
};
