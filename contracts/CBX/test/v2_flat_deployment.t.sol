
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "../deployment/Factory_v2_flat.sol"; // Import your Factory contract

contract DeploymentTest {// This test's only job is to fail and tell us why.
function test_FactoryDeploymentFlat() public {
    // We are attempting to deploy the factory with standard arguments.
    // If this fails, the test runner will report the exact revert reason.

    new Factory(300, 1 ether);
}
}
