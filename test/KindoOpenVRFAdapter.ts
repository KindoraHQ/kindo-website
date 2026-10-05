import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.create();

describe("KindoOpenVRFAdapter (local-only prototype)", function () {
  async function deploy() {
    const [deployer, outsider] = await ethers.getSigners();
    const router = await ethers.deployContract("MockOpenVRFRouter");
    await router.waitForDeployment();
    const consumer = await ethers.deployContract("MockKindoConsumer");
    await consumer.waitForDeployment();
    const adapter = await ethers.deployContract("KindoOpenVRFAdapter", [router.target, consumer.target, 100_000, 0]);
    await adapter.waitForDeployment();
    await consumer.bindProvider(adapter.target);
    return { deployer, outsider, router, consumer, adapter };
  }

  it("forwards one request and the exact randomWord unchanged", async function () {
    const { router, consumer, adapter } = await deploy();
    await consumer.request(11);
    expect(await adapter.routerRequestOf(11)).to.equal(1);
    const word = 0x1234567890n;
    await expect(router.fulfill(1, word)).to.emit(adapter, "RandomnessForwarded").withArgs(11, 1, word);
    expect(await consumer.words(11)).to.equal(word);
    expect(await consumer.fulfilled(11)).to.equal(true);
  });

  it("rejects unauthorized requests and callbacks", async function () {
    const { outsider, router, consumer, adapter } = await deploy();
    await expect(adapter.connect(outsider).requestRandomness(1)).to.be.revertedWithCustomError(adapter, "UnauthorizedConsumer");
    await expect(adapter.connect(outsider).rawFulfillRandomness(1, 7)).to.be.revertedWithCustomError(adapter, "UnauthorizedRouter");
    await expect(router.fulfill(99, 7)).to.be.revertedWithCustomError(router, "UnknownRequest");
    await consumer.request(1);
  });

  it("allows only one OpenVRF request per KINDO request", async function () {
    const { consumer, adapter } = await deploy();
    await consumer.request(1);
    await expect(consumer.request(1)).to.be.revertedWithCustomError(adapter, "RequestAlreadyExists");
  });

  it("rejects duplicate, replayed, and unknown router callbacks", async function () {
    const { router, consumer, adapter } = await deploy();
    await consumer.request(1);
    await router.fulfill(1, 101);
    await expect(router.retryCallback(1)).to.be.revertedWithCustomError(router, "AlreadyFulfilled");
    await expect(adapter.rawFulfillRandomness(99, 101)).to.be.revertedWithCustomError(adapter, "UnauthorizedRouter");
  });

  it("keeps the same stored word when a callback fails and is retried", async function () {
    const { router, consumer, adapter } = await deploy();
    await consumer.request(1);
    await consumer.setFailCallbacks(true);
    await router.fulfill(1, 777);
    expect((await router.requests(1)).word).to.equal(777);
    await consumer.setFailCallbacks(false);
    await router.retryCallback(1);
    expect(await consumer.words(1)).to.equal(777);
  });

  it("supports a stored zero word and retries that exact zero value", async function () {
    const { router, consumer } = await deploy();
    await consumer.request(1);
    await consumer.setFailCallbacks(true);
    await router.fulfill(1, 0);
    expect((await router.requests(1)).word).to.equal(0);
    await consumer.setFailCallbacks(false);
    await router.retryCallback(1);
    expect(await consumer.words(1)).to.equal(0);
    expect(await consumer.fulfilled(1)).to.equal(true);
  });

  it("handles out-of-order callbacks while preserving request identity", async function () {
    const { router, consumer } = await deploy();
    await consumer.request(1);
    await consumer.request(2);
    await router.fulfill(2, 222);
    await router.fulfill(1, 111);
    expect(await consumer.words(1)).to.equal(111);
    expect(await consumer.words(2)).to.equal(222);
  });

  it("does not fabricate an earlier result when a later request completes first", async function () {
    const { router, consumer } = await deploy();
    await consumer.request(1);
    await consumer.request(2);
    await router.fulfill(2, 222);
    expect(await consumer.fulfilled(1)).to.equal(false);
    expect(await consumer.words(1)).to.equal(0);
    await router.fulfill(1, 111);
    expect(await consumer.words(1)).to.equal(111);
    expect(await consumer.words(2)).to.equal(222);
  });

  it("rejects attempts to use another request's randomness or to reroll", async function () {
    const { router, consumer, adapter } = await deploy();
    await consumer.request(1);
    await consumer.request(2);
    await router.fulfill(1, 111);
    expect(await consumer.words(1)).to.equal(111);
    await expect(adapter.rawFulfillRandomness(1, 222)).to.be.revertedWithCustomError(adapter, "UnauthorizedRouter");
    await expect(router.retryCallback(1)).to.be.revertedWithCustomError(router, "AlreadyFulfilled");
  });

  it("rejects zero router/consumer configuration", async function () {
    const router = await ethers.deployContract("MockOpenVRFRouter");
    await router.waitForDeployment();
    const consumer = await ethers.deployContract("MockKindoConsumer");
    await consumer.waitForDeployment();
    const valid = await ethers.deployContract("KindoOpenVRFAdapter", [router.target, consumer.target, 100_000, 0]);
    await valid.waitForDeployment();
    await expect(ethers.deployContract("KindoOpenVRFAdapter", [ethers.ZeroAddress, ethers.ZeroAddress, 100_000, 0])).to.be.revertedWithCustomError(
      valid, "ZeroAddress"
    );
    await expect(ethers.deployContract("KindoOpenVRFAdapter", [router.target, ethers.ZeroAddress, 100_000, 0])).to.be.revertedWithCustomError(
      valid, "ZeroAddress"
    );
  });

  it("has no admin path to alter router, consumer, mappings, or completed results", async function () {
    const { adapter } = await deploy();
    expect(await adapter.router()).to.not.equal(ethers.ZeroAddress);
    expect(await adapter.consumer()).to.not.equal(ethers.ZeroAddress);
    expect(adapter.interface.hasFunction("setRouter")).to.equal(false);
    expect(adapter.interface.hasFunction("setConsumer")).to.equal(false);
    expect(adapter.interface.hasFunction("reroll")).to.equal(false);
    expect(adapter.interface.hasFunction("skip")).to.equal(false);
  });
});
