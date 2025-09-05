'use client';

import React, { useState, useEffect } from 'react';
import { Info, Globe, Star } from 'lucide-react';
import { useContracts } from '../../hooks/useContracts';
import { useWeb3 } from '../../hooks/useWeb3';
import type { Pool, PoolSummary, ProjectMetadata } from '../../types';
import { mockProjectMetadata } from '../../utils/mockData';

interface ProjectCardProps {
  pool: Pool;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ pool }) => {
  const { getCBXContract, approveUSDC, buyCredits, buyAndRetireCredits } = useContracts();
  const { account, isConnected } = useWeb3();
  const [summary, setSummary] = useState<PoolSummary | null>(null);
  const [metadata, setMetadata] = useState<ProjectMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [amount, setAmount] = useState('1');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const cbxContract = getCBXContract(pool.poolAddress);
        if (!cbxContract) return;

        // Fetch pool summary
        if (account) {
          const poolSummary = await cbxContract.getPoolSummary(account);
          setSummary(poolSummary);
        }

        // Mock metadata based on pool address for demo
        const metadataKey = Object.keys(mockProjectMetadata)[Math.floor(Math.random() * Object.keys(mockProjectMetadata).length)];
        setMetadata(mockProjectMetadata[metadataKey]);
      } catch (error) {
        console.error('Error fetching pool data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isConnected) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [pool, account]);

  const handleBuyCredits = async () => {
    if (!isConnected || !summary) return;
    
    try {
      setPurchasing(true);
      const amountTokens = Math.floor(parseFloat(amount) * 100).toString();
      const cost = (parseInt(amountTokens) * parseInt(summary.pricePerTokenWithFee)).toString();
      
      // Step 1: Approve USDC
      await approveUSDC(pool.poolAddress, cost);
      
      // Step 2: Buy tokens
      await buyCredits(pool.poolAddress, amountTokens);
      
      alert('Purchase successful!');
    } catch (error) {
      console.error('Purchase failed:', error);
      alert('Purchase failed. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  const handleBuyAndRetire = async () => {
    if (!isConnected || !summary) return;
    
    try {
      setPurchasing(true);
      const amountTokens = Math.floor(parseFloat(amount) * 100).toString();
      const cost = (parseInt(amountTokens) * parseInt(summary.pricePerTokenWithFee)).toString();
      
      // Step 1: Approve USDC
      await approveUSDC(pool.poolAddress, cost);
      
      // Step 2: Buy and retire
      await buyAndRetireCredits(pool.poolAddress, amountTokens);
      
      alert('Purchase and retirement successful!');
    } catch (error) {
      console.error('Purchase and retirement failed:', error);
      alert('Transaction failed. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  if (loading || !summary || !metadata) {
    return (
      <div className="bg-slate-800 rounded-xl p-6 animate-pulse border border-slate-700">
        <div className="w-full h-48 bg-slate-700 rounded-lg mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-slate-700 rounded w-3/4"></div>
          <div className="h-4 bg-slate-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  const available = parseInt(summary.remainingSupply) / 100;
  const price = parseInt(summary.pricePerTokenWithFee) / 1000000;
  const userOwned = parseInt(summary.userBalance) / 100;

  return (
    <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 hover:border-slate-600 transition-all duration-200 shadow-lg">
      <div className="relative">
        <img
          src={metadata.imageUrl}
          alt={metadata.name}
          className="w-full h-48 object-cover"
        />
        <div className="absolute top-4 right-4">
          <button className="p-2 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-70 transition-all">
            <Info size={16} />
          </button>
        </div>
      </div>
      
      <div className="p-6">
        <h3 className="text-xl font-semibold text-white mb-2">{metadata.name}</h3>
        <p className="text-slate-400 text-sm mb-4">Developed by {metadata.developer}</p>
        
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex items-center space-x-2">
            <Globe className="text-slate-400" size={14} />
            <span className="text-slate-300 text-sm">{metadata.country}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Star className="text-slate-400" size={14} />
            <span className="text-slate-300 text-sm">{metadata.registry}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-slate-400 text-sm">Issuance Date</p>
            <p className="text-white font-medium">{metadata.issuanceDate}</p>
          </div>
          <div>
            <p className="text-slate-400 text-sm">Price/Credit</p>
            <p className="text-green-400 font-medium">${price.toFixed(2)} USDC</p>
          </div>
          <div>
            <p className="text-slate-400 text-sm">Available</p>
            <p className="text-white font-medium">{available.toLocaleString()} Tonnes</p>
          </div>
          <div>
            <p className="text-slate-400 text-sm">You Own</p>
            <p className="text-white font-medium">{userOwned} Tonnes</p>
          </div>
        </div>

        <div className="mb-4">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount to buy"
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-green-500 transition-colors"
          />
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handleBuyCredits}
            disabled={!isConnected || purchasing}
            className="flex-1 bg-green-600 text-white py-2.5 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
          >
            {purchasing ? 'Processing...' : 'Buy Credits'}
          </button>
          <button
            onClick={handleBuyAndRetire}
            disabled={!isConnected || purchasing}
            className="flex-1 bg-transparent border border-green-600 text-green-400 py-2.5 px-4 rounded-lg hover:bg-green-600 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
          >
            {purchasing ? 'Processing...' : 'Buy & Retire'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;