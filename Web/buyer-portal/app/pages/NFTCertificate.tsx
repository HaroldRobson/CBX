'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Download, Share2, ExternalLink, CheckCircle, Info, Shield } from 'lucide-react';
import { mockNFTCertificate } from 'cbx/utils/mockData';

const NFTCertificate: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const certificateId = params?.certificateId as string;

  // In a real implementation, you would fetch the certificate data based on certificateId
  const certificate = mockNFTCertificate;

  return (
    <div className="p-8 bg-slate-900 min-h-screen">
      <div className="mb-8">
        <button
          onClick={() => router.push('/receipts')}
          className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft size={20} />
          <span>Back to Receipts</span>
        </button>
        <h1 className="text-3xl font-bold text-white">NFT Certificate</h1>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-2xl">
          {/* Certificate Header */}
          <div className="bg-gradient-to-r from-slate-700 to-slate-800 p-8 text-center border-b border-slate-600">
            <h2 className="text-2xl font-bold text-white mb-2">
              Certificate of Carbon Credit Retirement
            </h2>
            <p className="text-slate-300">
              Official proof of carbon offset through CBX platform
            </p>
          </div>

          {/* Amount Retired Section */}
          <div className="p-8 text-center border-b border-slate-700">
            <p className="text-slate-400 mb-2">Amount Retired</p>
            <div className="flex items-center justify-center space-x-2">
              <span className="text-5xl font-bold text-white">{certificate.amountRetired.toFixed(2)}</span>
              <span className="text-xl text-slate-300">Tonnes</span>
            </div>
            <div className="flex items-center justify-center space-x-2 mt-4">
              <CheckCircle className="text-green-500" size={20} />
              <span className="text-green-400 font-medium">Verified Retirement</span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Project Information */}
            <div className="bg-slate-700 rounded-lg p-6 border border-slate-600">
              <div className="flex items-center space-x-2 mb-4">
                <h3 className="text-lg font-semibold text-white">Project Information</h3>
                <Info className="text-slate-400" size={16} />
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-slate-400 text-sm">Project</p>
                  <p className="text-white font-medium">{certificate.project.name}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Registry</p>
                  <p className="text-white">{certificate.project.registry}</p>
                </div>
              </div>
            </div>

            {/* Retirement Details */}
            <div className="bg-slate-700 rounded-lg p-6 border border-slate-600">
              <div className="flex items-center space-x-2 mb-4">
                <h3 className="text-lg font-semibold text-white">Retirement Details</h3>
                <Info className="text-slate-400" size={16} />
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-slate-400 text-sm">Serial Number</p>
                  <p className="text-white font-medium">{certificate.serialNumber}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Retirement Date</p>
                  <p className="text-white">{certificate.retirementDate}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Blockchain Verification */}
          <div className="p-8 border-t border-slate-700">
            <div className="bg-purple-900 bg-opacity-30 rounded-lg p-6 mb-6">
              <div className="flex items-center space-x-2 mb-4">
                <Shield className="text-purple-400" size={20} />
                <h3 className="text-lg font-semibold text-white">Blockchain Verification</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-slate-400 text-sm mb-2">Transaction Hash</p>
                  <div className="flex items-center space-x-2">
                    <code className="text-purple-300 font-mono text-sm">{certificate.transactionHash}...</code>
                    <ExternalLink className="text-purple-400 hover:text-purple-300 cursor-pointer" size={16} />
                  </div>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-2">NFT Token ID</p>
                  <div className="flex items-center space-x-2">
                    <code className="text-blue-300 font-mono text-sm">{certificate.nftTokenId}</code>
                    <ExternalLink className="text-blue-400 hover:text-blue-300 cursor-pointer" size={16} />
                  </div>
                </div>
              </div>
            </div>

            {/* Permanent Storage */}
            <div className="bg-green-900 bg-opacity-30 rounded-lg p-6">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-6 h-6 bg-green-600 rounded flex items-center justify-center">
                  <span className="text-white text-xs">📦</span>
                </div>
                <h3 className="text-lg font-semibold text-white">Permanent Storage</h3>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm mb-2">IPFS Link</p>
                  <div className="flex items-center space-x-2">
                    <code className="text-green-300 font-mono text-sm">{certificate.ipfsLink}...</code>
                    <ExternalLink className="text-green-400 hover:text-green-300 cursor-pointer" size={16} />
                  </div>
                </div>
                <div className="flex items-center space-x-2 bg-green-800 px-3 py-1 rounded-full">
                  <CheckCircle className="text-green-400" size={16} />
                  <span className="text-green-400 text-sm font-medium">Active</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-8 border-t border-slate-700">
            <div className="flex justify-center space-x-4">
              <button className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium">
                <Download size={20} />
                <span>Download Certificate</span>
              </button>
              <button className="flex items-center space-x-2 bg-slate-700 text-white px-6 py-3 rounded-lg hover:bg-slate-600 transition-colors font-medium">
                <Share2 size={20} />
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NFTCertificate;