'use client';

import React, { useState } from 'react';
import SellerLayout from './components/Layout/SellerLayout';
import MyPools from './pages/MyPools';
import ListNewCredits from './pages/ListNewCredits';

export default function SellerPortal() {
  const [activeTab, setActiveTab] = useState<'list-credits' | 'my-pools'>('my-pools');

  const getPageTitle = () => {
    switch (activeTab) {
      case 'my-pools':
        return 'My Pools';
      case 'list-credits':
        return 'List New Credits';
      default:
        return 'My Pools';
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <SellerLayout 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        pageTitle={getPageTitle()}
      >
        {activeTab === 'my-pools' && <MyPools />}
        {activeTab === 'list-credits' && <ListNewCredits />}
      </SellerLayout>
    </div>
  );
} 