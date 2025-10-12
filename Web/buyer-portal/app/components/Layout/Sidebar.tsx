'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CreditCard, Eye, FileText, Wallet } from 'lucide-react';

const Sidebar: React.FC = () => {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && pathname.startsWith(path)) return true;
    return false;
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
            <Link
              href="/"
              className={`flex items-center space-x-3 px-6 py-3 transition-all duration-200 ${
                isActive('/')
                  ? 'text-white'
                  : 'text-gray-300 hover:text-white'
              }`}
              style={{
                backgroundColor: isActive('/') ? '#374151' : 'transparent'
              }}
            >
              {isActive('/') && (
                <div 
                  className="absolute left-0 top-0 bottom-0 w-1" 
                  style={{backgroundColor: '#2ed37d'}}
                ></div>
              )}
              <CreditCard size={20} style={{color: isActive('/') ? '#2ed37d' : 'inherit'}} />
              <span>Buy Credits</span>
            </Link>
          </li>
          <li className="relative">
            <Link
              href="/credits"
              className={`flex items-center space-x-3 px-6 py-3 transition-all duration-200 ${
                isActive('/credits')
                  ? 'text-white'
                  : 'text-gray-300 hover:text-white'
              }`}
              style={{
                backgroundColor: isActive('/credits') ? '#374151' : 'transparent'
              }}
            >
              {isActive('/credits') && (
                <div 
                  className="absolute left-0 top-0 bottom-0 w-1" 
                  style={{backgroundColor: '#2ed37d'}}
                ></div>
              )}
              <Eye size={20} style={{color: isActive('/credits') ? '#2ed37d' : 'inherit'}} />
              <span>View Credits</span>
            </Link>
          </li>
          <li className="relative">
            <Link
              href="/receipts"
              className={`flex items-center space-x-3 px-6 py-3 transition-all duration-200 ${
                isActive('/receipts')
                  ? 'text-white'
                  : 'text-gray-300 hover:text-white'
              }`}
              style={{
                backgroundColor: isActive('/receipts') ? '#374151' : 'transparent'
              }}
            >
              {isActive('/receipts') && (
                <div 
                  className="absolute left-0 top-0 bottom-0 w-1" 
                  style={{backgroundColor: '#2ed37d'}}
                ></div>
              )}
              <FileText size={20} style={{color: isActive('/receipts') ? '#2ed37d' : 'inherit'}} />
              <span>View Receipts</span>
            </Link>
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

export default Sidebar;