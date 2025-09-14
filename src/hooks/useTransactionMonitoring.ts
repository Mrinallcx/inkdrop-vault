import { useState, useEffect, useCallback, useRef } from 'react';
import { ethers } from 'ethers';
import { web3ConnectionManager } from '@/utils/web3Utils';
import { TransactionResult } from '@/utils/contractUtils';
import { useToast } from '@/hooks/use-toast';

export interface TransactionStatus {
  hash: string;
  status: 'pending' | 'confirmed' | 'failed' | 'dropped';
  confirmations: number;
  blockNumber?: number;
  gasUsed?: string;
  effectiveGasPrice?: string;
  error?: string;
  timestamp: Date;
  chainId: string;
}

export interface TransactionMonitorOptions {
  requiredConfirmations?: number;
  timeoutMs?: number;
  pollIntervalMs?: number;
}

export const useTransactionMonitoring = () => {
  const [monitoredTransactions, setMonitoredTransactions] = useState<Map<string, TransactionStatus>>(new Map());
  const [isMonitoring, setIsMonitoring] = useState(false);
  const { toast } = useToast();
  
  const intervalRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Start monitoring a transaction
  const startMonitoring = useCallback(
    async (
      transaction: TransactionResult,
      options: TransactionMonitorOptions = {}
    ): Promise<void> => {
      const {
        requiredConfirmations = 1,
        timeoutMs = 300000, // 5 minutes default
        pollIntervalMs = 3000, // 3 seconds default
      } = options;

      const { hash, chainId } = transaction;

      // Initialize transaction status
      const initialStatus: TransactionStatus = {
        hash,
        status: 'pending',
        confirmations: 0,
        timestamp: new Date(),
        chainId,
      };

      setMonitoredTransactions(prev => new Map(prev.set(hash, initialStatus)));
      setIsMonitoring(true);

      // Get provider for this chain
      const provider = await web3ConnectionManager.getProvider(chainId);
      if (!provider || provider.type !== 'ethereum') {
        console.error('Provider not available for chain:', chainId);
        return;
      }

      // Set up polling interval
      const pollTransaction = async () => {
        try {
          const receipt = await provider.provider.getTransactionReceipt(hash);
          const currentBlock = await provider.provider.getBlockNumber();

          if (receipt) {
            const confirmations = currentBlock - receipt.blockNumber;
            const isConfirmed = confirmations >= requiredConfirmations;
            const status: 'confirmed' | 'failed' = receipt.status === 1 ? 'confirmed' : 'failed';

            const updatedStatus: TransactionStatus = {
              ...initialStatus,
              status: isConfirmed ? status : 'pending',
              confirmations,
              blockNumber: receipt.blockNumber,
              gasUsed: receipt.gasUsed?.toString(),
              effectiveGasPrice: receipt.gasPrice?.toString(),
            };

            setMonitoredTransactions(prev => new Map(prev.set(hash, updatedStatus)));

            if (isConfirmed || status === 'failed') {
              // Stop monitoring this transaction
              stopMonitoring(hash);

              // Show notification
              toast({
                title: status === 'confirmed' ? 'Transaction Confirmed' : 'Transaction Failed',
                description: `Transaction ${hash.slice(0, 10)}... ${
                  status === 'confirmed' ? 'completed successfully' : 'failed'
                }`,
                variant: status === 'confirmed' ? 'default' : 'destructive',
              });
            }
          }
        } catch (error) {
          console.error('Error polling transaction:', error);
        }
      };

      // Start polling
      const intervalId = setInterval(pollTransaction, pollIntervalMs);
      intervalRefs.current.set(hash, intervalId);

      // Set timeout to stop monitoring
      const timeoutId = setTimeout(() => {
        stopMonitoring(hash);
        
        setMonitoredTransactions(prev => {
          const updated = new Map(prev);
          const current = updated.get(hash);
          if (current && current.status === 'pending') {
            updated.set(hash, { ...current, status: 'dropped', error: 'Transaction timeout' });
          }
          return updated;
        });

        toast({
          title: 'Transaction Timeout',
          description: `Transaction ${hash.slice(0, 10)}... timed out`,
          variant: 'destructive',
        });
      }, timeoutMs);
      timeoutRefs.current.set(hash, timeoutId);

      // Initial poll
      await pollTransaction();
    },
    [toast]
  );

  // Stop monitoring a specific transaction
  const stopMonitoring = useCallback((hash: string) => {
    const intervalId = intervalRefs.current.get(hash);
    if (intervalId) {
      clearInterval(intervalId);
      intervalRefs.current.delete(hash);
    }

    const timeoutId = timeoutRefs.current.get(hash);
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutRefs.current.delete(hash);
    }

    // Check if we're still monitoring any transactions
    if (intervalRefs.current.size === 0) {
      setIsMonitoring(false);
    }
  }, []);

  // Stop monitoring all transactions
  const stopAllMonitoring = useCallback(() => {
    intervalRefs.current.forEach(intervalId => clearInterval(intervalId));
    timeoutRefs.current.forEach(timeoutId => clearTimeout(timeoutId));
    
    intervalRefs.current.clear();
    timeoutRefs.current.clear();
    
    setIsMonitoring(false);
  }, []);

  // Get transaction status
  const getTransactionStatus = useCallback((hash: string): TransactionStatus | undefined => {
    return monitoredTransactions.get(hash);
  }, [monitoredTransactions]);

  // Get all monitored transactions
  const getAllTransactions = useCallback((): TransactionStatus[] => {
    return Array.from(monitoredTransactions.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [monitoredTransactions]);

  // Get transactions by status
  const getTransactionsByStatus = useCallback((status: TransactionStatus['status']): TransactionStatus[] => {
    return getAllTransactions().filter(tx => tx.status === status);
  }, [getAllTransactions]);

  // Remove transaction from monitoring
  const removeTransaction = useCallback((hash: string) => {
    stopMonitoring(hash);
    setMonitoredTransactions(prev => {
      const updated = new Map(prev);
      updated.delete(hash);
      return updated;
    });
  }, [stopMonitoring]);

  // Clear all transactions
  const clearAllTransactions = useCallback(() => {
    stopAllMonitoring();
    setMonitoredTransactions(new Map());
  }, [stopAllMonitoring]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAllMonitoring();
    };
  }, [stopAllMonitoring]);

  // Re-check pending transactions when provider changes
  const recheckPendingTransactions = useCallback(async () => {
    const pendingTxs = getTransactionsByStatus('pending');
    
    for (const tx of pendingTxs) {
      try {
        const provider = await web3ConnectionManager.getProvider(tx.chainId);
        if (provider && provider.type === 'ethereum') {
          const receipt = await provider.provider.getTransactionReceipt(tx.hash);
          if (receipt) {
            const currentBlock = await provider.provider.getBlockNumber();
            const confirmations = currentBlock - receipt.blockNumber;
            const status: 'confirmed' | 'failed' = receipt.status === 1 ? 'confirmed' : 'failed';

            setMonitoredTransactions(prev => new Map(prev.set(tx.hash, {
              ...tx,
              status,
              confirmations,
              blockNumber: receipt.blockNumber,
              gasUsed: receipt.gasUsed?.toString(),
              effectiveGasPrice: receipt.gasPrice?.toString(),
            })));
          }
        }
      } catch (error) {
        console.error('Error rechecking transaction:', error);
      }
    }
  }, [getTransactionsByStatus]);

  return {
    // State
    monitoredTransactions: getAllTransactions(),
    isMonitoring,
    
    // Actions
    startMonitoring,
    stopMonitoring,
    stopAllMonitoring,
    removeTransaction,
    clearAllTransactions,
    recheckPendingTransactions,
    
    // Getters
    getTransactionStatus,
    getAllTransactions,
    getTransactionsByStatus,
    
    // Counts
    pendingCount: getTransactionsByStatus('pending').length,
    confirmedCount: getTransactionsByStatus('confirmed').length,
    failedCount: getTransactionsByStatus('failed').length,
  };
};