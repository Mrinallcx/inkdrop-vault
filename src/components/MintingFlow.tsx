import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Loader2, Coins, ExternalLink, Copy } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

type MintingStage = 'processing' | 'minting' | 'succeeding' | 'successful' | 'tokenized';

interface MintingFlowProps {
  formData: any;
  onComplete: () => void;
  onBack: () => void;
}

const MintingFlow: React.FC<MintingFlowProps> = ({ formData, onComplete, onBack }) => {
  const [currentStage, setCurrentStage] = useState<MintingStage>('processing');
  const [progress, setProgress] = useState(0);
  const [transactionHash, setTransactionHash] = useState('');
  const [tokenId, setTokenId] = useState('');
  const [contractAddress, setContractAddress] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const simulateMintingProcess = async () => {
      // Processing stage
      setCurrentStage('processing');
      setProgress(0);
      
      // Simulate processing (uploading metadata, preparing contract)
      for (let i = 0; i <= 25; i++) {
        setProgress(i);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Minting stage
      setCurrentStage('minting');
      for (let i = 25; i <= 60; i++) {
        setProgress(i);
        await new Promise(resolve => setTimeout(resolve, 150));
      }
      
      // Succeeding stage
      setCurrentStage('succeeding');
      for (let i = 60; i <= 85; i++) {
        setProgress(i);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Successful stage
      setCurrentStage('successful');
      for (let i = 85; i <= 95; i++) {
        setProgress(i);
        await new Promise(resolve => setTimeout(resolve, 80));
      }
      
      // Generate mock data
      setTransactionHash('0x1234567890abcdef1234567890abcdef12345678');
      setTokenId('12345');
      setContractAddress('0xabcdef1234567890abcdef1234567890abcdef12');
      
      // Tokenized stage
      setCurrentStage('tokenized');
      setProgress(100);
    };

    simulateMintingProcess();
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Address copied successfully",
    });
  };

  const getStageIcon = (stage: MintingStage) => {
    switch (stage) {
      case 'processing':
        return <Loader2 className="h-8 w-8 animate-spin text-primary" />;
      case 'minting':
        return <Coins className="h-8 w-8 animate-pulse text-primary" />;
      case 'succeeding':
        return <Loader2 className="h-8 w-8 animate-spin text-green-500" />;
      case 'successful':
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case 'tokenized':
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      default:
        return <Loader2 className="h-8 w-8 animate-spin text-primary" />;
    }
  };

  const getStageTitle = (stage: MintingStage) => {
    switch (stage) {
      case 'processing':
        return 'Processing Your NFT';
      case 'minting':
        return 'Minting on Blockchain';
      case 'succeeding':
        return 'Finalizing Transaction';
      case 'successful':
        return 'Minting Successful!';
      case 'tokenized':
        return 'NFT Successfully Tokenized!';
      default:
        return 'Processing...';
    }
  };

  const getStageDescription = (stage: MintingStage) => {
    switch (stage) {
      case 'processing':
        return 'Uploading metadata and preparing your NFT for minting...';
      case 'minting':
        return 'Creating your NFT on the blockchain. This may take a few moments...';
      case 'succeeding':
        return 'Confirming transaction and updating records...';
      case 'successful':
        return 'Your NFT has been successfully minted and is now on the blockchain!';
      case 'tokenized':
        return 'Congratulations! Your digital asset is now tokenized and ready to be traded.';
      default:
        return 'Processing your request...';
    }
  };

  if (currentStage === 'tokenized') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-8">
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="bg-green-100 dark:bg-green-900/20 p-4 rounded-full">
                  <CheckCircle className="h-16 w-16 text-green-500" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-foreground">NFT Successfully Tokenized!</h1>
                <p className="text-muted-foreground text-lg">
                  Your digital asset "{formData.assetTitle}" is now live on the blockchain
                </p>
              </div>

              <div className="bg-muted/50 rounded-lg p-6 space-y-4">
                <div className="grid gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Token ID</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">#{tokenId}</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(tokenId)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Contract</span>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-background px-2 py-1 rounded">
                        {contractAddress.slice(0, 10)}...{contractAddress.slice(-8)}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(contractAddress)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Transaction</span>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-background px-2 py-1 rounded">
                        {transactionHash.slice(0, 10)}...{transactionHash.slice(-8)}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(transactionHash)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Blockchain</span>
                    <Badge variant="outline">{formData.primaryChain || 'Ethereum'}</Badge>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button onClick={() => window.open('#', '_blank')} className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  View on Marketplace
                </Button>
                <Button variant="outline" onClick={onComplete}>
                  Create Another NFT
                </Button>
                <Button variant="ghost" onClick={onBack}>
                  Back to Details
                </Button>
              </div>
              
              <div className="text-xs text-muted-foreground">
                Your NFT is now tradeable and will appear in your wallet within a few minutes.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-lg">
        <CardContent className="p-8">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              {getStageIcon(currentStage)}
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">
                {getStageTitle(currentStage)}
              </h1>
              <p className="text-muted-foreground">
                {getStageDescription(currentStage)}
              </p>
            </div>

            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <div className="text-sm text-muted-foreground">
                {progress}% complete
              </div>
            </div>

            {(currentStage === 'processing' || currentStage === 'minting') && (
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="text-sm space-y-1">
                  <div className="font-medium">Asset: "{formData.assetTitle}"</div>
                  <div className="text-muted-foreground">Chain: {formData.primaryChain || 'Ethereum'}</div>
                  <div className="text-muted-foreground">Type: {formData.tokenStandard || 'ERC-721'}</div>
                </div>
              </div>
            )}

            {currentStage === 'successful' && (
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <div className="text-sm text-green-700 dark:text-green-300">
                  Transaction confirmed! Finalizing your NFT...
                </div>
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              Please don't close this window. The process will complete automatically.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MintingFlow;