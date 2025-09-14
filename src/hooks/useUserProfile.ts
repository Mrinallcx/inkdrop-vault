import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWallet } from '@/contexts/WalletContext';
import { toast } from '@/hooks/use-toast';

export interface UserProfile {
  id: string;
  wallet_address: string;
  wallet_type: string;
  network?: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  email?: string;
  twitter_handle?: string;
  website_url?: string;
  total_nfts_created: number;
  total_nfts_owned: number;
  total_collections: number;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export const useUserProfile = () => {
  const { wallet } = useWallet();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set wallet address in the database session for RLS policies
  const setSessionWalletAddress = async (walletAddress: string) => {
    try {
      // For now, we'll handle RLS through direct wallet address matching in policies
      // Future improvement: implement proper session management
      console.log('Setting wallet context for:', walletAddress);
    } catch (error) {
      console.error('Failed to set session wallet address:', error);
    }
  };

  // Create or update user profile
  const upsertUserProfile = async () => {
    if (!wallet) return null;

    setLoading(true);
    setError(null);

    try {
      // Set session context for RLS
      await setSessionWalletAddress(wallet.address);

      // Call the upsert function
      const { data, error } = await supabase.rpc('upsert_user_profile', {
        p_wallet_address: wallet.address,
        p_wallet_type: wallet.type,
        p_network: wallet.network
      });

      if (error) throw error;

      // Fetch the complete profile
      const { data: profileData, error: fetchError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('wallet_address', wallet.address)
        .single();

      if (fetchError) throw fetchError;

      setProfile(profileData);
      return profileData;
    } catch (error: any) {
      console.error('Error upserting user profile:', error);
      setError(error.message);
      toast({
        title: "Profile Error",
        description: "Failed to create or update user profile",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Update user profile
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!wallet || !profile) return null;

    setLoading(true);
    setError(null);

    try {
      await setSessionWalletAddress(wallet.address);

      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('wallet_address', wallet.address)
        .select()
        .single();

      if (error) throw error;

      setProfile(data);
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully",
      });
      return data;
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setError(error.message);
      toast({
        title: "Update Failed",
        description: "Failed to update your profile",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Fetch user profile
  const fetchProfile = async () => {
    if (!wallet) return null;

    setLoading(true);
    setError(null);

    try {
      await setSessionWalletAddress(wallet.address);

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('wallet_address', wallet.address)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Profile doesn't exist, create it
          return await upsertUserProfile();
        }
        throw error;
      }

      setProfile(data);
      return data;
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      setError(error.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch or create profile when wallet connects
  useEffect(() => {
    if (wallet) {
      fetchProfile();
    } else {
      setProfile(null);
      setError(null);
    }
  }, [wallet]);

  return {
    profile,
    loading,
    error,
    upsertUserProfile,
    updateProfile,
    fetchProfile,
  };
};