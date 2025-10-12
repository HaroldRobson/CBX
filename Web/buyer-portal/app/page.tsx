'use client';

import React from 'react';
import Layout from './components/Layout/Layout';
import BuyCredits from './pages/BuyCredits';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-900">
      <Layout>
        <BuyCredits />
      </Layout>
    </div>
  );
}