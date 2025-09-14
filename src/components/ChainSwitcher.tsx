import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, Plus, Settings } from 'lucide-react';
import { useMultiChainWallet } from '@/contexts/MultiChainWalletContext';
import { NetworkStatusIndicator } from './NetworkStatusIndicator';
import { MultiChainWalletModal } from './MultiChainWalletModal';
import { getChainById } from '@/config/chains';

interface ChainSwitcherProps {
  showAddButton?: boolean;
  compact?: boolean;
}

export const ChainSwitcher = ({ showAddButton = true, compact = false }: ChainSwitcherProps) => {
  const {
    currentChain,
    connections,
    switchChain,
    isConnecting,
  } = useMultiChainWallet();

  const [showWalletModal, setShowWalletModal] = useState(false);

  const connectedChains = Object.keys(connections);
  
  const handleChainSwitch = async (chainId: string) => {
    await switchChain(chainId);
  };

  if (compact && currentChain) {
    return (
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={isConnecting}>
              <span className="mr-1">{currentChain.icon}</span>
              {!compact && currentChain.displayName}
              <ChevronDown className="w-3 h-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Connected Chains</DropdownMenuLabel>
            {connectedChains.map((chainId) => {
              const connection = connections[chainId];
              const isActive = currentChain?.id === chainId;
              
              return (
                <DropdownMenuItem
                  key={chainId}
                  onClick={() => !isActive && handleChainSwitch(chainId)}
                  className={isActive ? 'bg-accent' : ''}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <span>{currentChain?.icon}</span>
                      <span>{currentChain?.displayName}</span>
                      {isActive && <Badge variant="secondary" className="text-xs">Active</Badge>}
                    </div>
                    <NetworkStatusIndicator chainId={chainId} compact />
                  </div>
                </DropdownMenuItem>
              );
            })}
            
            {showAddButton && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowWalletModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Connect More Chains
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        
        <NetworkStatusIndicator compact />
      </div>
    );
  }

  if (!currentChain) {
    return (
      <Button 
        variant="outline" 
        onClick={() => setShowWalletModal(true)}
        disabled={isConnecting}
      >
        <Plus className="w-4 h-4 mr-2" />
        Connect Wallet
      </Button>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Active Network</h3>
        {showAddButton && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowWalletModal(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Chain
          </Button>
        )}
      </div>

      {/* Current Chain Display */}
      <div className="flex items-center justify-between p-3 border rounded-lg">
        <div className="flex items-center gap-3">
          <span className="text-xl">{currentChain.icon}</span>
          <div>
            <div className="font-medium">{currentChain.displayName}</div>
            <div className="text-sm text-muted-foreground">
              {currentChain.nativeCurrency.symbol}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <NetworkStatusIndicator />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => window.open(currentChain.explorerUrl, '_blank')}
              >
                View Explorer
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowWalletModal(true)}>
                Manage Connections
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Connected Chains List */}
      {connectedChains.length > 1 && (
        <div>
          <h4 className="font-medium mb-2">Switch to:</h4>
          <div className="space-y-2">
            {connectedChains
              .filter(chainId => chainId !== currentChain.id)
              .map((chainId) => {
                const connection = connections[chainId];
                const chain = getChainById(chainId);
                
                if (!chain) return null;
                
                return (
                  <Button
                    key={chainId}
                    variant="outline"
                    className="w-full justify-between"
                    onClick={() => handleChainSwitch(chainId)}
                    disabled={isConnecting}
                  >
                    <div className="flex items-center gap-2">
                      <span>{chain.icon}</span>
                      <span>{chain.displayName}</span>
                    </div>
                    <NetworkStatusIndicator chainId={chainId} compact />
                  </Button>
                );
              })}
          </div>
        </div>
      )}

      <MultiChainWalletModal
        open={showWalletModal}
        onOpenChange={setShowWalletModal}
      />
    </div>
  );
};