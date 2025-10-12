'use client';

import React from 'react';
import Layout from '../components/Layout/Layout';
import ViewReceipts from '../pages/ViewReceipts';

export default function ReceiptsPage() {
  return (
    <div className="min-h-screen bg-slate-900">
      <Layout>
        <ViewReceipts />
      </Layout>
    </div>
  );
}