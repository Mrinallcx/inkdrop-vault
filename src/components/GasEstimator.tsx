import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Fuel,
  TrendingUp,
  TrendingDown,
  Clock,
  Zap,
  Calculator,
  DollarSign,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { gasEstimationManager, GasEstimate } from '@/utils/gasEstimation';
import { useMultiChainWallet } from '@/contexts/MultiChainWalletContext';
import { formatWei } from '@/utils/web3Utils';

interface GasEstimatorProps {
  contractAddress?: string;
  methodName?: string;
  params?: any[];
  value?: string;
  onEstimate?: (estimate: GasEstimate) => void;
}

export const GasEstimator = ({
  contractAddress,
  methodName,
  params = [],
  value = '0',
  onEstimate,
}: GasEstimatorProps) => {
  const { currentChain, activeConnection } = useMultiChainWallet();
  
  const [loading, setLoading] = useState(false);
  const [estimate, setEstimate] = useState<GasEstimate | null>(null);
  const [gasPrices, setGasPrices] = useState<{
    slow: GasEstimate;
    standard: GasEstimate;
    fast: GasEstimate;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<'slow' | 'standard' | 'fast'>('standard');
  
  // For manual gas estimation
  const [toAddress, setToAddress] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [manualGasLimit, setManualGasLimit] = useState('');
  const [manualGasPrice, setManualGasPrice] = useState('');

  // Load current gas prices
  useEffect(() => {
    if (!currentChain) return;

    const loadGasPrices = async () => {
      try {
        const prices = await gasEstimationManager.getCurrentGasPrices(currentChain.id);
        if (prices) {
          setGasPrices(prices);
        }
      } catch (err) {
        console.error('Failed to load gas prices:', err);
      }
    };

    loadGasPrices();
    const interval = setInterval(loadGasPrices, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [currentChain]);

  // Estimate gas for contract transaction
  const estimateContractGas = async () => {
    if (!currentChain || !contractAddress || !methodName) return;

    setLoading(true);
    setError(null);

    try {
      // For demo purposes, use minimal ERC-721 ABI
      const abi = [
        'function mint(address to, string uri) returns (uint256)',
        'function transfer(address to, uint256 amount) returns (bool)',
        'function approve(address spender, uint256 amount) returns (bool)',
      ];

      const gasEstimate = await gasEstimationManager.estimateContractGas(
        contractAddress,
        abi,
        methodName,
        params,
        currentChain.id,
        value
      );

      setEstimate(gasEstimate);
      onEstimate?.(gasEstimate);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Estimate gas for simple transfer
  const estimateTransferGas = async () => {
    if (!currentChain || !toAddress || !transferAmount) return;

    setLoading(true);
    setError(null);

    try {
      const gasEstimate = await gasEstimationManager.estimateTransferGas(
        toAddress,
        transferAmount,
        currentChain.id
      );

      setEstimate(gasEstimate);
      onEstimate?.(gasEstimate);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Calculate manual estimate
  const calculateManualEstimate = () => {
    if (!manualGasLimit || !manualGasPrice) return;

    try {
      const gasLimit = BigInt(manualGasLimit);
      const gasPrice = BigInt(manualGasPrice);
      const estimatedCost = gasLimit * gasPrice;

      const manualEstimate: GasEstimate = {
        gasLimit: gasLimit.toString(),
        gasPrice: gasPrice.toString(),
        estimatedCost: formatWei(estimatedCost.toString()),
        type: 'legacy',
      };

      setEstimate(manualEstimate);
      onEstimate?.(manualEstimate);
    } catch (err: any) {
      setError('Invalid gas values');
    }
  };

  const formatGasDisplay = (estimate: GasEstimate) => {
    return gasEstimationManager.formatGasEstimate(estimate);
  };

  if (!currentChain) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <Fuel className="w-8 h-8 mx-auto mb-2" />
            <p>Connect to a blockchain to estimate gas fees</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (currentChain.name === 'solana' || currentChain.name === 'cardano') {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <Fuel className="w-8 h-8 mx-auto mb-2" />
            <p>Gas estimation is only available for Ethereum-based chains</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Gas Prices */}
      {gasPrices && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Current Gas Prices
            </CardTitle>
            <CardDescription>Live gas prices on {currentChain.displayName}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span className="font-medium">Slow</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{formatGasDisplay(gasPrices.slow).gasPrice}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatGasDisplay(gasPrices.slow).estimatedCost} {currentChain.nativeCurrency.symbol}
                  </div>
                </div>
              </div>

              <div className={`flex items-center justify-between p-3 border rounded-lg ${
                selectedPriority === 'standard' ? 'border-primary bg-primary/5' : ''
              }`}>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  <span className="font-medium">Standard</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{formatGasDisplay(gasPrices.standard).gasPrice}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatGasDisplay(gasPrices.standard).estimatedCost} {currentChain.nativeCurrency.symbol}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="font-medium">Fast</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{formatGasDisplay(gasPrices.fast).gasPrice}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatGasDisplay(gasPrices.fast).estimatedCost} {currentChain.nativeCurrency.symbol}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gas Estimation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Gas Estimation
          </CardTitle>
          <CardDescription>
            Estimate transaction costs for different operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="transfer" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="transfer">Transfer</TabsTrigger>
              <TabsTrigger value="contract">Contract</TabsTrigger>
              <TabsTrigger value="manual">Manual</TabsTrigger>
            </TabsList>

            {/* Transfer Tab */}
            <TabsContent value="transfer" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="toAddress">To Address</Label>
                  <Input
                    id="toAddress"
                    placeholder="0x..."
                    value={toAddress}
                    onChange={(e) => setToAddress(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="amount">Amount ({currentChain.nativeCurrency.symbol})</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.1"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                  />
                </div>
              </div>
              
              <Button 
                onClick={estimateTransferGas} 
                disabled={!toAddress || !transferAmount || loading}
                className="w-full"
              >
                {loading ? 'Estimating...' : 'Estimate Transfer Cost'}
              </Button>
            </TabsContent>

            {/* Contract Tab */}
            <TabsContent value="contract" className="space-y-4">
              <div className="text-sm text-muted-foreground mb-4">
                {contractAddress && methodName 
                  ? `Estimating ${methodName} on ${contractAddress.slice(0, 10)}...`
                  : 'Contract details will be populated automatically'
                }
              </div>
              
              <Button 
                onClick={estimateContractGas} 
                disabled={!contractAddress || !methodName || loading}
                className="w-full"
              >
                {loading ? 'Estimating...' : 'Estimate Contract Transaction'}
              </Button>
            </TabsContent>

            {/* Manual Tab */}
            <TabsContent value="manual" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="gasLimit">Gas Limit</Label>
                  <Input
                    id="gasLimit"
                    type="number"
                    placeholder="21000"
                    value={manualGasLimit}
                    onChange={(e) => setManualGasLimit(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="gasPrice">Gas Price (wei)</Label>
                  <Input
                    id="gasPrice"
                    type="number"
                    placeholder="20000000000"
                    value={manualGasPrice}
                    onChange={(e) => setManualGasPrice(e.target.value)}
                  />
                </div>
              </div>
              
              <Button 
                onClick={calculateManualEstimate} 
                disabled={!manualGasLimit || !manualGasPrice}
                className="w-full"
              >
                Calculate Gas Cost
              </Button>
            </TabsContent>
          </Tabs>

          {/* Error Display */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Estimate Results */}
          {estimate && (
            <div className="mt-6 space-y-4">
              <Separator />
              
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="w-4 h-4" />
                <span className="font-medium">Gas Estimate Complete</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Gas Limit:</span>
                    <span className="font-medium">{formatGasDisplay(estimate).gasLimit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Gas Price:</span>
                    <span className="font-medium">{formatGasDisplay(estimate).gasPrice}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Estimated Cost:</span>
                    <span className="font-medium">
                      {formatGasDisplay(estimate).estimatedCost} {currentChain.nativeCurrency.symbol}
                    </span>
                  </div>
                  {formatGasDisplay(estimate).estimatedCostUSD && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">USD Value:</span>
                      <span className="font-medium">{formatGasDisplay(estimate).estimatedCostUSD}</span>
                    </div>
                  )}
                </div>

                {/* Priority Selection */}
                <div className="space-y-2">
                  <Label>Transaction Priority</Label>
                  <Select value={selectedPriority} onValueChange={(v: any) => setSelectedPriority(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="slow">Slow (Lower Cost)</SelectItem>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="fast">Fast (Higher Cost)</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {gasPrices && (
                    <div className="text-sm text-muted-foreground">
                      Recommended: {formatGasDisplay(gasPrices[selectedPriority]).gasPrice}
                    </div>
                  )}
                </div>
              </div>

              {/* Balance Check */}
              {activeConnection && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-700 mb-1">
                    <DollarSign className="w-4 h-4" />
                    <span className="font-medium">Balance Check</span>
                  </div>
                  <div className="text-sm text-blue-600">
                    Make sure you have enough {currentChain.nativeCurrency.symbol} to cover the transaction cost
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};