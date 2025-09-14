import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  ExternalLink,
  Search,
  Filter,
  Download,
  Calendar,
  TrendingUp,
  Activity,
  Trash2,
} from 'lucide-react';
import { useTransactionHistory, TransactionFilter } from '@/hooks/useTransactionHistory';
import { getChainExplorerUrl } from '@/utils/blockchainUtils';
import { formatAddress, formatWei } from '@/utils/web3Utils';
import { format, formatDistanceToNow } from 'date-fns';
import { ethers } from 'ethers';

interface TransactionHistoryProps {
  compact?: boolean;
  limit?: number;
}

export const TransactionHistory = ({ compact = false, limit }: TransactionHistoryProps) => {
  const {
    transactions,
    loading,
    error,
    loadTransactions,
    deleteTransaction,
    clearHistory,
    statistics,
    pendingTransactions,
    confirmedTransactions,
    failedTransactions,
  } = useTransactionHistory();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterChain, setFilterChain] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [activeTab, setActiveTab] = useState('all');

  // Apply filters and search
  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    // Apply tab filter
    if (activeTab !== 'all') {
      filtered = filtered.filter(tx => tx.status === activeTab);
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(tx =>
        tx.hash.toLowerCase().includes(query) ||
        tx.from_address.toLowerCase().includes(query) ||
        tx.to_address.toLowerCase().includes(query) ||
        tx.contract_address?.toLowerCase().includes(query) ||
        tx.method_name?.toLowerCase().includes(query)
      );
    }

    // Apply filters
    if (filterChain) {
      filtered = filtered.filter(tx => tx.chain_id === filterChain);
    }
    if (filterType) {
      filtered = filtered.filter(tx => tx.transaction_type === filterType);
    }
    if (filterStatus) {
      filtered = filtered.filter(tx => tx.status === filterStatus);
    }

    // Apply limit
    if (limit) {
      filtered = filtered.slice(0, limit);
    }

    return filtered;
  }, [transactions, searchQuery, filterChain, filterType, filterStatus, activeTab, limit]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'dropped':
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
      case 'pending':
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'mint':
        return '🎨';
      case 'transfer':
        return '💸';
      case 'approve':
        return '✅';
      case 'contract':
        return '📋';
      default:
        return '⚡';
    }
  };

  const exportTransactions = () => {
    const csv = [
      'Hash,Chain,From,To,Value,Gas Used,Status,Type,Timestamp',
      ...filteredTransactions.map(tx => [
        tx.hash,
        tx.chain_id,
        tx.from_address,
        tx.to_address,
        formatWei(tx.value),
        tx.gas_used || '',
        tx.status,
        tx.transaction_type,
        tx.created_at,
      ].join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (compact) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Recent Transactions
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ScrollArea className="h-[200px]">
            <div className="space-y-2">
              {transactions.slice(0, 5).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-2 border rounded-lg">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(tx.status)}
                    <span className="text-sm">{getTypeIcon(tx.transaction_type)}</span>
                    <code className="text-xs font-mono">{formatAddress(tx.hash)}</code>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{tx.chain_id}</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const url = getChainExplorerUrl(tx.chain_id, 'tx', tx.hash);
                        if (url) window.open(url, '_blank');
                      }}
                    >
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-semibold">{statistics.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-semibold">{statistics.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Confirmed</p>
                <p className="text-2xl font-semibold">{statistics.confirmed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Failed</p>
                <p className="text-2xl font-semibold">{statistics.failed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Transaction History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Transaction History
              </CardTitle>
              <CardDescription>
                View and manage your transaction history across all chains
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={exportTransactions}
                disabled={filteredTransactions.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearHistory}
                disabled={transactions.length === 0}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>

            <Select value={filterChain} onValueChange={setFilterChain}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Chain" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Chains</SelectItem>
                {Object.keys(statistics.byChain).map(chain => (
                  <SelectItem key={chain} value={chain}>{chain}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                {Object.keys(statistics.byType).map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="dropped">Dropped</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All ({statistics.total})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({statistics.pending})</TabsTrigger>
              <TabsTrigger value="confirmed">Confirmed ({statistics.confirmed})</TabsTrigger>
              <TabsTrigger value="failed">Failed ({statistics.failed})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : error ? (
                <div className="text-center py-8 text-red-500">{error}</div>
              ) : filteredTransactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No transactions found
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="space-y-2">
                    {filteredTransactions.map((tx, index) => (
                      <div key={tx.id} className="space-y-2">
                        <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                          <div className="flex-1 space-y-2">
                            {/* Header */}
                            <div className="flex items-center gap-3">
                              {getStatusIcon(tx.status)}
                              <span className="text-lg">{getTypeIcon(tx.transaction_type)}</span>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <code className="text-sm font-mono">{formatAddress(tx.hash)}</code>
                                  <Badge variant="outline">{tx.chain_id}</Badge>
                                  <Badge variant="secondary">{tx.transaction_type}</Badge>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {format(new Date(tx.created_at), 'MMM dd, yyyy HH:mm')} • {formatDistanceToNow(new Date(tx.created_at), { addSuffix: true })}
                                </div>
                              </div>
                            </div>

                            {/* Transaction Details */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                              <div>
                                <span className="text-muted-foreground">From:</span>
                                <div className="font-mono text-xs">{formatAddress(tx.from_address)}</div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">To:</span>
                                <div className="font-mono text-xs">{formatAddress(tx.to_address)}</div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Value:</span>
                                <div className="font-medium">{formatWei(tx.value)} ETH</div>
                              </div>
                            </div>

                            {/* Additional Info */}
                            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                              {tx.block_number && (
                                <span>Block: #{tx.block_number}</span>
                              )}
                              {tx.gas_used && (
                                <span>Gas Used: {parseInt(tx.gas_used).toLocaleString()}</span>
                              )}
                              {tx.confirmations && (
                                <span>Confirmations: {tx.confirmations}</span>
                              )}
                            </div>

                            {/* Error Message */}
                            {tx.status === 'failed' && tx.error_message && (
                              <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                                {tx.error_message}
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 ml-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const url = getChainExplorerUrl(tx.chain_id, 'tx', tx.hash);
                                if (url) window.open(url, '_blank');
                              }}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteTransaction(tx.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        
                        {index < filteredTransactions.length - 1 && <Separator />}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};