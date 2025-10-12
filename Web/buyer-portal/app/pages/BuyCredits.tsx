'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, ChevronDown, Globe, Star, Info } from 'lucide-react';
import { useContracts } from '../hooks/useContracts';
import { useWeb3 } from '../hooks/useWeb3';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import PurchaseModal from '../components/UI/PurchaseModal';
import type { Pool } from '../types';

interface TransformedPoolData {
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
  poolSummary: any;
}

const BuyCredits: React.FC = () => {
  const { getActivePools, transformPoolData } = useContracts();
  const { isConnected } = useWeb3();
  const [pools, setPools] = useState<TransformedPoolData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [registryFilter, setRegistryFilter] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
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

  const fetchPools = useCallback(async () => {
    try {
      setLoading(true);
      const activePools = await getActivePools();
      console.log('Fetched active pools:', activePools);

      const transformedPools: TransformedPoolData[] = [];
      
      for (const pool of activePools) {
        try {
          const transformedData = await transformPoolData(pool);
          if (transformedData) {
            transformedPools.push(transformedData);
          }
        } catch (error) {
          console.error('Error transforming pool data:', error);
          // Continue with other pools
        }
      }

      setPools(transformedPools);
    } catch (error) {
      console.error('Error fetching pools:', error);
      setPools([]);
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array since we're using the hooks directly

  useEffect(() => {
    fetchPools();
  }, []); // Only run once on mount

  const filteredProjects = pools.filter(project => {
    const matchesSearch = searchTerm === '' || 
      project.metadata.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.metadata.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.metadata.developer.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRegistry = registryFilter === '' || 
      project.metadata.registry.toLowerCase() === registryFilter.toLowerCase();
    
    const matchesCountry = countryFilter === '' || 
      project.metadata.country.toLowerCase() === countryFilter.toLowerCase();

    return matchesSearch && matchesRegistry && matchesCountry;
  });

  const openPurchaseModal = (project: TransformedPoolData, mode: 'buy' | 'buyAndRetire') => {
    setPurchaseModal({
      isOpen: true,
      poolAddress: project.pool.poolAddress,
      projectName: project.metadata.name,
      pricePerCredit: project.pricePerCreditUSD,
      availableCredits: project.availableCredits,
      mode
    });
  };

  const closePurchaseModal = () => {
    setPurchaseModal(prev => ({ ...prev, isOpen: false }));
  };

  return (
    <div className="h-full flex flex-col" style={{backgroundColor: '#111827'}}>
      {/* Fixed Header Section */}
      <div className="flex-shrink-0 p-8 pb-0">
        <h1 className="text-3xl font-bold text-white mb-8">Buy Carbon Credits</h1>
        
        {/* Search and Filters Container */}
        <div className="rounded-xl p-6 border border-slate-700 mb-8" style={{backgroundColor: '#111827'}}>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Search by project name, country..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-slate-600 rounded-lg pl-10 pr-4 py-3 text-white placeholder-slate-400 focus:outline-none transition-colors"
                style={{
                  backgroundColor: '#374151',
                  borderColor: searchTerm ? '#2ed37d' : '',
                  boxShadow: searchTerm ? '0 0 0 3px rgba(46, 211, 125, 0.1)' : ''
                }}
              />
            </div>
            
            <div className="relative">
              <select
                value={registryFilter}
                onChange={(e) => setRegistryFilter(e.target.value)}
                className="appearance-none border border-slate-600 rounded-lg px-4 py-3 pr-10 text-white focus:outline-none cursor-pointer transition-colors min-w-[200px]"
                style={{backgroundColor: '#374151',
                  borderColor: registryFilter ? '#2ed37d' : '', boxShadow: registryFilter ? '0 0 0 3px rgba(46, 211, 125, 0.1)' : ''}}
              >
                <option value="">Filter by Registry</option>
                <option value="verra">Verra</option>
                <option value="gold standard">Gold Standard</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
            </div>
            
            <div className="relative">
              <select
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                className="appearance-none border border-slate-600 rounded-lg px-4 py-3 pr-10 text-white focus:outline-none cursor-pointer transition-colors min-w-[200px]"
                style={{backgroundColor: '#374151',
                  borderColor: countryFilter ? '#2ed37d' : '', boxShadow: countryFilter ? '0 0 0 3px rgba(46, 211, 125, 0.1)' : ''}}
              >
                <option value="">Filter by Country</option>
                <option value="ghana">Ghana</option>
                <option value="india">India</option>
                <option value="vietnam">Vietnam</option>
                <option value="indonesia">Indonesia</option>
                <option value="peru">Peru</option>
                <option value="colombia">Colombia</option>
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
            {filteredProjects.map((project, index) => (
              <div key={project.pool.poolAddress} className="rounded-xl overflow-hidden border border-slate-700 hover:border-slate-600 transition-all duration-200 shadow-lg" style={{backgroundColor: '#1F2937'}}>
                <div className="relative">
                  <img
                    src={project.metadata.imageUrl}
                    alt={project.metadata.name}
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.pexels.com/photos/957024/forest-trees-perspective-bright-957024.jpeg?auto=compress&cs=tinysrgb&w=400';
                    }}
                  />
                  <div className="absolute top-4 right-4">
                    <button className="p-2 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-70 transition-all">
                      <Info size={16} />
                    </button>
                  </div>
                </div>
                
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-white mb-2">{project.metadata.name}</h3>
                  <p className="text-slate-400 text-sm mb-4">Developed by {project.metadata.developer}</p>
                  
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <Globe className="text-slate-400" size={14} />
                      <span className="text-slate-300 text-sm">{project.metadata.country}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Star className="text-slate-400" size={14} />
                      <span className="text-slate-300 text-sm">{project.metadata.registry}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <p className="text-slate-400 text-sm">Issuance Date</p>
                      <p className="text-white font-medium">{project.metadata.issuanceDate}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Price/Credit</p>
                      <p className="font-medium" style={{color: '#2ed37d'}}>${project.pricePerCreditUSD.toFixed(2)} USDC</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Available</p>
                      <p className="text-white font-medium">{project.availableCredits.toLocaleString()} Tonnes</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">You Own</p>
                      <p className="text-white font-medium">{project.userOwnedCredits.toFixed(1)} Tonnes</p>
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <button 
                      onClick={() => openPurchaseModal(project, 'buy')}
                      className="flex-1 text-black py-2.5 px-4 rounded-lg hover:opacity-90 transition-all duration-200 font-medium" 
                      style={{backgroundColor: '#2ed37d'}}
                    >
                      Buy Credits
                    </button>
                    <button 
                      onClick={() => openPurchaseModal(project, 'buyAndRetire')}
                      className="flex-1 bg-slate-600 text-white px-4 py-2.5 rounded-lg hover:bg-slate-500 transition-all font-medium text-sm"
                    >
                      Buy & Retire
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filteredProjects.length === 0 && (
          <div className="text-center py-16">
            <h3 className="text-xl font-semibold text-white mb-2">No Active Pools Found</h3>
            <p className="text-slate-400">
              {pools.length === 0 
                ? "There are currently no active carbon credit pools available."
                : "No pools match your current filters. Try adjusting your search criteria."
              }
            </p>
          </div>
        )}
      </div>

      {/* Purchase Modal */}
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

export default BuyCredits;