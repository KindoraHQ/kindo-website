// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC2981} from "@openzeppelin/contracts/token/common/ERC2981.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import {IOpenVRFConsumer, IOpenVRFRouter} from "./openvrf/IOpenVRFRouter.sol";

/// @notice KINDO epoch allocation using an OpenVRF callback and an immutable public pool.
/// @dev Later epochs may mint while an earlier epoch awaits randomness. Assignment is
///      intentionally finalized in mint order so the global pool cannot be duplicated.
contract KindoEpochOpenVRFNFT is ERC721, ERC2981, Ownable2Step, ReentrancyGuard, IOpenVRFConsumer {
    using Strings for uint256;

    uint256 public constant MAX_SUPPLY = 555;
    uint256 public constant PUBLIC_SUPPLY = 553;
    uint256 public constant FOUNDER_TOKEN_ID = 554;
    uint256 public constant OWNER_TOKEN_ID = 555;
    uint256 public constant COMMON_COUNT = 250;
    uint256 public constant UNCOMMON_COUNT = 140;
    uint256 public constant RARE_COUNT = 85;
    uint256 public constant EPIC_COUNT = 45;
    uint256 public constant LEGENDARY_COUNT = 22;
    uint256 public constant MYTHIC_COUNT = 10;
    uint256 public constant PUBLIC_GENIUS_COUNT = 1;
    uint256 public constant TOTAL_GENIUS_COUNT = 3;

    error ZeroAddress(); error InvalidConfiguration(); error SaleClosed(); error Limit();
    error Payment(); error EpochOrder(); error NotReady(); error UnauthorizedRouter();
    error UnknownRequest(); error SeedAlreadyReceived(); error AlreadyMinted();
    error TransferFailed(); error MetadataNotCommitted();

    struct Config {
        address owner; address founder; address treasury; address router;
        uint256 price; uint256 start; uint256 epochDuration;
        uint256 walletLimit; uint256 transactionLimit; uint32 callbackGasLimit;
        uint256 requestFee; string placeholder; string finalBase; bytes32 allocationRoot;
    }
    struct Epoch { uint256 first; uint256 count; uint256 requestId; bool requested; bool seedReceived; bool finalized; uint256 seed; }

    address public immutable founder;
    address public immutable reservedOwner;
    address public immutable treasury;
    IOpenVRFRouter public immutable router;
    uint32 public immutable callbackGasLimit;
    uint256 public immutable requestFee;
    uint256 public immutable startTime;
    uint256 public immutable epochDuration;
    uint256 public immutable maxPerWallet;
    uint256 public immutable maxPerTransaction;

    bytes32 public immutable allocationCommitment;
    string public finalBaseURI;
    string public placeholderURI;
    uint256 public mintPrice;
    uint256 public publicMinted;
    uint256 public nextEpochToFinalize;
    uint256 public remaining = PUBLIC_SUPPLY;
    bool public mintPaused;
    bool public founderMinted;
    bool public ownerMinted;

    mapping(uint256 => Epoch) public epochs;
    mapping(uint256 => uint256) public requestToEpoch;
    mapping(address => uint256) public walletMinted;
    mapping(uint256 => uint256) public tokenEpoch;
    mapping(uint256 => uint256) public packageOf;
    mapping(uint256 => uint256) private pool;

    event EpochOpened(uint256 indexed epoch, uint256 indexed first, uint256 count);
    event RandomnessRequested(uint256 indexed epoch, uint256 indexed requestId);
    event RandomnessReceived(uint256 indexed epoch, uint256 indexed requestId, uint256 randomWord);
    event EpochFinalized(uint256 indexed epoch, uint256 indexed requestId, uint256 count);
    event PackageAssigned(uint256 indexed tokenId, uint256 indexed packageId);
    event ReservedMinted(uint256 indexed tokenId, address indexed recipient);

    constructor(Config memory c) ERC721("KINDO NFT", "KINDONFT") Ownable(c.owner) {
        if (c.owner == address(0) || c.founder == address(0) || c.treasury == address(0) || c.router == address(0)) revert ZeroAddress();
        if (c.start == 0 || c.epochDuration == 0 || c.walletLimit == 0 || c.transactionLimit == 0
            || c.transactionLimit > c.walletLimit || c.walletLimit > PUBLIC_SUPPLY || c.allocationRoot == bytes32(0) || bytes(c.placeholder).length == 0
            || bytes(c.finalBase).length == 0) revert InvalidConfiguration();
        founder = c.founder; reservedOwner = c.owner; treasury = c.treasury;
        router = IOpenVRFRouter(c.router); callbackGasLimit = c.callbackGasLimit; requestFee = c.requestFee;
        startTime = c.start; epochDuration = c.epochDuration; maxPerWallet = c.walletLimit;
        maxPerTransaction = c.transactionLimit; mintPrice = c.price; placeholderURI = c.placeholder;
        finalBaseURI = c.finalBase; allocationCommitment = c.allocationRoot;
        _setDefaultRoyalty(c.treasury, 500);
    }

    function epochAt(uint256 timestamp) public view returns (uint256) {
        if (timestamp < startTime) revert SaleClosed();
        return (timestamp - startTime) / epochDuration;
    }
    function epochEnd(uint256 epoch) public view returns (uint256) { return startTime + (epoch + 1) * epochDuration; }

    function mint(uint256 quantity) external payable nonReentrant {
        if (mintPaused || block.timestamp < startTime || quantity == 0 || quantity > maxPerTransaction
            || walletMinted[msg.sender] + quantity > maxPerWallet || publicMinted + quantity > PUBLIC_SUPPLY) revert Limit();
        if (msg.value != mintPrice * quantity) revert Payment();
        uint256 e = epochAt(block.timestamp); uint256 first = publicMinted + 1;
        Epoch storage ep = epochs[e];
        if (ep.count == 0) { ep.first = first; emit EpochOpened(e, first, quantity); }
        ep.count += quantity; publicMinted += quantity; walletMinted[msg.sender] += quantity;
        for (uint256 i; i < quantity; ++i) { tokenEpoch[first + i] = e; _safeMint(msg.sender, first + i); }
    }

    function requestEpochRandomness(uint256 epoch) external payable nonReentrant returns (uint256 requestId) {
        Epoch storage ep = epochs[epoch];
        if (ep.count == 0 || ep.requested || block.timestamp < epochEnd(epoch)) revert NotReady();
        if (msg.value != requestFee) revert Payment();
        requestId = router.requestRandomness{value: requestFee}(callbackGasLimit);
        if (requestId == 0) revert InvalidConfiguration();
        ep.requested = true; ep.requestId = requestId; requestToEpoch[requestId] = epoch;
        emit RandomnessRequested(epoch, requestId);
    }

    function rawFulfillRandomness(uint256 requestId, uint256 randomWord) external override {
        if (msg.sender != address(router)) revert UnauthorizedRouter();
        uint256 epoch = requestToEpoch[requestId]; Epoch storage ep = epochs[epoch];
        if (!ep.requested || ep.requestId != requestId) revert UnknownRequest();
        if (ep.seedReceived) revert SeedAlreadyReceived();
        ep.seed = randomWord; ep.seedReceived = true; emit RandomnessReceived(epoch, requestId, randomWord);
    }

    function finalize(uint256 epoch) external nonReentrant {
        if (epoch != nextEpochToFinalize) revert EpochOrder();
        Epoch storage ep = epochs[epoch];
        if (ep.count == 0 || !ep.requested || !ep.seedReceived || ep.finalized) revert NotReady();
        uint256 left = remaining; uint256 counter;
        for (uint256 i; i < ep.count; ++i) {
            uint256 pick; (pick, counter) = _sample(ep.seed, counter, left);
            uint256 selected = pool[pick]; if (selected == 0) selected = pick + 1;
            uint256 tail = pool[left - 1]; if (tail == 0) tail = left;
            pool[pick] = tail; delete pool[left - 1]; --left;
            uint256 tokenId = ep.first + i; packageOf[tokenId] = selected; emit PackageAssigned(tokenId, selected);
        }
        remaining = left; ep.finalized = true; ++nextEpochToFinalize; emit EpochFinalized(epoch, ep.requestId, ep.count);
    }

    function skipEmptyEpoch(uint256 epoch) external {
        if (epoch != nextEpochToFinalize) revert EpochOrder();
        if (epochs[epoch].count != 0 || block.timestamp < epochEnd(epoch)) revert NotReady();
        ++nextEpochToFinalize;
    }

    function _sample(uint256 seed, uint256 counter, uint256 bound) private pure returns (uint256 index, uint256 nextCounter) {
        if (bound == 0) revert InvalidConfiguration(); uint256 threshold = addmod(type(uint256).max, 1, bound);
        while (true) { uint256 word = uint256(keccak256(abi.encode("KINDO_EPOCH_SAMPLE_V1", seed, counter++))); if (word >= threshold) return (word % bound, counter); }
    }

    function mintFounderEdition() external onlyOwner nonReentrant { if (founderMinted) revert AlreadyMinted(); founderMinted = true; packageOf[FOUNDER_TOKEN_ID] = FOUNDER_TOKEN_ID; _safeMint(founder, FOUNDER_TOKEN_ID); emit ReservedMinted(FOUNDER_TOKEN_ID, founder); }
    function mintOwnerEdition() external onlyOwner nonReentrant { if (ownerMinted) revert AlreadyMinted(); ownerMinted = true; packageOf[OWNER_TOKEN_ID] = OWNER_TOKEN_ID; _safeMint(reservedOwner, OWNER_TOKEN_ID); emit ReservedMinted(OWNER_TOKEN_ID, reservedOwner); }
    function totalSupply() external view returns (uint256) { return publicMinted + (founderMinted ? 1 : 0) + (ownerMinted ? 1 : 0); }
    function rarityOfPackage(uint256 id) public pure returns (uint8) {
        if (id == 0 || id > MAX_SUPPLY) revert InvalidConfiguration();
        if (id <= COMMON_COUNT) return 1;
        if (id <= COMMON_COUNT + UNCOMMON_COUNT) return 2;
        if (id <= COMMON_COUNT + UNCOMMON_COUNT + RARE_COUNT) return 3;
        if (id <= 520) return 4;
        if (id <= 542) return 5;
        if (id <= 552) return 6;
        return 7;
    }
    function verifyPackage(uint256 id, bytes32 metadataHash, bytes32[] calldata proof) external view returns (bool) {
        bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(id, rarityOfPackage(id), metadataHash))));
        return MerkleProof.verifyCalldata(proof, allocationCommitment, leaf);
    }
    function tokenURI(uint256 id) public view override returns (string memory) { _requireOwned(id); uint256 p = packageOf[id]; return p == 0 ? placeholderURI : string.concat(finalBaseURI, p.toString(), ".json"); }
    function setMintPaused(bool paused) external onlyOwner { mintPaused = paused; }
    function withdraw() external onlyOwner nonReentrant { (bool ok,) = payable(treasury).call{value: address(this).balance}(""); if (!ok) revert TransferFailed(); }
    function supportsInterface(bytes4 id) public view override(ERC721, ERC2981) returns (bool) { return super.supportsInterface(id); }
}
