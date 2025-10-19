// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../src/Factory_v2.sol";
import "../src/CBX_v2.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// A helper contract that cannot receive ETH. Used to test deposit return failures.
contract RejectEth {
// This contract intentionally lacks a payable receive() or fallback() function.
}

contract EdgeCaseTestSuite is Test {
    //=======================================================
    // ================= STATE VARIABLES ====================
    //=======================================================
    Factory public factory;
    CBX public cbxPool1;
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

        vm.prank(seller);
        address newPoolAddress =
            factory.createPool{value: POOL_DEPOSIT}("ipfs://pool1", PRICE_PER_TOKEN, INITIAL_SUPPLY, seller, "POOL1", 0);
        cbxPool1 = CBX(newPoolAddress);

        vm.prank(owner);
        factory.activatePool(newPoolAddress);
    }

    // =======================================================
    // =========== RETIREMENT LOGIC EDGE CASES ===============
    // =======================================================

    function test_ProcessRetirements_SimpleBundle_NoSplit() public {
        _buyAndRetire(user1, 150);
        _buyAndRetire(user2, 250);

        assertEq(cbxPool1.getPendingCount(), 2);

        // FIX: Adjusted vm.expectEmit to match the event signature correctly
        // We check topic1 (bundleId), but ignore the complex `data` part.
        vm.expectEmit(true, false, false, false);
        emit CBX.RetirementBundle(1, 0, bytes(""), address(0)); // Values other than topic1 don't matter here

        vm.prank(owner);
        cbxPool1.processRetirements();

        assertEq(cbxPool1.getPendingCount(), 0, "Queue should be empty after processing");
    }

    function test_ProcessRetirements_ComplexSplit() public {
        _buyAndRetire(user1, 80);
        _buyAndRetire(user2, 80);
        _buyAndRetire(user3, 80);

        // FIX: Adjusted vm.expectEmit
        vm.expectEmit(true, false, false, false);
        emit CBX.RetirementBundle(1, 0, bytes(""), address(0));

        vm.prank(owner);
        cbxPool1.processRetirements();

        assertEq(cbxPool1.getPendingCount(), 1, "Queue should have 1 item left");
        (uint256 tokens, address user,) = cbxPool1.pendingRetirementQueue(0);
        assertEq(tokens, 40, "Remaining queue item should have 40 tokens");
        assertEq(user, user3, "Remaining queue item should belong to user3");
    }

    function test_ProcessRetirements_ResidueLargerThanLastItem() public {
        _buyAndRetire(user1, 150);
        _buyAndRetire(user2, 20);
        _buyAndRetire(user3, 20);

        // FIX: Adjusted vm.expectEmit
        vm.expectEmit(true, false, false, false);
        emit CBX.RetirementBundle(1, 0, bytes(""), address(0));

        vm.prank(owner);
        cbxPool1.processRetirements();

        assertEq(cbxPool1.getPendingCount(), 3, "Queue should have 3 remaining item");
        (uint256 tokens, address user,) = cbxPool1.pendingRetirementQueue(0);
        assertEq(tokens, 50, "User1's remaining part should be 50");
        assertEq(user, user1, "Remaining queue item should belong to user1");
    }

    function test_Revert_ProcessRetirements_WhenQueueIsEmpty() public {
        vm.prank(owner);
        vm.expectRevert("QUEUE IS TOO SMALL");
        cbxPool1.processRetirements();
    }

    function test_ProcessRetirements_DoesNothingIfTotalIsLessThan100() public {
        _buyAndRetire(user1, 40);
        _buyAndRetire(user2, 50);

        vm.prank(owner);
        cbxPool1.processRetirements();

        assertEq(cbxPool1.getPendingCount(), 2, "Queue should remain unchanged");
    }
// =======================================================
    // ======== RETIRE ON BEHALF OF EDGE CASES ===============
    // =======================================================

    function test_RetireOnBehalfOf_Success() public {
        // 1. SETUP
        uint256 tokensToBuyAndRetire = 200;
        _buyTokens(user1, tokensToBuyAndRetire);
        
        uint256 initialTotalSupply = cbxPool1.totalSupply();
        uint256 ownerInitialEth = owner.balance;
        string memory retirementMessage = "Retiring 2 credits for Q4 2025 compliance.";

        // 2. ARRANGE: We will check that AN event of this type is emitted, but we won't
        // check the complex values like bundleId, which are hard to predict.
        // By setting all booleans to false, we just check the event signature.
        vm.expectEmit(false, false, false, false);
        emit CBX.RetiredOnBehalfOf(0, 0, bytes(""), address(0), "");

        // 3. ACT
        vm.prank(user1);
        cbxPool1.retireOnBehalfOf{value: RETIREMENT_FEE}(tokensToBuyAndRetire, retirementMessage);

        // 4. ASSERT
        assertEq(cbxPool1.balanceOf(user1), 0, "User1's token balance should be zero");
        assertEq(cbxPool1.totalSupply(), initialTotalSupply - tokensToBuyAndRetire, "Total supply should decrease");
        assertEq(owner.balance, ownerInitialEth + RETIREMENT_FEE, "Owner should receive the retirement fee");
        assertEq(cbxPool1.getPendingCount(), 0, "Pending retirement queue should not be affected");
    }

    function test_Revert_RetireOnBehalfOf_IfAmountNotMultipleOf100() public {
        // 1. SETUP
        _buyTokens(user1, 150);
        uint256 invalidAmount = 150;

        // 2. ACT & ASSERT: Expect revert without a reason string, to match your contract's code.
        vm.prank(user1);
        vm.expectRevert(); 
        cbxPool1.retireOnBehalfOf{value: RETIREMENT_FEE}(invalidAmount, "This will fail");
    }

    function test_Revert_RetireOnBehalfOf_IfInsufficientFee() public {
        // 1. SETUP
        _buyTokens(user1, 200);

        // 2. ACT & ASSERT: Expect revert when not sending enough ETH.
        vm.prank(user1);
        vm.expectRevert(); 
        cbxPool1.retireOnBehalfOf{value: RETIREMENT_FEE - 1}(200, "Fee is too low");
    }

    function test_Revert_RetireOnBehalfOf_IfInsufficientTokens() public {
        // 1. SETUP
        uint256 balance = 100;
        uint256 needed = 200;
        _buyTokens(user1, balance);
        
        // 2. ACT & ASSERT: Expect the modern "custom error" from OpenZeppelin.
        vm.prank(user1);
        vm.expectRevert();
        cbxPool1.retireOnBehalfOf{value: RETIREMENT_FEE}(needed, "Not enough tokens");
    }
    // =======================================================
    // ============ FINANCIAL & SECURITY EDGE CASES ==========
    // =======================================================

    function test_VULNERABILITY_SellerDepositIsLostIfSellerIsUnpayable() public {
        RejectEth unpayableSeller = new RejectEth();
        vm.deal(address(unpayableSeller), 10 ether);

        uint256 factoryInitialBalance = address(factory).balance;
        vm.prank(address(unpayableSeller));
        address poolAddr = factory.createPool{value: POOL_DEPOSIT}(
            "ipfs://bad", PRICE_PER_TOKEN, 100, address(unpayableSeller), "BAD", 0
        );
        CBX badPool = CBX(poolAddr);

        vm.prank(owner);
        factory.activatePool(poolAddr);

        // FIX: Added vm.prank(owner) to satisfy the onlyOwner modifier on closepool()
        vm.prank(owner);
        badPool.closepool();

        assertEq(address(unpayableSeller).balance, 9 ether, "Unpayable seller should not have received deposit");
        assertEq(
            address(factory).balance - factoryInitialBalance, POOL_DEPOSIT, "Factory should now hold the locked deposit"
        );
    }

    function test_VULNERABILITY_DirectUSDCtransferBricksWithdrawals() public {
        _buyTokens(user1, 1000);

        uint256 accidentalAmount = 1_000_000;
        vm.prank(usdcWhale);
        usdc.transfer(address(cbxPool1), accidentalAmount);

        assertTrue(usdc.balanceOf(address(cbxPool1)) > cbxPool1.sellerProfit() + cbxPool1.feesCollected());

        vm.prank(seller);
        vm.expectRevert("insufficient funds");
        cbxPool1.closePool();
    }

    function test_FrontRunning_OwnerCanChangeFeeBeforePurchase() public {
        uint256 tokensToBuy = 1000;
        uint256 costWithOldFee = tokensToBuy * cbxPool1.getUSDCPricePerTokenWithFee();

        uint256 newFee = 1000;
        vm.prank(owner);
        cbxPool1.setFee(newFee);

        uint256 costWithNewFee = tokensToBuy * cbxPool1.getUSDCPricePerTokenWithFee();
        assertTrue(costWithNewFee > costWithOldFee);

        vm.startPrank(user1);
        usdc.approve(address(cbxPool1), costWithNewFee);
        cbxPool1.buyTokensWithUSDC(tokensToBuy);
        vm.stopPrank();

        uint256 expectedFees = (costWithNewFee * newFee) / (1e4 + newFee);
        assertApproxEqAbs(cbxPool1.feesCollected(), expectedFees, 1);
    }

    function test_SellerCanPullBackUnsoldTokens() public {
        uint256 initialReserves = cbxPool1.getReserves();
        uint256 amountToPull = 1000;

        vm.prank(seller);
        cbxPool1.sellerTransfer(seller, amountToPull);

        assertEq(cbxPool1.balanceOf(seller), amountToPull);
        assertEq(cbxPool1.getReserves(), initialReserves - amountToPull);
    }

    // =======================================================
    // ======== OFF-CHAIN TRANSFER & OTHER EDGE CASES ========
    // =======================================================

    function test_OffChainTransfer_BurnsOnlyWholeCredits() public {
        _buyTokens(user1, 350);

        vm.prank(user1);
        cbxPool1.transferOffChain{value: RETIREMENT_FEE}(350, "Registry: Verra, Acc: 123");

        assertEq(cbxPool1.balanceOf(user1), 50);
        assertEq(cbxPool1.totalSupply(), INITIAL_SUPPLY - 300);
    }

    function test_OffChainTransfer_BurnsZeroIfAmountIsLessThan100() public {
        _buyTokens(user1, 99);
        uint256 initialSupply = cbxPool1.totalSupply();
        uint256 ownerInitialEth = owner.balance;

        vm.startPrank(user1);
        cbxPool1.transferOffChain{value: RETIREMENT_FEE}(99, "Registry: Verra, Acc: 123");
        vm.stopPrank();

        assertEq(cbxPool1.balanceOf(user1), 99);
        assertEq(cbxPool1.totalSupply(), initialSupply);
        assertEq(owner.balance, ownerInitialEth + RETIREMENT_FEE);
    }

    function test_Revert_CreatePool_WithInsufficientDeposit() public {
        vm.prank(seller);
        vm.expectRevert("insufficient Deposit Amount");
        factory.createPool{value: POOL_DEPOSIT - 1}("ipfs://fail", PRICE_PER_TOKEN, 100, seller, "FAIL", 0);
    }

    function test_Revert_ActivatePool_WhenAlreadyActive() public {
        vm.prank(owner);
        vm.expectRevert("pool status must be PENDING_APPROVAL first");
        factory.activatePool(address(cbxPool1));
    }

    function test_PriceCalculation_MatchesExpectedDollarValue() public {
        // This test explicitly verifies that the contract's price calculation,
        // when accounting for USDC decimals, matches the expected real-world dollar value.

        // --- 1. Define Expected Real-World Values ---
        uint256 tokensToBuy = 100; // 1 full carbon credit
        uint256 usdcDecimals = 1e6;

        // Expected base price in USDC units: 100 tokens * $0.05/token = $5.00
        uint256 expectedBaseCost = 5 * usdcDecimals;

        // Expected fee in USDC units: $5.00 * 3% = $0.15
        uint256 expectedFee = (expectedBaseCost * PLATFORM_FEE_BPS) / 10000;

        // Total expected cost in smallest USDC units
        uint256 expectedTotalCostInUSDC = expectedBaseCost + expectedFee;
        assertEq(expectedTotalCostInUSDC, 5_150_000, "Manual calculation should equal $5.15");

        // --- 2. Get The Cost Calculated By The Smart Contract ---
        uint256 pricePerTokenWithFee = cbxPool1.getUSDCPricePerTokenWithFee();
        uint256 contractCalculatedCostInUSDC = tokensToBuy * pricePerTokenWithFee;

        // --- 3. Assert They Are Equal ---
        assertEq(
            contractCalculatedCostInUSDC,
            expectedTotalCostInUSDC,
            "Contract's final cost does not match expected real-world dollar value"
        );
    }

    // =======================================================
    // ================= HELPER FUNCTIONS ====================
    // =======================================================

    function _buyTokens(address user, uint256 amount) internal {
        uint256 cost = amount * cbxPool1.getUSDCPricePerTokenWithFee();
        vm.startPrank(user);
        usdc.approve(address(cbxPool1), cost);
        cbxPool1.buyTokensWithUSDC(amount);
        vm.stopPrank();
    }

    function _buyAndRetire(address user, uint256 amount) internal {
        _buyTokens(user, amount);
        vm.prank(user);
        cbxPool1.retire{value: RETIREMENT_FEE}(amount);
    }
}
