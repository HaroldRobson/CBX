// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../src/Factory2.sol";
import "../src/CBX2.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract DAppHelperTestSuite is Test {
    //=======================================================
    // ================= STATE VARIABLES ====================
    //=======================================================
    // This setup is identical to your provided file for consistency.
    Factory public factory;
    CBX public cbxPool1;
    IERC20 public usdc = IERC20(0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359);
    
    // Actors
    address public owner = makeAddr("owner");
    address public seller = makeAddr("seller");
    address public seller2 = makeAddr("seller2");
    address public user1 = makeAddr("user1");
    address public user2 = makeAddr("user2");
    address public usdcWhale = 0xF977814e90dA44bFA03b6295A0616a897441aceC;

    // Constants
    uint256 constant PLATFORM_FEE_BPS = 300; // 3%
    uint256 constant POOL_DEPOSIT = 1 ether;
    uint256 constant INITIAL_SUPPLY = 10_000; // Represents 100 carbon credits
    uint256 constant PRICE_PER_TOKEN = 50_000; // 5e4 -> $0.05/token -> $5/credit
    uint256 constant RETIREMENT_FEE = 0.05 ether;

    //=======================================================
    // ===================== SETUP =========================
    //=======================================================
    function setUp() public {
        vm.createSelectFork(vm.rpcUrl("polygon"), 63_000_000);

        // Deal ETH to all actors
        vm.deal(owner, 10 ether);
        vm.deal(seller, 10 ether);
        vm.deal(seller2, 10 ether);
        vm.deal(user1, 10 ether);
        vm.deal(user2, 10 ether);

        // Fund users with USDC from a whale
        uint256 amountToFund = 2_000_000 * 1e6; // $2M USDC
        vm.startPrank(usdcWhale);
        usdc.transfer(user1, amountToFund);
        usdc.transfer(user2, amountToFund);
        vm.stopPrank();

        // Deploy Factory as owner
        vm.prank(owner);
        factory = new Factory(PLATFORM_FEE_BPS, POOL_DEPOSIT);

        // Create and activate the main pool for testing
        vm.prank(seller);
        address newPoolAddress = factory.createPool{value: POOL_DEPOSIT}(
            "ipfs://pool1", PRICE_PER_TOKEN, INITIAL_SUPPLY, seller, "POOL1", 0
        );
        cbxPool1 = CBX(newPoolAddress);
        
        vm.prank(owner);
        factory.activatePool(newPoolAddress);
    }

    // =======================================================
    // ======== TESTING NEW DAPP HELPER FUNCTIONS ============
    // =======================================================

    /**
     * @dev Tests the end-to-end flow of the buyAndRetireTokensWithUSDC function.
     */
    function test_BuyAndRetire_SuccessfulFlow() public {
        uint256 tokensToRetire = 500; // 5 carbon credits
        uint256 costInUSDC = tokensToRetire * cbxPool1.getUSDCPricePerTokenWithFee();

        // --- Record initial state ---
        uint256 initialUserUSDC = usdc.balanceOf(user1);
        uint256 initialPoolSupply = cbxPool1.getReserves();
        uint256 initialTotalSupply = cbxPool1.totalSupply();
        uint256 initialOwnerETH = owner.balance;
        uint256 initialQueueCount = cbxPool1.getPendingCount();

        // --- User approves and calls the function ---
        vm.startPrank(user1);
        usdc.approve(address(cbxPool1), costInUSDC);
        cbxPool1.buyAndRetireTokensWithUSDC{value: RETIREMENT_FEE}(tokensToRetire);
        vm.stopPrank();

        // --- Assertions ---
        assertEq(usdc.balanceOf(user1), initialUserUSDC - costInUSDC, "User's USDC should decrease by the cost");
        assertEq(cbxPool1.getReserves(), initialPoolSupply - tokensToRetire, "Pool reserves should decrease");
        assertEq(cbxPool1.totalSupply(), initialTotalSupply - tokensToRetire, "Total supply should decrease due to burn");
        assertEq(owner.balance, initialOwnerETH + RETIREMENT_FEE, "Owner should receive the retirement fee");
        assertEq(cbxPool1.getPendingCount(), initialQueueCount + 1, "Retirement queue count should increase by 1");
        
        // Verify the new queue item is correct
        (uint256 tokens, address user, ) = cbxPool1.pendingRetirementQueue(initialQueueCount);
        assertEq(tokens, tokensToRetire, "Queue item should have the correct token amount");
        assertEq(user, user1, "Queue item should belong to the correct user");

        // Verify the user never received any CBX tokens
        assertEq(cbxPool1.balanceOf(user1), 0, "User's CBX balance should remain 0");
    }

    /**
     * @dev Tests the getPoolSummary view function to ensure it returns accurate data.
     */
    function test_GetPoolSummary_ReturnsCorrectData() public {
        // --- Have user1 buy some tokens to create a balance ---
        uint256 tokensToBuy = 250;
        uint256 cost = tokensToBuy * cbxPool1.getUSDCPricePerTokenWithFee();
        vm.startPrank(user1);
        usdc.approve(address(cbxPool1), cost);
        cbxPool1.buyTokensWithUSDC(tokensToBuy);
        vm.stopPrank();

        // --- Get summary for user1 (who has a balance) ---
        CBX.PoolSummary memory summaryUser1 = cbxPool1.getPoolSummary(user1);

        // --- Assertions for user1's summary ---
        assertEq(summaryUser1.name, "POOL1");
        assertEq(summaryUser1.remainingSupply, INITIAL_SUPPLY - tokensToBuy);
        assertEq(summaryUser1.pricePerToken, PRICE_PER_TOKEN);
        assertEq(uint(summaryUser1.status), uint(CBX.PoolStatus.ACTIVE));
        assertEq(summaryUser1.seller, seller);
        assertEq(summaryUser1.userBalance, tokensToBuy, "Summary should show user1's correct balance");

        // --- Get summary for user2 (who has no balance) ---
        CBX.PoolSummary memory summaryUser2 = cbxPool1.getPoolSummary(user2);
        
        // --- Assertions for user2's summary ---
        assertEq(summaryUser2.remainingSupply, INITIAL_SUPPLY - tokensToBuy, "Remaining supply should be the same for all users");
        assertEq(summaryUser2.userBalance, 0, "Summary should show user2's balance as 0");
    }

    /**
     * @dev Tests the getPendingPools view function on the Factory contract.
     */
    function test_GetPendingPools_CorrectlyFilters() public {
        // --- Initial state: cbxPool1 was activated in setUp, so there are no pending pools ---
        Factory.Pool[] memory initialPendingPools = factory.getPendingPools();
        assertEq(initialPendingPools.length, 0, "Initially, there should be no pending pools");

        // --- Create a new pool but DO NOT activate it ---
        vm.prank(seller2);
        address pendingPoolAddr = factory.createPool{value: POOL_DEPOSIT}(
            "ipfs://pending", PRICE_PER_TOKEN, 5000, seller2, "PENDING", 1
        );
        
        // --- Check again: there should be one pending pool ---
        Factory.Pool[] memory pendingPoolsAfterCreation = factory.getPendingPools();
        assertEq(pendingPoolsAfterCreation.length, 1, "There should be one pending pool after creation");
        assertEq(pendingPoolsAfterCreation[0].poolAddress, pendingPoolAddr, "The address of the pending pool is incorrect");
        assertEq(uint(pendingPoolsAfterCreation[0].status), uint(Factory.PoolStatus.PENDING_APPROVAL), "Pool status should be PENDING_APPROVAL");

        // --- Activate the pending pool ---
        vm.prank(owner);
        factory.activatePool(pendingPoolAddr);

        // --- Check one last time: the pending pool list should be empty again ---
        Factory.Pool[] memory finalPendingPools = factory.getPendingPools();
        assertEq(finalPendingPools.length, 0, "Pending pools should be empty after activation");
    }
}
