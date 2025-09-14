import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  FileCode,
  Fuel,
  Activity,
  History,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { SmartContractInterface } from '@/components/SmartContractInterface';
import { GasEstimator } from '@/components/GasEstimator';
import { TransactionMonitor } from '@/components/TransactionMonitor';
import { TransactionHistory } from '@/components/TransactionHistory';
import { useMultiChainWallet } from '@/contexts/MultiChainWalletContext';

export default function SmartContractDemo() {
  const { currentChain, activeConnection } = useMultiChainWallet();

  const features = [
    {
      icon: <FileCode className="w-5 h-5" />,
      title: "Smart Contract Interface",
      description: "Interact with any smart contract by entering its address. View contract information and execute methods.",
      color: "bg-blue-500",
    },
    {
      icon: <Fuel className="w-5 h-5" />,
      title: "Gas Estimation",
      description: "Estimate transaction costs before execution. Get real-time gas prices and optimize your transactions.",
      color: "bg-green-500",
    },
    {
      icon: <Activity className="w-5 h-5" />,
      title: "Transaction Monitoring",
      description: "Monitor your transactions in real-time. Track confirmations, status, and get notifications.",
      color: "bg-yellow-500",
    },
    {
      icon: <History className="w-5 h-5" />,
      title: "Transaction History",
      description: "View and manage your complete transaction history across all supported blockchains.",
      color: "bg-purple-500",
    },
  ];

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Zap className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Smart Contract Integration</h1>
            <p className="text-muted-foreground">
              Comprehensive Web3 tools for blockchain interaction, gas estimation, and transaction management
            </p>
          </div>
        </div>

        {currentChain && activeConnection ? (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              Connected to {currentChain.displayName}
            </Badge>
            <Badge variant="outline">
              {activeConnection.address.slice(0, 6)}...{activeConnection.address.slice(-4)}
            </Badge>
          </div>
        ) : (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800">
              Connect your wallet to start using smart contract features
            </p>
          </div>
        )}
      </div>

      {/* Feature Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-lg text-white ${feature.color}`}>
                  {feature.icon}
                </div>
                <div className="flex-1 space-y-2">
                  <h3 className="font-semibold text-sm">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Interface */}
      <Tabs defaultValue="interface" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="interface" className="flex items-center gap-2">
            <FileCode className="w-4 h-4" />
            Contract Interface
          </TabsTrigger>
          <TabsTrigger value="gas" className="flex items-center gap-2">
            <Fuel className="w-4 h-4" />
            Gas Estimation
          </TabsTrigger>
          <TabsTrigger value="monitor" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Live Monitor
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="interface" className="space-y-6">
          <SmartContractInterface />
        </TabsContent>

        <TabsContent value="gas" className="space-y-6">
          <GasEstimator />
        </TabsContent>

        <TabsContent value="monitor" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TransactionMonitor />
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Quick Stats
                </CardTitle>
                <CardDescription>
                  Overview of your blockchain activity
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">0</div>
                    <div className="text-sm text-muted-foreground">Pending</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">0</div>
                    <div className="text-sm text-muted-foreground">Confirmed</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Network:</span>
                    <span className="font-medium">
                      {currentChain?.displayName || 'Not connected'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Address:</span>
                    <span className="font-mono text-xs">
                      {activeConnection?.address 
                        ? `${activeConnection.address.slice(0, 10)}...${activeConnection.address.slice(-8)}`
                        : 'Not connected'
                      }
                    </span>
                  </div>
                </div>

                {!currentChain && (
                  <div className="text-center py-4 text-muted-foreground">
                    <p className="text-sm">Connect to a blockchain to see your activity</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <TransactionHistory />
        </TabsContent>
      </Tabs>

      {/* Additional Information */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-blue-900">🚀 Smart Contract Integration Features</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <h4 className="font-medium text-blue-800">Web3 Connection</h4>
                <ul className="space-y-1 text-blue-700">
                  <li>• Multi-chain wallet support</li>
                  <li>• Automatic provider detection</li>
                  <li>• Network switching</li>
                  <li>• Connection management</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-blue-800">Contract Interaction</h4>
                <ul className="space-y-1 text-blue-700">
                  <li>• Dynamic ABI detection</li>
                  <li>• Method parameter input</li>
                  <li>• Read/write operations</li>
                  <li>• Transaction options</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-blue-800">Gas Management</h4>
                <ul className="space-y-1 text-blue-700">
                  <li>• Real-time gas estimation</li>
                  <li>• EIP-1559 support</li>
                  <li>• Priority fee calculation</li>
                  <li>• Balance validation</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-blue-800">Transaction Tracking</h4>
                <ul className="space-y-1 text-blue-700">
                  <li>• Real-time monitoring</li>
                  <li>• Confirmation tracking</li>
                  <li>• Status notifications</li>
                  <li>• History management</li>
                </ul>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-blue-600">
              <span>💡 Tip: All transaction data is stored locally and in your Supabase database for persistence across sessions.</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}