// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../src/Factory_v2.sol";
import "../src/CBX_v2.sol";
import "../src/NFT_v2.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract OnBehalfOfTestSuite is Test {
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
    address public payer = makeAddr("payer"); // The one who pays
    address public recipient1 = makeAddr("recipient1"); // The one who receives
    address public recipient2 = makeAddr("recipient2");
    address public recipient3 = makeAddr("recipient3");
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
        
        // Fund all accounts with ETH
        vm.deal(owner, 10 ether);
        vm.deal(seller, 10 ether);
        vm.deal(payer, 10 ether);
        vm.deal(recipient1, 10 ether);
        vm.deal(recipient2, 10 ether);
        vm.deal(recipient3, 10 ether);
        
        // Fund payer and recipients with USDC
        uint256 amountToFund = 2_000_000 * 1e6;
        vm.startPrank(usdcWhale);
        usdc.transfer(payer, amountToFund);
        usdc.transfer(recipient1, amountToFund);
        usdc.transfer(recipient2, amountToFund);
        usdc.transfer(recipient3, amountToFund);
        vm.stopPrank();
        
        // Deploy factory and pool
        vm.prank(owner);
        factory = new Factory(PLATFORM_FEE_BPS, POOL_DEPOSIT);
        nftReceipt = NFTReceipt(factory.NFTContractAddress());
        
        vm.prank(seller);
        address newPoolAddress = factory.createPool{value: POOL_DEPOSIT}(
            "ipfs://pool1",
            PRICE_PER_TOKEN,
            INITIAL_SUPPLY,
            seller,
            "POOL1",
            0
        );
        cbxPool1 = CBX(newPoolAddress);
        
        vm.prank(owner);
        factory.activatePool(newPoolAddress);
    }

    //=======================================================
    // ========== buyTokensOnBehalfOf TESTS =================
    //=======================================================

    function test_BuyTokensOnBehalfOf_BasicPurchase() public {
        uint256 amount = 100;
        uint256 cost = amount * cbxPool1.getUSDCPricePerTokenWithFee();
        
        // Record initial balances
        uint256 recipientBalanceBefore = cbxPool1.balanceOf(recipient1);
        uint256 payerUSDCBefore = usdc.balanceOf(payer);
        uint256 poolReservesBefore = cbxPool1.getReserves();
        
        // Payer buys tokens for recipient1
        vm.startPrank(payer);
        usdc.approve(address(cbxPool1), cost);
        cbxPool1.buyTokensOnBehalfOf(amount, recipient1);
        vm.stopPrank();
        
        // Verify token transfer
        assertEq(
            cbxPool1.balanceOf(recipient1),
            recipientBalanceBefore + amount,
            "Recipient should receive the tokens"
        );
        assertEq(
            cbxPool1.balanceOf(payer),
            0,
            "Payer should not receive any tokens"
        );
        
        // Verify USDC payment
        assertEq(
            usdc.balanceOf(payer),
            payerUSDCBefore - cost,
            "Payer should pay the cost"
        );
        
        // Verify pool reserves decreased
        assertEq(
            cbxPool1.getReserves(),
            poolReservesBefore - amount,
            "Pool reserves should decrease"
        );
    }

    function test_BuyTokensOnBehalfOf_MultipleRecipients() public {
        uint256 amount1 = 100;
        uint256 amount2 = 200;
        uint256 amount3 = 150;
        
        uint256 cost1 = amount1 * cbxPool1.getUSDCPricePerTokenWithFee();
        uint256 cost2 = amount2 * cbxPool1.getUSDCPricePerTokenWithFee();
        uint256 cost3 = amount3 * cbxPool1.getUSDCPricePerTokenWithFee();
        
        uint256 totalCost = cost1 + cost2 + cost3;
        
        // Payer buys for multiple recipients
        vm.startPrank(payer);
        usdc.approve(address(cbxPool1), totalCost);
        
        cbxPool1.buyTokensOnBehalfOf(amount1, recipient1);
        cbxPool1.buyTokensOnBehalfOf(amount2, recipient2);
        cbxPool1.buyTokensOnBehalfOf(amount3, recipient3);
        vm.stopPrank();
        
        // Verify all recipients received their tokens
        assertEq(cbxPool1.balanceOf(recipient1), amount1);
        assertEq(cbxPool1.balanceOf(recipient2), amount2);
        assertEq(cbxPool1.balanceOf(recipient3), amount3);
        assertEq(cbxPool1.balanceOf(payer), 0, "Payer should have no tokens");
    }

    function test_BuyTokensOnBehalfOf_EmitsCorrectEvent() public {
        uint256 amount = 100;
        uint256 cost = amount * cbxPool1.getUSDCPricePerTokenWithFee();
        
        vm.startPrank(payer);
        usdc.approve(address(cbxPool1), cost);
        
        // Expect the TokensPurchasedWithUSDC event with recipient address
        vm.expectEmit(true, false, false, true);
        emit CBX.TokensPurchasedWithUSDC(recipient1, amount, cost);
        
        cbxPool1.buyTokensOnBehalfOf(amount, recipient1);
        vm.stopPrank();
    }

    function test_BuyTokensOnBehalfOf_UpdatesProfitsCorrectly() public {
        uint256 amount = 1000;
        uint256 cost = amount * cbxPool1.getUSDCPricePerTokenWithFee();
        
        uint256 sellerProfitBefore = cbxPool1.sellerProfit();
        uint256 feesCollectedBefore = cbxPool1.feesCollected();
        
        vm.startPrank(payer);
        usdc.approve(address(cbxPool1), cost);
        cbxPool1.buyTokensOnBehalfOf(amount, recipient1);
        vm.stopPrank();
        
        // Calculate expected values
        uint256 expectedProfit = cost * 1e4 / (1e4 + PLATFORM_FEE_BPS);
        uint256 expectedFees = cost * PLATFORM_FEE_BPS / (1e4 + PLATFORM_FEE_BPS);
        
        assertEq(
            cbxPool1.sellerProfit() - sellerProfitBefore,
            expectedProfit,
            "Seller profit should increase correctly"
        );
        assertEq(
            cbxPool1.feesCollected() - feesCollectedBefore,
            expectedFees,
            "Fees collected should increase correctly"
        );
    }

    function test_Revert_BuyTokensOnBehalfOf_InsufficientSupply() public {
        uint256 excessiveAmount = INITIAL_SUPPLY + 1;
        uint256 cost = excessiveAmount * cbxPool1.getUSDCPricePerTokenWithFee();
        
        vm.startPrank(payer);
        usdc.approve(address(cbxPool1), cost);
        
        vm.expectRevert("We don't have enough carbon credits in our pool");
        cbxPool1.buyTokensOnBehalfOf(excessiveAmount, recipient1);
        vm.stopPrank();
    }

    function test_Revert_BuyTokensOnBehalfOf_PoolNotActive() public {
        // Deactivate pool
        vm.prank(seller);
        cbxPool1.closePool();
        
        uint256 amount = 100;
        uint256 cost = amount * cbxPool1.getUSDCPricePerTokenWithFee();
        
        vm.startPrank(payer);
        usdc.approve(address(cbxPool1), cost);
        
        vm.expectRevert("Pool is not active!");
        cbxPool1.buyTokensOnBehalfOf(amount, recipient1);
        vm.stopPrank();
    }

    //=======================================================
    // ======= buyAndRetireTokensOnBehalfOf TESTS ===========
    //=======================================================

    function test_BuyAndRetireTokensOnBehalfOf_BasicRetirement() public {
        uint256 amount = 100;
        uint256 cost = amount * cbxPool1.getUSDCPricePerTokenWithFee();
        
        // Record initial state
        uint256 totalSupplyBefore = cbxPool1.totalSupply();
        uint256 queueLengthBefore = cbxPool1.getPendingCount();
        
        // Payer buys and retires on behalf of recipient1
        vm.startPrank(payer);
        usdc.approve(address(cbxPool1), cost);
        cbxPool1.buyAndRetireTokensOnBehalfOf{value: RETIREMENT_FEE}(amount, recipient1);
        vm.stopPrank();
        
        // Verify tokens were burned
        assertEq(
            cbxPool1.totalSupply(),
            totalSupplyBefore - amount,
            "Total supply should decrease"
        );
        
        // Verify retirement was queued
        assertEq(
            cbxPool1.getPendingCount(),
            queueLengthBefore + 1,
            "Pending retirement queue should increase"
        );
        
        // Verify the queued retirement has correct recipient
        (uint256 tokens, address user, uint256 timestamp) = cbxPool1.pendingRetirementQueue(queueLengthBefore);
        assertEq(tokens, amount, "Queued tokens should match amount");
        assertEq(user, recipient1, "Queued user should be recipient, not payer");
        assertTrue(timestamp > 0, "Timestamp should be set");
    }

    function test_BuyAndRetireTokensOnBehalfOf_EmitsCorrectEvents() public {
        uint256 amount = 100;
        uint256 cost = amount * cbxPool1.getUSDCPricePerTokenWithFee();
        
        vm.startPrank(payer);
        usdc.approve(address(cbxPool1), cost);
        
        // Expect TokensQueued event with recipient address (not payer)
        vm.expectEmit(true, false, false, true);
        emit CBX.TokensQueued(recipient1, amount);
        
        cbxPool1.buyAndRetireTokensOnBehalfOf{value: RETIREMENT_FEE}(amount, recipient1);
        vm.stopPrank();
    }

    function test_BuyAndRetireTokensOnBehalfOf_GasFeeSentToOwner() public {
        uint256 amount = 100;
        uint256 cost = amount * cbxPool1.getUSDCPricePerTokenWithFee();
        
        uint256 ownerBalanceBefore = owner.balance;
        
        vm.startPrank(payer);
        usdc.approve(address(cbxPool1), cost);
        cbxPool1.buyAndRetireTokensOnBehalfOf{value: RETIREMENT_FEE}(amount, recipient1);
        vm.stopPrank();
        
        assertEq(
            owner.balance,
            ownerBalanceBefore + RETIREMENT_FEE,
            "Owner should receive gas fee"
        );
    }

    function test_Revert_BuyAndRetireTokensOnBehalfOf_InsufficientGasFee() public {
        uint256 amount = 100;
        uint256 cost = amount * cbxPool1.getUSDCPricePerTokenWithFee();
        
        vm.startPrank(payer);
        usdc.approve(address(cbxPool1), cost);
        
        vm.expectRevert();
        cbxPool1.buyAndRetireTokensOnBehalfOf{value: RETIREMENT_FEE - 0.01 ether}(amount, recipient1);
        vm.stopPrank();
    }

    function test_Revert_BuyAndRetireTokensOnBehalfOf_QueueFull() public {
        // Fill up the queue to MAX_PENDING_RETIREMENTS
        uint256 maxRetirements = cbxPool1.MAX_PENDING_RETIREMENTS();
        
        vm.startPrank(payer);
        for (uint256 i = 0; i < maxRetirements; i++) {
            uint256 cost = 1 * cbxPool1.getUSDCPricePerTokenWithFee();
            usdc.approve(address(cbxPool1), cost);
            cbxPool1.buyAndRetireTokensOnBehalfOf{value: RETIREMENT_FEE}(1, recipient1);
        }
        
        // Try to add one more - should fail
        uint256 cost = 1 * cbxPool1.getUSDCPricePerTokenWithFee();
        usdc.approve(address(cbxPool1), cost);
        
        vm.expectRevert("Retirement queue is full, try again later");
        cbxPool1.buyAndRetireTokensOnBehalfOf{value: RETIREMENT_FEE}(1, recipient1);
        vm.stopPrank();
    }

    //=======================================================
    // ========== MIXED SCENARIO TESTS ======================
    //=======================================================

    function test_MixedScenario_PayerBuysForSelfAndOthers() public {
        uint256 amountForSelf = 100;
        uint256 amountForOther = 200;
        
        uint256 costForSelf = amountForSelf * cbxPool1.getUSDCPricePerTokenWithFee();
        uint256 costForOther = amountForOther * cbxPool1.getUSDCPricePerTokenWithFee();
        
        vm.startPrank(payer);
        
        // Buy for self (regular purchase)
        usdc.approve(address(cbxPool1), costForSelf);
        cbxPool1.buyTokensWithUSDC(amountForSelf);
        
        // Buy for recipient
        usdc.approve(address(cbxPool1), costForOther);
        cbxPool1.buyTokensOnBehalfOf(amountForOther, recipient1);
        
        vm.stopPrank();
        
        assertEq(cbxPool1.balanceOf(payer), amountForSelf);
        assertEq(cbxPool1.balanceOf(recipient1), amountForOther);
    }

    //=======================================================
    // ================ HELPER FUNCTIONS ====================
    //=======================================================

    function _buyAndRetire(address user, uint256 amount) internal {
        uint256 cost = amount * cbxPool1.getUSDCPricePerTokenWithFee();
        vm.startPrank(user);
        usdc.approve(address(cbxPool1), cost);
        cbxPool1.buyAndRetireTokensWithUSDC{value: RETIREMENT_FEE}(amount);
        vm.stopPrank();
    }

    function _buyAndRetireOnBehalfOf(address buyer, address beneficiary, uint256 amount) internal {
        uint256 cost = amount * cbxPool1.getUSDCPricePerTokenWithFee();
        vm.startPrank(buyer);
        usdc.approve(address(cbxPool1), cost);
        cbxPool1.buyAndRetireTokensOnBehalfOf{value: RETIREMENT_FEE}(amount, beneficiary);
        vm.stopPrank();
    }
}
