import { ethers } from 'ethers';
import { web3ConnectionManager, Web3Provider } from './web3Utils';
import { ChainConfig } from '@/config/chains';

export interface ContractMethod {
  name: string;
  inputs: any[];
  outputs: any[];
  stateMutability: 'pure' | 'view' | 'nonpayable' | 'payable';
}

export interface ContractInfo {
  address: string;
  abi: any[];
  chainId: string;
  name?: string;
  symbol?: string;
  methods: ContractMethod[];
}

export interface TransactionOptions {
  gasLimit?: string | number;
  gasPrice?: string;
  value?: string;
  nonce?: number;
}

export interface TransactionResult {
  hash: string;
  chainId: string;
  from: string;
  to: string;
  value: string;
  gasLimit: string;
  gasPrice?: string;
  status: 'pending' | 'confirmed' | 'failed';
  blockNumber?: number;
  confirmations?: number;
  timestamp: Date;
}

export class SmartContractManager {
  // Standard ERC-721 ABI (minimal)
  private static ERC721_ABI = [
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function totalSupply() view returns (uint256)',
    'function balanceOf(address owner) view returns (uint256)',
    'function ownerOf(uint256 tokenId) view returns (address)',
    'function tokenURI(uint256 tokenId) view returns (string)',
    'function approve(address to, uint256 tokenId)',
    'function getApproved(uint256 tokenId) view returns (address)',
    'function setApprovalForAll(address operator, bool approved)',
    'function isApprovedForAll(address owner, address operator) view returns (bool)',
    'function transferFrom(address from, address to, uint256 tokenId)',
    'function safeTransferFrom(address from, address to, uint256 tokenId)',
    'function safeTransferFrom(address from, address to, uint256 tokenId, bytes data)',
    'function mint(address to, string uri) returns (uint256)',
    'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
    'event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)',
    'event ApprovalForAll(address indexed owner, address indexed operator, bool approved)',
  ];

  // Standard ERC-20 ABI (minimal)
  private static ERC20_ABI = [
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function decimals() view returns (uint8)',
    'function totalSupply() view returns (uint256)',
    'function balanceOf(address account) view returns (uint256)',
    'function transfer(address recipient, uint256 amount) returns (bool)',
    'function allowance(address owner, address spender) view returns (uint256)',
    'function approve(address spender, uint256 amount) returns (bool)',
    'function transferFrom(address sender, address recipient, uint256 amount) returns (bool)',
    'event Transfer(address indexed from, address indexed to, uint256 value)',
    'event Approval(address indexed owner, address indexed spender, uint256 value)',
  ];

  // Get contract instance
  async getContract(
    address: string,
    abi: any[],
    chainId: string,
    withSigner = false
  ): Promise<ethers.Contract | null> {
    const provider = await web3ConnectionManager.getProvider(chainId);
    if (!provider || provider.type !== 'ethereum') {
      throw new Error('Ethereum provider not available');
    }

    try {
      const contractProvider = withSigner && provider.signer ? provider.signer : provider.provider;
      return new ethers.Contract(address, abi, contractProvider);
    } catch (error) {
      console.error('Failed to create contract instance:', error);
      return null;
    }
  }

  // Get contract info (name, symbol, methods)
  async getContractInfo(address: string, chainId: string): Promise<ContractInfo | null> {
    try {
      // Try ERC-721 first, then ERC-20
      let contract = await this.getContract(address, SmartContractManager.ERC721_ABI, chainId);
      let isERC721 = false;
      
      if (contract) {
        try {
          await contract.name();
          await contract.symbol();
          await contract.totalSupply();
          isERC721 = true;
        } catch {
          // Not ERC-721, try ERC-20
          contract = await this.getContract(address, SmartContractManager.ERC20_ABI, chainId);
        }
      }

      if (!contract) {
        return null;
      }

      const [name, symbol] = await Promise.all([
        contract.name().catch(() => 'Unknown'),
        contract.symbol().catch(() => 'UNK'),
      ]);

      const abi = isERC721 ? SmartContractManager.ERC721_ABI : SmartContractManager.ERC20_ABI;
      const methods = this.parseContractMethods(abi);

      return {
        address,
        abi,
        chainId,
        name,
        symbol,
        methods,
      };
    } catch (error) {
      console.error('Failed to get contract info:', error);
      return null;
    }
  }

  // Parse contract methods from ABI
  private parseContractMethods(abi: any[]): ContractMethod[] {
    return abi
      .filter(item => item.type === 'function')
      .map(func => ({
        name: func.name,
        inputs: func.inputs || [],
        outputs: func.outputs || [],
        stateMutability: func.stateMutability || 'nonpayable',
      }));
  }

  // Call contract method (read-only)
  async callContractMethod(
    address: string,
    abi: any[],
    methodName: string,
    params: any[] = [],
    chainId: string
  ): Promise<any> {
    const contract = await this.getContract(address, abi, chainId, false);
    if (!contract) {
      throw new Error('Contract not available');
    }

    try {
      return await contract[methodName](...params);
    } catch (error: any) {
      console.error('Contract call failed:', error);
      throw new Error(`Contract call failed: ${error.message}`);
    }
  }

  // Send contract transaction
  async sendContractTransaction(
    address: string,
    abi: any[],
    methodName: string,
    params: any[] = [],
    chainId: string,
    options: TransactionOptions = {}
  ): Promise<TransactionResult> {
    const contract = await this.getContract(address, abi, chainId, true);
    if (!contract) {
      throw new Error('Contract or signer not available');
    }

    try {
      const txOptions: any = {};
      if (options.gasLimit) txOptions.gasLimit = options.gasLimit;
      if (options.gasPrice) txOptions.gasPrice = options.gasPrice;
      if (options.value) txOptions.value = ethers.parseEther(options.value);
      if (options.nonce) txOptions.nonce = options.nonce;

      const tx = await contract[methodName](...params, txOptions);
      
      return {
        hash: tx.hash,
        chainId,
        from: tx.from,
        to: tx.to,
        value: tx.value?.toString() || '0',
        gasLimit: tx.gasLimit?.toString() || '0',
        gasPrice: tx.gasPrice?.toString(),
        status: 'pending',
        timestamp: new Date(),
      };
    } catch (error: any) {
      console.error('Transaction failed:', error);
      throw new Error(`Transaction failed: ${error.message}`);
    }
  }

  // NFT specific methods
  async mintNFT(
    contractAddress: string,
    toAddress: string,
    tokenURI: string,
    chainId: string,
    options: TransactionOptions = {}
  ): Promise<TransactionResult> {
    return this.sendContractTransaction(
      contractAddress,
      SmartContractManager.ERC721_ABI,
      'mint',
      [toAddress, tokenURI],
      chainId,
      options
    );
  }

  async transferNFT(
    contractAddress: string,
    fromAddress: string,
    toAddress: string,
    tokenId: string | number,
    chainId: string,
    options: TransactionOptions = {}
  ): Promise<TransactionResult> {
    return this.sendContractTransaction(
      contractAddress,
      SmartContractManager.ERC721_ABI,
      'safeTransferFrom',
      [fromAddress, toAddress, tokenId],
      chainId,
      options
    );
  }

  async approveNFT(
    contractAddress: string,
    toAddress: string,
    tokenId: string | number,
    chainId: string,
    options: TransactionOptions = {}
  ): Promise<TransactionResult> {
    return this.sendContractTransaction(
      contractAddress,
      SmartContractManager.ERC721_ABI,
      'approve',
      [toAddress, tokenId],
      chainId,
      options
    );
  }

  // Get NFT info
  async getNFTInfo(
    contractAddress: string,
    tokenId: string | number,
    chainId: string
  ): Promise<{
    owner: string;
    tokenURI: string;
    approved: string;
  } | null> {
    try {
      const contract = await this.getContract(
        contractAddress,
        SmartContractManager.ERC721_ABI,
        chainId,
        false
      );

      if (!contract) return null;

      const [owner, tokenURI, approved] = await Promise.all([
        contract.ownerOf(tokenId),
        contract.tokenURI(tokenId),
        contract.getApproved(tokenId),
      ]);

      return {
        owner,
        tokenURI,
        approved,
      };
    } catch (error) {
      console.error('Failed to get NFT info:', error);
      return null;
    }
  }

  // Get user's NFT balance
  async getNFTBalance(
    contractAddress: string,
    userAddress: string,
    chainId: string
  ): Promise<number> {
    try {
      const balance = await this.callContractMethod(
        contractAddress,
        SmartContractManager.ERC721_ABI,
        'balanceOf',
        [userAddress],
        chainId
      );
      return parseInt(balance.toString());
    } catch (error) {
      console.error('Failed to get NFT balance:', error);
      return 0;
    }
  }

  // Token specific methods (ERC-20)
  async getTokenBalance(
    contractAddress: string,
    userAddress: string,
    chainId: string
  ): Promise<{ balance: string; decimals: number }> {
    try {
      const contract = await this.getContract(
        contractAddress,
        SmartContractManager.ERC20_ABI,
        chainId,
        false
      );

      if (!contract) {
        throw new Error('Token contract not available');
      }

      const [balance, decimals] = await Promise.all([
        contract.balanceOf(userAddress),
        contract.decimals(),
      ]);

      return {
        balance: balance.toString(),
        decimals: parseInt(decimals.toString()),
      };
    } catch (error) {
      console.error('Failed to get token balance:', error);
      return { balance: '0', decimals: 18 };
    }
  }

  async transferToken(
    contractAddress: string,
    toAddress: string,
    amount: string,
    chainId: string,
    options: TransactionOptions = {}
  ): Promise<TransactionResult> {
    return this.sendContractTransaction(
      contractAddress,
      SmartContractManager.ERC20_ABI,
      'transfer',
      [toAddress, ethers.parseEther(amount)],
      chainId,
      options
    );
  }
}

// Export singleton instance
export const smartContractManager = new SmartContractManager();