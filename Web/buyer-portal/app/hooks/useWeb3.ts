'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

export interface Web3State {
  provider: ethers.BrowserProvider | null;
  signer: ethers.Signer | null;
  account: string | null;
  chainId: number | null;
  isConnected: boolean;
  isConnecting: boolean;
}

export const useWeb3 = () => {
  const [web3State, setWeb3State] = useState<Web3State>({
    provider: null,
    signer: null,
    account: null,
    chainId: null,
    isConnected: false,
    isConnecting: false,
  });

  // MARK: TODO – Rewrite for Transak One
  const connectWallet = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      alert('Please install MetaMask!');
      return;
    }

    try {
      setWeb3State(prev => ({ ...prev, isConnecting: true }));

      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);

      const signer = await provider.getSigner();
      const account = await signer.getAddress();
      const network = await provider.getNetwork();

      setWeb3State({
        provider,
        signer,
        account,
        chainId: Number(network.chainId),
        isConnected: true,
        isConnecting: false,
      });
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      setWeb3State(prev => ({ ...prev, isConnecting: false }));
    }
  };

  const disconnectWallet = () => {
    setWeb3State({
      provider: null,
      signer: null,
      account: null,
      chainId: null,
      isConnected: false,
      isConnecting: false,
    });
  };

  useEffect(() => {
    // Check if wallet is already connected on page load
    const checkConnection = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const accounts = await provider.listAccounts();
          if (accounts.length > 0) {
            const signer = await provider.getSigner();
            const account = await signer.getAddress();
            const network = await provider.getNetwork();

            setWeb3State({
              provider,
              signer,
              account,
              chainId: Number(network.chainId),
              isConnected: true,
              isConnecting: false,
            });
          }
        } catch (error) {
          console.error('Error checking wallet connection:', error);
        }
      }
    };

    checkConnection();

    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          connectWallet();
        }
      });

      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    }

    return () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }
    };
  }, []);

  return {
    ...web3State,
    connectWallet,
    disconnectWallet,
  };
};