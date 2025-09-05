'use client';

import React from 'react';
import SellerSidebar from './SellerSidebar';
import SellerHeader from './SellerHeader';

interface SellerLayoutProps {
  children: React.ReactNode;
  activeTab?: 'list-credits' | 'my-pools';
  onTabChange?: (tab: 'list-credits' | 'my-pools') => void;
  pageTitle?: string;
}

const SellerLayout: React.FC<SellerLayoutProps> = ({ 
  children, 
  activeTab = 'my-pools', 
  onTabChange,
  pageTitle 
}) => {
  return (
    <div className="h-screen text-white flex overflow-hidden" style={{backgroundColor: '#111827'}}>
      <SellerSidebar activeTab={activeTab} onTabChange={onTabChange} />
      <div className="flex-1 flex flex-col h-screen">
        <SellerHeader pageTitle={pageTitle} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default SellerLayout; 