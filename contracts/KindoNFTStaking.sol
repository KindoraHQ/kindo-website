// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title KINDO NFT Staking
/// @notice Time-based KINDO rewards for deposited NFTs. One NFT can only be
///         deposited once at a time and may be deposited again after withdrawal.
/// @dev This is a testnet-ready implementation. Reward rate and cap are stored
///      in the token's smallest units and are adjustable by the owner.
contract KindoNFTStaking is IERC721Receiver, Ownable2Step, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 public constant DAY = 1 days;
    uint256 public constant MAX_REWARD_CAP = 200_000_000 ether;

    IERC721 public immutable nft;
    IERC20 public immutable rewardToken;
    uint256 public rewardRatePerDay;
    uint256 public rewardCap;
    uint256 public totalRewardsPaid;
    uint256 public totalStaked;

    struct StakeInfo {
        address owner;
        uint64 startedAt;
        uint256 claimed;
    }

    mapping(uint256 tokenId => StakeInfo info) public stakes;

    error ZeroAddress();
    error InvalidRate();
    error InvalidCap();
    error NotStaked();
    error AlreadyStaked();
    error NotStakeOwner();
    error InsufficientRewards();
    error NativeCurrencyRejected();
    error ActiveStakesExist();

    event Staked(address indexed user, uint256 indexed tokenId, uint256 timestamp);
    event Unstaked(address indexed user, uint256 indexed tokenId, uint256 reward);
    event RewardClaimed(address indexed user, uint256 indexed tokenId, uint256 reward);
    event RewardRateUpdated(uint256 oldRate, uint256 newRate);
    event RewardCapUpdated(uint256 oldCap, uint256 newCap);
    event RewardsFunded(address indexed from, uint256 amount);
    event RewardsWithdrawn(address indexed to, uint256 amount);

    constructor(IERC721 nft_, IERC20 rewardToken_, uint256 initialRatePerDay_, uint256 rewardCap_)
        Ownable(msg.sender)
    {
        if (address(nft_) == address(0) || address(rewardToken_) == address(0)) revert ZeroAddress();
        if (initialRatePerDay_ == 0) revert InvalidRate();
        if (rewardCap_ == 0 || rewardCap_ > MAX_REWARD_CAP) revert InvalidCap();
        nft = nft_;
        rewardToken = rewardToken_;
        rewardRatePerDay = initialRatePerDay_;
        rewardCap = rewardCap_;
    }

    function stake(uint256 tokenId) external whenNotPaused nonReentrant {
        if (stakes[tokenId].owner != address(0)) revert AlreadyStaked();
        nft.safeTransferFrom(msg.sender, address(this), tokenId);
        stakes[tokenId] = StakeInfo(msg.sender, uint64(block.timestamp), 0);
        totalStaked += 1;
        emit Staked(msg.sender, tokenId, block.timestamp);
    }

    function claim(uint256 tokenId) external whenNotPaused nonReentrant returns (uint256 reward) {
        StakeInfo storage info = _ownedStake(tokenId);
        reward = _pending(info);
        if (reward == 0) revert InsufficientRewards();
        info.claimed += reward;
        totalRewardsPaid += reward;
        _pay(info.owner, reward);
        emit RewardClaimed(info.owner, tokenId, reward);
    }

    function unstake(uint256 tokenId) external nonReentrant returns (uint256 reward) {
        StakeInfo memory info = _ownedStake(tokenId);
        reward = _pending(info);
        if (reward != 0) {
            totalRewardsPaid += reward;
            _pay(info.owner, reward);
        }
        delete stakes[tokenId];
        totalStaked -= 1;
        nft.safeTransferFrom(address(this), info.owner, tokenId);
        emit Unstaked(info.owner, tokenId, reward);
    }

    function pendingReward(uint256 tokenId) public view returns (uint256) {
        StakeInfo memory info = stakes[tokenId];
        if (info.owner == address(0)) return 0;
        return _pending(info);
    }

    function setRewardRatePerDay(uint256 newRate) external onlyOwner {
        if (newRate == 0) revert InvalidRate();
        emit RewardRateUpdated(rewardRatePerDay, newRate);
        rewardRatePerDay = newRate;
    }

    function setRewardCap(uint256 newCap) external onlyOwner {
        if (newCap < totalRewardsPaid || newCap == 0 || newCap > MAX_REWARD_CAP) revert InvalidCap();
        emit RewardCapUpdated(rewardCap, newCap);
        rewardCap = newCap;
    }

    function fundRewards(uint256 amount) external onlyOwner {
        rewardToken.safeTransferFrom(msg.sender, address(this), amount);
        emit RewardsFunded(msg.sender, amount);
    }

    function withdrawUnusedRewards(uint256 amount, address to) external onlyOwner {
        if (to == address(0)) revert ZeroAddress();
        if (totalStaked != 0) revert ActiveStakesExist();
        rewardToken.safeTransfer(to, amount);
        emit RewardsWithdrawn(to, amount);
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    function onERC721Received(address, address, uint256, bytes calldata)
        external pure override returns (bytes4)
    { return IERC721Receiver.onERC721Received.selector; }

    receive() external payable { revert NativeCurrencyRejected(); }

    function _ownedStake(uint256 tokenId) internal view returns (StakeInfo storage info) {
        info = stakes[tokenId];
        if (info.owner == address(0)) revert NotStaked();
        if (info.owner != msg.sender) revert NotStakeOwner();
    }

    function _pending(StakeInfo memory info) internal view returns (uint256) {
        uint256 gross = ((block.timestamp - uint256(info.startedAt)) * rewardRatePerDay) / DAY;
        uint256 earned = gross > info.claimed ? gross - info.claimed : 0;
        uint256 remainingCap = rewardCap > totalRewardsPaid ? rewardCap - totalRewardsPaid : 0;
        return earned > remainingCap ? remainingCap : earned;
    }

    function _pay(address to, uint256 amount) internal {
        if (rewardToken.balanceOf(address(this)) < amount) revert InsufficientRewards();
        rewardToken.safeTransfer(to, amount);
    }
}
