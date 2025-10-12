'use client';

import React, { useState, useEffect } from 'react';
import { Moon, ChevronDown } from 'lucide-react';
import { useWeb3 } from '../../hooks/useWeb3';
import { useContracts } from '../../hooks/useContracts';
import Image from 'next/image';

const Header: React.FC = () => {
  const { account, isConnected, connectWallet, disconnectWallet, isConnecting } = useWeb3();
  const { getUSDCBalance } = useContracts();
  const [usdcBalance, setUsdcBalance] = useState('0.00');

  useEffect(() => {
    const fetchBalance = async () => {
      if (isConnected) {
        try {
          const balance = await getUSDCBalance();
          setUsdcBalance(balance);
        } catch (error) {
          console.error('Error fetching USDC balance:', error);
        }
      }
    };

    fetchBalance();
    // Refresh balance every 30 seconds
    const interval = isConnected ? setInterval(fetchBalance, 30000) : null;
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isConnected, getUSDCBalance]);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <header className="border-b border-slate-700 px-6 py-5 flex-shrink-0" style={{backgroundColor: '#111827'}}>
      <div className="flex items-center justify-between">
        <h1 className="text-white text-[24px] font-semibold">Buyer Portal</h1>
        
        <div className="flex items-center space-x-4">
          <button className="flex items-center space-x-2 bg-slate-700 text-slate-300 px-3 py-2 rounded-lg hover:bg-slate-600 transition-colors">
            <Moon size={16} />
            <span>Dark</span>
          </button>
          
          {isConnected && (
            <div className="flex items-center space-x-1 bg-slate-700 px-3 py-2 rounded-lg">
              {/* USDC icon using coins.png */}
                <Image 
                  src="/coins.png" 
                  alt="USDC" 
                  width={16} 
                  height={16}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              <span className="text-white font-medium">USDC:</span>
              <span className="font-semibold font-mono-numbers" style={{ color: '#4ADE80' }}>
                {parseFloat(usdcBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          )}
          
          {isConnected && (
            <div className="flex items-center space-x-1 bg-slate-700 px-3 py-2 rounded-lg">
              {/* POL icon using POL.png */}
                <Image 
                  src="/POL.png" 
                  alt="POL" 
                  width={16} 
                  height={16}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              <span className="text-white font-medium">POL:</span>
              <span className="font-semibold font-mono-numbers" style={{ color: '#4ADE80' }}>45.32</span>
            </div>
          )}
          
          <div className="flex items-center space-x-2 bg-slate-700 px-0 py-0 rounded-lg font-mono-numbers">
            {isConnected ? (
              <button
                onClick={disconnectWallet}
                className="flex items-center space-x-2 text-white px-4 py-2 rounded-lg hover:opacity-90 transition-colors"
              >
                <span className="w-2 h-2 rounded-full" style={{backgroundColor: '#22c55e'}}></span>
                <span>{formatAddress(account || '')}</span>
                <ChevronDown size={16} />
              </button>
            ) : (
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                className="text-white px-4 py-2 rounded-lg hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;