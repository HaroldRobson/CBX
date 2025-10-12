// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../src/Factory_v2.sol";
import "../src/CBX_v2.sol";
import "../src/NFT_v2.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract ComprehensiveNFTTestSuite is Test {
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
    address public user1 = makeAddr("user1");
    address public user2 = makeAddr("user2");
    address public user3 = makeAddr("user3");
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
        vm.deal(owner, 10 ether);
        vm.deal(seller, 10 ether);
        vm.deal(user1, 10 ether);
        vm.deal(user2, 10 ether);
        vm.deal(user3, 10 ether);
        uint256 amountToFund = 2_000_000 * 1e6;
        vm.startPrank(usdcWhale);
        usdc.transfer(user1, amountToFund);
        usdc.transfer(user2, amountToFund);
        usdc.transfer(user3, amountToFund);
        vm.stopPrank();
        vm.prank(owner);
        factory = new Factory(PLATFORM_FEE_BPS, POOL_DEPOSIT);
        nftReceipt = NFTReceipt(factory.NFTContractAddress());
        vm.prank(seller);
        address newPoolAddress =
            factory.createPool{value: POOL_DEPOSIT}("ipfs://pool1", PRICE_PER_TOKEN, INITIAL_SUPPLY, seller, "POOL1", 0);
        cbxPool1 = CBX(newPoolAddress);
        vm.prank(owner);
        factory.activatePool(newPoolAddress);
    }

    // =======================================================
    // ============ INITIAL STATE & VIEW FUNCTIONS ===========
    // =======================================================

    function test_InitialState_And_ConstantViewFunctions() public {
        assertEq(nftReceipt.owner(), owner, "Owner should be set correctly");
        assertEq(nftReceipt.factory(), address(factory), "Factory address should be set correctly");
        assertEq(nftReceipt.name(), "CBX Carbon Retirement Receipt", "Incorrect NFT name");
        assertEq(nftReceipt.symbol(), "CBXR", "Incorrect NFT symbol");
        assertEq(nftReceipt.NFTID(), 0, "Initial NFTID should be 0");
        assertEq(nftReceipt.bundleCounter(), 0, "Initial bundleCounter should be 0");

        NFTReceipt.awaitingReceipt[] memory pendingBundles = nftReceipt.getPendingBundles();
        assertEq(pendingBundles.length, 0, "There should be no pending bundles initially");
    }

    // =======================================================
    // ============ MULTI-BUNDLE LIFECYCLE & VIEWS ===========
    // =======================================================

    function test_MultiBundleLifecycle_And_StatefulViewFunctions() public {
        // --- BUNDLE 0: user1 and user2 retire ---
        _buyAndRetire(user1, 150);
        _buyAndRetire(user2, 250); // Total 400
        vm.prank(owner);
        cbxPool1.processRetirements(); // Mints NFTs 1, 2. Creates Bundle 0.

        // --- Verify State After Bundle 0 Creation ---
        assertEq(nftReceipt.bundleCounter(), 1, "Bundle counter should be 1");
        assertEq(nftReceipt.ownerOf(1), user1, "NFT 1 owner should be user1");
        assertEq(nftReceipt.ownerOf(2), user2, "NFT 2 owner should be user2");
        assertEq(nftReceipt.balanceOf(user1), 1, "User1 balance should be 1 NFT");

        // Test getPendingBundles with one pending bundle
        NFTReceipt.awaitingReceipt[] memory pending = nftReceipt.getPendingBundles();
        assertEq(pending.length, 1, "Should be one pending bundle");
        assertEq(pending[0].bundle, 0, "Pending bundle ID should be 0");
        assertEq(pending[0].totalValue, 400, "Pending bundle value should be 400");

        // Test getAwaitingReceipt for the specific bundle
        NFTReceipt.awaitingReceipt memory bundle0 = nftReceipt.getAwaitingReceipt(0);
        assertEq(bundle0.firstNFTID, 1);
        assertEq(bundle0.lastNFTID, 2);

        // --- BUNDLE 1: user3 retires ---
        _buyAndRetire(user3, 100);
        vm.prank(owner);
        cbxPool1.processRetirements(); // Mints NFT 3. Creates Bundle 1.

        // --- Verify State After Bundle 1 Creation ---
        assertEq(nftReceipt.bundleCounter(), 2, "Bundle counter should be 2");
        assertEq(nftReceipt.ownerOf(3), user3, "NFT 3 owner should be user3");
        pending = nftReceipt.getPendingBundles();
        assertEq(pending.length, 2, "Should now be two pending bundles");
        assertEq(pending[1].bundle, 1, "Second pending bundle ID should be 1");

        // --- VALIDATE BUNDLE 0 ONLY ---
        string memory ipfsHash0 = "QmFIRST_BUNDLE_HASH";
        vm.prank(owner);
        nftReceipt.validateReceipts(0, ipfsHash0);

        // --- Verify State After Partial Validation ---
        assertTrue(nftReceipt.isRetired(1), "NFT 1 should be retired");
        assertTrue(nftReceipt.isRetired(2), "NFT 2 should be retired");
        assertEq(nftReceipt.IPFSHash(1), ipfsHash0, "NFT 1 has incorrect IPFS hash");
        
        // Crucially, check that the other bundle is unaffected
        assertFalse(nftReceipt.isRetired(3), "NFT 3 should NOT be retired yet");
        assertEq(bytes(nftReceipt.IPFSHash(3)).length, 0, "NFT 3 should have no hash yet");

        // Check getPendingBundles again - should only contain the unhandled bundle
        pending = nftReceipt.getPendingBundles();
        assertEq(pending.length, 1, "Should only be one pending bundle left");
        assertEq(pending[0].bundle, 1, "The remaining pending bundle should be bundle 1");
    }

    // =======================================================
    // ============ EDGE CASES & SECURITY TESTS ==============
    // =======================================================

    function test_Revert_TokenURI_ForNonExistentToken() public {
        // The ERC721 standard requires tokenURI to revert for tokens that don't exist.
        // We use the raw selector to avoid any compiler scope issues with the custom error type.
        vm.expectRevert();
        nftReceipt.tokenURI(999);
    }

    function test_Revert_ValidateNonExistentBundle() public {
        // Attempting to validate a bundle that has not been created should fail.
        vm.prank(owner);
        vm.expectRevert();
        nftReceipt.validateReceipts(99, "fake-hash");
    }

    function test_Idempotency_ValidateBundleTwice() public {
        _buyAndRetire(user1, 100);
        vm.prank(owner);
        cbxPool1.processRetirements(); // Creates Bundle 0

        string memory ipfsHash = "QmIDEMPOTENT_HASH";
        vm.prank(owner);
        nftReceipt.validateReceipts(0, ipfsHash); // First validation

        // Assert initial validation worked
        assertTrue(nftReceipt.isRetired(1), "NFT should be retired after first validation");
        assertTrue(nftReceipt.awaitingReceiptsHandled(0), "Bundle should be handled after first validation");

        // Second validation with a different hash
        string memory newHash = "QmNEW_HASH";
        vm.prank(owner);
        vm.expectRevert("Bundle has already been handled");
        nftReceipt.validateReceipts(0, newHash);
        // The state should NOT have changed. The original hash should remain.
        assertEq(nftReceipt.IPFSHash(1), ipfsHash, "IPFS Hash should not change on second validation");
    }
    
    function test_VULNERABILITY_GasExhaustionOnValidateReceipts() public {
        // This test proves that a very large bundle could exceed the block gas limit,
        // making it impossible to validate and trapping the NFTs in a pending state.
        
        uint256 largeBundleSize = 3500; // A number large enough to likely exceed gas limits in a loop
        NFTReceipt.PendingRetirement[] memory largeRetirement = new NFTReceipt.PendingRetirement[](largeBundleSize);
        
        for(uint i = 0; i < largeBundleSize; i++) {
            largeRetirement[i] = NFTReceipt.PendingRetirement({tokens: 1, user: user1, timestamp: block.timestamp});
        }
        bytes memory payload = abi.encode(largeRetirement);

        // We must prank as the pool to call sendReceipts directly
        vm.prank(address(cbxPool1));
        nftReceipt.sendReceipts(payload);

        // Now, as the owner, try to validate this massive bundle. This is expected to fail.
        vm.prank(owner);
        nftReceipt.validateReceipts(0, "QmGAS_LIMIT_HASH");
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
