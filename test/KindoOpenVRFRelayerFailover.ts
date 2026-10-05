import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.create();

describe("Kindo OpenVRF relayer failover (local-only)", function () {
  async function deploy() {
    const [primary, backup, outsider] = await ethers.getSigners();
    const router = await ethers.deployContract("MockAuthorizedOpenVRFRouter", [primary.address, backup.address]);
    await router.waitForDeployment();
    const consumer = await ethers.deployContract("MockKindoConsumer");
    await consumer.waitForDeployment();
    const adapter = await ethers.deployContract("KindoOpenVRFAdapter", [router.target, consumer.target, 100_000, 0]);
    await adapter.waitForDeployment();
    await consumer.bindProvider(adapter.target);
    return { primary, backup, outsider, router, consumer, adapter };
  }

  it("lets the backup relayer deliver the exact same proof after primary failure", async function () {
    const { primary, backup, router, consumer, adapter } = await deploy();
    await consumer.setFailCallbacks(true);
    await consumer.request(1);
    await router.connect(primary).fulfill(1, 0xdeadbeefn);
    expect((await router.requests(1)).word).to.equal(0xdeadbeefn);
    await consumer.setFailCallbacks(false);
    await router.connect(backup).retryCallback(1);
    expect(await consumer.words(1)).to.equal(0xdeadbeefn);
  });

  it("rejects an unauthorized relayer while accepting the backup", async function () {
    const { outsider, backup, router, consumer } = await deploy();
    await consumer.request(7);
    await expect(router.connect(outsider).fulfill(1, 7)).to.be.revertedWithCustomError(router, "UnauthorizedRelayer");
    await router.connect(backup).fulfill(1, 7);
    expect(await consumer.words(7)).to.equal(7);
  });

  it("lets the backup directly fulfill when the primary is silent", async function () {
    const { backup, router, consumer } = await deploy();
    const suppliedWord = 0xfeedcafen;
    await consumer.request(12);

    // The primary is unavailable in this scenario: it submits no fulfillment.
    expect((await router.requests(1)).fulfilled).to.equal(false);
    await router.connect(backup).fulfill(1, suppliedWord);

    const request = await router.requests(1);
    expect(request.word).to.equal(suppliedWord);
    expect(request.fulfilled).to.equal(true);
    expect(await consumer.fulfilled(12)).to.equal(true);
    expect(await consumer.words(12)).to.equal(suppliedWord);

    await expect(router.connect(backup).retryCallback(1)).to.be.revertedWithCustomError(router, "AlreadyFulfilled");
    await expect(router.connect(backup).fulfill(1, 0x1234n)).to.be.revertedWithCustomError(router, "AlreadyFulfilled");
    expect(await consumer.words(12)).to.equal(suppliedWord);
  });

  it("does not permit a second result or a reroll after successful delivery", async function () {
    const { primary, backup, router, consumer } = await deploy();
    await consumer.request(9);
    await router.connect(primary).fulfill(1, 111);
    expect((await router.requests(1)).fulfilled).to.equal(true);
    await expect(router.connect(backup).retryCallback(1)).to.be.revertedWithCustomError(router, "AlreadyFulfilled");
    expect(await consumer.words(9)).to.equal(111);
  });
});
