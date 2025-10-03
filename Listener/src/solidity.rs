use alloy::sol;

sol! {
    contract Factory {
        event poolsChanged(bytes currentPools);
        event newPendingPool(address Address, address Seller, string IPFS, uint256 initialSupply, uint256 registry);
        event poolActivated(address Address, address Seller, string IPFS, uint256 initialSupply);
        event poolDeactivated(address Address, address Seller, string IPFS, bool refundRequired, uint256 registry); // a pool can be deactivated either because the seller withdraws credits (true),
            //or because all credits are sold (false).
        event PoolDeclined(address indexed poolAddress, address indexed seller, uint256 depositRefunded);
        event refundSeller(address Address, address Seller, string IPFS, uint256 refundAmount, uint256 registry);
        function activatePool(address poolAddress) external;

        }

    contract CBX {
        event newCreditsPurchased(uint256 amountOfNewTokens, uint256 pricePayedPerNewToken);
        event tokensMinted(uint256 amountOfNewTokens);
        event priceUpdated(uint256 newPrice);
        event feesUpdated(uint256 fee);
        event withdrawnUSDC(uint256 amount);
        event TokensPurchasedWithUSDC(address indexed buyer, uint256 amount, uint256 cost);
        event reserveOfCBXChanged(uint256 newReserve);
        event poolDeactivated(uint256 reservesLeft);
        event transferoffChain(uint256 amount, string details); // we transfer the credits
// off-chain to the seller
        event TokensQueued(address indexed user, uint256 tokens);
        event RetirementBundle(uint256 indexed bundleId, uint256 bundleSize, bytes RetirementData, address originalPool); // this should call a function which causes retirement on Verra. We  then in turn validateReceipts for this bundle ID once verra retires.
        function processRetirements() public; // regularly call this for all pools
        function withDrawUSDCFees() public;
        }

    contract NFT {
    function validateReceipts(uint256 bundle, string memory IPFS) public;
}
}
