import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { useMultiChainWallet } from '@/contexts/MultiChainWalletContext';
import { ChainConfig } from '@/config/chains';

interface ChainSelectorProps {
  showTestnets?: boolean;
  onChainSelect?: (chainId: string) => void;
}

export const ChainSelector = ({ showTestnets = false, onChainSelect }: ChainSelectorProps) => {
  const {
    supportedChains,
    currentChain,
    connections,
    networkStatus,
    switchChain,
    isConnecting,
  } = useMultiChainWallet();

  const filteredChains = supportedChains.filter(chain => 
    showTestnets ? chain.testnet : !chain.testnet
  );

  const handleChainSelect = async (chainId: string) => {
    const hasConnection = connections[chainId];
    
    if (hasConnection) {
      await switchChain(chainId);
    }
    
    onChainSelect?.(chainId);
  };

  const getNetworkStatusIcon = (chainId: string) => {
    const status = networkStatus[chainId];
    if (!status) return null;

    switch (status.status) {
      case 'connected':
        return <Wifi className="w-3 h-3 text-green-500" />;
      case 'connecting':
        return <Loader2 className="w-3 h-3 animate-spin text-yellow-500" />;
      case 'error':
        return <AlertTriangle className="w-3 h-3 text-red-500" />;
      case 'disconnected':
        return <WifiOff className="w-3 h-3 text-gray-500" />;
      default:
        return null;
    }
  };

  const getNetworkLatency = (chainId: string): string => {
    const status = networkStatus[chainId];
    if (!status?.latency) return '';
    
    if (status.latency < 100) return 'text-green-500';
    if (status.latency < 300) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="space-y-4">
      <Select 
        value={currentChain?.id || ''} 
        onValueChange={handleChainSelect}
        disabled={isConnecting}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a blockchain">
            {currentChain && (
              <div className="flex items-center gap-2">
                <span className="text-lg">{currentChain.icon}</span>
                <span>{currentChain.displayName}</span>
                {connections[currentChain.id] && (
                  <Badge variant="secondary" className="text-xs">
                    Connected
                  </Badge>
                )}
                {getNetworkStatusIcon(currentChain.id)}
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {filteredChains.map((chain) => {
            const isConnected = connections[chain.id];
            const status = networkStatus[chain.id];
            
            return (
              <SelectItem key={chain.id} value={chain.id}>
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{chain.icon}</span>
                    <span>{chain.displayName}</span>
                    {chain.testnet && (
                      <Badge variant="outline" className="text-xs">
                        Testnet
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {isConnected && (
                      <Badge variant="secondary" className="text-xs">
                        Connected
                      </Badge>
                    )}
                    {status && (
                      <div className="flex items-center gap-1">
                        {getNetworkStatusIcon(chain.id)}
                        {status.latency && (
                          <span className={`text-xs ${getNetworkLatency(chain.id)}`}>
                            {status.latency}ms
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

      {/* Chain Details */}
      {currentChain && (
        <div className="p-4 border rounded-lg bg-card">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">{currentChain.icon}</span>
            <div>
              <h3 className="font-semibold">{currentChain.displayName}</h3>
              <p className="text-sm text-muted-foreground">
                {currentChain.nativeCurrency.symbol} • Chain ID: {currentChain.chainId}
              </p>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Network:</span>
              <span>{currentChain.network}</span>
            </div>
            
            {networkStatus[currentChain.id] && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Status:</span>
                  <div className="flex items-center gap-2">
                    {getNetworkStatusIcon(currentChain.id)}
                    <span className="capitalize">
                      {networkStatus[currentChain.id].status}
                    </span>
                  </div>
                </div>
                
                {networkStatus[currentChain.id].latency && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Latency:</span>
                    <span className={getNetworkLatency(currentChain.id)}>
                      {networkStatus[currentChain.id].latency}ms
                    </span>
                  </div>
                )}
                
                {networkStatus[currentChain.id].blockNumber && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Block:</span>
                    <span>#{networkStatus[currentChain.id].blockNumber}</span>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(currentChain.explorerUrl, '_blank')}
            >
              Explorer
            </Button>
            {connections[currentChain.id] && (
              <Badge variant="secondary">
                {connections[currentChain.id].address.slice(0, 6)}...
                {connections[currentChain.id].address.slice(-4)}
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
};