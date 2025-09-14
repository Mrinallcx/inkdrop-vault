import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface BlockchainAPIParams {
  chain: 'ethereum' | 'polygon';
  method: 'getBalance' | 'getTransaction' | 'getGasPrice' | 'getBlockNumber';
  address?: string;
  txHash?: string;
}

interface BlockchainAPIResponse {
  success: boolean;
  chain: string;
  method: string;
  data?: any;
  error?: string;
  timestamp: string;
}

export const useBlockchainAPI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callBlockchainAPI = useCallback(async (params: BlockchainAPIParams): Promise<any> => {
    setLoading(true);
    setError(null);

    try {
      // Call the Supabase Edge Function that uses the secure API keys
      const { data, error: functionError } = await supabase.functions.invoke('blockchain-api', {
        body: params
      });

      if (functionError) {
        throw new Error(functionError.message);
      }

      const response = data as BlockchainAPIResponse;
      
      if (!response.success) {
        throw new Error(response.error || 'API call failed');
      }

      return response.data;

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to call blockchain API';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Convenience methods for common blockchain operations
  const getBalance = useCallback((chain: 'ethereum' | 'polygon', address: string) => {
    return callBlockchainAPI({ chain, method: 'getBalance', address });
  }, [callBlockchainAPI]);

  const getTransaction = useCallback((chain: 'ethereum' | 'polygon', txHash: string) => {
    return callBlockchainAPI({ chain, method: 'getTransaction', txHash });
  }, [callBlockchainAPI]);

  const getGasPrice = useCallback((chain: 'ethereum' | 'polygon') => {
    return callBlockchainAPI({ chain, method: 'getGasPrice' });
  }, [callBlockchainAPI]);

  const getBlockNumber = useCallback((chain: 'ethereum' | 'polygon') => {
    return callBlockchainAPI({ chain, method: 'getBlockNumber' });
  }, [callBlockchainAPI]);

  return {
    // State
    loading,
    error,
    
    // Generic method
    callBlockchainAPI,
    
    // Convenience methods
    getBalance,
    getTransaction,
    getGasPrice,
    getBlockNumber,
  };
};