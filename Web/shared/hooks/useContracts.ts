'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from './useWeb3';
import { FACTORY_ABI, CBX_ABI, USDC_ABI, FACTORY_ADDRESS, USDC_ADDRESS } from '../contracts/abis';
import type { Pool, PoolSummary, ProjectMetadata } from '../types';

// Toggle this to switch between mock-only mode and real contracts
const MOCK_MODE = true;

// Stable mock data - no randomness to prevent flickering
const MOCK_POOLS: Pool[] = [
  {
    status: 1,
    poolAddress: '0x0000000000000000000000000000000000000001',
    IPFS_URI: 'QmExampleHash1',
    seller: '0x0000000000000000000000000000000000000002',
    pricePerToken: '50000',
    deposit: '0',
    initialSupply: '500000',
    registry: 0,
  },
  {
    status: 1,
    poolAddress: '0x0000000000000000000000000000000000000003',
    IPFS_URI: 'QmExampleHash2',
    seller: '0x0000000000000000000000000000000000000004',
    pricePerToken: '35000',
    deposit: '0',
    initialSupply: '320000',
    registry: 1,
  },
  {
    status: 1,
    poolAddress: '0x0000000000000000000000000000000000000005',
    IPFS_URI: 'QmExampleHash3',
    seller: '0x0000000000000000000000000000000000000006',
    pricePerToken: '41000',
    deposit: '0',
    initialSupply: '280000',
    registry: 1,
  },
];

const MOCK_METADATA: Record<string, ProjectMetadata> = {
  QmExampleHash1: {
    name: 'Forest Ecosystem Restoration',
    developer: 'Rainforest Builder Ltd',
    country: 'Ghana',
    registry: 'Verra',
    issuanceDate: 'Jan 15, 2025',
    description: 'Restoring degraded forest ecosystems in Ghana',
    imageUrl: 'https://images.pexels.com/photos/957024/forest-trees-perspective-bright-957024.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  QmExampleHash2: {
    name: 'India Wind Power Project',
    developer: 'Hero Future Energies Ltd',
    country: 'India',
    registry: 'Gold Standard',
    issuanceDate: 'Mar 22, 2025',
    description: 'Clean wind energy generation in rural India',
    imageUrl: 'https://images.pexels.com/photos/414928/pexels-photo-414928.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  QmExampleHash3: {
    name: 'Rural Vietnam Solar Power',
    developer: 'Stepok Solar Power Company',
    country: 'Vietnam',
    registry: 'Gold Standard',
    issuanceDate: 'Feb 10, 2025',
    description: 'Solar power infrastructure for rural communities',
    imageUrl: 'https://images.pexels.com/photos/2800832/pexels-photo-2800832.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
};

// Stable mock values - deterministic based on pool address
const getMockValues = (poolAddress: string) => {
  const hash = poolAddress.slice(-4);
  const seed = parseInt(hash, 16) || 1;
  
  return {
    availableCredits: 5000 - (seed % 100), // 4900-5000 range
    pricePerCreditUSD: 10 + (seed % 500) / 100, // 10.00-14.99 range
    userOwnedCredits: (seed % 50) / 2, // 0-25 range
  };
};

export const useContracts = () => {
  const { provider, signer, account } = useWeb3();
  const [contracts, setContracts] = useState<{
    factory: ethers.Contract | null;
    usdc: ethers.Contract | null;
  }>({ factory: null, usdc: null });

  useEffect(() => {
    if (MOCK_MODE) return; // do not wire real contracts in mock mode
    if (provider && signer) {
      const factoryContract = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, signer);
      const usdcContract = new ethers.Contract(USDC_ADDRESS, USDC_ABI, signer);
      setContracts({ factory: factoryContract, usdc: usdcContract });
    }
  }, [provider, signer]);

  const fetchIPFSMetadata = async (ipfsHash: string): Promise<ProjectMetadata | null> => {
    if (MOCK_MODE) return MOCK_METADATA[ipfsHash] || null;
    try {
      const response = await fetch(`https://ipfs.io/ipfs/${ipfsHash}`);
      const metadata = await response.json();
      return metadata;
    } catch (error) {
      console.error('Error fetching IPFS metadata:', error);
      return null;
    }
  };

  const transformPoolData = useCallback(async (pool: Pool) => {
    // In mock mode, compute deterministic values from pool
    if (MOCK_MODE) {
      const metadata = await fetchIPFSMetadata(pool.IPFS_URI);
      const mockValues = getMockValues(pool.poolAddress);
      
      const poolSummary: PoolSummary = {
        name: metadata?.name || 'CBX Pool',
        symbol: 'CBX1',
        decimals: 2,
        totalSupply: pool.initialSupply,
        pricePerToken: pool.pricePerToken,
        pricePerTokenWithFee: (Number(pool.pricePerToken) * 1.03).toFixed(0),
        remainingSupply: String((mockValues.availableCredits * 100) | 0),
        seller: pool.seller,
        owner: '0x0000000000000000000000000000000000000000',
        status: 1,
        feeBps: '300',
        userBalance: String((mockValues.userOwnedCredits * 100) | 0),
      };
      
      return {
        pool,
        availableCredits: mockValues.availableCredits,
        pricePerCreditUSD: mockValues.pricePerCreditUSD,
        userOwnedCredits: mockValues.userOwnedCredits,
        metadata: metadata || {
          name: `Pool ${pool.poolAddress.slice(0, 8)}...`,
          developer: 'Unknown Developer',
          country: 'Unknown',
          registry: pool.registry === 0 ? 'Verra' : 'Gold Standard',
          issuanceDate: 'Unknown',
          description: 'No description available',
          imageUrl: '/placeholder.jpg',
        },
        poolSummary,
      };
    }

    const cbxContract = getCBXContract(pool.poolAddress);
    if (!cbxContract || !account) return null;
    try {
      const [reserves, priceWithFee, poolSummary, metadata] = await Promise.all([
        cbxContract.getReserves(),
        cbxContract.getUSDCPricePerCreditWithFee(),
        cbxContract.getPoolSummary(account),
        fetchIPFSMetadata(pool.IPFS_URI),
      ]);
      return {
        pool,
        availableCredits: Number(reserves) / 100,
        pricePerCreditUSD: Number(priceWithFee) / 1000000,
        userOwnedCredits: Number(poolSummary.userBalance) / 100,
        metadata: metadata || {
          name: `Pool ${pool.poolAddress.slice(0, 8)}...`,
          developer: 'Unknown Developer',
          country: 'Unknown',
          registry: pool.registry === 0 ? 'Verra' : 'Gold Standard',
          issuanceDate: 'Unknown',
          description: 'No description available',
          imageUrl: '/placeholder.jpg',
        },
        poolSummary,
      };
    } catch (error) {
      console.error('Error transforming pool data:', error);
      return null;
    }
  }, [account]);

  const getActivePools = useCallback(async (): Promise<Pool[]> => {
    if (MOCK_MODE) return MOCK_POOLS;
    if (!contracts.factory) return [];
    try {
      return await contracts.factory.getActivePools();
    } catch (error) {
      console.error('Error fetching active pools:', error);
      return [];
    }
  }, [contracts.factory]);

  const getAllPools = async (): Promise<Pool[]> => {
    if (MOCK_MODE) return MOCK_POOLS;
    if (!contracts.factory) return [];
    try {
      return await contracts.factory.getAllPools();
    } catch (error) {
      console.error('Error fetching all pools:', error);
      return [];
    }
  };

  const getCBXContract = (poolAddress: string) => {
    if (MOCK_MODE) return null;
    if (!signer) return null;
    return new ethers.Contract(poolAddress, CBX_ABI, signer);
  };

  const getPoolSummary = async (poolAddress: string): Promise<PoolSummary | null> => {
    if (MOCK_MODE) {
      const pool = MOCK_POOLS.find(p => p.poolAddress === poolAddress);
      if (!pool) return null;
      const transformed = await transformPoolData(pool);
      return transformed?.poolSummary || null;
    }
    const cbxContract = getCBXContract(poolAddress);
    if (!cbxContract || !account) return null;
    try {
      return await cbxContract.getPoolSummary(account);
    } catch (error) {
      console.error('Error fetching pool summary:', error);
      return null;
    }
  };

  const calculatePurchaseCost = async (poolAddress: string, amountInCredits: number) => {
    const amountOfTokens = Math.floor(amountInCredits * 100);
    if (MOCK_MODE) {
      // Use stable pricing based on pool
      const mockValues = getMockValues(poolAddress);
      const pricePerTokenWithFee = (mockValues.pricePerCreditUSD * 1000000) / 100; // Convert to per-token in USDC units
      const totalCost = amountOfTokens * pricePerTokenWithFee;
      return {
        amountOfTokens,
        totalCostInSmallestUnit: totalCost,
        totalCostInUSDC: totalCost / 1000000,
      };
    }
    const cbxContract = getCBXContract(poolAddress);
    if (!cbxContract) throw new Error('CBX contract not available');
    const pricePerTokenWithFee = await cbxContract.getUSDCPricePerTokenWithFee();
    const totalCost = amountOfTokens * Number(pricePerTokenWithFee);
    return {
      amountOfTokens,
      totalCostInSmallestUnit: totalCost,
      totalCostInUSDC: totalCost / 1000000,
    };
  };

  const approveUSDC = async (spenderAddress: string, amount: string) => {
    if (MOCK_MODE) {
      console.log('Mock: Approving USDC spending...', { spenderAddress, amount });
      return new Promise<any>((resolve) => setTimeout(() => {
        console.log('Mock: USDC approval successful');
        resolve({ hash: '0xMOCKAPPROVE123' });
      }, 800));
    }
    if (!contracts.usdc) throw new Error('USDC contract not available');
    const tx = await contracts.usdc.approve(spenderAddress, amount);
    return tx.wait();
  };

  const buyCredits = async (poolAddress: string, amountInCredits: number) => {
    if (MOCK_MODE) {
      console.log('Mock: Buying credits...', { poolAddress, amountInCredits });
      return new Promise<any>((resolve) => setTimeout(() => {
        console.log('Mock: Credit purchase successful');
        resolve({ hash: '0xMOCKBUY456' });
      }, 1000));
    }
    const cbxContract = getCBXContract(poolAddress);
    if (!cbxContract) throw new Error('CBX contract not available');
    const amountOfTokens = Math.floor(amountInCredits * 100);
    const tx = await cbxContract.buyTokensWithUSDC(amountOfTokens);
    return tx.wait();
  };

  const buyAndRetireCredits = async (poolAddress: string, amountInCredits: number) => {
    if (MOCK_MODE) {
      console.log('Mock: Buying and retiring credits...', { poolAddress, amountInCredits });
      return new Promise<any>((resolve) => setTimeout(() => {
        console.log('Mock: Buy and retire successful');
        resolve({ hash: '0xMOCKBUYRETIRE789' });
      }, 1200));
    }
    const cbxContract = getCBXContract(poolAddress);
    if (!cbxContract) throw new Error('CBX contract not available');
    const amountOfTokens = Math.floor(amountInCredits * 100);
    const retirementFee = await cbxContract.RETIREMET_GAS_FEE();
    const tx = await cbxContract.buyAndRetireTokensWithUSDC(amountOfTokens, { value: retirementFee });
    return tx.wait();
  };

  const retireCredits = async (poolAddress: string, amountInCredits: number) => {
    if (MOCK_MODE) {
      console.log('Mock: Retiring credits...', { poolAddress, amountInCredits });
      return new Promise<any>((resolve) => setTimeout(() => {
        console.log('Mock: Credit retirement successful');
        resolve({ hash: '0xMOCKRETIRE101' });
      }, 900));
    }
    const cbxContract = getCBXContract(poolAddress);
    if (!cbxContract) throw new Error('CBX contract not available');
    const amountOfTokens = Math.floor(amountInCredits * 100);
    const retirementFee = await cbxContract.RETIREMET_GAS_FEE();
    const tx = await cbxContract.retire(amountOfTokens, { value: retirementFee });
    return tx.wait();
  };

  const getUserPortfolio = useCallback(async () => {
    if (MOCK_MODE) {
      const transformed = await Promise.all(MOCK_POOLS.map(p => transformPoolData(p)));
      return transformed.filter(Boolean) as any[];
    }
    if (!account) return [];
    try {
      const allPools = await getAllPools();
      const items: any[] = [];
      for (const pool of allPools) {
        const cbxContract = getCBXContract(pool.poolAddress);
        if (!cbxContract) continue;
        const balance = await cbxContract.balanceOf(account);
        if (Number(balance) > 0) {
          const transformed = await transformPoolData(pool);
          if (transformed) items.push(transformed);
        }
      }
      return items;
    } catch (error) {
      console.error('Error fetching user portfolio:', error);
      return [];
    }
  }, [account, transformPoolData]);

  const checkUSDCAllowance = async (_spenderAddress: string) => {
    if (MOCK_MODE) return '1000000000000000000000000000000000000000'; // effectively infinite
    if (!contracts.usdc || !account) return '0';
    try {
      const allowance = await contracts.usdc.allowance(account, _spenderAddress);
      return allowance.toString();
    } catch (error) {
      console.error('Error checking USDC allowance:', error);
      return '0';
    }
  };

  const getUSDCBalance = async () => {
    if (MOCK_MODE) return '1250.00';
    if (!contracts.usdc || !account) return '0';
    try {
      const balance = await contracts.usdc.balanceOf(account);
      return (Number(balance) / 1000000).toFixed(2);
    } catch (error) {
      console.error('Error fetching USDC balance:', error);
      return '0';
    }
  };

  return {
    contracts,
    getActivePools,
    getAllPools,
    getPoolSummary,
    getCBXContract,
    transformPoolData,
    calculatePurchaseCost,
    approveUSDC,
    buyCredits,
    buyAndRetireCredits,
    retireCredits,
    getUserPortfolio,
    checkUSDCAllowance,
    getUSDCBalance,
    fetchIPFSMetadata,
  };
};