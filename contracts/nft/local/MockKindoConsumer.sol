// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

interface IKindoAdapter {
    function requestRandomness(uint256 requestId) external;
}

contract MockKindoConsumer {
    error UnauthorizedProvider();
    error AlreadyFulfilled();
    error ForcedFailure();

    IKindoAdapter public provider;
    bool public providerBound;
    bool public failCallbacks;
    mapping(uint256 => uint256) public words;
    mapping(uint256 => bool) public fulfilled;

    function bindProvider(IKindoAdapter provider_) external {
        require(!providerBound && address(provider_) != address(0), "provider already bound");
        provider = provider_;
        providerBound = true;
    }
    function request(uint256 id) external { require(providerBound, "provider not bound"); provider.requestRandomness(id); }
    function setFailCallbacks(bool value) external { failCallbacks = value; }
    function fulfillRandomness(uint256 id, uint256 word) external {
        if (!providerBound || msg.sender != address(provider)) revert UnauthorizedProvider();
        if (failCallbacks) revert ForcedFailure();
        if (fulfilled[id]) revert AlreadyFulfilled();
        fulfilled[id] = true;
        words[id] = word;
    }
}
