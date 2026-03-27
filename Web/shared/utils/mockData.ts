import type { ProjectMetadata, RetirementReceipt, NFTCertificate } from '../types';

export const mockProjectMetadata: Record<string, ProjectMetadata> = {
  'forest-ecosystem': {
    name: 'Forest Ecosystem Restoration',
    developer: 'Rainforest Builder Ltd',
    country: 'Ghana',
    registry: 'Verra',
    issuanceDate: 'Jan 15, 2025',
    description: 'A comprehensive forest restoration project in Ghana',
    imageUrl: 'https://images.pexels.com/photos/957024/forest-trees-perspective-bright-957024.jpeg?auto=compress&cs=tinysrgb&w=800'
  },
  'wind-power': {
    name: 'India Wind Power Project',
    developer: 'Hero Future Energies Ltd',
    country: 'India',
    registry: 'Gold Standard',
    issuanceDate: 'Mar 22, 2025',
    description: 'Large-scale wind energy generation in India',
    imageUrl: 'https://images.pexels.com/photos/414928/pexels-photo-414928.jpeg?auto=compress&cs=tinysrgb&w=800'
  },
  'solar-power': {
    name: 'Rural Vietnam Solar Power',
    developer: 'Stepok Solar Power Company',
    country: 'Vietnam',
    registry: 'Gold Standard',
    issuanceDate: 'Feb 10, 2025',
    description: 'Solar energy infrastructure for rural communities',
    imageUrl: 'https://images.pexels.com/photos/2800832/pexels-photo-2800832.jpeg?auto=compress&cs=tinysrgb&w=800'
  }
};

export const mockRetirementReceipts: RetirementReceipt[] = [
  {
    id: 'RET-001',
    projectName: 'Amazon Rainforest Conservation',
    amount: 25.0,
    retirementDate: 'Jun 15, 2023',
    status: 'Complete',
    certificateId: 'VCS-123456789-123456789'
  },
  {
    id: 'RET-002',
    projectName: 'India Wind Power Project',
    amount: 10.5,
    retirementDate: 'Jul 22, 2023',
    status: 'Complete',
    certificateId: 'GS-987654321-987654321'
  },
  {
    id: 'RET-003',
    projectName: 'Forest Ecosystem Restoration',
    amount: 15.0,
    retirementDate: 'Aug 10, 2023',
    status: 'Pending',
  }
];

export const mockNFTCertificate: NFTCertificate = {
  id: 'VCS-123456789-123456789',
  amountRetired: 25.0,
  project: {
    name: 'Amazon Rainforest Conservation',
    registry: 'Verra'
  },
  serialNumber: 'VCS-123456789-123456789',
  retirementDate: 'June 15, 2023',
  transactionHash: '0x7a6b0f3e2c5d4b3a',
  nftTokenId: '#78901',
  ipfsLink: 'ipfs://bafybeihkoviema7g3'
};

export const mockUserBalances = {
  totalCreditsOwned: 45.5,
  retiredCredits: 12.5
};