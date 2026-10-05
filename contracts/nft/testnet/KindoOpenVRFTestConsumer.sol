// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IOpenVRFConsumer, IOpenVRFRouter} from "../openvrf/IOpenVRFRouter.sol";

/// @notice Minimal testnet-only consumer used to prove OpenVRF delivery and retry semantics.
contract KindoOpenVRFTestConsumer is IOpenVRFConsumer {
    error ZeroRouter();
    error UnauthorizedRouter();
    error UnknownRequest();
    error DuplicateFulfillment();

    IOpenVRFRouter public immutable router;
    uint32 public immutable callbackGasLimit;
    uint256 public immutable requestFee;
    uint256 public nextRequestId;
    mapping(uint256 => uint256) public requestIds;
    mapping(uint256 => uint256) public randomWords;
    mapping(uint256 => bool) public fulfilled;

    event RandomnessRequested(uint256 indexed localId, uint256 indexed routerRequestId);
    event RandomnessFulfilled(uint256 indexed localId, uint256 indexed routerRequestId, uint256 randomWord);

    constructor(IOpenVRFRouter router_, uint32 callbackGasLimit_, uint256 requestFee_) {
        if (address(router_) == address(0)) revert ZeroRouter();
        router = router_;
        callbackGasLimit = callbackGasLimit_;
        requestFee = requestFee_;
    }

    function request() external payable returns (uint256 localId, uint256 routerRequestId) {
        if (msg.value != requestFee) revert("fee");
        localId = ++nextRequestId;
        routerRequestId = router.requestRandomness{value: requestFee}(callbackGasLimit);
        requestIds[localId] = routerRequestId;
        emit RandomnessRequested(localId, routerRequestId);
    }

    function rawFulfillRandomness(uint256 routerRequestId, uint256 randomWord) external override {
        if (msg.sender != address(router)) revert UnauthorizedRouter();
        uint256 localId;
        for (uint256 i = 1; i <= nextRequestId; ++i) {
            if (requestIds[i] == routerRequestId) { localId = i; break; }
        }
        if (localId == 0) revert UnknownRequest();
        if (fulfilled[localId]) revert DuplicateFulfillment();
        fulfilled[localId] = true;
        randomWords[localId] = randomWord;
        emit RandomnessFulfilled(localId, routerRequestId, randomWord);
    }
}
