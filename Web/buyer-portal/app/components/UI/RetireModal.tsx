'use client';

import React, { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { useContracts } from '../../hooks/useContracts';

interface RetireModalProps {
  isOpen: boolean;
  onClose: () => void;
  poolAddress: string;
  projectName: string;
  maxAmount: number;
}

const RetireModal: React.FC<RetireModalProps> = ({
  isOpen,
  onClose,
  poolAddress,
  projectName,
  maxAmount
}) => {
  const { retireCredits } = useContracts();

  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<'input' | 'retire' | 'success' | 'error'>('input');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState('');

  // Reset modal state when it opens
  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setStep('input');
      setError('');
      setLoading(false);
      setTxHash('');
    }
  }, [isOpen]);

  const handleRetire = async () => {
    if (!amount || Number(amount) <= 0 || Number(amount) > maxAmount) return;

    setLoading(true);
    setError('');
    setStep('retire');

    try {
      const receipt = await retireCredits(poolAddress, Number(amount));
      setTxHash(receipt.hash);
      setStep('success');
    } catch (error: any) {
      setError(error.message || 'Retirement failed');
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setAmount('');
    setStep('input');
    setError('');
    setLoading(false);
    setTxHash('');
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!isOpen) return null;

  const isAmountValid = amount && Number(amount) > 0 && Number(amount) <= maxAmount;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white">Retire Credits</h2>
          <button onClick={handleClose} className="text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {/* Project Info */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-white mb-2">{projectName}</h3>
            <div className="text-sm text-slate-400 space-y-1">
              <p>Available to retire: {maxAmount.toFixed(1)} tonnes</p>
            </div>
          </div>

          {step === 'input' && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-white mb-2">
                  Amount to Retire (tonnes)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.0"
                  step="0.1"
                  min="0.1"
                  max={maxAmount}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-green-500"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Maximum: {maxAmount.toFixed(1)} tonnes
                </p>
              </div>

              <div className="mb-6 p-4 bg-yellow-900 bg-opacity-30 border border-yellow-700 rounded-lg">
                <h4 className="text-sm font-medium text-yellow-300 mb-2">Important Notice</h4>
                <p className="text-xs text-yellow-200">
                  Retiring credits is permanent and cannot be undone. Once retired, these credits will be removed from your balance and cannot be sold or transferred.
                </p>
              </div>

              <button
                onClick={handleRetire}
                disabled={!isAmountValid}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors"
              >
                Retire Credits
              </button>
            </>
          )}

          {step === 'retire' && (
            <div className="text-center">
              <Loader className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-spin" />
              <h3 className="text-lg font-medium text-white mb-2">Processing Retirement</h3>
              <p className="text-slate-400 text-sm">
                Your retirement request is being processed...
              </p>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">Credits Retired Successfully!</h3>
              <p className="text-slate-400 text-sm mb-4">
                Your carbon credits have been queued for retirement. You will receive an NFT certificate once the retirement is processed.
              </p>
              {txHash && (
                <p className="text-xs text-blue-400 mb-4 break-all">
                  Transaction: {txHash}
                </p>
              )}
              <button
                onClick={handleClose}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          )}

          {step === 'error' && (
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">Retirement Failed</h3>
              <p className="text-slate-400 text-sm mb-4">{error}</p>
              <div className="space-y-2">
                <button
                  onClick={() => setStep('input')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={handleClose}
                  className="w-full bg-slate-600 hover:bg-slate-700 text-white py-3 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RetireModal; 