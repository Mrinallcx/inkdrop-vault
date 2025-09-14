import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Wallet, Settings, Network, Activity } from 'lucide-react';
import { useMultiChainWallet } from '@/contexts/MultiChainWalletContext';
import { ChainSelector } from './ChainSelector';
import { ChainSwitcher } from './ChainSwitcher';
import { NetworkStatusGrid } from './NetworkStatusIndicator';
import { MultiChainWalletModal } from './MultiChainWalletModal';

interface UnifiedWalletManagerProps {
  className?: string;
}

export const UnifiedWalletManager = ({ className }: UnifiedWalletManagerProps) => {
  const {
    connections,
    currentChain,
    activeConnection,
    networkStatus,
  } = useMultiChainWallet();

  const [showWalletModal, setShowWalletModal] = useState(false);
  const [selectedTab, setSelectedTab] = useState('overview');

  const connectedChainCount = Object.keys(connections).length;
  const totalNetworkLatency = Object.values(networkStatus)
    .filter(status => status.latency)
    .reduce((sum, status) => sum + (status.latency || 0), 0);
  const avgLatency = totalNetworkLatency > 0 ? 
    Math.round(totalNetworkLatency / Object.values(networkStatus).length) : 0;

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Network className="w-5 h-5 text-primary" />
              <div>
                <div className="font-semibold">{connectedChainCount}</div>
                <div className="text-sm text-muted-foreground">Connected Chains</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-500" />
              <div>
                <div className="font-semibold">{avgLatency}ms</div>
                <div className="text-sm text-muted-foreground">Avg Latency</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-blue-500" />
              <div>
                <div className="font-semibold">{activeConnection?.walletType || 'None'}</div>
                <div className="text-sm text-muted-foreground">Active Wallet</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Connection */}
      {activeConnection && currentChain ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-xl">{currentChain.icon}</span>
              Active Connection
            </CardTitle>
            <CardDescription>
              Currently connected to {currentChain.displayName}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Chain</label>
                <div className="flex items-center gap-2 mt-1">
                  <span>{currentChain.displayName}</span>
                  <Badge variant="outline">{currentChain.nativeCurrency.symbol}</Badge>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Wallet</label>
                <div className="capitalize mt-1">{activeConnection.walletType}</div>
              </div>
              
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-muted-foreground">Address</label>
                <div className="font-mono text-sm mt-1 p-2 bg-muted rounded">
                  {activeConnection.address}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <Wallet className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold mb-2">No Wallet Connected</h3>
            <p className="text-muted-foreground mb-4">
              Connect your wallet to start using multi-chain features
            </p>
            <Button onClick={() => setShowWalletModal(true)}>
              Connect Wallet
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Network Status */}
      {connectedChainCount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Network Status</CardTitle>
            <CardDescription>
              Real-time status of connected networks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <NetworkStatusGrid />
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderChainManagement = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-semibold">Chain Management</h3>
          <p className="text-sm text-muted-foreground">
            Select and switch between different blockchain networks
          </p>
        </div>
        <Button onClick={() => setShowWalletModal(true)}>
          Add Chain
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Chain Selector</CardTitle>
            <CardDescription>Browse and select blockchain networks</CardDescription>
          </CardHeader>
          <CardContent>
            <ChainSelector showTestnets />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Quick Switch</CardTitle>
            <CardDescription>Switch between connected networks</CardDescription>
          </CardHeader>
          <CardContent>
            <ChainSwitcher />
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className={className}>
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="chains">Chains</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-6">
          {renderOverview()}
        </TabsContent>
        
        <TabsContent value="chains" className="mt-6">
          {renderChainManagement()}
        </TabsContent>
      </Tabs>

      <MultiChainWalletModal
        open={showWalletModal}
        onOpenChange={setShowWalletModal}
      />
    </div>
  );
};