import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import { useMultiChainWallet } from '@/contexts/MultiChainWalletContext';
import { NetworkStatus } from '@/utils/blockchainUtils';

interface NetworkStatusIndicatorProps {
  chainId?: string;
  showDetails?: boolean;
  compact?: boolean;
}

export const NetworkStatusIndicator = ({ 
  chainId, 
  showDetails = false, 
  compact = false 
}: NetworkStatusIndicatorProps) => {
  const { currentChain, networkStatus } = useMultiChainWallet();
  
  const targetChainId = chainId || currentChain?.id;
  const status = targetChainId ? networkStatus[targetChainId] : null;
  
  if (!targetChainId || !status) {
    return compact ? null : (
      <Badge variant="outline" className="text-xs">
        <WifiOff className="w-3 h-3 mr-1" />
        Disconnected
      </Badge>
    );
  }

  const getStatusColor = (status: NetworkStatus): string => {
    switch (status) {
      case 'connected':
        return 'text-green-500 bg-green-50 border-green-200';
      case 'connecting':
        return 'text-yellow-500 bg-yellow-50 border-yellow-200';
      case 'error':
        return 'text-red-500 bg-red-50 border-red-200';
      case 'disconnected':
        return 'text-gray-500 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-500 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: NetworkStatus) => {
    switch (status) {
      case 'connected':
        return <Wifi className="w-3 h-3" />;
      case 'connecting':
        return <Loader2 className="w-3 h-3 animate-spin" />;
      case 'error':
        return <AlertTriangle className="w-3 h-3" />;
      case 'disconnected':
        return <WifiOff className="w-3 h-3" />;
      default:
        return <WifiOff className="w-3 h-3" />;
    }
  };

  const getLatencyColor = (latency?: number): string => {
    if (!latency) return 'text-gray-500';
    if (latency < 100) return 'text-green-500';
    if (latency < 300) return 'text-yellow-500';
    return 'text-red-500';
  };

  const formatLastUpdated = (date?: Date): string => {
    if (!date) return 'Never';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`flex items-center justify-center w-6 h-6 rounded-full ${getStatusColor(status.status)}`}>
              {getStatusIcon(status.status)}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <div className="font-semibold capitalize">{status.status}</div>
              {status.latency && (
                <div className={`text-xs ${getLatencyColor(status.latency)}`}>
                  Latency: {status.latency}ms
                </div>
              )}
              {status.blockNumber && (
                <div className="text-xs">
                  Block: #{status.blockNumber}
                </div>
              )}
              <div className="text-xs text-muted-foreground">
                Updated: {formatLastUpdated(status.lastUpdated)}
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="space-y-2">
      <Badge 
        variant="outline" 
        className={`text-xs ${getStatusColor(status.status)}`}
      >
        {getStatusIcon(status.status)}
        <span className="ml-1 capitalize">{status.status}</span>
        {status.latency && (
          <span className={`ml-2 ${getLatencyColor(status.latency)}`}>
            {status.latency}ms
          </span>
        )}
      </Badge>

      {showDetails && (
        <div className="text-xs space-y-1">
          {status.blockNumber && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Block Height:</span>
              <span>#{status.blockNumber}</span>
            </div>
          )}
          
          {status.latency && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Latency:</span>
              <span className={getLatencyColor(status.latency)}>
                {status.latency}ms
              </span>
            </div>
          )}
          
          <div className="flex justify-between">
            <span className="text-muted-foreground">Last Updated:</span>
            <span>{formatLastUpdated(status.lastUpdated)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

interface NetworkStatusGridProps {
  chainIds?: string[];
}

export const NetworkStatusGrid = ({ chainIds }: NetworkStatusGridProps) => {
  const { connections, networkStatus } = useMultiChainWallet();
  
  const connectedChains = chainIds || Object.keys(connections);
  
  if (connectedChains.length === 0) {
    return (
      <div className="text-center text-muted-foreground text-sm py-4">
        No networks connected
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
      {connectedChains.map((chainId) => {
        const connection = connections[chainId];
        const status = networkStatus[chainId];
        
        return (
          <div key={chainId} className="p-2 border rounded-lg text-center">
            <div className="text-xs font-medium mb-1">
              {connection?.walletType || chainId}
            </div>
            <NetworkStatusIndicator chainId={chainId} compact />
            {status?.latency && (
              <div className="text-xs mt-1 text-muted-foreground">
                {status.latency}ms
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};