import { ethers } from 'ethers';
import { web3ConnectionManager } from './web3Utils';
import { smartContractManager } from './contractUtils';
import { getChainById } from '@/config/chains';

export interface GasEstimate {
  gasLimit: string;
  gasPrice: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  estimatedCost: string;
  estimatedCostUSD?: number;
  type: 'legacy' | 'eip1559';
}

export interface FeeData {
  gasPrice?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
}

export class GasEstimationManager {
  // Native token prices (mock data - in real app, fetch from API)
  private static TOKEN_PRICES: Record<string, number> = {
    ETH: 2000,
    MATIC: 0.8,
    SOL: 100,
    ADA: 0.5,
  };

  // Estimate gas for a contract transaction
  async estimateContractGas(
    contractAddress: string,
    abi: any[],
    methodName: string,
    params: any[] = [],
    chainId: string,
    value = '0'
  ): Promise<GasEstimate> {
    const provider = await web3ConnectionManager.getProvider(chainId);
    if (!provider || provider.type !== 'ethereum') {
      throw new Error('Ethereum provider not available');
    }

    try {
      const contract = await smartContractManager.getContract(contractAddress, abi, chainId, true);
      if (!contract) {
        throw new Error('Contract not available');
      }

      // Estimate gas limit
      const estimatedGas = await contract[methodName].estimateGas(...params, {
        value: value !== '0' ? ethers.parseEther(value) : 0,
      });

      // Get current fee data
      const feeData = await provider.provider.getFeeData();
      
      // Add 20% buffer to gas estimate
      const gasLimit = (estimatedGas * BigInt(120)) / BigInt(100);

      return this.calculateGasCosts(gasLimit, feeData, chainId);
    } catch (error: any) {
      console.error('Gas estimation failed:', error);
      throw new Error(`Gas estimation failed: ${error.message}`);
    }
  }

  // Estimate gas for a simple transfer
  async estimateTransferGas(
    toAddress: string,
    amount: string,
    chainId: string
  ): Promise<GasEstimate> {
    const provider = await web3ConnectionManager.getProvider(chainId);
    if (!provider || provider.type !== 'ethereum') {
      throw new Error('Ethereum provider not available');
    }

    try {
      const signer = provider.signer;
      if (!signer) {
        throw new Error('Signer not available');
      }

      const fromAddress = await signer.getAddress();
      
      // Estimate gas for transfer
      const estimatedGas = await provider.provider.estimateGas({
        from: fromAddress,
        to: toAddress,
        value: ethers.parseEther(amount),
      });

      const feeData = await provider.provider.getFeeData();
      
      // Add 10% buffer for simple transfers
      const gasLimit = (estimatedGas * BigInt(110)) / BigInt(100);

      return this.calculateGasCosts(gasLimit, feeData, chainId);
    } catch (error: any) {
      console.error('Transfer gas estimation failed:', error);
      throw new Error(`Transfer gas estimation failed: ${error.message}`);
    }
  }

  // Calculate gas costs and format estimate
  private calculateGasCosts(gasLimit: bigint, feeData: FeeData, chainId: string): GasEstimate {
    const chain = getChainById(chainId);
    const isEIP1559 = feeData.maxFeePerGas && feeData.maxPriorityFeePerGas;

    let estimate: GasEstimate;

    if (isEIP1559) {
      const maxFeePerGas = feeData.maxFeePerGas!;
      const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas!;
      const estimatedCost = gasLimit * maxFeePerGas;

      estimate = {
        gasLimit: gasLimit.toString(),
        gasPrice: maxFeePerGas.toString(),
        maxFeePerGas: maxFeePerGas.toString(),
        maxPriorityFeePerGas: maxPriorityFeePerGas.toString(),
        estimatedCost: ethers.formatEther(estimatedCost),
        type: 'eip1559',
      };
    } else {
      const gasPrice = feeData.gasPrice || BigInt(0);
      const estimatedCost = gasLimit * gasPrice;

      estimate = {
        gasLimit: gasLimit.toString(),
        gasPrice: gasPrice.toString(),
        estimatedCost: ethers.formatEther(estimatedCost),
        type: 'legacy',
      };
    }

    // Add USD estimate if we have price data
    if (chain) {
      const tokenPrice = GasEstimationManager.TOKEN_PRICES[chain.nativeCurrency.symbol];
      if (tokenPrice) {
        estimate.estimatedCostUSD = parseFloat(estimate.estimatedCost) * tokenPrice;
      }
    }

    return estimate;
  }

  // Get current gas prices for a chain
  async getCurrentGasPrices(chainId: string): Promise<{
    slow: GasEstimate;
    standard: GasEstimate;
    fast: GasEstimate;
  } | null> {
    const provider = await web3ConnectionManager.getProvider(chainId);
    if (!provider || provider.type !== 'ethereum') {
      return null;
    }

    try {
      const feeData = await provider.provider.getFeeData();
      const standardGasLimit = BigInt(21000); // Standard transfer gas limit

      const isEIP1559 = feeData.maxFeePerGas && feeData.maxPriorityFeePerGas;

      if (isEIP1559) {
        const maxFeePerGas = feeData.maxFeePerGas!;
        const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas!;
        
        return {
          slow: this.calculateGasCosts(
            standardGasLimit,
            {
              maxFeePerGas: maxFeePerGas - maxPriorityFeePerGas / BigInt(2),
              maxPriorityFeePerGas: maxPriorityFeePerGas / BigInt(2),
            },
            chainId
          ),
          standard: this.calculateGasCosts(standardGasLimit, feeData, chainId),
          fast: this.calculateGasCosts(
            standardGasLimit,
            {
              maxFeePerGas: (maxFeePerGas * BigInt(12)) / BigInt(10),
              maxPriorityFeePerGas: (maxPriorityFeePerGas * BigInt(15)) / BigInt(10),
            },
            chainId
          ),
        };
      } else {
        const gasPrice = feeData.gasPrice || BigInt(0);
        
        return {
          slow: this.calculateGasCosts(
            standardGasLimit,
            { gasPrice: (gasPrice * BigInt(8)) / BigInt(10) },
            chainId
          ),
          standard: this.calculateGasCosts(standardGasLimit, feeData, chainId),
          fast: this.calculateGasCosts(
            standardGasLimit,
            { gasPrice: (gasPrice * BigInt(12)) / BigInt(10) },
            chainId
          ),
        };
      }
    } catch (error) {
      console.error('Failed to get gas prices:', error);
      return null;
    }
  }

  // Get recommended gas settings based on priority
  getRecommendedGas(
    estimate: GasEstimate,
    priority: 'slow' | 'standard' | 'fast' = 'standard'
  ): Partial<GasEstimate> {
    const multipliers = {
      slow: 0.9,
      standard: 1.0,
      fast: 1.2,
    };

    const multiplier = multipliers[priority];

    if (estimate.type === 'eip1559' && estimate.maxFeePerGas && estimate.maxPriorityFeePerGas) {
      return {
        gasLimit: estimate.gasLimit,
        maxFeePerGas: (BigInt(estimate.maxFeePerGas) * BigInt(Math.floor(multiplier * 100)) / BigInt(100)).toString(),
        maxPriorityFeePerGas: (BigInt(estimate.maxPriorityFeePerGas) * BigInt(Math.floor(multiplier * 100)) / BigInt(100)).toString(),
        type: 'eip1559',
      };
    } else {
      return {
        gasLimit: estimate.gasLimit,
        gasPrice: (BigInt(estimate.gasPrice) * BigInt(Math.floor(multiplier * 100)) / BigInt(100)).toString(),
        type: 'legacy',
      };
    }
  }

  // Validate if user has enough balance for transaction
  async validateBalance(
    userAddress: string,
    amount: string,
    gasEstimate: GasEstimate,
    chainId: string
  ): Promise<{
    hasEnoughForAmount: boolean;
    hasEnoughForGas: boolean;
    hasEnoughForTotal: boolean;
    currentBalance: string;
    requiredBalance: string;
  }> {
    const provider = await web3ConnectionManager.getProvider(chainId);
    if (!provider || provider.type !== 'ethereum') {
      throw new Error('Ethereum provider not available');
    }

    try {
      const balance = await provider.provider.getBalance(userAddress);
      const balanceEther = ethers.formatEther(balance);
      
      const amountBigInt = ethers.parseEther(amount);
      const gasBigInt = ethers.parseEther(gasEstimate.estimatedCost);
      const totalBigInt = amountBigInt + gasBigInt;
      const totalEther = ethers.formatEther(totalBigInt);

      return {
        hasEnoughForAmount: balance >= amountBigInt,
        hasEnoughForGas: balance >= gasBigInt,
        hasEnoughForTotal: balance >= totalBigInt,
        currentBalance: balanceEther,
        requiredBalance: totalEther,
      };
    } catch (error) {
      console.error('Balance validation failed:', error);
      throw new Error('Balance validation failed');
    }
  }

  // Format gas estimate for display
  formatGasEstimate(estimate: GasEstimate): {
    gasLimit: string;
    gasPrice: string;
    estimatedCost: string;
    estimatedCostUSD?: string;
  } {
    const gasPrice = estimate.type === 'eip1559' && estimate.maxFeePerGas
      ? ethers.formatUnits(estimate.maxFeePerGas, 'gwei')
      : ethers.formatUnits(estimate.gasPrice, 'gwei');

    return {
      gasLimit: parseInt(estimate.gasLimit).toLocaleString(),
      gasPrice: parseFloat(gasPrice).toFixed(2) + ' gwei',
      estimatedCost: parseFloat(estimate.estimatedCost).toFixed(6),
      estimatedCostUSD: estimate.estimatedCostUSD 
        ? '$' + estimate.estimatedCostUSD.toFixed(2)
        : undefined,
    };
  }
}

// Export singleton instance
export const gasEstimationManager = new GasEstimationManager();