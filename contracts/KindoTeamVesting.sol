// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title KindoTeamVesting
/// @notice Immutable, step-based vesting for a deposited KINDO allocation.
/// @dev A month is defined as 30 days. Deposits made after a milestone vest
///      according to the current step, consistent with OpenZeppelin VestingWallet.
contract KindoTeamVesting {
    using SafeERC20 for IERC20;

    uint256 public constant MONTH = 30 days;
    uint256 public constant SIX_MONTHS = 6 * MONTH;
    uint256 public constant TWELVE_MONTHS = 12 * MONTH;
    uint256 public constant EIGHTEEN_MONTHS = 18 * MONTH;
    uint256 public constant TWENTY_FOUR_MONTHS = 24 * MONTH;

    IERC20 public immutable token;
    address public immutable beneficiary;
    uint256 public immutable start;
    uint256 public released;

    error ZeroAddress();
    error NotBeneficiary();
    error NothingToRelease();
    error NativeCurrencyRejected();
    error InvalidStart();

    event ERC20Released(uint256 amount);

    constructor(IERC20 token_, address beneficiary_, uint256 startTimestamp_) {
        if (address(token_) == address(0) || beneficiary_ == address(0)) revert ZeroAddress();
        if (startTimestamp_ == 0) revert InvalidStart();
        token = token_;
        beneficiary = beneficiary_;
        start = startTimestamp_;
    }

    receive() external payable {
        revert NativeCurrencyRejected();
    }

    function vestedAmount(uint256 timestamp) public view returns (uint256) {
        uint256 allocation = token.balanceOf(address(this)) + released;
        if (timestamp < start + SIX_MONTHS) return 0;
        if (timestamp < start + TWELVE_MONTHS) return allocation / 4;
        if (timestamp < start + EIGHTEEN_MONTHS) return allocation / 2;
        if (timestamp < start + TWENTY_FOUR_MONTHS) return (allocation * 3) / 4;
        return allocation;
    }

    function releasable() public view returns (uint256) {
        return vestedAmount(block.timestamp) - released;
    }

    function release() external {
        if (msg.sender != beneficiary) revert NotBeneficiary();
        uint256 amount = releasable();
        if (amount == 0) revert NothingToRelease();
        released += amount;
        token.safeTransfer(beneficiary, amount);
        emit ERC20Released(amount);
    }
}
