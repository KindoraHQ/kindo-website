// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IRandomnessProvider} from "../IRandomnessProvider.sol";
import {IRandomnessConsumer} from "../IRandomnessConsumer.sol";
import {IOpenVRFRouter, IOpenVRFConsumer} from "./IOpenVRFRouter.sol";

/// @notice Local-only adapter prototype between KindoNFT and an OpenVRF-style router.
/// @dev It forwards the router's word unchanged and has no owner or reroll path.
contract KindoOpenVRFAdapter is IRandomnessProvider, IOpenVRFConsumer, ReentrancyGuard {
    error ZeroAddress();
    error UnauthorizedConsumer();
    error UnauthorizedRouter();
    error RequestAlreadyExists();
    error UnknownRouterRequest();
    error RequestAlreadyCompleted();
    error RouterRequestCollision();

    struct PendingRequest {
        uint256 kindoRequestId;
        bool pending;
        bool completed;
    }

    IOpenVRFRouter public immutable router;
    uint32 public immutable callbackGasLimit;
    uint256 public immutable requestFee;
    address public immutable consumer;

    mapping(uint256 routerRequestId => PendingRequest) public requests;
    mapping(uint256 kindoRequestId => uint256 routerRequestId) public routerRequestOf;

    event RandomnessRequested(uint256 indexed kindoRequestId, uint256 indexed routerRequestId);
    event RandomnessForwarded(uint256 indexed kindoRequestId, uint256 indexed routerRequestId, uint256 randomWord);

    constructor(IOpenVRFRouter router_, address consumer_, uint32 callbackGasLimit_, uint256 requestFee_) {
        if (address(router_) == address(0) || consumer_ == address(0)) revert ZeroAddress();
        router = router_;
        consumer = consumer_;
        callbackGasLimit = callbackGasLimit_;
        requestFee = requestFee_;
    }

    function requestRandomness(uint256 kindoRequestId) external override nonReentrant {
        if (msg.sender != consumer) revert UnauthorizedConsumer();
        if (routerRequestOf[kindoRequestId] != 0) revert RequestAlreadyExists();

        uint256 routerRequestId = router.requestRandomness{value: requestFee}(callbackGasLimit);
        if (routerRequestId == 0 || requests[routerRequestId].kindoRequestId != 0) revert RouterRequestCollision();
        requests[routerRequestId] = PendingRequest(kindoRequestId, true, false);
        routerRequestOf[kindoRequestId] = routerRequestId;
        emit RandomnessRequested(kindoRequestId, routerRequestId);
    }

    function rawFulfillRandomness(uint256 routerRequestId, uint256 randomWord) external override nonReentrant {
        if (msg.sender != address(router)) revert UnauthorizedRouter();
        PendingRequest storage request = requests[routerRequestId];
        if (request.kindoRequestId == 0) revert UnknownRouterRequest();
        if (!request.pending) revert RequestAlreadyCompleted();

        IRandomnessConsumer(consumer).fulfillRandomness(request.kindoRequestId, randomWord);
        request.pending = false;
        request.completed = true;
        emit RandomnessForwarded(request.kindoRequestId, routerRequestId, randomWord);
    }
}
