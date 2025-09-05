interface Window {
  ethereum?: {
    isMetaMask?: true;
    request?: (...args: any[]) => Promise<any>;
    on?: (...args: any[]) => void;
    removeListener?: (...args: any[]) => void;
    removeAllListeners?: (...args: any[]) => void;
  };
}