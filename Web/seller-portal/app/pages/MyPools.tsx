'use client';

import React, { useState } from 'react';
import { Filter, ArrowUpDown, X } from 'lucide-react';
import { useSellerPools } from '../hooks/useSellerPools';

interface Pool {
  id: string;
  name: string;
  status: 'active' | 'pending' | 'inactive';
  amountSold: number;
  totalAmount: number;
  profitsEarned: number;
  imageUrl: string;
}

const MyPools: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'active' | 'pending' | 'inactive'>('active');
  const { pools, withdrawProfits, cancelPool } = useSellerPools();
  const [loadingPool, setLoadingPool] = useState<string | null>(null);
  
  const filteredPools = pools.filter(pool => pool.status === activeTab);
  const getTabCount = (status: 'active' | 'pending' | 'inactive') => 
    pools.filter(pool => pool.status === status).length;

  const getProgressPercentage = (sold: number, total: number) => (sold / total) * 100;

  const handleWithdrawProfits = async (poolId: string) => {
    setLoadingPool(`withdraw-${poolId}`);
    try {
      await withdrawProfits(poolId);
      console.log('Profits withdrawn successfully');
    } catch (error) {
      console.error('Error withdrawing profits:', error);
    } finally {
      setLoadingPool(null);
    }
  };

  const handleCancelPool = async (poolId: string) => {
    if (window.confirm('Are you sure you want to cancel this pool? This action cannot be undone.')) {
      setLoadingPool(`cancel-${poolId}`);
      try {
        await cancelPool(poolId);
        console.log('Pool cancelled successfully');
      } catch (error) {
        console.error('Error cancelling pool:', error);
      } finally {
        setLoadingPool(null);
      }
    }
  };

  return (
    <div className="h-full flex flex-col" style={{backgroundColor: '#111827'}}>
      <div className="p-8">
        {/* Header with Filter and Sort */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">My Pools</h1>
          <div className="flex items-center space-x-4">
            <button className="flex items-center space-x-2 bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-600 transition-colors">
              <Filter size={16} />
              <span>Filter</span>
            </button>
            <button className="flex items-center space-x-2 bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-600 transition-colors">
              <ArrowUpDown size={16} />
              <span>Sort</span>
            </button>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex space-x-1 mb-8">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
              activeTab === 'active'
                ? 'text-white'
                : 'text-slate-400 hover:text-white'
            }`}
            style={{
              backgroundColor: activeTab === 'active' ? '#22c55e' : 'transparent'
            }}
          >
            <span>Active</span>
            <span className="bg-slate-600 text-white text-xs px-2 py-1 rounded-full">
              {getTabCount('active')}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
              activeTab === 'pending'
                ? 'text-white'
                : 'text-slate-400 hover:text-white'
            }`}
            style={{
              backgroundColor: activeTab === 'pending' ? '#22c55e' : 'transparent'
            }}
          >
            <span>Pending Approval</span>
            <span className="bg-slate-600 text-white text-xs px-2 py-1 rounded-full">
              {getTabCount('pending')}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('inactive')}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
              activeTab === 'inactive'
                ? 'text-white'
                : 'text-slate-400 hover:text-white'
            }`}
            style={{
              backgroundColor: activeTab === 'inactive' ? '#22c55e' : 'transparent'
            }}
          >
            <span>Inactive</span>
            <span className="bg-slate-600 text-white text-xs px-2 py-1 rounded-full">
              {getTabCount('inactive')}
            </span>
          </button>
        </div>

        {/* Pool Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPools.map((pool) => (
            <div key={pool.id} className="rounded-xl overflow-hidden border border-slate-700 shadow-lg" style={{backgroundColor: '#1F2937'}}>
              {/* Pool Header */}
              <div className="relative">
                <img
                  src={pool.imageUrl}
                  alt={pool.name}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-4 right-4">
                  <span className="px-3 py-1 rounded-full text-xs font-medium text-white" style={{backgroundColor: '#22c55e'}}>
                    Active
                  </span>
                </div>
              </div>

              {/* Pool Content */}
              <div className="p-6">
                <h3 className="text-xl font-semibold text-white mb-4">{pool.name}</h3>
                
                {/* Amount Sold Progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-400 text-sm">Amount Sold</span>
                    <span className="text-white font-medium">
                      {pool.amountSold.toLocaleString()} / {pool.totalAmount.toLocaleString()} Tonnes
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all duration-300" 
                      style={{
                        backgroundColor: '#22c55e',
                        width: `${getProgressPercentage(pool.amountSold, pool.totalAmount)}%`
                      }}
                    />
                  </div>
                </div>

                {/* Profits Earned */}
                <div className="mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-sm">Profits Earned</span>
                    <span className="font-semibold" style={{color: '#22c55e'}}>
                      ${pool.profitsEarned.toLocaleString(undefined, { minimumFractionDigits: 2 })} USDC
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <button 
                    onClick={() => handleWithdrawProfits(pool.id)}
                    disabled={loadingPool === `withdraw-${pool.id}` || pool.profitsEarned === 0}
                    className="flex-1 text-black py-2.5 px-3 rounded-lg hover:opacity-90 transition-all duration-200 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed" 
                    style={{backgroundColor: '#22c55e'}}
                  >
                    {loadingPool === `withdraw-${pool.id}` ? 'Withdrawing...' : 'Withdraw Profits'}
                  </button>
                  <button 
                    onClick={() => handleCancelPool(pool.id)}
                    disabled={loadingPool === `cancel-${pool.id}`}
                    className="flex-1 bg-slate-600 text-white px-3 py-2.5 rounded-lg hover:bg-slate-500 transition-all font-medium text-sm flex items-center justify-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <X size={14} />
                    <span>{loadingPool === `cancel-${pool.id}` ? 'Cancelling...' : 'Cancel Pool'}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredPools.length === 0 && (
          <div className="text-center py-16">
            <h3 className="text-xl font-semibold text-white mb-2">
              No {activeTab} pools found
            </h3>
            <p className="text-slate-400">
              {activeTab === 'active' && "You don't have any active pools yet."}
              {activeTab === 'pending' && "No pools are pending approval."}
              {activeTab === 'inactive' && "No inactive pools found."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyPools; 