'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PlusCircle, Layers, Wallet } from 'lucide-react';

interface SellerSidebarProps {
  activeTab?: 'list-credits' | 'my-pools';
  onTabChange?: (tab: 'list-credits' | 'my-pools') => void;
}

const SellerSidebar: React.FC<SellerSidebarProps> = ({ activeTab = 'my-pools', onTabChange }) => {
  const pathname = usePathname();

  const handleNavClick = (tab: 'list-credits' | 'my-pools') => {
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  const isActive = (tab: 'list-credits' | 'my-pools') => {
    return activeTab === tab;
  };

  return (
    <div className="w-64 h-screen flex flex-col border-r border-slate-700" style={{backgroundColor: '#111827'}}>
      <div className="p-0 border-b border-slate-700 flex items-center justify-center flex-shrink-0">
        <img 
          src="/CBX_logo-removebg-preview.png" 
          alt="CBX Logo"
          className="h-20 w-auto"
        />
      </div>
      
      <nav className="flex-1 px-0 py-6 overflow-y-auto">
        <ul className="space-y-1">
          <li className="relative">
            <button
              onClick={() => handleNavClick('list-credits')}
              className={`w-full flex items-center space-x-3 px-6 py-3 transition-all duration-200 text-left ${
                isActive('list-credits')
                  ? 'text-white'
                  : 'text-gray-300 hover:text-white'
              }`}
              style={{
                backgroundColor: isActive('list-credits') ? '#374151' : 'transparent'
              }}
            >
              {isActive('list-credits') && (
                <div 
                  className="absolute left-0 top-0 bottom-0 w-1" 
                  style={{backgroundColor: '#2ed37d'}}
                ></div>
              )}
              <PlusCircle size={20} style={{color: isActive('list-credits') ? '#2ed37d' : 'inherit'}} />
              <span>List New Credits</span>
            </button>
          </li>
          <li className="relative">
            <button
              onClick={() => handleNavClick('my-pools')}
              className={`w-full flex items-center space-x-3 px-6 py-3 transition-all duration-200 text-left ${
                isActive('my-pools')
                  ? 'text-white'
                  : 'text-gray-300 hover:text-white'
              }`}
              style={{
                backgroundColor: isActive('my-pools') ? '#374151' : 'transparent'
              }}
            >
              {isActive('my-pools') && (
                <div 
                  className="absolute left-0 top-0 bottom-0 w-1" 
                  style={{backgroundColor: '#2ed37d'}}
                ></div>
              )}
              <Layers size={20} style={{color: isActive('my-pools') ? '#2ed37d' : 'inherit'}} />
              <span>My Pools</span>
            </button>
          </li>
        </ul>
      </nav>
      
      {/* Wallet Status at Bottom */}
      <div className="p-4 border-t border-slate-700 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{backgroundColor: '#2ed37d'}}>
            <Wallet className="text-black" size={20} />
          </div>
          <div>
            <p className="text-slate-300 text-sm font-medium">0x3DF...8369</p>
            <p className="text-slate-400 text-xs">Connected</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerSidebar; 