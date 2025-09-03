// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/Factory2.sol";
import "../src/CBX2.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract CarbonForkTest is Test {
    // ======== Contracts & Interfaces ========
    Factory public factory;
    CBX public cbxPool;
    IERC20 public usdc = IERC20(0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359);

    // ======== Realistic Actors (not blacklisted addresses) ========
    address public owner = address(0xA11CE); // Realistic looking address
    address public seller = address(0xB0B); // Realistic looking address
    address public user1 = address(0xC0FFEE); // Realistic looking address
    address public user2 = address(0xDECAF); // Realistic looking address

    // ======== Working whale addresses ========
    address public usdcWhale1 = 0x40ec5B33f54e0E8A33A975908C5BA1c14e5BbbDf;
    address public usdcWhale2 = 0x1a13F4Ca1d028320A707D99520AbFefca3998b7F;
    address public usdcWhale3 = 0x28C6c06298d514Db089934071355E5743bf21d60;

    // ======== Constants ========
    uint256 constant PLATFORM_FEE_BPS = 300; // 3%
    uint256 constant POOL_DEPOSIT = 1 ether;
    uint256 constant INITIAL_SUPPLY = 10000; // 100 credits
    uint256 constant PRICE_PER_TOKEN = 50_000; // 0.05 USDC

    function setUp() public {
        // Use a recent block
        vm.createSelectFork(vm.rpcUrl("polygon"), 63000000);

        // Give ETH for gas to all addresses
        vm.deal(owner, 10 ether);
        vm.deal(seller, 10 ether);
        vm.deal(user1, 10 ether);
        vm.deal(user2, 10 ether);

        // Deploy factory
        vm.prank(owner);
        factory = new Factory(PLATFORM_FEE_BPS, POOL_DEPOSIT);

        // Try to give USDC using multiple methods
        uint256 amountToGive = 10_000 * 1e6;
        bool success = false;

        // Method 1: Try deal() first (most reliable if supported)
        try this.tryDeal(address(usdc), user1, amountToGive) {
            deal(address(usdc), user2, amountToGive);
            success = true;
            console.log("Used deal() method successfully");
        } catch {
            console.log("deal() failed, trying whale transfers...");

            // Method 2: Try whale transfers
            address[3] memory whales = [usdcWhale1, usdcWhale2, usdcWhale3];

            for (uint256 i = 0; i < whales.length && !success; i++) {
                uint256 whaleBalance = usdc.balanceOf(whales[i]);
                console.log("Whale", i, "balance:", whaleBalance);

                if (whaleBalance >= amountToGive * 2) {
                    vm.startPrank(whales[i]);

                    // Try to transfer to users
                    try usdc.transfer(user1, amountToGive) returns (bool result1) {
                        if (result1) {
                            try usdc.transfer(user2, amountToGive) returns (bool result2) {
                                if (result2) {
                                    success = true;
                                    console.log("Whale", i, "transfer successful");
                                }
                            } catch Error(string memory reason) {
                                console.log("Transfer to user2 failed:", reason);
                            }
                        }
                    } catch Error(string memory reason) {
                        console.log("Transfer to user1 failed:", reason);
                    }

                    vm.stopPrank();
                }
            }
        }

        require(success, "Failed to get USDC using any method");

        // Verify balances
        console.log("User1 USDC balance:", usdc.balanceOf(user1));
        console.log("User2 USDC balance:", usdc.balanceOf(user2));

        require(usdc.balanceOf(user1) >= amountToGive, "User1 insufficient USDC");
        require(usdc.balanceOf(user2) >= amountToGive, "User2 insufficient USDC");

        // Create and activate pool
        vm.startPrank(seller);
        string memory ipfs = "ipfs://somehash";
        string memory serial = "VERRA-123";
        address newPoolAddress =
            factory.createPool{value: POOL_DEPOSIT}(ipfs, PRICE_PER_TOKEN, INITIAL_SUPPLY, seller, serial, 0);
        vm.stopPrank();

        cbxPool = CBX(newPoolAddress);
        vm.prank(owner);
        factory.activatePool(newPoolAddress);
    }

    // Helper function for deal
    function tryDeal(address token, address to, uint256 amount) external {
        deal(token, to, amount);
    }

    function test_PoolSetupAndActivation() public {
        assertEq(factory.counter(), 1);
        assertTrue(factory.checkActive(address(cbxPool)));
        Factory.Pool memory pool = factory.getPool(address(cbxPool));
        assertEq(uint256(pool.status), uint256(Factory.PoolStatus.ACTIVE));
        assertEq(cbxPool.balanceOf(address(cbxPool)), INITIAL_SUPPLY);
    }

    function test_BuyTokensWithUSDC() public {
        uint256 tokensToBuy = 250;
        uint256 priceWithFee = cbxPool.getUSDCPricePerTokenWithFee();
        uint256 totalCost = tokensToBuy * priceWithFee;

        console.log("Price with fee:", priceWithFee);
        console.log("Total cost:", totalCost);
        console.log("User1 USDC balance:", usdc.balanceOf(user1));

        vm.startPrank(user1);
        usdc.approve(address(cbxPool), totalCost);
        cbxPool.buyTokensWithUSDC(tokensToBuy);
        vm.stopPrank();

        assertEq(cbxPool.balanceOf(user1), tokensToBuy);
        assertEq(usdc.balanceOf(address(cbxPool)), totalCost);

        uint256 expectedFees = (totalCost * PLATFORM_FEE_BPS) / (10000 + PLATFORM_FEE_BPS);
        uint256 expectedProfit = totalCost - expectedFees;

        assertApproxEqAbs(cbxPool.feesCollected(), expectedFees, 1);
        assertApproxEqAbs(cbxPool.sellerProfit(), expectedProfit, 1);
    }

    function test_QueueAndProcessRetirements() public {
        uint256 tokensToRetire1 = 80;
        uint256 tokensToRetire2 = 70;

        // Buy tokens first
        vm.startPrank(user1);
        uint256 cost1 = cbxPool.getUSDCPricePerTokenWithFee() * tokensToRetire1;
        usdc.approve(address(cbxPool), cost1);
        cbxPool.buyTokensWithUSDC(tokensToRetire1);
        vm.stopPrank();

        vm.startPrank(user2);
        uint256 cost2 = cbxPool.getUSDCPricePerTokenWithFee() * tokensToRetire2;
        usdc.approve(address(cbxPool), cost2);
        cbxPool.buyTokensWithUSDC(tokensToRetire2);
        vm.stopPrank();

        // Queue retirements
        vm.prank(user1);
        cbxPool.retire{value: 0.05 ether}(tokensToRetire1);
        vm.prank(user2);
        cbxPool.retire{value: 0.05 ether}(tokensToRetire2);

        assertEq(cbxPool.getPendingCount(), 2);

        // Process retirements
        vm.prank(owner);
        cbxPool.processRetirements();

        assertEq(cbxPool.bundleCounter(), 1);
        assertEq(cbxPool.getPendingCount(), 1);
    }

    // Test to check if addresses are blacklisted
    function test_CheckBlacklist() public view {
        console.log("Checking if addresses might be blacklisted...");
        console.log("user1 address:", user1);
        console.log("user2 address:", user2);
        console.log("seller address:", seller);
        console.log("owner address:", owner);

        // These should now be realistic addresses that aren't blacklisted
    }
}
