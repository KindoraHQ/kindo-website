// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

interface IOpenVRFRouter {
    function requestRandomness(uint32 callbackGasLimit) external payable returns (uint256 requestId);
}

interface IOpenVRFConsumer {
    function rawFulfillRandomness(uint256 requestId, uint256 randomWord) external;
}
