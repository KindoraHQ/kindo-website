// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract MockStakingNFT is ERC721 {
    constructor() ERC721("Mock KINDO NFT", "mKINDO") {}

    function mint(address to, uint256 tokenId) external { _mint(to, tokenId); }
}
