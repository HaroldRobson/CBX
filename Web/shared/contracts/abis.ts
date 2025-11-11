export const FACTORY_ABI = [
  // View functions
  "function getActivePools() external view returns (tuple(uint8 status, address poolAddress, string IPFS_URI, address seller, uint256 pricePerToken, uint256 deposit, uint256 initialSupply, uint256 registry)[] memory)",
  "function getAllPools() external view returns (tuple(uint8 status, address poolAddress, string IPFS_URI, address seller, uint256 pricePerToken, uint256 deposit, uint256 initialSupply, uint256 registry)[] memory)",
  "function getPool(address poolAddress) external view returns (tuple(uint8 status, address poolAddress, string IPFS_URI, address seller, uint256 pricePerToken, uint256 deposit, uint256 initialSupply, uint256 registry) memory)",
  "function getPendingPools() external view returns (tuple(uint8 status, address poolAddress, string IPFS_URI, address seller, uint256 pricePerToken, uint256 deposit, uint256 initialSupply, uint256 registry)[] memory)",
  "function getSellersPools(address sellerAddress) external view returns (tuple(uint8 status, address poolAddress, string IPFS_URI, address seller, uint256 pricePerToken, uint256 deposit, uint256 initialSupply, uint256 registry)[] memory)",
  "function checkActive(address poolAddress) external view returns (bool)",
  // Public variables
  "function counter() public view returns (uint256)",
  "function fee() public view returns (uint256)",
  "function poolCreationDeposit() public view returns (uint256)",
  "function owner() public view returns (address)",
  "function retirementGasFee() public view returns (uint256)",
  // Write functions
  "function createPool(string calldata IPFS, uint256 pricePerToken, uint256 _initialSupply, address SellerAddress, string memory serialNumber, uint256 _registry) external payable returns (address)",
  "function activatePool(address poolAddress) external",
  "function changeFee(uint256 _fee) external",
  "function changeRetirementGasFee(uint256 _fee) external",
  "function changePoolCreationDeposit(uint256 _poolCreationDeposit) external"
];

export const CBX_ABI = [
  // View functions for marketplace
  "function getReserves() public view returns (uint256)",
  "function getUSDCPricePerCreditWithFee() public view returns (uint256)",
  "function getUSDCPricePerTokenWithFee() public view returns (uint256)",
  "function getPoolSummary(address _user) external view returns (tuple(string name, string symbol, uint8 decimals, uint256 totalSupply, uint256 pricePerToken, uint256 pricePerTokenWithFee, uint256 remainingSupply, address seller, address owner, uint8 status, uint256 feeBps, uint256 userBalance) memory)",
  "function balanceOf(address account) public view returns (uint256)",
  "function name() public view returns (string memory)",
  "function symbol() public view returns (string memory)",
  "function decimals() public view returns (uint8)",
  "function totalSupply() public view returns (uint256)",
  // Public variables
  "function owner() public view returns (address)",
  "function seller() public view returns (address)",
  "function pricePerToken() public view returns (uint256)",
  "function factory() public view returns (address)",
  "function USDC() public view returns (address)",
  "function fee() public view returns (uint256)",
  "function RETIREMET_GAS_FEE() public view returns (uint256)",
  "function sellerProfit() public view returns (uint256)",
  "function feesCollected() public view returns (uint256)",
  "function status() public view returns (uint8)",
  // Write functions
  "function buyTokensWithUSDC(uint256 amountOfCBXOut) external",
  "function buyAndRetireTokensWithUSDC(uint256 amountOfCBXOut) external payable",
  "function retire(uint256 amountOfTokens) external payable",
  "function sellerTransfer(address recipient, uint256 amount) public",
  "function setFee(uint256 _fee) external",
  "function setRetirementGasFee(uint256 _fee) external",
  // Retirement functions
  "function getPendingCount() external view returns (uint256)",
  "function processRetirements() public",
  "function transferOffChain(uint256 amountOfTokens, string memory details) external payable"
];

export const USDC_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function balanceOf(address account) external view returns (uint256)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function decimals() external view returns (uint8)",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) external returns (bool)"
];

export const FACTORY_ADDRESS = "0x742d35Cc6436C0532925a3b8D9956b0E0C32c555"; // Replace with actual address
export const USDC_ADDRESS = "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359"; // Polygon USDC