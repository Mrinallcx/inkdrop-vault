import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  ExternalLink,
  X,
  Trash2,
  RefreshCw,
  Activity,
} from 'lucide-react';
import { useTransactionMonitoring } from '@/hooks/useTransactionMonitoring';
import { getChainExplorerUrl } from '@/utils/blockchainUtils';
import { formatAddress } from '@/utils/web3Utils';
import { formatDistanceToNow } from 'date-fns';

interface TransactionMonitorProps {
  compact?: boolean;
  showControls?: boolean;
}

export const TransactionMonitor = ({ compact = false, showControls = true }: TransactionMonitorProps) => {
  const {
    monitoredTransactions,
    isMonitoring,
    pendingCount,
    confirmedCount,
    failedCount,
    removeTransaction,
    clearAllTransactions,
    recheckPendingTransactions,
  } = useTransactionMonitoring();

  const [activeTab, setActiveTab] = useState('all');

  const getStatusIcon = (status: string, confirmations: number = 0) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'dropped':
        return <X className="w-4 h-4 text-gray-500" />;
      case 'pending':
      default:
        return (
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-yellow-500 animate-pulse" />
            {confirmations > 0 && (
              <span className="text-xs text-muted-foreground">
                {confirmations}/12
              </span>
            )}
          </div>
        );
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      case 'dropped':
        return 'bg-gray-500';
      case 'pending':
      default:
        return 'bg-yellow-500';
    }
  };

  const getConfirmationProgress = (confirmations: number, required = 12): number => {
    return Math.min((confirmations / required) * 100, 100);
  };

  const filteredTransactions = monitoredTransactions.filter(tx => {
    if (activeTab === 'all') return true;
    return tx.status === activeTab;
  });

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {isMonitoring && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Activity className="w-3 h-3 animate-pulse" />
            <span>{pendingCount}</span>
          </div>
        )}
        {pendingCount > 0 && (
          <Badge variant="outline" className="text-xs">
            {pendingCount} pending
          </Badge>
        )}
      </div>
    );
  }

  if (monitoredTransactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Transaction Monitor
          </CardTitle>
          <CardDescription>No transactions being monitored</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Transaction Monitor
              {isMonitoring && (
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              )}
            </CardTitle>
            <CardDescription>
              Tracking {monitoredTransactions.length} transaction{monitoredTransactions.length !== 1 ? 's' : ''}
            </CardDescription>
          </div>
          
          {showControls && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={recheckPendingTransactions}
                disabled={pendingCount === 0}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllTransactions}
                disabled={monitoredTransactions.length === 0}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full" />
            <span>{pendingCount} Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span>{confirmedCount} Confirmed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full" />
            <span>{failedCount} Failed</span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
            <TabsTrigger value="failed">Failed</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            <ScrollArea className="h-[400px] w-full">
              <div className="space-y-4">
                {filteredTransactions.map((tx, index) => (
                  <div key={tx.hash} className="space-y-2">
                    <div className="flex items-start justify-between p-3 border rounded-lg">
                      <div className="flex-1 space-y-2">
                        {/* Header */}
                        <div className="flex items-center gap-2">
                          {getStatusIcon(tx.status, tx.confirmations)}
                          <code className="text-sm font-mono">
                            {formatAddress(tx.hash)}
                          </code>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getStatusColor(tx.status)}`}
                          >
                            {tx.status}
                          </Badge>
                        </div>

                        {/* Progress for pending transactions */}
                        {tx.status === 'pending' && tx.confirmations > 0 && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Confirmations</span>
                              <span>{tx.confirmations}/12</span>
                            </div>
                            <Progress 
                              value={getConfirmationProgress(tx.confirmations)} 
                              className="h-1"
                            />
                          </div>
                        )}

                        {/* Transaction details */}
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div className="flex justify-between">
                            <span>Chain:</span>
                            <span className="font-medium">{tx.chainId}</span>
                          </div>
                          
                          {tx.blockNumber && (
                            <div className="flex justify-between">
                              <span>Block:</span>
                              <span className="font-medium">#{tx.blockNumber}</span>
                            </div>
                          )}
                          
                          {tx.gasUsed && (
                            <div className="flex justify-between">
                              <span>Gas Used:</span>
                              <span className="font-medium">
                                {parseInt(tx.gasUsed).toLocaleString()}
                              </span>
                            </div>
                          )}
                          
                          <div className="flex justify-between">
                            <span>Time:</span>
                            <span className="font-medium">
                              {formatDistanceToNow(tx.timestamp, { addSuffix: true })}
                            </span>
                          </div>
                        </div>

                        {/* Error message for failed transactions */}
                        {tx.status === 'failed' && tx.error && (
                          <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                            {tx.error}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-1 ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const url = getChainExplorerUrl(tx.chainId, 'tx', tx.hash);
                            if (url) window.open(url, '_blank');
                          }}
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTransaction(tx.hash)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    
                    {index < filteredTransactions.length - 1 && <Separator />}
                  </div>
                ))}
                
                {filteredTransactions.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    No {activeTab === 'all' ? '' : activeTab + ' '}transactions found
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};