'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { useContracts } from '../hooks/useContracts';
import { useWeb3 } from '../hooks/useWeb3';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import RetireModal from '../components/UI/RetireModal';
import PurchaseModal from '../components/UI/PurchaseModal';
import type { Pool, PoolSummary } from '../types';
import { useRouter } from 'next/navigation';

interface PortfolioItem {
  pool: Pool;
  availableCredits: number;
  pricePerCreditUSD: number;
  userOwnedCredits: number;
  metadata: {
    name: string;
    developer: string;
    country: string;
    registry: string;
    issuanceDate: string;
    description: string;
    imageUrl: string;
  };
  poolSummary: PoolSummary;
}

const ViewCredits: React.FC = () => {
  const { getUserPortfolio } = useContracts();
  const { isConnected, account } = useWeb3();
  const router = useRouter();
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCredits, setTotalCredits] = useState(0);
  const [retiredCredits, setRetiredCredits] = useState(12.5); // Mock for now - would need backend
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('Recent');
  const [retireModal, setRetireModal] = useState<{
    isOpen: boolean;
    poolAddress: string;
    projectName: string;
    maxAmount: number;
  }>({
    isOpen: false,
    poolAddress: '',
    projectName: '',
    maxAmount: 0
  });
  const [purchaseModal, setPurchaseModal] = useState<{
    isOpen: boolean;
    poolAddress: string;
    projectName: string;
    pricePerCredit: number;
    availableCredits: number;
    mode: 'buy' | 'buyAndRetire';
  }>({
    isOpen: false,
    poolAddress: '',
    projectName: '',
    pricePerCredit: 0,
    availableCredits: 0,
    mode: 'buy'
  });

  const fetchPortfolio = useCallback(async () => {
    try {
      setLoading(true);
      const portfolio = await getUserPortfolio();
      console.log('Fetched user portfolio:', portfolio);
      
      setPortfolioItems(portfolio);
      const total = portfolio.reduce((sum: number, item: PortfolioItem) => sum + item.userOwnedCredits, 0);
      setTotalCredits(total);
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      setPortfolioItems([]);
      setTotalCredits(0);
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array since we're using the hook directly

  useEffect(() => {
    fetchPortfolio();
  }, []); // Only run once on mount

  const filteredPortfolio = portfolioItems.filter(item => {
    const matchesSearch = searchTerm === '' || 
      item.metadata.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.metadata.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.metadata.developer.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || 
      (statusFilter === 'Active' && item.userOwnedCredits > 0) ||
      (statusFilter === 'Retired' && item.userOwnedCredits === 0);

    return matchesSearch && matchesStatus;
  });

  const sortedPortfolio = [...filteredPortfolio].sort((a, b) => {
    switch (sortBy) {
      case 'Amount':
        return b.userOwnedCredits - a.userOwnedCredits;
      case 'Value':
        return (b.userOwnedCredits * b.pricePerCreditUSD) - (a.userOwnedCredits * a.pricePerCreditUSD);
      case 'Recent':
      default:
        return new Date(b.metadata.issuanceDate).getTime() - new Date(a.metadata.issuanceDate).getTime();
    }
  });

  const openRetireModal = (item: PortfolioItem) => {
    setRetireModal({
      isOpen: true,
      poolAddress: item.pool.poolAddress,
      projectName: item.metadata.name,
      maxAmount: item.userOwnedCredits
    });
  };

  const closeRetireModal = () => {
    setRetireModal(prev => ({ ...prev, isOpen: false }));
    // Refresh portfolio after retirement
    if (!loading) {
      setTimeout(() => {
        fetchPortfolio();
      }, 1000); // Refresh after 1 second
    }
  };

  const openPurchaseModal = (item: PortfolioItem) => {
    setPurchaseModal({
      isOpen: true,
      poolAddress: item.pool.poolAddress,
      projectName: item.metadata.name,
      pricePerCredit: item.pricePerCreditUSD,
      availableCredits: item.availableCredits,
      mode: 'buy'
    });
  };

  const closePurchaseModal = () => {
    setPurchaseModal(prev => ({ ...prev, isOpen: false }));
  };

  return (
    <div className="h-full flex flex-col" style={{backgroundColor: '#111827'}}>
      {/* Fixed Header Section */}
      <div className="flex-shrink-0 p-8 pb-0">
        <h1 className="text-3xl font-bold text-white mb-8">View Credits</h1>
        
        {/* Portfolio Summary */}
        <div className="rounded-xl p-6 border border-slate-700 shadow-lg mb-8" style={{backgroundColor: '#1F2937'}}>
          <h2 className="text-xl font-semibold text-white mb-4">Your Carbon Credit Portfolio</h2>
          <p className="text-slate-400 mb-6">Manage and retire your owned carbon credits from verified projects</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center md:text-left">
              <p className="text-slate-400 text-sm mb-1">Total Credits Owned</p>
              <p className="text-3xl font-bold" style={{color: '#2ed37d'}}>{totalCredits.toFixed(1)} Tonnes</p>
            </div>
            <div className="text-center md:text-right">
              <p className="text-slate-400 text-sm mb-1">Retired Credits</p>
              <p className="text-3xl font-bold text-slate-300">{retiredCredits.toFixed(1)} Tonnes</p>
            </div>
          </div>
        </div>

        {/* Search and Filters Container */}
        <div className="rounded-xl p-6 border border-slate-700 mb-8" style={{backgroundColor: '#1F2937'}}>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Search your credits by project name, country..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-10 pr-4 py-3 text-white placeholder-slate-400 focus:outline-none transition-colors"
                style={{borderColor: searchTerm ? '#2ed37d' : '', boxShadow: searchTerm ? '0 0 0 3px rgba(46, 211, 125, 0.1)' : ''}}
              />
            </div>
            
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 pr-10 text-white focus:outline-none cursor-pointer transition-colors min-w-[150px]"
                style={{borderColor: statusFilter !== 'All' ? '#2ed37d' : '', boxShadow: statusFilter !== 'All' ? '0 0 0 3px rgba(46, 211, 125, 0.1)' : ''}}
              >
                <option value="All">Status: All</option>
                <option value="Active">Active</option>
                <option value="Retired">Retired</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
            </div>
            
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 pr-10 text-white focus:outline-none cursor-pointer transition-colors min-w-[170px]"
                style={{borderColor: sortBy !== 'Recent' ? '#2ed37d' : '', boxShadow: sortBy !== 'Recent' ? '0 0 0 3px rgba(46, 211, 125, 0.1)' : ''}}
              >
                <option value="Recent">Sort By: Recent</option>
                <option value="Amount">Amount</option>
                <option value="Value">Value</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Cards Section */}
      <div className="flex-1 overflow-y-auto px-8 pb-8">
        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedPortfolio.map((item, index) => (
              <div key={item.pool.poolAddress} className="rounded-xl overflow-hidden border border-slate-700 shadow-lg hover:shadow-xl transition-shadow duration-300" style={{backgroundColor: '#1F2937'}}>
                {/* Project Image */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={item.metadata.imageUrl}
                    alt={item.metadata.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.pexels.com/photos/957024/forest-trees-perspective-bright-957024.jpeg?auto=compress&cs=tinysrgb&w=400';
                    }}
                  />
                  {/* Status Badge */}
                  <div className="absolute top-3 right-3">
                    <span className="px-3 py-1 rounded-full text-xs font-medium text-white" style={{backgroundColor: '#2ed37d'}}>
                      Active
                    </span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-1">{item.metadata.name}</h3>
                  <p className="text-slate-400 text-sm mb-4">Developed by {item.metadata.developer}</p>
                  
                  <div className="flex items-center space-x-4 mb-4 text-sm">
                    <div className="flex items-center space-x-1">
                      <span className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                        <span className="text-xs">🌍</span>
                      </span>
                      <span className="text-slate-300">{item.metadata.country}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="w-4 h-4 rounded-full flex items-center justify-center" style={{backgroundColor: '#2ed37d'}}>
                        <span className="text-xs">✓</span>
                      </span>
                      <span className="text-slate-300">{item.metadata.registry}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                    <div>
                      <p className="text-slate-400">Purchase Date</p>
                      <p className="text-white font-medium">{item.metadata.issuanceDate}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Current Price</p>
                      <p className="text-white font-medium">${item.pricePerCreditUSD.toFixed(2)} USDC</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Amount Owned</p>
                      <p className="font-medium" style={{color: '#2ed37d'}}>{item.userOwnedCredits.toFixed(1)} Tonnes</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Current Value</p>
                      <p className="text-white font-medium">${(item.userOwnedCredits * item.pricePerCreditUSD).toFixed(2)} USDC</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3">
                    <button 
                      onClick={() => openPurchaseModal(item)}
                      className="flex-1 text-black px-4 py-2 rounded-lg hover:opacity-90 transition-colors font-medium text-sm" 
                      style={{backgroundColor: '#2ed37d'}}
                    >
                      Buy More
                    </button>
                    <button 
                      onClick={() => openRetireModal(item)}
                      disabled={item.userOwnedCredits === 0}
                      className="flex-1 bg-slate-600 text-white px-4 py-2 rounded-lg hover:bg-slate-500 disabled:bg-slate-700 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                    >
                      Retire Credits
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && sortedPortfolio.length === 0 && (
          <div className="text-center py-16">
            <h3 className="text-xl font-semibold text-white mb-2">No Credits Found</h3>
            <p className="text-slate-400 mb-4">
              {portfolioItems.length === 0 
                ? "You don't own any carbon credits yet."
                : "No credits match your current filters."
              }
            </p>
            <button 
              onClick={() => router.push('/')}
              className="text-white px-6 py-2 rounded-lg hover:opacity-90 transition-colors" 
              style={{backgroundColor: '#2ed37d'}}
            >
              Browse Credits
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      <RetireModal
        isOpen={retireModal.isOpen}
        onClose={closeRetireModal}
        poolAddress={retireModal.poolAddress}
        projectName={retireModal.projectName}
        maxAmount={retireModal.maxAmount}
      />

      <PurchaseModal
        isOpen={purchaseModal.isOpen}
        onClose={closePurchaseModal}
        poolAddress={purchaseModal.poolAddress}
        projectName={purchaseModal.projectName}
        pricePerCredit={purchaseModal.pricePerCredit}
        availableCredits={purchaseModal.availableCredits}
        mode={purchaseModal.mode}
      />
    </div>
  );
};

export default ViewCredits;