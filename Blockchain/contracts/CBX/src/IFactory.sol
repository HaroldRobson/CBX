
pragma solidity ^0.8.0;
interface IFactory {
    function deActivatePool(bool shouldRefund, uint256 refundAmount) external;
    function getPool(address poolAddress) external view returns (Pool memory);

    enum PoolStatus {
        PENDING_APPROVAL,
        ACTIVE,
        INACTIVE
    } // inactive means no more credits can be purchased, however they can still be retired.

    struct Pool { // check where these should go. 
        PoolStatus status;
        address poolAddress;
        string IPFS_URI;
        address seller;
        uint256 pricePerToken;
        uint256 deposit;
        uint256 initialSupply;
        uint256 registry;
    }

}
