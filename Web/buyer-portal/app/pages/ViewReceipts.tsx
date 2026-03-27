'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ChevronDown, Award } from 'lucide-react';
import { mockRetirementReceipts } from 'cbx/utils/mockData';

const ViewReceipts: React.FC = () => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateSort, setDateSort] = useState('Newest First');

  const handleViewCertificate = (certificateId: string) => {
    router.push(`/certificate/${certificateId}`);
  };

  // Mock project images mapping
  const projectImages: Record<string, string> = {
    'Amazon Rainforest Conservation': 'https://images.pexels.com/photos/957024/forest-trees-perspective-bright-957024.jpeg?auto=compress&cs=tinysrgb&w=400',
    'India Wind Power Project': 'https://images.pexels.com/photos/414928/pexels-photo-414928.jpeg?auto=compress&cs=tinysrgb&w=400',
    'Forest Ecosystem Restoration': 'https://images.pexels.com/photos/1108572/pexels-photo-1108572.jpeg?auto=compress&cs=tinysrgb&w=400',
    'Kenya Wind Power Project': 'https://images.pexels.com/photos/414928/pexels-photo-414928.jpeg?auto=compress&cs=tinysrgb&w=400',
    'Rural India Solar Initiative': 'https://images.pexels.com/photos/2800832/pexels-photo-2800832.jpeg?auto=compress&cs=tinysrgb&w=400',
    'Indonesian Mangrove Restoration': 'https://images.pexels.com/photos/1108572/pexels-photo-1108572.jpeg?auto=compress&cs=tinysrgb&w=400',
    'Peru Sustainable Agriculture': 'https://images.pexels.com/photos/1108572/pexels-photo-1108572.jpeg?auto=compress&cs=tinysrgb&w=400',
    'Colombian Reforestation Project': 'https://images.pexels.com/photos/957024/forest-trees-perspective-bright-957024.jpeg?auto=compress&cs=tinysrgb&w=400'
  };

  // Extended mock data to match the screenshots
  const extendedReceipts = [
    {
      id: 'RET-001',
      projectName: 'Amazon Rainforest Conservation',
      amount: '2.5',
      retirementDate: 'Jul 15, 2025',
      status: 'Complete',
      certificateId: 'CBX-4566-8742'
    },
    {
      id: 'RET-002',
      projectName: 'Kenya Wind Power Project',
      amount: '5.0',
      retirementDate: 'Jun 28, 2025',
      status: 'Complete',
      certificateId: 'CBX-3971-6234'
    },
    {
      id: 'RET-003',
      projectName: 'Rural India Solar Initiative',
      amount: '1.75',
      retirementDate: 'Jul 2, 2025',
      status: 'Pending',
      certificateId: 'CBX-4127-9305'
    },
    {
      id: 'RET-004',
      projectName: 'Indonesian Mangrove Restoration',
      amount: '',
      retirementDate: 'May 19, 2025',
      status: 'Complete',
      certificateId: ''
    },
    {
      id: 'RET-005',
      projectName: 'Peru Sustainable Agriculture',
      amount: '',
      retirementDate: 'Jul 30, 2025',
      status: 'Pending',
      certificateId: ''
    },
    {
      id: 'RET-006',
      projectName: 'Colombian Reforestation Project',
      amount: '',
      retirementDate: 'Apr 30, 2025',
      status: 'Complete',
      certificateId: ''
    }
  ];

  return (
    <div className="p-8 bg-slate-900 min-h-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-8">View Receipts</h1>

        {/* Search and Filters Container */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Search your credits by project name, country..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-10 pr-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 pr-10 text-white focus:outline-none focus:border-emerald-500 cursor-pointer transition-colors min-w-[150px]"
              >
                <option value="All">Status: All</option>
                <option value="Complete">Complete</option>
                <option value="Pending">Pending</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
            </div>

            <div className="relative">
              <select
                value={dateSort}
                onChange={(e) => setDateSort(e.target.value)}
                className="appearance-none bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 pr-10 text-white focus:outline-none focus:border-emerald-500 cursor-pointer transition-colors min-w-[170px]"
              >
                <option value="Newest First">Date: Newest First</option>
                <option value="Oldest First">Date: Oldest First</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {extendedReceipts.map((receipt) => (
          <div key={receipt.id} className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 shadow-lg hover:shadow-xl transition-shadow duration-300">
            {/* Project Image */}
            <div className="relative h-48 overflow-hidden">
              <img
                src={projectImages[receipt.projectName] || 'https://images.pexels.com/photos/957024/forest-trees-perspective-bright-957024.jpeg?auto=compress&cs=tinysrgb&w=400'}
                alt={receipt.projectName}
                className="w-full h-full object-cover"
              />
              {/* Status Badge */}
              <div className="absolute top-3 right-3">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${receipt.status === 'Complete'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-yellow-600 text-white'
                  }`}>
                  {receipt.status}
                </span>
              </div>
            </div>

            {/* Card Content */}
            <div className="p-6">
              <h3 className="text-lg font-semibold text-white mb-2">{receipt.projectName}</h3>
              <p className="text-slate-400 text-sm mb-4">
                Retired on {receipt.retirementDate}
              </p>

              <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                <div>
                  <p className="text-slate-400">Amount Retired</p>
                  <p className="text-white font-medium">{receipt.amount} Tonnes</p>
                </div>
                <div>
                  <p className="text-slate-400">Certificate ID</p>
                  <p className="text-white font-medium">{receipt.certificateId}</p>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                {receipt.status === 'Complete' ? (
                  <button
                    onClick={() => handleViewCertificate(receipt.certificateId!)}
                    className="w-full flex items-center justify-center space-x-2 bg-emerald-600 text-white px-4 py-3 rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                  >
                    <Award size={18} />
                    <span>View NFT Certificate</span>
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full flex items-center justify-center space-x-2 bg-slate-600 text-slate-400 px-4 py-3 rounded-lg cursor-not-allowed"
                  >
                    <span className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></span>
                    <span>Certificate Processing</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {extendedReceipts.length === 0 && (
        <div className="text-center py-16">
          <h3 className="text-xl font-semibold text-white mb-2">No Retirement History</h3>
          <p className="text-slate-400">You haven't retired any carbon credits yet.</p>
        </div>
      )}
    </div>
  );
};

export default ViewReceipts;