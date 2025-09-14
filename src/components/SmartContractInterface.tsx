import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  FileCode,
  Play,
  Eye,
  Settings,
  Loader2,
  CheckCircle,
  AlertCircle,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { smartContractManager, ContractInfo, TransactionResult } from '@/utils/contractUtils';
import { useMultiChainWallet } from '@/contexts/MultiChainWalletContext';
import { useTransactionMonitoring } from '@/hooks/useTransactionMonitoring';
import { GasEstimator } from './GasEstimator';
import { formatAddress } from '@/utils/web3Utils';
import { useToast } from '@/hooks/use-toast';
import { getChainExplorerUrl } from '@/utils/blockchainUtils';

interface SmartContractInterfaceProps {
  defaultAddress?: string;
  defaultMethod?: string;
}

export const SmartContractInterface = ({ 
  defaultAddress, 
  defaultMethod 
}: SmartContractInterfaceProps) => {
  const { currentChain, activeConnection } = useMultiChainWallet();
  const { startMonitoring } = useTransactionMonitoring();
  const { toast } = useToast();

  const [contractAddress, setContractAddress] = useState(defaultAddress || '');
  const [contractInfo, setContractInfo] = useState<ContractInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(defaultMethod || '');
  const [methodParams, setMethodParams] = useState<Record<string, string>>({});
  const [transactionValue, setTransactionValue] = useState('');
  const [gasLimit, setGasLimit] = useState('');
  const [gasPrice, setGasPrice] = useState('');
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [executing, setExecuting] = useState(false);

  // Load contract info when address changes
  useEffect(() => {
    if (contractAddress && currentChain) {
      loadContractInfo();
    }
  }, [contractAddress, currentChain]);

  // Set default method when contract info loads
  useEffect(() => {
    if (contractInfo && !selectedMethod && contractInfo.methods.length > 0) {
      setSelectedMethod(contractInfo.methods[0].name);
    }
  }, [contractInfo, selectedMethod]);

  const loadContractInfo = async () => {
    if (!currentChain || !contractAddress) return;

    setLoading(true);
    setError(null);

    try {
      const info = await smartContractManager.getContractInfo(contractAddress, currentChain.id);
      if (info) {
        setContractInfo(info);
      } else {
        setError('Contract not found or not supported');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getSelectedMethodInfo = () => {
    if (!contractInfo || !selectedMethod) return null;
    return contractInfo.methods.find(m => m.name === selectedMethod);
  };

  const isReadOnlyMethod = () => {
    const method = getSelectedMethodInfo();
    return method && (method.stateMutability === 'view' || method.stateMutability === 'pure');
  };

  const prepareMethodParams = (): any[] => {
    const method = getSelectedMethodInfo();
    if (!method) return [];

    return method.inputs.map(input => {
      const value = methodParams[input.name] || '';
      
      // Basic type conversion
      if (input.type.includes('uint') || input.type.includes('int')) {
        return value ? parseInt(value) : 0;
      } else if (input.type === 'bool') {
        return value.toLowerCase() === 'true';
      } else if (input.type.includes('[]')) {
        try {
          return JSON.parse(value || '[]');
        } catch {
          return [];
        }
      }
      
      return value;
    });
  };

  const executeMethod = async () => {
    if (!currentChain || !contractInfo || !selectedMethod || !activeConnection) return;

    setExecuting(true);
    setError(null);
    setResults(null);

    try {
      const method = getSelectedMethodInfo();
      if (!method) throw new Error('Method not found');

      const params = prepareMethodParams();
      
      if (isReadOnlyMethod()) {
        // Read-only method call
        const result = await smartContractManager.callContractMethod(
          contractAddress,
          contractInfo.abi,
          selectedMethod,
          params,
          currentChain.id
        );
        
        setResults({ type: 'read', data: result });
        
        toast({
          title: 'Contract Call Successful',
          description: `${selectedMethod} executed successfully`,
        });
      } else {
        // Transaction method
        const options: any = {};
        if (gasLimit) options.gasLimit = gasLimit;
        if (gasPrice) options.gasPrice = gasPrice;
        if (transactionValue) options.value = transactionValue;

        const transaction: TransactionResult = await smartContractManager.sendContractTransaction(
          contractAddress,
          contractInfo.abi,
          selectedMethod,
          params,
          currentChain.id,
          options
        );
        
        setResults({ type: 'transaction', data: transaction });
        
        // Start monitoring the transaction
        await startMonitoring(transaction);
        
        toast({
          title: 'Transaction Sent',
          description: `Transaction ${formatAddress(transaction.hash)} submitted`,
        });
      }
    } catch (err: any) {
      setError(err.message);
      toast({
        title: 'Execution Failed',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setExecuting(false);
    }
  };

  if (!currentChain) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <FileCode className="w-8 h-8 mx-auto mb-2" />
            <p>Connect to a blockchain to interact with smart contracts</p>
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
            <FileCode className="w-8 h-8 mx-auto mb-2" />
            <p>Smart contract interaction is only available for Ethereum-based chains</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Contract Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCode className="w-5 h-5" />
            Smart Contract Interface
          </CardTitle>
          <CardDescription>
            Interact with smart contracts on {currentChain.displayName}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="contractAddress">Contract Address</Label>
            <div className="flex gap-2">
              <Input
                id="contractAddress"
                placeholder="0x..."
                value={contractAddress}
                onChange={(e) => setContractAddress(e.target.value)}
              />
              <Button onClick={loadContractInfo} disabled={!contractAddress || loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Load'}
              </Button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {contractInfo && (
            <div className="space-y-4">
              <div className="p-4 bg-accent rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{contractInfo.name || 'Unknown Contract'}</h3>
                  <Badge variant="outline">{contractInfo.symbol || 'N/A'}</Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  <div>Address: {formatAddress(contractInfo.address)}</div>
                  <div>Methods: {contractInfo.methods.length}</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Method Execution */}
      {contractInfo && (
        <Tabs defaultValue="execute" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="execute">Execute Method</TabsTrigger>
            <TabsTrigger value="estimate">Gas Estimation</TabsTrigger>
          </TabsList>

          {/* Execute Tab */}
          <TabsContent value="execute">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="w-5 h-5" />
                  Method Execution
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Method Selection */}
                <div>
                  <Label>Select Method</Label>
                  <Select value={selectedMethod} onValueChange={setSelectedMethod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a method" />
                    </SelectTrigger>
                    <SelectContent>
                      {contractInfo.methods.map((method) => (
                        <SelectItem key={method.name} value={method.name}>
                          <div className="flex items-center gap-2">
                            {method.stateMutability === 'view' || method.stateMutability === 'pure' ? (
                              <Eye className="w-3 h-3 text-blue-500" />
                            ) : (
                              <Settings className="w-3 h-3 text-orange-500" />
                            )}
                            <span>{method.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {method.stateMutability}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Method Parameters */}
                {getSelectedMethodInfo() && (
                  <div className="space-y-3">
                    <Label>Method Parameters</Label>
                    {getSelectedMethodInfo()!.inputs.length === 0 ? (
                      <div className="text-sm text-muted-foreground">No parameters required</div>
                    ) : (
                      <div className="space-y-3">
                        {getSelectedMethodInfo()!.inputs.map((input, index) => (
                          <div key={index} className="space-y-1">
                            <Label htmlFor={`param-${index}`}>
                              {input.name} ({input.type})
                            </Label>
                            <Input
                              id={`param-${index}`}
                              placeholder={`Enter ${input.type} value`}
                              value={methodParams[input.name] || ''}
                              onChange={(e) => setMethodParams(prev => ({
                                ...prev,
                                [input.name]: e.target.value,
                              }))}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Transaction Settings (for non-read methods) */}
                {!isReadOnlyMethod() && (
                  <div className="space-y-3">
                    <Separator />
                    <Label>Transaction Settings</Label>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <Label htmlFor="value">Value ({currentChain.nativeCurrency.symbol})</Label>
                        <Input
                          id="value"
                          type="number"
                          placeholder="0"
                          value={transactionValue}
                          onChange={(e) => setTransactionValue(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="gasLimit">Gas Limit</Label>
                        <Input
                          id="gasLimit"
                          placeholder="Auto"
                          value={gasLimit}
                          onChange={(e) => setGasLimit(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="gasPrice">Gas Price (gwei)</Label>
                        <Input
                          id="gasPrice"
                          placeholder="Auto"
                          value={gasPrice}
                          onChange={(e) => setGasPrice(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Execute Button */}
                <Button
                  onClick={executeMethod}
                  disabled={!selectedMethod || executing || !activeConnection}
                  className="w-full"
                >
                  {executing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {isReadOnlyMethod() ? 'Calling...' : 'Sending Transaction...'}
                    </>
                  ) : (
                    <>
                      {isReadOnlyMethod() ? (
                        <Eye className="w-4 h-4 mr-2" />
                      ) : (
                        <Play className="w-4 h-4 mr-2" />
                      )}
                      {isReadOnlyMethod() ? 'Call Method' : 'Execute Transaction'}
                    </>
                  )}
                </Button>

                {/* Results */}
                {results && (
                  <div className="space-y-3">
                    <Separator />
                    <div className="flex items-center gap-2 text-green-700">
                      <CheckCircle className="w-4 h-4" />
                      <span className="font-medium">
                        {results.type === 'read' ? 'Call Result' : 'Transaction Submitted'}
                      </span>
                    </div>

                    {results.type === 'read' ? (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <Textarea
                          value={JSON.stringify(results.data, null, 2)}
                          readOnly
                          className="min-h-[100px] font-mono text-sm"
                        />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div>
                            <div className="font-medium">Transaction Hash</div>
                            <code className="text-sm text-muted-foreground">
                              {formatAddress(results.data.hash)}
                            </code>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigator.clipboard.writeText(results.data.hash)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const url = getChainExplorerUrl(
                                  currentChain.id,
                                  'tx',
                                  results.data.hash
                                );
                                if (url) window.open(url, '_blank');
                              }}
                            >
                              <ExternalLink className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Gas Estimation Tab */}
          <TabsContent value="estimate">
            <GasEstimator
              contractAddress={contractAddress}
              methodName={selectedMethod}
              params={prepareMethodParams()}
              value={transactionValue}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};