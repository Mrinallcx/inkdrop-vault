import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfileContext } from '@/components/UserProfileProvider';
import { toast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type NFTRow = Database['public']['Tables']['nft_tokens']['Row'];
type NFTInsert = Database['public']['Tables']['nft_tokens']['Insert'];
type NFTUpdate = Database['public']['Tables']['nft_tokens']['Update'];

export interface NFTSearchFilters {
  search?: string;
  blockchain?: string;
  collection_id?: string;
  creator_id?: string;
  owner_id?: string;
  is_minted?: boolean;
  is_listed?: boolean;
  min_price?: number;
  max_price?: number;
}

export const useNFTManagement = () => {
  const { profile } = useUserProfileContext();
  const [nfts, setNFTs] = useState<NFTRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create NFT
  const createNFT = async (nftData: Omit<NFTInsert, 'creator_id' | 'owner_id'>) => {
    if (!profile) {
      throw new Error('User profile required');
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('nft_tokens')
        .insert({
          ...nftData,
          creator_id: profile.id,
          owner_id: profile.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "NFT Created",
        description: "Your NFT has been created successfully",
      });

      return data;
    } catch (error: any) {
      setError(error.message);
      toast({
        title: "Creation Failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Update NFT
  const updateNFT = async (id: string, updates: NFTUpdate) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('nft_tokens')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "NFT Updated",
        description: "Your NFT has been updated successfully",
      });

      return data;
    } catch (error: any) {
      setError(error.message);
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Get NFT by ID
  const getNFTById = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('nft_tokens')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Search and filter NFTs
  const searchNFTs = async (filters: NFTSearchFilters = {}, page = 0, limit = 20) => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('nft_tokens')
        .select('*')
        .range(page * limit, (page + 1) * limit - 1)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      if (filters.blockchain) {
        query = query.eq('blockchain', filters.blockchain);
      }

      if (filters.collection_id) {
        query = query.eq('collection_id', filters.collection_id);
      }

      if (filters.creator_id) {
        query = query.eq('creator_id', filters.creator_id);
      }

      if (filters.owner_id) {
        query = query.eq('owner_id', filters.owner_id);
      }

      if (filters.is_minted !== undefined) {
        query = query.eq('is_minted', filters.is_minted);
      }

      if (filters.is_listed !== undefined) {
        query = query.eq('is_listed', filters.is_listed);
      }

      if (filters.min_price !== undefined) {
        query = query.gte('current_price', filters.min_price);
      }

      if (filters.max_price !== undefined) {
        query = query.lte('current_price', filters.max_price);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      setNFTs(data || []);
      return data || [];
    } catch (error: any) {
      setError(error.message);
      toast({
        title: "Search Failed",
        description: error.message,
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Get user's NFTs (owned)
  const getUserNFTs = async (userId?: string) => {
    const targetUserId = userId || profile?.id;
    if (!targetUserId) return [];

    return searchNFTs({ owner_id: targetUserId });
  };

  // Get user's created NFTs
  const getUserCreatedNFTs = async (userId?: string) => {
    const targetUserId = userId || profile?.id;
    if (!targetUserId) return [];

    return searchNFTs({ creator_id: targetUserId });
  };

  // Transfer ownership
  const transferOwnership = async (nftId: string, newOwnerId: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('nft_tokens')
        .update({ owner_id: newOwnerId })
        .eq('id', nftId)
        .select()
        .single();

      if (error) throw error;

      // Log the transfer activity
      await supabase
        .from('user_activity')
        .insert({
          user_id: profile?.id || '',
          activity_type: 'nft_transfer',
          entity_type: 'nft_token',
          entity_id: nftId,
          metadata: {
            new_owner: newOwnerId,
            timestamp: new Date().toISOString(),
          },
        });

      toast({
        title: "Ownership Transferred",
        description: "NFT ownership has been transferred successfully",
      });

      return data;
    } catch (error: any) {
      setError(error.message);
      toast({
        title: "Transfer Failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Update NFT from blockchain data
  const syncFromBlockchain = async (nftId: string, blockchainData: any) => {
    setLoading(true);
    setError(null);

    try {
      const updates: NFTUpdate = {
        contract_address: blockchainData.contract_address,
        token_id: blockchainData.token_id,
        is_minted: true,
        current_price: blockchainData.price,
        owner_id: blockchainData.owner_id,
      };

      const { data, error } = await supabase
        .from('nft_tokens')
        .update(updates)
        .eq('id', nftId)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Blockchain Sync Complete",
        description: "NFT data synchronized with blockchain",
      });

      return data;
    } catch (error: any) {
      setError(error.message);
      toast({
        title: "Sync Failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Increment view count
  const incrementViewCount = async (nftId: string) => {
    try {
      const { data: currentNFT } = await supabase
        .from('nft_tokens')
        .select('view_count')
        .eq('id', nftId)
        .single();

      if (currentNFT) {
        await supabase
          .from('nft_tokens')
          .update({ view_count: (currentNFT.view_count || 0) + 1 })
          .eq('id', nftId);
      }
    } catch (error) {
      console.error('Failed to increment view count:', error);
    }
  };

  // Toggle like
  const toggleLike = async (nftId: string) => {
    if (!profile) return false;

    try {
      // Check if already liked
      const { data: existingLike } = await supabase
        .from('user_activity')
        .select('id')
        .eq('user_id', profile.id)
        .eq('entity_type', 'nft_token')
        .eq('entity_id', nftId)
        .eq('activity_type', 'like')
        .single();

      const { data: currentNFT } = await supabase
        .from('nft_tokens')
        .select('like_count')
        .eq('id', nftId)
        .single();

      if (existingLike) {
        // Unlike
        await supabase
          .from('user_activity')
          .delete()
          .eq('id', existingLike.id);

        if (currentNFT) {
          await supabase
            .from('nft_tokens')
            .update({ like_count: Math.max(0, (currentNFT.like_count || 0) - 1) })
            .eq('id', nftId);
        }
        return false;
      } else {
        // Like
        await supabase
          .from('user_activity')
          .insert({
            user_id: profile.id,
            activity_type: 'like',
            entity_type: 'nft_token',
            entity_id: nftId,
            metadata: { timestamp: new Date().toISOString() },
          });

        if (currentNFT) {
          await supabase
            .from('nft_tokens')
            .update({ like_count: (currentNFT.like_count || 0) + 1 })
            .eq('id', nftId);
        }
        return true;
      }
    } catch (error: any) {
      toast({
        title: "Like Failed",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    nfts,
    loading,
    error,
    createNFT,
    updateNFT,
    getNFTById,
    searchNFTs,
    getUserNFTs,
    getUserCreatedNFTs,
    transferOwnership,
    syncFromBlockchain,
    incrementViewCount,
    toggleLike,
  };
};