import { expect } from "chai";
import { network } from "hardhat";

const { ethers, networkHelpers } = await network.create();
const { time } = networkHelpers;

describe("KindoEpochOpenVRFNFT (local OpenVRF integration)", function () {
  async function deploy() {
    const [owner, founder, treasury, primary, backup, alice, bob] = await ethers.getSigners();
    const router = await ethers.deployContract("MockAuthorizedOpenVRFRouter", [primary.address, backup.address]);
    await router.waitForDeployment();
    const now = BigInt(await time.latest());
    const start = now + 10n;
    const root = ethers.keccak256(ethers.toUtf8Bytes("committed-555-package-root"));
    const nft = await ethers.deployContract("KindoEpochOpenVRFNFT", [{
      owner: owner.address, founder: founder.address, treasury: treasury.address, router: router.target,
      price: 0, start, epochDuration: 100, walletLimit: 553, transactionLimit: 553,
      callbackGasLimit: 100_000, requestFee: 0, placeholder: "ipfs://placeholder/", finalBase: "ipfs://final/", allocationRoot: root
    }]);
    await nft.waitForDeployment();
    await time.increaseTo(start);
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
});
