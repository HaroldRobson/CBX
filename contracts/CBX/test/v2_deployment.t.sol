// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/Factory_v2.sol"; // Import your Factory contract

contract DeploymentTest is Test {// This test's only job is to fail and tell us why.
function test_FactoryDeployment() public {
    // We are attempting to deploy the factory with standard arguments.
    // If this fails, the test runner will report the exact revert reason.

    vm.createSelectFork(vm.rpcUrl("amoy"));
    new Factory(300, 1 ether);
}
}
