'use client';

import React, { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { useContracts } from 'cbx/hooks/useContracts';

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  poolAddress: string;
  projectName: string;
  pricePerCredit: number;
  availableCredits: number;
  mode: 'buy' | 'buyAndRetire';
}

const PurchaseModal: React.FC<PurchaseModalProps> = ({
  isOpen,
  onClose,
  poolAddress,
  projectName,
  pricePerCredit,
  availableCredits,
  mode
}) => {
  const {
    calculatePurchaseCost,
    approveUSDC,
    buyCredits,
    buyAndRetireCredits,
    checkUSDCAllowance,
    getUSDCBalance
  } = useContracts();

  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<'input' | 'approve' | 'purchase' | 'success' | 'error'>('input');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [usdcBalance, setUsdcBalance] = useState('1250.00'); // Default mock balance
  const [costData, setCostData] = useState<{
    amountOfTokens: number;
    totalCostInSmallestUnit: number;
    totalCostInUSDC: number;
  } | null>(null);

  // Only fetch balance when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchUSDCBalance();
      // Reset modal state when opening
      setAmount('');
      setStep('input');
      setError('');
      setLoading(false);
      setTxHash('');
      setCostData(null);
    }
  }, [isOpen]);

  // Calculate cost only when amount changes and is valid
  useEffect(() => {
    if (amount && Number(amount) > 0 && poolAddress) {
      const calculateCostDebounced = setTimeout(() => {
        calculateCost();
      }, 300); // Debounce to prevent too many calculations

      return () => clearTimeout(calculateCostDebounced);
    } else {
      setCostData(null);
    }
  }, [amount, poolAddress]);

  const fetchUSDCBalance = async () => {
    try {
      const balance = await getUSDCBalance();
      setUsdcBalance(balance);
    } catch (error) {
      console.error('Error fetching USDC balance:', error);
      setUsdcBalance('1250.00'); // Fallback to mock balance
    }
  };

  const calculateCost = async () => {
    try {
      if (!poolAddress || !amount || Number(amount) <= 0) return;
      const cost = await calculatePurchaseCost(poolAddress, Number(amount));
      setCostData(cost);
    } catch (error) {
      console.error('Error calculating cost:', error);
      setCostData(null);
    }
  };

  const handleApprove = async () => {
    if (!costData) return;

    setLoading(true);
    setError('');

    try {
      // Check if already approved
      const allowance = await checkUSDCAllowance(poolAddress);
      const requiredAmount = costData.totalCostInSmallestUnit;

      if (Number(allowance) >= requiredAmount) {
        setStep('purchase');
        setLoading(false);
        return;
      }

      // Approve USDC spending
      await approveUSDC(poolAddress, requiredAmount.toString());
      setStep('purchase');
    } catch (error: any) {
      setError(error.message || 'Approval failed');
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!costData) return;

    setLoading(true);
    setError('');

    try {
      let receipt;
      if (mode === 'buy') {
        receipt = await buyCredits(poolAddress, Number(amount));
      } else {
        receipt = await buyAndRetireCredits(poolAddress, Number(amount));
      }

      setTxHash(receipt.hash);
      setStep('success');
    } catch (error: any) {
      setError(error.message || 'Purchase failed');
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
    setCostData(null);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!isOpen) return null;

  // Calculate max amount more safely
  const getMaxAmount = () => {
    const balanceLimit = Number(usdcBalance) / pricePerCredit;
    return Math.min(availableCredits, balanceLimit);
  };

  const maxAmount = getMaxAmount();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white">
            {mode === 'buy' ? 'Buy Credits' : 'Buy & Retire Credits'}
          </h2>
          <button onClick={handleClose} className="text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {/* Project Info */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-white mb-2">{projectName}</h3>
            <div className="text-sm text-slate-400 space-y-1">
              <p>Price: ${pricePerCredit.toFixed(2)} USDC per credit</p>
              <p>Available: {availableCredits.toFixed(1)} tonnes</p>
              <p>Your USDC Balance: {usdcBalance} USDC</p>
            </div>
          </div>

          {step === 'input' && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-white mb-2">
                  Amount to {mode === 'buy' ? 'Purchase' : 'Purchase & Retire'} (tonnes)
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

              {costData && (
                <div className="mb-6 p-4 bg-slate-700 rounded-lg">
                  <h4 className="text-sm font-medium text-white mb-2">Purchase Summary</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Amount:</span>
                      <span className="text-white">{amount} tonnes</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Price per credit:</span>
                      <span className="text-white">${pricePerCredit.toFixed(2)} USDC</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-600 pt-1 mt-2">
                      <span className="text-slate-400">Total Cost:</span>
                      <span className="text-green-400 font-medium">
                        ${costData.totalCostInUSDC.toFixed(2)} USDC
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={() => setStep('approve')}
                disabled={!amount || !costData || Number(amount) <= 0 || Number(amount) > maxAmount}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors"
              >
                Continue to Approval
              </button>
            </>
          )}

          {step === 'approve' && (
            <div className="text-center">
              <div className="mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl text-black">1</span>
                </div>
                <h3 className="text-lg font-medium text-white mb-2">Approve USDC Spending</h3>
                <p className="text-slate-400 text-sm">
                  First, you need to approve the contract to spend your USDC tokens.
                </p>
              </div>

              <button
                onClick={handleApprove}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <Loader className="animate-spin mr-2" size={20} />
                    Approving...
                  </>
                ) : (
                  'Approve USDC'
                )}
              </button>
            </div>
          )}

          {step === 'purchase' && (
            <div className="text-center">
              <div className="mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl text-black">2</span>
                </div>
                <h3 className="text-lg font-medium text-white mb-2">
                  {mode === 'buy' ? 'Purchase Credits' : 'Purchase & Retire Credits'}
                </h3>
                <p className="text-slate-400 text-sm">
                  Now complete your {mode === 'buy' ? 'purchase' : 'purchase and retirement'}.
                </p>
              </div>

              <button
                onClick={handlePurchase}
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <Loader className="animate-spin mr-2" size={20} />
                    Processing...
                  </>
                ) : (
                  `${mode === 'buy' ? 'Buy' : 'Buy & Retire'} Credits`
                )}
              </button>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                {mode === 'buy' ? 'Purchase Successful!' : 'Purchase & Retirement Successful!'}
              </h3>
              <p className="text-slate-400 text-sm mb-4">
                Your transaction has been completed successfully.
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
              <h3 className="text-lg font-medium text-white mb-2">Transaction Failed</h3>
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

export default PurchaseModal; 