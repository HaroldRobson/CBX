'use client';

import React, { useState } from 'react';
import { useContracts } from '../../hooks/useContracts';
import type { Pool, PoolSummary, ProjectMetadata } from '../../types';

interface PortfolioCardProps {
  pool: Pool;
  summary: PoolSummary;
  metadata: ProjectMetadata;
}

const PortfolioCard: React.FC<PortfolioCardProps> = ({ pool, summary, metadata }) => {
  const { retireCredits } = useContracts();
  const [retiring, setRetiring] = useState(false);
  const [retireAmount, setRetireAmount] = useState('');

  const amountOwned = parseInt(summary.userBalance) / 100;
  const currentPrice = parseInt(summary.pricePerTokenWithFee) / 1000000;
  const currentValue = amountOwned * currentPrice;

  // Mock data for purchase date and price paid
  const purchaseDate = 'Mar 15, 2024';
  const pricePaid = '$11.50';

  const handleRetire = async () => {
    if (!retireAmount || retiring) return;

    try {
      setRetiring(true);
      const amountTokens = Math.floor(parseFloat(retireAmount) * 100);
      await retireCredits(pool.poolAddress, amountTokens);
      alert('Retirement successful!');
      setRetireAmount('');
    } catch (error) {
      console.error('Retirement failed:', error);
      alert('Retirement failed. Please try again.');
    } finally {
      setRetiring(false);
    }
  };

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-semibold text-white mb-1">{metadata.name}</h3>
          <p className="text-slate-400 text-sm">Developed by {metadata.developer}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-white">{amountOwned.toFixed(2)}</p>
          <p className="text-slate-400 text-sm">Tonnes</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <p className="text-slate-400 text-sm">Purchase Date</p>
          <p className="text-white">{purchaseDate}</p>
        </div>
        <div>
          <p className="text-slate-400 text-sm">Price Paid</p>
          <p className="text-white">{pricePaid}</p>
        </div>
        <div>
          <p className="text-slate-400 text-sm">Current Value</p>
          <p className="text-green-400 font-medium">${currentValue.toFixed(2)} USDC</p>
        </div>
        <div>
          <p className="text-slate-400 text-sm">Project Type</p>
          <p className="text-white">{metadata.registry}</p>
        </div>
      </div>

      <div className="flex space-x-3">
        <input
          type="number"
          value={retireAmount}
          onChange={(e) => setRetireAmount(e.target.value)}
          placeholder="Amount to retire"
          max={amountOwned}
          className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-green-500 transition-colors"
        />
        <button
          onClick={handleRetire}
          disabled={!retireAmount || retiring || parseFloat(retireAmount) > amountOwned}
          className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {retiring ? 'Retiring...' : 'Retire Credits'}
        </button>
      </div>
    </div>
  );
};

export default PortfolioCard;