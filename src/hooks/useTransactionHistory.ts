import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TransactionResult } from '@/utils/contractUtils';
import { TransactionStatus } from './useTransactionMonitoring';
import { useMultiChainWallet } from '@/contexts/MultiChainWalletContext';

export interface TransactionHistoryEntry {
  id: string;
  hash: string;
  chain_id: string;
  from_address: string;
  to_address: string;
  value: string;
  gas_limit: string;
  gas_price?: string;
  gas_used?: string;
  status: 'pending' | 'confirmed' | 'failed' | 'dropped';
  block_number?: number;
  confirmations?: number;
  transaction_type: 'transfer' | 'contract' | 'mint' | 'approve' | 'other';
  contract_address?: string;
  method_name?: string;
  method_params?: any;
  error_message?: string;
  created_at: string;
  updated_at: string;
  user_address: string;
}

export interface TransactionFilter {
  chainId?: string;
  status?: TransactionHistoryEntry['status'];
  type?: TransactionHistoryEntry['transaction_type'];
  dateFrom?: Date;
  dateTo?: Date;
  address?: string;
}

export const useTransactionHistory = () => {
  const [transactions, setTransactions] = useState<TransactionHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { activeConnection } = useMultiChainWallet();

  // Load transaction history
  const loadTransactions = useCallback(async (filter?: TransactionFilter) => {
    if (!activeConnection) return;

    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('transaction_history')
        .select('*')
        .eq('user_address', activeConnection.address)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filter?.chainId) {
        query = query.eq('chain_id', filter.chainId);
      }
      if (filter?.status) {
        query = query.eq('status', filter.status);
      }
      if (filter?.type) {
        query = query.eq('transaction_type', filter.type);
      }
      if (filter?.dateFrom) {
        query = query.gte('created_at', filter.dateFrom.toISOString());
      }
      if (filter?.dateTo) {
        query = query.lte('created_at', filter.dateTo.toISOString());
      }
      if (filter?.address) {
        query = query.or(
          `from_address.eq.${filter.address},to_address.eq.${filter.address},contract_address.eq.${filter.address}`
        );
      }

      const { data, error: queryError } = await query.limit(100);

      if (queryError) throw queryError;

      setTransactions(data || []);
    } catch (err: any) {
      console.error('Failed to load transaction history:', err);
      setError(err.message || 'Failed to load transaction history');
    } finally {
      setLoading(false);
    }
  }, [activeConnection]);

  // Save transaction to history
  const saveTransaction = useCallback(
    async (
      transaction: TransactionResult,
      type: TransactionHistoryEntry['transaction_type'] = 'other',
      contractAddress?: string,
      methodName?: string,
      methodParams?: any
    ): Promise<string | null> => {
      if (!activeConnection) return null;

      try {
        const entry: Partial<TransactionHistoryEntry> = {
          hash: transaction.hash,
          chain_id: transaction.chainId,
          from_address: transaction.from,
          to_address: transaction.to,
          value: transaction.value,
          gas_limit: transaction.gasLimit,
          gas_price: transaction.gasPrice,
          status: transaction.status,
          transaction_type: type,
          contract_address: contractAddress,
          method_name: methodName,
          method_params: methodParams,
          user_address: activeConnection.address,
        };

        const { data, error } = await supabase
          .from('transaction_history')
          .insert([entry])
          .select()
          .single();

        if (error) throw error;

        // Update local state
        setTransactions(prev => [data, ...prev]);

        return data.id;
      } catch (err: any) {
        console.error('Failed to save transaction:', err);
        return null;
      }
    },
    [activeConnection]
  );

  // Update transaction status
  const updateTransactionStatus = useCallback(
    async (hash: string, status: TransactionStatus): Promise<void> => {
      try {
        const updateData: Partial<TransactionHistoryEntry> = {
          status: status.status,
          block_number: status.blockNumber,
          confirmations: status.confirmations,
          gas_used: status.gasUsed,
          error_message: status.error,
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase
          .from('transaction_history')
          .update(updateData)
          .eq('hash', hash);

        if (error) throw error;

        // Update local state
        setTransactions(prev =>
          prev.map(tx =>
            tx.hash === hash
              ? { ...tx, ...updateData }
              : tx
          )
        );
      } catch (err: any) {
        console.error('Failed to update transaction status:', err);
      }
    },
    []
  );

  // Delete transaction from history
  const deleteTransaction = useCallback(async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('transaction_history')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTransactions(prev => prev.filter(tx => tx.id !== id));
    } catch (err: any) {
      console.error('Failed to delete transaction:', err);
      throw err;
    }
  }, []);

  // Clear all transaction history for current user
  const clearHistory = useCallback(async (): Promise<void> => {
    if (!activeConnection) return;

    try {
      const { error } = await supabase
        .from('transaction_history')
        .delete()
        .eq('user_address', activeConnection.address);

      if (error) throw error;

      setTransactions([]);
    } catch (err: any) {
      console.error('Failed to clear transaction history:', err);
      throw err;
    }
  }, [activeConnection]);

  // Get transaction statistics
  const getStatistics = useCallback(() => {
    const stats = {
      total: transactions.length,
      pending: 0,
      confirmed: 0,
      failed: 0,
      dropped: 0,
      totalGasUsed: BigInt(0),
      totalValue: BigInt(0),
      byType: {} as Record<string, number>,
      byChain: {} as Record<string, number>,
    };

    transactions.forEach(tx => {
      // Count by status
      stats[tx.status]++;

      // Count by type
      stats.byType[tx.transaction_type] = (stats.byType[tx.transaction_type] || 0) + 1;

      // Count by chain
      stats.byChain[tx.chain_id] = (stats.byChain[tx.chain_id] || 0) + 1;

      // Sum gas used and value
      if (tx.gas_used) {
        stats.totalGasUsed += BigInt(tx.gas_used);
      }
      if (tx.value) {
        stats.totalValue += BigInt(tx.value);
      }
    });

    return stats;
  }, [transactions]);

  // Get transactions by status
  const getTransactionsByStatus = useCallback(
    (status: TransactionHistoryEntry['status']) => {
      return transactions.filter(tx => tx.status === status);
    },
    [transactions]
  );

  // Get recent transactions (last 24h)
  const getRecentTransactions = useCallback(() => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return transactions.filter(tx => new Date(tx.created_at) > yesterday);
  }, [transactions]);

  // Load initial transactions when connection changes
  useEffect(() => {
    if (activeConnection) {
      loadTransactions();
    } else {
      setTransactions([]);
    }
  }, [activeConnection, loadTransactions]);

  return {
    // State
    transactions,
    loading,
    error,

    // Actions
    loadTransactions,
    saveTransaction,
    updateTransactionStatus,
    deleteTransaction,
    clearHistory,

    // Getters
    getStatistics,
    getTransactionsByStatus,
    getRecentTransactions,

    // Computed
    pendingTransactions: getTransactionsByStatus('pending'),
    confirmedTransactions: getTransactionsByStatus('confirmed'),
    failedTransactions: getTransactionsByStatus('failed'),
    recentTransactions: getRecentTransactions(),
    statistics: getStatistics(),
  };
};