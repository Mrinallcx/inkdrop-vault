import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Wallet, Link, Unlink } from 'lucide-react';
import { useMultiChainWallet } from '@/contexts/MultiChainWalletContext';
import { ChainConfig } from '@/config/chains';

interface MultiChainWalletModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MultiChainWalletModal = ({ open, onOpenChange }: MultiChainWalletModalProps) => {
  const {
    supportedChains,
    connections,
    connectWallet,
    disconnectWallet,
    isConnecting,
    error,
  } = useMultiChainWallet();

  const [selectedTab, setSelectedTab] = useState('mainnet');

  const mainnetChains = supportedChains.filter(chain => !chain.testnet);
  const testnetChains = supportedChains.filter(chain => chain.testnet);

  const getWalletIcon = (walletType: string) => {
    const icons = {
      metamask: '🦊',
      phantom: '👻',
      trustwallet: '🛡️',
      lace: '🎴',
    };
    return icons[walletType as keyof typeof icons] || '👛';
  };

  const isWalletInstalled = (walletType: string) => {
    switch (walletType) {
      case 'metamask':
        return window.ethereum?.isMetaMask;
      case 'phantom':
        return window.solana?.isPhantom;
      case 'trustwallet':
        return window.ethereum?.isTrust;
      case 'lace':
        return window.cardano?.lace;
      default:
        return false;
    }
  };

  const handleConnect = async (chainId: string, walletType: string) => {
    const success = await connectWallet(chainId, walletType);
    if (success) {
      // Keep modal open to allow multiple connections
    }
  };

  const handleDisconnect = (chainId: string) => {
    disconnectWallet(chainId);
  };

  const renderChainSection = (chains: ChainConfig[], title: string) => (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">{title}</h3>
      <div className="grid gap-4">
        {chains.map((chain) => {
          const connection = connections[chain.id];
          
          return (
            <div key={chain.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{chain.icon}</span>
                  <div>
                    <h4 className="font-semibold">{chain.displayName}</h4>
                    <p className="text-sm text-muted-foreground">
                      {chain.nativeCurrency.symbol}
                    </p>
                  </div>
                </div>
                
                {connection && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Connected</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDisconnect(chain.id)}
                    >
                      <Unlink className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              {connection ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span>{getWalletIcon(connection.walletType)}</span>
                    <span className="capitalize">{connection.walletType}</span>
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">
                    {connection.address.slice(0, 8)}...{connection.address.slice(-6)}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground mb-2">
                    Available wallets:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {chain.walletTypes.map((walletType) => {
                      const installed = isWalletInstalled(walletType);
                      
                      return (
                        <Button
                          key={walletType}
                          variant={installed ? "default" : "outline"}
                          size="sm"
                          disabled={!installed || isConnecting}
                          onClick={() => handleConnect(chain.id, walletType)}
                          className="flex items-center gap-2"
                        >
                          {isConnecting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <span>{getWalletIcon(walletType)}</span>
                          )}
                          <span className="capitalize">{walletType}</span>
                          {!installed && (
                            <Badge variant="secondary" className="text-xs">
                              Not installed
                            </Badge>
                          )}
                        </Button>
                      );
                    })}
                  </div>
                  
                  {!chain.walletTypes.some(isWalletInstalled) && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Install a compatible wallet to connect to this chain
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Multi-Chain Wallet Connection
          </DialogTitle>
          <DialogDescription>
            Connect to multiple blockchains using different wallet providers
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-3 border border-red-200 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="mainnet">
              Mainnet ({mainnetChains.length})
            </TabsTrigger>
            <TabsTrigger value="testnet">
              Testnet ({testnetChains.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="mainnet" className="mt-6">
            {renderChainSection(mainnetChains, 'Mainnet Chains')}
          </TabsContent>

          <TabsContent value="testnet" className="mt-6">
            {renderChainSection(testnetChains, 'Testnet Chains')}
          </TabsContent>
        </Tabs>

        <div className="flex justify-between items-center mt-6 pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {Object.keys(connections).length} chain(s) connected
          </div>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
