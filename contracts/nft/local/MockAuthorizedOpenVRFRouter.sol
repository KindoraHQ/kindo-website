// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IOpenVRFConsumer} from "./IOpenVRFRouter.sol";

/// @notice Local-only model of OpenVRF's authorized-relayer delivery boundary.
/// @dev It stores the word before callback and permits only approved relayers to fulfill/retry.
contract MockAuthorizedOpenVRFRouter {
    error UnauthorizedRelayer();
    error UnknownRequest();
    error AlreadyFulfilled();

    struct Request {
        address consumer;
        uint256 word;
        bool exists;
        bool wordStored;
        bool fulfilled;
    }

    uint256 public nextRequestId = 1;
    mapping(address => bool) public authorizedRelayer;
    mapping(uint256 => Request) public requests;
    event CallbackFailed(uint256 indexed requestId, bytes reason);

    constructor(address primaryRelayer, address backupRelayer) {
        authorizedRelayer[primaryRelayer] = true;
        authorizedRelayer[backupRelayer] = true;
    }

    function requestRandomness(uint32) external payable returns (uint256 requestId) {
        requestId = nextRequestId++;
        requests[requestId] = Request(msg.sender, 0, true, false, false);
    }

    function fulfill(uint256 requestId, uint256 word) external {
        if (!authorizedRelayer[msg.sender]) revert UnauthorizedRelayer();
        Request storage request = requests[requestId];
        if (!request.exists) revert UnknownRequest();
        if (request.fulfilled) revert AlreadyFulfilled();
        request.word = word;
        request.wordStored = true;
        _callback(requestId, request);
    }

    function retryCallback(uint256 requestId) external {
        if (!authorizedRelayer[msg.sender]) revert UnauthorizedRelayer();
        Request storage request = requests[requestId];
        if (!request.exists) revert UnknownRequest();
        if (!request.wordStored || request.fulfilled) revert AlreadyFulfilled();
        _callback(requestId, request);
    }

    function _callback(uint256 requestId, Request storage request) private {
        try IOpenVRFConsumer(request.consumer).rawFulfillRandomness(requestId, request.word) {
            request.fulfilled = true;
        } catch (bytes memory reason) { emit CallbackFailed(requestId, reason); }
    }
}
