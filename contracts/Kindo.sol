// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title Kindo
/// @author KindoraHQ
/// @notice A fixed-supply ERC-20 with no privileged administration or transfer restrictions.
contract Kindo is ERC20 {
    /// @notice The immutable-by-design token supply minted during construction.
    uint256 public constant INITIAL_SUPPLY = 1_000_000_000 ether;

    /// @notice Mints the entire fixed supply to the deployment sender exactly once.
    constructor() ERC20("Kindo", "KINDO") {
        _mint(msg.sender, INITIAL_SUPPLY);
    }
}
