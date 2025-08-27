import "./CBX2.sol";
pragma solidity ^0.8.30;

interface ICBX {
    function activate() external;
}
contract Factory {
    event poolsChanged(bytes currentPools);
    event newPendingPool(address Address, address Seller, string IPFS, uint256 initialSupply, uint256 registry);
    event poolActivated(address Address, address Seller, string IPFS, uint256 initialSupply);
    event poolDeactivated(address Address, address Seller, string IPFS, bool refundRequired, uint256 registry); // a pool can be deactivated either because the seller withdraws credits (true),
                                                                                                               //or because all credits are sold (false).
    event refundSeller(address Address, address Seller, string IPFS, uint256 refundAmount, uint256 registry);
    // may as well have 0 = VERRA, 1 = GOLDSTANDARD, 2 = ETC..... Not having a fixed enum gives us flexibility for the future. 
    uint256 public counter; // increments each time a new pool is made.
    uint256 public fee;    // basis points
    uint256 public poolCreationDeposit;
    address public owner;
    uint256 public retirementGasFee = 0.05 ether; // can change later
    /*
    Pools begin as PENDING_APPROVAL, then owner (us) approves them to make them ACTIVE, then the pools themselves become INACTIVE either because the seller requests a refund, or all credits are sold.
    */
    enum PoolStatus{PENDING_APPROVAL,
                    ACTIVE,
                    INACTIVE
    }// inactive means no more credits can be purchased, however they can still be retired.



    struct Pool {
        PoolStatus status;
        address poolAddress;
        string IPFS_URI;
        address seller;
        uint256 pricePerToken;
        uint256 deposit;
        uint256 initialSupply;
        uint256 registry;
    }

    mapping(address => Pool) addressToPool;
    mapping(address => bool) isActive;
    mapping(address => Pool[]) sellerPools;

    address[] public pools;

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    function checkActive(address poolAddress) external view returns (bool) {
        return isActive[poolAddress];
    }

    function changeRetirementGasFee(uint256 _fee) external onlyOwner {
        retirementGasFee = _fee; // include e18 in input. 
    }

    function changeFee(uint256 _fee) external onlyOwner {
        fee = _fee; // in basis points ie 300 = %3
    }

    function changePoolCreationDeposit(uint256 _poolCreationDeposit) external onlyOwner {
        poolCreationDeposit = _poolCreationDeposit;
    }

    constructor(uint256 _fee, uint256 _poolCreationDeposit) {
        // our fee in basis points.
        owner = msg.sender;
        fee = _fee;
        poolCreationDeposit = _poolCreationDeposit; // with decimals ie 500 e18 NOT 500;

    }

    function emitPoolsChanged() internal {
        bytes memory poolsAsBytes = abi.encode(pools);
        emit poolsChanged(poolsAsBytes);
    }

    function createPool(string calldata IPFS, uint256 pricePerToken,  uint256 _initialSupply, address SellerAddress, string memory serialNumber, uint256 _registry) external payable returns (address) {
        require(msg.value == poolCreationDeposit, "insufficient Deposit Amount");
        CBX poolContract = new CBX(fee, _initialSupply, pricePerToken, owner, SellerAddress, serialNumber, counter); // need to pass in factory address too for activate() onlyFactory.
        counter++;
        Pool memory pool = Pool({
            status: PoolStatus.PENDING_APPROVAL,
            poolAddress: address(poolContract),
            IPFS_URI: IPFS,
            seller: SellerAddress,
            pricePerToken: pricePerToken,
            deposit: poolCreationDeposit,
            initialSupply: _initialSupply,
            registry: _registry
        });
        addressToPool[address(poolContract)] = pool;
        pools.push(address(poolContract));
        bytes memory poolsAsBytes = abi.encode(pools);
        emit poolsChanged(poolsAsBytes);
        emit newPendingPool(address(poolContract), SellerAddress, IPFS, _initialSupply, _registry);
        return address(poolContract);
    }

    function activatePool(address poolAddress) external onlyOwner {
        require(addressToPool[poolAddress].status == PoolStatus.PENDING_APPROVAL, "pool status must be PENDING_APPROVAL first");
        addressToPool[poolAddress].status = PoolStatus.ACTIVE;
        ICBX PoolContract = ICBX(poolAddress);
        PoolContract.activate();
        isActive[poolAddress] = true;
         
    }

    function deActivatePool(bool shouldRefund, uint256 refundAmount) external { // this can only be successfully called by an existing pool only becasue of msg.sender
        require(addressToPool[msg.sender].status == PoolStatus.ACTIVE, "Pool must first be ACTIVE");
        addressToPool[msg.sender].status = PoolStatus.INACTIVE;
        isActive[msg.sender] = false;
        address sellerAddress = addressToPool[msg.sender].seller;
        (bool success, ) = sellerAddress.call{value: addressToPool[msg.sender].deposit}(""); // return deposit
        emit poolDeactivated(msg.sender, sellerAddress, addressToPool[msg.sender].IPFS_URI, shouldRefund, addressToPool[msg.sender].registry);
        if (shouldRefund) {
            emit refundSeller(msg.sender, sellerAddress, addressToPool[msg.sender].IPFS_URI, refundAmount, addressToPool[msg.sender].registry);
        }
        
    }

    function getPool(address poolAddress) external view returns (Pool memory){
        return addressToPool[poolAddress];

    }

    function getSellersPools(address sellerAddress) external view returns (Pool[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < counter; i++) {
            if (addressToPool[pools[i]].seller == sellerAddress) {
                count++;
            }
        }
        Pool[] memory sellersPools = new Pool[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < counter; i++) {
           if (addressToPool[pools[i]].seller == sellerAddress) {
               sellersPools[index] = addressToPool[pools[i]];
               index++;
           }
        }
        return sellersPools;
    }

    function getActivePools() external view returns (Pool[] memory) {
        uint256 activeCount = 0;
        for (uint256 i = 0; i < pools.length; i++) {
            if (isActive[pools[i]]) {
                activeCount++;
            }
        }
        uint256 index = 0;
        Pool[] memory activePools = new Pool[](activeCount);
        for (uint256 i = 0; i < pools.length; i++){
            if (isActive[pools[i]]) {
            activePools[index] = addressToPool[pools[i]];
            index++;
            }
        }
        return activePools;
    }

    function getAllPools() external view returns (Pool[] memory) {
        Pool[] memory allPools = new Pool[](counter);
        for (uint256 i = 0; i < counter; i++) {
            allPools[i] = addressToPool[pools[i]];
        }
        return allPools;
    }

    function getPendingPools() external view returns (Pool[] memory) {
        uint256 pendingCount = 0;
        for (uint256 i = 0; i < pools.length; i++) {
            if (addressToPool[pools[i]].status == PoolStatus.PENDING_APPROVAL) {
                pendingCount++;
            }
        }
        
        Pool[] memory pendingPools = new Pool[](pendingCount);
        uint256 index = 0;
        for (uint256 i = 0; i < pools.length; i++){
            if (addressToPool[pools[i]].status == PoolStatus.PENDING_APPROVAL) {
                pendingPools[index] = addressToPool[pools[i]];
                index++;
            }
        }
        return pendingPools;
    }


}
