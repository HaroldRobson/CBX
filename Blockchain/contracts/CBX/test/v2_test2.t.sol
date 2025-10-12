
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../src/Factory_v2.sol";
import "../src/CBX_v2.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract ComprehensiveCarbonTest is Test {
    // ... (State variables are unchanged) ...
    Factory public factory;
    CBX public cbxPool1;
    CBX public cbxPool2;
    CBX public cbxPool3;
    IERC20 public usdc = IERC20(0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582);
    address public owner = makeAddr("owner");
    address public seller = makeAddr("seller");
    address public seller2 = makeAddr("seller2");
    address public user1 = makeAddr("user1");
    address public user2 = makeAddr("user2");
    address public usdcWhale = 0x26c84e7640DcC7A3DCa2abA5e6e0a56Bef5a2f7C;
    uint256 constant PLATFORM_FEE_BPS = 300;
    uint256 constant POOL_DEPOSIT = 1 ether;
    uint256 constant INITIAL_SUPPLY = 10000;
    uint256 constant PRICE_PER_TOKEN = 50_000;

    function setUp() public {
        vm.createSelectFork(vm.rpcUrl("amoy"));
        vm.deal(owner, 10 ether);
        vm.deal(seller, 10 ether);
        vm.deal(seller2, 10 ether);
        vm.deal(user1, 10 ether);
        vm.deal(user2, 10 ether);
        uint256 amountToFund = 20_000 * 1e6;
        vm.startPrank(usdcWhale);
        usdc.transfer(user1, amountToFund);
        usdc.transfer(user2, amountToFund);
        vm.stopPrank();
        vm.prank(owner);
        factory = new Factory(PLATFORM_FEE_BPS, POOL_DEPOSIT);
        vm.prank(seller);
        address newPoolAddress =
            factory.createPool{value: POOL_DEPOSIT}("ipfs://pool1", PRICE_PER_TOKEN, INITIAL_SUPPLY, seller, "POOL1", 0);
        vm.stopPrank();
        cbxPool1 = CBX(newPoolAddress);
        vm.prank(owner);
        factory.activatePool(newPoolAddress);
    }

    // =======================================================
    // ======== ECONOMIC AND LIFECYCLE TESTS ================
    // =======================================================

    function test_Withdrawals_OwnerAndSeller() public {
        uint256 tokensToBuy = 5000;
        uint256 totalCost = tokensToBuy * cbxPool1.getUSDCPricePerTokenWithFee();

        // --- FIX: Use startPrank for multiple calls ---
        vm.startPrank(user1);
        usdc.approve(address(cbxPool1), totalCost);
        cbxPool1.buyTokensWithUSDC(tokensToBuy);
        vm.stopPrank();

        uint256 initialFees = cbxPool1.feesCollected();
        uint256 initialProfit = cbxPool1.sellerProfit();
        assertTrue(initialFees > 0);
        assertTrue(initialProfit > 0);
        uint256 ownerInitialUSDC = usdc.balanceOf(owner);
        uint256 feeToWithdraw = initialFees / 2;
        vm.prank(owner);
        cbxPool1.withDrawUSDCFeesPartial(feeToWithdraw, owner);
        assertEq(usdc.balanceOf(owner), ownerInitialUSDC + feeToWithdraw);
        uint256 sellerInitialUSDC = usdc.balanceOf(seller);
        vm.prank(seller);
        cbxPool1.withDrawUSDCProfits();
        assertEq(usdc.balanceOf(seller), sellerInitialUSDC + initialProfit);
    }

    function test_PoolClosing_SellerInitiated_WithRemainingSupply() public {
        uint256 tokensToBuy = 1000;
        uint256 cost = tokensToBuy * cbxPool1.getUSDCPricePerTokenWithFee();

        // --- FIX: Use startPrank for multiple calls ---
        vm.startPrank(user1);
        usdc.approve(address(cbxPool1), cost);
        cbxPool1.buyTokensWithUSDC(tokensToBuy);
        vm.stopPrank();

        uint256 sellerInitialETH = seller.balance;
        vm.prank(seller);
        cbxPool1.closePool();
        Factory.Pool memory pool = factory.getPool(address(cbxPool1));
        assertEq(uint256(pool.status), uint256(Factory.PoolStatus.INACTIVE));
        assertFalse(factory.checkActive(address(cbxPool1)));
        assertApproxEqAbs(seller.balance, sellerInitialETH + POOL_DEPOSIT, 1e16);
    }

    function test_PoolClosing_Automatic_OnSellOut() public {
        uint256 sellerInitialETH = seller.balance;

        // --- FIX: Use startPrank for multiple calls ---
        vm.startPrank(user1);
        usdc.approve(address(cbxPool1), type(uint256).max);
        cbxPool1.buyTokensWithUSDC(INITIAL_SUPPLY);
        vm.stopPrank();

        Factory.Pool memory pool = factory.getPool(address(cbxPool1));
        assertEq(uint256(pool.status), uint256(Factory.PoolStatus.INACTIVE));
        assertFalse(factory.checkActive(address(cbxPool1)));
        assertApproxEqAbs(seller.balance, sellerInitialETH + POOL_DEPOSIT, 1e16);
    }

    // (The other tests were already correct and remain unchanged)
    function test_PoolClosing_OwnerInitiated() public {
        uint256 sellerInitialETH = seller.balance;
        vm.prank(owner);
        cbxPool1.closepool();
        Factory.Pool memory pool = factory.getPool(address(cbxPool1));
        assertEq(uint256(pool.status), uint256(Factory.PoolStatus.INACTIVE));
        assertApproxEqAbs(seller.balance, sellerInitialETH + POOL_DEPOSIT, 1e16);
    }

    function test_Factory_PoolManagement_And_Getters() public {
        vm.prank(seller);
        factory.createPool{value: POOL_DEPOSIT}("ipfs://pool2", PRICE_PER_TOKEN, 5000, seller, "POOL2", 1);
        vm.stopPrank();
        vm.prank(seller2);
        address pool3Addr =
            factory.createPool{value: POOL_DEPOSIT}("ipfs://pool3", PRICE_PER_TOKEN, 8000, seller2, "POOL3", 0);
        vm.stopPrank();
        vm.prank(owner);
        factory.activatePool(pool3Addr);
        vm.stopPrank();
        Factory.Pool[] memory allPools = factory.getAllPools();
        assertEq(allPools.length, 3);
        Factory.Pool[] memory activePools = factory.getActivePools();
        assertEq(activePools.length, 2);
        bool foundPool1;
        bool foundPool3;
        for (uint256 i; i < activePools.length; i++) {
            if (activePools[i].poolAddress == address(cbxPool1)) foundPool1 = true;
            if (activePools[i].poolAddress == pool3Addr) foundPool3 = true;
        }
        assertTrue(foundPool1);
        assertTrue(foundPool3);
        Factory.Pool[] memory seller1Pools = factory.getSellersPools(seller);
        assertEq(seller1Pools.length, 2);
        Factory.Pool[] memory seller2Pools = factory.getSellersPools(seller2);
        assertEq(seller2Pools.length, 1);
        assertEq(seller2Pools[0].poolAddress, pool3Addr);
    }
}
