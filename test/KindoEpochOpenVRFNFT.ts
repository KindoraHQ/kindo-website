import { expect } from "chai";
import { network } from "hardhat";

const { ethers, networkHelpers } = await network.create();
const { time } = networkHelpers;

describe("KindoEpochOpenVRFNFT (local OpenVRF integration)", function () {
  async function deploy(overrides: Record<string, unknown> = {}, advanceToStart = true) {
    const [owner, founder, treasury, primary, backup, alice, bob] = await ethers.getSigners();
    const router = await ethers.deployContract("MockAuthorizedOpenVRFRouter", [primary.address, backup.address]);
    await router.waitForDeployment();
    const now = BigInt(await time.latest());
    const start = now + 10n;
    const root = ethers.keccak256(ethers.toUtf8Bytes("committed-555-package-root"));
    const config = {
      owner: owner.address, founder: founder.address, treasury: treasury.address, router: router.target,
      price: 0, start, epochDuration: 100, walletLimit: 553, transactionLimit: 553,
      callbackGasLimit: 100_000, requestFee: 0, placeholder: "ipfs://placeholder/", finalBase: "ipfs://final/", allocationRoot: root
    };
    const nft = await ethers.deployContract("KindoEpochOpenVRFNFT", [{ ...config, ...overrides }]);
    await nft.waitForDeployment();
    if (advanceToStart) await time.increaseTo(start);
    return { owner, founder, treasury, primary, backup, alice, bob, router, nft, start };
  }

  it("keeps later epochs mintable while earlier assignment waits, then finalizes in order", async function () {
    const { alice, bob, primary, backup, router, nft, start } = await deploy();
    await nft.connect(alice).mint(2);
    await time.increaseTo(start + 100n);
    await nft.requestEpochRandomness(0);
    await nft.connect(bob).mint(1);
    expect(await nft.publicMinted()).to.equal(3);
    await expect(nft.finalize(0)).to.be.revertedWithCustomError(nft, "NotReady");
    await expect(nft.requestEpochRandomness(1)).to.be.revertedWithCustomError(nft, "NotReady");
    await router.connect(primary).fulfill(1, 111);
    await nft.finalize(0);
    await time.increaseTo(start + 200n);
    await nft.requestEpochRandomness(1);
    await router.connect(backup).fulfill(2, 222);
    await nft.finalize(1);
    expect(await nft.packageOf(1)).to.be.within(1n, 553n);
    expect(await nft.packageOf(2)).to.be.within(1n, 553n);
    expect(await nft.packageOf(3)).to.be.within(1n, 553n);
    expect(new Set([String(await nft.packageOf(1)), String(await nft.packageOf(2)), String(await nft.packageOf(3))]).size).to.equal(3);
  });

  it("accepts only one request and one callback result per epoch", async function () {
    const { primary, router, nft, start } = await deploy();
    await nft.mint(1);
    await time.increaseTo(start + 100n);
    await nft.requestEpochRandomness(0);
    await expect(nft.requestEpochRandomness(0)).to.be.revertedWithCustomError(nft, "NotReady");
    await router.connect(primary).fulfill(1, 777);
    await expect(router.connect(primary).fulfill(1, 778)).to.be.revertedWithCustomError(router, "AlreadyFulfilled");
  });

  it("keeps the reserved Founder and Owner Genius editions outside the public pool", async function () {
    const { owner, founder, nft } = await deploy();
    await nft.mintFounderEdition();
    await nft.mintOwnerEdition();
    expect(await nft.ownerOf(554)).to.equal(founder.address);
    expect(await nft.ownerOf(555)).to.equal(owner.address);
    expect(await nft.packageOf(554)).to.equal(554);
    expect(await nft.packageOf(555)).to.equal(555);
  });

  it("skips an ended empty epoch before the first non-empty epoch", async function () {
    const { alice, nft, start } = await deploy();
    await time.increaseTo(start + 100n);
    await nft.connect(alice).mint(1);
    expect(await nft.nextEpochToFinalize()).to.equal(0n);
    await nft.skipEmptyEpoch(0);
    expect(await nft.nextEpochToFinalize()).to.equal(1n);
    expect(await nft.publicMinted()).to.equal(1n);
    expect(await nft.remaining()).to.equal(553n);
  });

  it("skips multiple consecutive ended empty epochs in order", async function () {
    const { alice, nft, start } = await deploy();
    await time.increaseTo(start + 300n);
    await nft.connect(alice).mint(1);
    await nft.skipEmptyEpoch(0);
    await nft.skipEmptyEpoch(1);
    await nft.skipEmptyEpoch(2);
    expect(await nft.nextEpochToFinalize()).to.equal(3n);
  });

  it("rejects skipping an empty epoch before it ends", async function () {
    const { nft } = await deploy();
    await expect(nft.skipEmptyEpoch(0)).to.be.revertedWithCustomError(nft, "NotReady");
  });

  it("rejects skipping a non-empty epoch", async function () {
    const { alice, nft, start } = await deploy();
    await nft.connect(alice).mint(1);
    await time.increaseTo(start + 100n);
    await expect(nft.skipEmptyEpoch(0)).to.be.revertedWithCustomError(nft, "NotReady");
  });

  it("rejects skipping an epoch other than the current finalization epoch", async function () {
    const { nft, start } = await deploy();
    await time.increaseTo(start + 200n);
    await expect(nft.skipEmptyEpoch(1)).to.be.revertedWithCustomError(nft, "EpochOrder");
  });

  it("changes only the finalization cursor when skipping", async function () {
    const { alice, nft, start } = await deploy();
    await time.increaseTo(start + 100n);
    await nft.connect(alice).mint(1);
    const before = {
      publicMinted: await nft.publicMinted(),
      remaining: await nft.remaining(),
      package: await nft.packageOf(1),
      epoch: await nft.epochs(0)
    };
    await nft.skipEmptyEpoch(0);
    const after = {
      publicMinted: await nft.publicMinted(),
      remaining: await nft.remaining(),
      package: await nft.packageOf(1),
      epoch: await nft.epochs(0)
    };
    expect(after.publicMinted).to.equal(before.publicMinted);
    expect(after.remaining).to.equal(before.remaining);
    expect(after.package).to.equal(before.package);
    expect(after.epoch.count).to.equal(before.epoch.count);
    expect(after.epoch.requested).to.equal(before.epoch.requested);
    expect(after.epoch.seedReceived).to.equal(before.epoch.seedReceived);
  });

  it("allows the next non-empty epoch to finalize normally after skips", async function () {
    const { alice, primary, router, nft, start } = await deploy();
    await time.increaseTo(start + 100n);
    await nft.connect(alice).mint(1);
    await nft.skipEmptyEpoch(0);
    await time.increaseTo(start + 200n);
    await nft.requestEpochRandomness(1);
    await router.connect(primary).fulfill(1, 1234);
    await nft.finalize(1);
    expect(await nft.nextEpochToFinalize()).to.equal(2n);
    expect(await nft.packageOf(1)).to.be.within(1n, 553n);
  });

  it("cannot bypass an earlier non-empty epoch waiting for randomness", async function () {
    const { alice, bob, nft, start } = await deploy();
    await nft.connect(alice).mint(1);
    await time.increaseTo(start + 100n);
    await nft.connect(bob).mint(1);
    await expect(nft.skipEmptyEpoch(0)).to.be.revertedWithCustomError(nft, "NotReady");
    await expect(nft.finalize(1)).to.be.revertedWithCustomError(nft, "EpochOrder");
  });

  it("rejects invalid constructor configuration", async function () {
    const [owner, founder, treasury, primary, backup] = await ethers.getSigners();
    const router = await ethers.deployContract("MockAuthorizedOpenVRFRouter", [primary.address, backup.address]);
    const now = BigInt(await time.latest());
    const base = { owner: owner.address, founder: founder.address, treasury: treasury.address, router: router.target,
      price: 0, start: now + 10n, epochDuration: 100, walletLimit: 10, transactionLimit: 2,
      callbackGasLimit: 100_000, requestFee: 0, placeholder: "ipfs://p/", finalBase: "ipfs://f/", allocationRoot: ethers.keccak256(ethers.toUtf8Bytes("root")) };
    for (const change of [{ owner: ethers.ZeroAddress }, { founder: ethers.ZeroAddress }, { treasury: ethers.ZeroAddress }, { router: ethers.ZeroAddress }]) {
      await expect(ethers.deployContract("KindoEpochOpenVRFNFT", [{ ...base, ...change }])).to.be.revertedWithCustomError(await ethers.getContractFactory("KindoEpochOpenVRFNFT"), change.owner === ethers.ZeroAddress ? "OwnableInvalidOwner" : "ZeroAddress");
    }
    for (const change of [{ start: 0 }, { epochDuration: 0 }, { walletLimit: 0 }, { transactionLimit: 0 }, { transactionLimit: 11 }, { walletLimit: 554 }, { placeholder: "" }, { finalBase: "" }, { allocationRoot: ethers.ZeroHash }]) {
      await expect(ethers.deployContract("KindoEpochOpenVRFNFT", [{ ...base, ...change }])).to.be.revertedWithCustomError(await ethers.getContractFactory("KindoEpochOpenVRFNFT"), "InvalidConfiguration");
    }
  });

  it("enforces mint timing, pause, limits, payment and the 553 public cap", async function () {
    const early = await deploy({ price: 5 }, false);
    await expect(early.nft.connect(early.alice).mint(1, { value: 5 })).to.be.revertedWithCustomError(early.nft, "Limit");
    const { owner, alice, nft, start } = await deploy({ price: 5 });
    await expect(nft.connect(alice).mint(0)).to.be.revertedWithCustomError(nft, "Limit");
    await expect(nft.connect(alice).mint(1, { value: 4 })).to.be.revertedWithCustomError(nft, "Payment");
    await nft.connect(owner).setMintPaused(true);
    await expect(nft.connect(alice).mint(1, { value: 5 })).to.be.revertedWithCustomError(nft, "Limit");
    await nft.connect(owner).setMintPaused(false);
    const limited = await deploy({ price: 5, walletLimit: 2, transactionLimit: 1 });
    await limited.nft.connect(limited.alice).mint(1, { value: 5 });
    await limited.nft.connect(limited.alice).mint(1, { value: 5 });
    await expect(limited.nft.connect(limited.alice).mint(1, { value: 5 })).to.be.revertedWithCustomError(limited.nft, "Limit");
    await expect(limited.nft.connect(limited.alice).mint(2, { value: 10 })).to.be.revertedWithCustomError(limited.nft, "Limit");
    const full = await deploy({ price: 0, walletLimit: 553, transactionLimit: 553 });
    await full.nft.connect(full.alice).mint(553);
    expect(await full.nft.publicMinted()).to.equal(553n);
    await expect(full.nft.connect(full.bob).mint(1)).to.be.revertedWithCustomError(full.nft, "Limit");
  });

  it("reports epoch boundaries and rejects pre-start queries", async function () {
    const { nft, start } = await deploy();
    await expect(nft.epochAt(start - 1n)).to.be.revertedWithCustomError(nft, "SaleClosed");
    expect(await nft.epochAt(start)).to.equal(0n);
    expect(await nft.epochAt(start + 99n)).to.equal(0n);
    expect(await nft.epochAt(start + 100n)).to.equal(1n);
    expect(await nft.epochEnd(0)).to.equal(start + 100n);
    expect(await nft.epochEnd(1)).to.equal(start + 200n);
  });

  it("requires a non-empty ended epoch and the exact request fee", async function () {
    const { alice, nft, start } = await deploy({ requestFee: 7 });
    await expect(nft.requestEpochRandomness(0, { value: 7 })).to.be.revertedWithCustomError(nft, "NotReady");
    await nft.connect(alice).mint(1);
    await time.increaseTo(start + 100n);
    await expect(nft.requestEpochRandomness(0, { value: 6 })).to.be.revertedWithCustomError(nft, "Payment");
    await expect(nft.requestEpochRandomness(0, { value: 7 })).to.emit(nft, "RandomnessRequested");
    expect((await nft.epochs(0)).requestId).to.equal(1n);
    expect(await nft.requestToEpoch(1)).to.equal(0n);
    await expect(nft.requestEpochRandomness(0, { value: 7 })).to.be.revertedWithCustomError(nft, "NotReady");
  });

  it("enforces Router-only callbacks, request identity and seed immutability", async function () {
    const { alice, primary, router, nft, start } = await deploy();
    await nft.connect(alice).mint(1);
    await time.increaseTo(start + 100n);
    await nft.requestEpochRandomness(0);
    await expect(nft.rawFulfillRandomness(1, 11)).to.be.revertedWithCustomError(nft, "UnauthorizedRouter");
    await expect(router.connect((await ethers.getSigners())[3]).fulfill(99, 11)).to.be.revertedWithCustomError(router, "UnknownRequest");
    await router.connect(primary).fulfill(1, 11);
    expect((await nft.epochs(0)).seed).to.equal(11n);
    await expect(nft.rawFulfillRandomness(1, 22)).to.be.revertedWithCustomError(nft, "UnauthorizedRouter");
    await expect(router.connect(primary).fulfill(1, 22)).to.be.revertedWithCustomError(router, "AlreadyFulfilled");
  });

  it("calculates every package rarity boundary and rejects invalid IDs", async function () {
    const { nft } = await deploy();
    const ranges = [[1, 250, 1], [251, 390, 2], [391, 475, 3], [476, 520, 4], [521, 542, 5], [543, 552, 6], [553, 553, 7]];
    for (const [first, last, rarity] of ranges) {
      expect(await nft.rarityOfPackage(first)).to.equal(rarity);
      expect(await nft.rarityOfPackage(last)).to.equal(rarity);
    }
    expect(await nft.rarityOfPackage(554)).to.equal(7);
    expect(await nft.rarityOfPackage(555)).to.equal(7);
    await expect(nft.rarityOfPackage(0)).to.be.revertedWithCustomError(nft, "InvalidConfiguration");
    await expect(nft.rarityOfPackage(556)).to.be.revertedWithCustomError(nft, "InvalidConfiguration");
  });

  it("verifies valid and invalid allocation proofs against the immutable root", async function () {
    const [owner, founder, treasury, primary, backup] = await ethers.getSigners();
    const router = await ethers.deployContract("MockAuthorizedOpenVRFRouter", [primary.address, backup.address]);
    const now = BigInt(await time.latest());
    const hashA = ethers.keccak256(ethers.toUtf8Bytes("metadata-a"));
    const hashB = ethers.keccak256(ethers.toUtf8Bytes("metadata-b"));
    const leafA = ethers.keccak256(ethers.solidityPacked(["bytes32"], [ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(["uint256", "uint8", "bytes32"], [1, 1, hashA]))]));
    const leafB = ethers.keccak256(ethers.solidityPacked(["bytes32"], [ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(["uint256", "uint8", "bytes32"], [2, 1, hashB]))]));
    const [left, right] = [leafA, leafB].sort();
    const root = ethers.keccak256(ethers.solidityPacked(["bytes32", "bytes32"], [left, right]));
    const nft = await ethers.deployContract("KindoEpochOpenVRFNFT", [{ owner: owner.address, founder: founder.address, treasury: treasury.address, router: router.target, price: 0, start: now + 10n, epochDuration: 100, walletLimit: 10, transactionLimit: 2, callbackGasLimit: 100_000, requestFee: 0, placeholder: "ipfs://p/", finalBase: "ipfs://f/", allocationRoot: root }]);
    expect(await nft.verifyPackage(1, hashA, [leafB])).to.equal(true);
    expect(await nft.verifyPackage(1, hashB, [leafB])).to.equal(false);
    expect(await nft.verifyPackage(2, hashB, [leafA])).to.equal(true);
    expect(await nft.verifyPackage(3, hashB, [leafA])).to.equal(false);
    expect(await nft.allocationCommitment()).to.equal(root);
  });

  it("keeps placeholder and final token URIs tied to package assignment", async function () {
    const { alice, primary, router, nft, start } = await deploy();
    await expect(nft.tokenURI(1)).to.be.revertedWithCustomError(nft, "ERC721NonexistentToken");
    await nft.connect(alice).mint(1);
    expect(await nft.tokenURI(1)).to.equal("ipfs://placeholder/");
    await time.increaseTo(start + 100n);
    await nft.requestEpochRandomness(0);
    await router.connect(primary).fulfill(1, 1);
    await nft.finalize(0);
    const packageId = await nft.packageOf(1);
    expect(await nft.tokenURI(1)).to.equal(`ipfs://final/${packageId}.json`);
  });

  it("enforces admin, reserved mint, ownership and withdrawal permissions", async function () {
    const { owner, founder, treasury, alice, nft } = await deploy({ price: 100 });
    await expect(nft.connect(alice).setMintPaused(true)).to.be.revertedWithCustomError(nft, "OwnableUnauthorizedAccount");
    await nft.setMintPaused(true);
    expect(await nft.mintPaused()).to.equal(true);
    await expect(nft.connect(alice).mintFounderEdition()).to.be.revertedWithCustomError(nft, "OwnableUnauthorizedAccount");
    await nft.mintFounderEdition();
    await expect(nft.mintFounderEdition()).to.be.revertedWithCustomError(nft, "AlreadyMinted");
    await nft.mintOwnerEdition();
    expect(await nft.ownerOf(554)).to.equal(founder.address);
    expect(await nft.ownerOf(555)).to.equal(owner.address);
    expect(await nft.totalSupply()).to.equal(2n);
    await nft.setMintPaused(false);
    await expect(nft.connect(alice).withdraw()).to.be.revertedWithCustomError(nft, "OwnableUnauthorizedAccount");
    await nft.connect(alice).mint(1, { value: 100 });
    const before = await ethers.provider.getBalance(treasury.address);
    await nft.withdraw();
    expect(await ethers.provider.getBalance(treasury.address)).to.equal(before + 100n);
    await nft.transferOwnership(alice.address);
    await nft.connect(alice).acceptOwnership();
    await expect(nft.setMintPaused(false)).to.be.revertedWithCustomError(nft, "OwnableUnauthorizedAccount");
    await nft.connect(alice).setMintPaused(false);
  });

  it("assigns all 553 public packages exactly once with the contract rarity totals", async function () {
    const { alice, primary, router, nft, start } = await deploy({ walletLimit: 553, transactionLimit: 553 });
    await nft.connect(alice).mint(553);
    await time.increaseTo(start + 100n);
    await nft.requestEpochRandomness(0);
    await router.connect(primary).fulfill(1, 0x123456n);
    await nft.finalize(0, { gasLimit: 29_000_000 });
    expect(await nft.remaining()).to.equal(0n);
    expect(await nft.nextEpochToFinalize()).to.equal(1n);
    const seen = new Set<string>();
    const counts = [0, 0, 0, 0, 0, 0, 0];
    for (let tokenId = 1; tokenId <= 553; ++tokenId) {
      const packageId = await nft.packageOf(tokenId);
      expect(packageId).to.be.within(1n, 553n);
      expect(seen.has(packageId.toString())).to.equal(false);
      seen.add(packageId.toString());
      counts[Number(await nft.rarityOfPackage(packageId)) - 1]++;
    }
    expect(seen.size).to.equal(553);
    expect(counts).to.deep.equal([250, 140, 85, 45, 22, 10, 1]);
    await expect(nft.finalize(0)).to.be.revertedWithCustomError(nft, "EpochOrder");
  });
});
