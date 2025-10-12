
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../src/Factory_v2.sol";
import "../src/CBX_v2.sol";
import "../src/NFT_v2.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract NFTReceiptTestSuite is Test {
    //=======================================================
    // ================= STATE VARIABLES ====================
    //=======================================================
    Factory public factory;
    CBX public cbxPool1;
    NFTReceipt public nftReceipt;
    IERC20 public usdc = IERC20(0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582);

    // Actors
    address public owner = makeAddr("owner");
    address public seller = makeAddr("seller");
    address public seller2 = makeAddr("seller2");
    address public user1 = makeAddr("user1");
    address public user2 = makeAddr("user2");
    address public usdcWhale = 0x26c84e7640DcC7A3DCa2abA5e6e0a56Bef5a2f7C;

    // Constants
    uint256 constant PLATFORM_FEE_BPS = 300;
    uint256 constant POOL_DEPOSIT = 1 ether;
    uint256 constant INITIAL_SUPPLY = 10_000;
    uint256 constant PRICE_PER_TOKEN = 50_000;
    uint256 constant RETIREMENT_FEE = 0.05 ether;

    //=======================================================
    // ===================== SETUP =========================
    //=======================================================
    function setUp() public {
        vm.createSelectFork(vm.rpcUrl("amoy"));

        // Deal ETH to all actors
        vm.deal(owner, 10 ether);
        vm.deal(seller, 10 ether);
        vm.deal(seller2, 10 ether);
        vm.deal(user1, 10 ether);
        vm.deal(user2, 10 ether);

        // Fund users with USDC from a whale
        uint256 amountToFund = 2_000_000 * 1e6;
        vm.startPrank(usdcWhale);
        usdc.transfer(user1, amountToFund);
        usdc.transfer(user2, amountToFund);
        vm.stopPrank();

        // Deploy Factory and capture the deployed NFTReceipt contract address
        vm.prank(owner);
        factory = new Factory(PLATFORM_FEE_BPS, POOL_DEPOSIT);
        nftReceipt = NFTReceipt(factory.NFTContractAddress());

        // Create and activate a default pool for testing
        vm.prank(seller);
        address newPoolAddress =
            factory.createPool{value: POOL_DEPOSIT}("ipfs://pool1", PRICE_PER_TOKEN, INITIAL_SUPPLY, seller, "POOL1", 0);
        cbxPool1 = CBX(newPoolAddress);

        vm.prank(owner);
        factory.activatePool(newPoolAddress);
    }

    // =======================================================
    // ======== FULL NFT LIFECYCLE & CORE LOGIC TESTS ========
    // =======================================================

    function test_FullRetirementToValidatedNFTLifecycle() public {
        _buyAndRetire(user1, 120);
        _buyAndRetire(user2, 180);
        vm.prank(owner);
        cbxPool1.processRetirements();
        
        uint256 bundleId = 0;
        NFTReceipt.awaitingReceipt memory bundle = nftReceipt.getAwaitingReceipt(bundleId);
        assertEq(bundle.firstNFTID, 1);
        assertEq(bundle.lastNFTID, 2);

        // --- THE ROBUST SOLUTION: TEST THE STATE DIRECTLY ---

        // 1. Verify the initial state of the FIRST NFT before validation
        assertFalse(nftReceipt.isRetired(1), "NFT 1 should NOT be retired before validation");
        assertEq(bytes(nftReceipt.IPFSHash(1)).length, 0, "NFT 1 should have no IPFS hash before validation");

        // 2. Owner validates the receipts
        string memory ipfsHash = "QmXo7bC52q4YgPAdYcTggL42Z2KPA5D4S3frw6s7p4o5D9";
        vm.prank(owner);
        nftReceipt.validateReceipts(bundleId, ipfsHash);

        // 3. Verify the final state of BOTH NFTs after validation
        assertTrue(nftReceipt.isRetired(1), "BUG: First NFT in bundle (ID 1) was not validated!");
        assertEq(nftReceipt.IPFSHash(1), ipfsHash, "BUG: First NFT in bundle (ID 1) did not get IPFS hash!");

        assertTrue(nftReceipt.isRetired(2), "BUG: Last NFT in bundle (ID 2) was not validated!");
        assertEq(nftReceipt.IPFSHash(2), ipfsHash, "BUG: Last NFT in bundle (ID 2) did not get IPFS hash!");
    }

    // =======================================================
    // ============= ACCESS CONTROL & REVERT TESTS ===========
    // =======================================================

    function test_Revert_SendReceipts_IfNotPool() public {
        CBX.PendingRetirement[] memory retirements = new CBX.PendingRetirement[](1);
        retirements[0] = CBX.PendingRetirement({tokens: 100, user: user1, timestamp: block.timestamp});
        bytes memory payload = abi.encode(retirements);
        vm.prank(owner);
        vm.expectRevert();
        nftReceipt.sendReceipts(payload);
    }

    function test_Revert_ValidateReceipts_IfNotOwner() public {
        _buyAndRetire(user1, 100);
        vm.prank(owner);
        cbxPool1.processRetirements();
        vm.prank(user1);
        vm.expectRevert();
        nftReceipt.validateReceipts(0, "some-hash");
    }

    // =======================================================
    // ================== FACTORY FUNCTION TESTS =============
    // =======================================================

    function test_DeclinePool_RefundsDepositAndCleansState() public {
        uint256 seller2InitialBalance = seller2.balance;
        uint256 factoryInitialPoolCount = factory.getAllPools().length;

        vm.prank(seller2);
        address poolToDecline =
            factory.createPool{value: POOL_DEPOSIT}("ipfs://decline", PRICE_PER_TOKEN, 100, seller2, "DECLINE", 0);

        assertEq(seller2.balance, seller2InitialBalance - POOL_DEPOSIT);
        assertEq(factory.getAllPools().length, factoryInitialPoolCount + 1);
        Factory.Pool memory pendingPool = factory.getPool(poolToDecline);
        assertEq(uint256(pendingPool.status), uint256(Factory.PoolStatus.PENDING_APPROVAL));
        
        vm.prank(owner);
        factory.declinePool(poolToDecline);

        assertEq(seller2.balance, seller2InitialBalance, "Seller2 should be refunded their full deposit");
        assertEq(factory.getAllPools().length, factoryInitialPoolCount, "Pool count should revert to initial");

        Factory.Pool memory declinedPool = factory.getPool(poolToDecline);
        assertEq(declinedPool.seller, address(0), "Declined pool should be deleted from the mapping");
    }

    function test_Revert_DeclinePool_IfNotPending() public {
        vm.prank(owner);
        vm.expectRevert("pool status must be PENDING_APPROVAL first");
        factory.declinePool(address(cbxPool1));
    }

    // =======================================================
    // ================= HELPER FUNCTIONS ====================
    // =======================================================

    function _buyAndRetire(address user, uint256 amount) internal {
        uint256 cost = amount * cbxPool1.getUSDCPricePerTokenWithFee();
        vm.startPrank(user);
        usdc.approve(address(cbxPool1), cost);
        cbxPool1.buyAndRetireTokensWithUSDC{value: RETIREMENT_FEE}(amount);
        vm.stopPrank();
    }
}
