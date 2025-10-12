'use client';

import React from 'react';
import Layout from '../../components/Layout/Layout';
import NFTCertificate from '../../pages/NFTCertificate';

export default function CertificatePage() {
  return (
    <div className="min-h-screen bg-slate-900">
      <Layout>
        <NFTCertificate />
      </Layout>
    </div>
  );
}