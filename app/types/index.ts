export interface Pool {
  status: number;
  poolAddress: string;
  IPFS_URI: string;
  seller: string;
  pricePerToken: string;
  deposit: string;
  initialSupply: string;
  registry: number;
}

export interface PoolSummary {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  pricePerToken: string;
  pricePerTokenWithFee: string;
  remainingSupply: string;
  seller: string;
  owner: string;
  status: number;
  feeBps: string;
  userBalance: string;
}

export interface ProjectMetadata {
  name: string;
  developer: string;
  country: string;
  registry: string;
  issuanceDate: string;
  description: string;
  imageUrl: string;
}

export interface RetirementReceipt {
  id: string;
  projectName: string;
  amount: number;
  retirementDate: string;
  status: 'Complete' | 'Pending';
  certificateId?: string;
}

export interface NFTCertificate {
  id: string;
  amountRetired: number;
  project: {
    name: string;
    registry: string;
  };
  serialNumber: string;
  retirementDate: string;
  transactionHash: string;
  nftTokenId: string;
  ipfsLink: string;
}