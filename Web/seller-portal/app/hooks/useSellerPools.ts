'use client';

import { useState, useCallback } from 'react';

interface SellerPool {
  id: string;
  name: string;
  status: 'active' | 'pending' | 'inactive';
  amountSold: number;
  totalAmount: number;
  profitsEarned: number;
  imageUrl: string;
}

export const useSellerPools = () => {
  const [pools, setPools] = useState<SellerPool[]>([
    {
      id: '1',
      name: 'Amazon Conservation',
      status: 'active',
      amountSold: 2450,
      totalAmount: 5000,
      profitsEarned: 29400.00,
      imageUrl: 'https://images.pexels.com/photos/957024/forest-trees-perspective-bright-957024.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    {
      id: '2',
      name: 'Solar Energy Initiative',
      status: 'active',
      amountSold: 800,
      totalAmount: 3000,
      profitsEarned: 9680.00,
      imageUrl: 'https://images.pexels.com/photos/2800832/pexels-photo-2800832.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    {
      id: '3',
      name: 'Mangrove Restoration',
      status: 'active',
      amountSold: 1000,
      totalAmount: 1200,
      profitsEarned: 11350.00,
      imageUrl: 'https://images.pexels.com/photos/1108572/pexels-photo-1108572.jpeg?auto=compress&cs=tinysrgb&w=400'
    }
  ]);

  const withdrawProfits = useCallback(async (poolId: string) => {
    console.log('Mock: Withdrawing profits for pool', poolId);
    return new Promise<any>((resolve) => setTimeout(() => {
      console.log('Mock: Profits withdrawn successfully');
      // Update pool to show profits withdrawn
      setPools(prev => prev.map(pool => 
        pool.id === poolId 
          ? { ...pool, profitsEarned: 0 }
          : pool
      ));
      resolve({ hash: '0xMOCKWITHDRAW123' });
    }, 1200));
  }, []);

  const cancelPool = useCallback(async (poolId: string) => {
    console.log('Mock: Cancelling pool', poolId);
    return new Promise<any>((resolve) => setTimeout(() => {
      console.log('Mock: Pool cancelled successfully');
      // Update pool status to inactive
      setPools(prev => prev.map(pool => 
        pool.id === poolId 
          ? { ...pool, status: 'inactive' as const }
          : pool
      ));
      resolve({ hash: '0xMOCKCANCEL456' });
    }, 1000));
  }, []);

  const createNewPool = useCallback(async (poolData: any) => {
    console.log('Mock: Creating new pool', poolData);
    return new Promise<any>((resolve) => setTimeout(() => {
      console.log('Mock: Pool created successfully');
      const newPool: SellerPool = {
        id: Date.now().toString(),
        name: poolData.projectName,
        status: 'pending',
        amountSold: 0,
        totalAmount: parseInt(poolData.totalCredits) || 0,
        profitsEarned: 0,
        imageUrl: 'https://images.pexels.com/photos/957024/forest-trees-perspective-bright-957024.jpeg?auto=compress&cs=tinysrgb&w=400'
      };
      setPools(prev => [...prev, newPool]);
      resolve({ hash: '0xMOCKCREATE789', poolId: newPool.id });
    }, 1500));
  }, []);

  const getPoolsByStatus = useCallback((status: 'active' | 'pending' | 'inactive') => {
    return pools.filter(pool => pool.status === status);
  }, [pools]);

  const getTotalProfits = useCallback(() => {
    return pools.reduce((total, pool) => total + pool.profitsEarned, 0);
  }, [pools]);

  return {
    pools,
    withdrawProfits,
    cancelPool,
    createNewPool,
    getPoolsByStatus,
    getTotalProfits
  };
}; 