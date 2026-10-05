// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

interface IRandomnessProvider {
    function requestRandomness(uint256 consumerRequestId) external;
}
