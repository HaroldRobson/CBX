'use client';

import React from 'react';
import Layout from '../components/Layout/Layout';
import ViewCredits from '../pages/ViewCredits';

export default function CreditsPage() {
  return (
    <div className="min-h-screen bg-slate-900">
      <Layout>
        <ViewCredits />
      </Layout>
    </div>
  );
}