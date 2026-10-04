import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.create();
const MONTH = 30n * 24n * 60n * 60n;
const SIX = 6n * MONTH;
const TWELVE = 12n * MONTH;
const EIGHTEEN = 18n * MONTH;
const TWENTY_FOUR = 24n * MONTH;

async function moveTo(timestamp: bigint) {
  await ethers.provider.send("evm_setNextBlockTimestamp", [Number(timestamp)]);
  await ethers.provider.send("evm_mine");
}

describe("KindoTeamVesting", function () {
  async function deploy(amount = ethers.parseUnits("1000", 18)) {
    const [deployer, beneficiary, outsider] = await ethers.getSigners();
    const token = await ethers.deployContract("Kindo");
    await token.waitForDeployment();
    const latest = await ethers.provider.getBlock("latest");
    const start = BigInt(latest!.timestamp) + 60n;
    const vesting = await ethers.deployContract("KindoTeamVesting", [token.target, beneficiary.address, start]);
    await vesting.waitForDeployment();
    await token.transfer(vesting.target, amount);
    return { token, vesting, deployer, beneficiary, outsider, start, amount };
  }

  it("has no vesting before six months", async function () {
    const { vesting, start } = await deploy();
    await moveTo(start + SIX - 1n);
    expect(await vesting.vestedAmount(start + SIX - 1n)).to.equal(0);
  });

  it("vests exactly 25% at six months and remains flat until twelve", async function () {
    const { vesting, amount, start } = await deploy();
    expect(await vesting.vestedAmount(start + SIX)).to.equal(amount / 4n);
    expect(await vesting.vestedAmount(start + TWELVE - 1n)).to.equal(amount / 4n);
  });

  it("vests exactly 50% at twelve months and remains flat until eighteen", async function () {
    const { vesting, amount, start } = await deploy();
    expect(await vesting.vestedAmount(start + TWELVE)).to.equal(amount / 2n);
    expect(await vesting.vestedAmount(start + EIGHTEEN - 1n)).to.equal(amount / 2n);
  });

  it("vests exactly 75% at eighteen months and remains flat until twenty-four", async function () {
    const { vesting, amount, start } = await deploy();
    expect(await vesting.vestedAmount(start + EIGHTEEN)).to.equal(amount * 3n / 4n);
    expect(await vesting.vestedAmount(start + TWENTY_FOUR - 1n)).to.equal(amount * 3n / 4n);
  });

  it("vests 100% at and after twenty-four months", async function () {
    const { vesting, amount, start } = await deploy();
    expect(await vesting.vestedAmount(start + TWENTY_FOUR)).to.equal(amount);
    expect(await vesting.vestedAmount(start + TWENTY_FOUR + 1000n)).to.equal(amount);
  });

  it("releases only the newly vested amount after partial releases", async function () {
    const { vesting, token, beneficiary, amount, start } = await deploy();
    await moveTo(start + SIX);
    await expect(vesting.connect(beneficiary).release()).to.emit(vesting, "ERC20Released").withArgs(amount / 4n);
    expect(await token.balanceOf(beneficiary.address)).to.equal(amount / 4n);
    await moveTo(start + TWELVE);
    await vesting.connect(beneficiary).release();
    expect(await token.balanceOf(beneficiary.address)).to.equal(amount / 2n);
    expect(await vesting.released()).to.equal(amount / 2n);
  });

  it("works with different deposited amounts and encodes no allocation", async function () {
    for (const amount of [1n, ethers.parseUnits("37", 18), ethers.parseUnits("123456", 6)]) {
      const { vesting, start } = await deploy(amount);
      expect(await vesting.vestedAmount(start + SIX)).to.equal(amount / 4n);
      expect(await vesting.vestedAmount(start + TWENTY_FOUR)).to.equal(amount);
    }
  });

  it("prevents outsiders and schedule changes", async function () {
    const { vesting, outsider, start } = await deploy();
    await expect(vesting.connect(outsider).release()).to.be.revertedWithCustomError(vesting, "NotBeneficiary");
    expect(await vesting.beneficiary()).to.equal((await ethers.getSigners())[1].address);
    expect(await vesting.start()).to.equal(start);
    expect(vesting.interface.hasFunction("transferOwnership")).to.equal(false);
    expect(vesting.interface.hasFunction("setBeneficiary")).to.equal(false);
    expect(vesting.interface.hasFunction("cancel")).to.equal(false);
    expect(vesting.interface.hasFunction("withdraw")).to.equal(false);
  });

  it("rejects native currency", async function () {
    const { vesting, outsider } = await deploy();
    await expect(outsider.sendTransaction({to: vesting.target, value: 1})).to.be.revertedWithCustomError(vesting, "NativeCurrencyRejected");
  });

  it("does not release newly deposited tokens above the current milestone percentage", async function () {
    const { vesting, token, beneficiary, deployer, amount, start } = await deploy();
    await moveTo(start + SIX);
    await vesting.connect(beneficiary).release();
    const extra = 201n;
    await token.connect(deployer).transfer(vesting.target, extra);
    expect(await vesting.releasable()).to.equal(extra / 4n);
    await vesting.connect(beneficiary).release();
    expect(await vesting.released()).to.equal(amount / 4n + extra / 4n);
    await moveTo(start + TWELVE);
    await vesting.connect(beneficiary).release();
    const laterExtra = 203n;
    await token.connect(deployer).transfer(vesting.target, laterExtra);
    // The aggregate allocation is rounded once at the milestone: (amount + extra + laterExtra) / 2 - released.
    expect(await vesting.releasable()).to.equal((amount + extra + laterExtra) / 2n - (amount / 4n + extra / 4n + (amount + extra) / 4n));
    await vesting.connect(beneficiary).release();
    expect(await vesting.released()).to.equal((amount + extra + laterExtra) / 2n);
  });

  it("repeated release calls cannot release before the next milestone", async function () {
    const { vesting, beneficiary, start } = await deploy();
    await moveTo(start + SIX);
    await vesting.connect(beneficiary).release();
    await expect(vesting.connect(beneficiary).release()).to.be.revertedWithCustomError(vesting, "NothingToRelease");
  });

  it("handles non-divisible and very small allocations without over-release", async function () {
    for (const amount of [1n, 2n, 3n, 5n, 7n, 11n]) {
      const { vesting, token, beneficiary, start } = await deploy(amount);
      await moveTo(start + SIX);
      if ((await vesting.releasable()) > 0n) await vesting.connect(beneficiary).release();
      expect(await vesting.released()).to.equal(amount / 4n);
      await moveTo(start + TWENTY_FOUR);
      await vesting.connect(beneficiary).release();
      expect(await vesting.released()).to.equal(amount);
      expect(await token.balanceOf(vesting.target)).to.equal(0);
    }
  });

  it("releases every remaining token at the final milestone", async function () {
    const { vesting, token, beneficiary, amount, start } = await deploy(123n);
    await moveTo(start + TWENTY_FOUR);
    await vesting.connect(beneficiary).release();
    expect(await vesting.released()).to.equal(amount);
    expect(await token.balanceOf(vesting.target)).to.equal(0);
    await expect(vesting.connect(beneficiary).release()).to.be.revertedWithCustomError(vesting, "NothingToRelease");
  });

  it("enforces every milestone boundary one second before and exactly at the boundary", async function () {
    const { vesting, amount, start } = await deploy();
    for (const [offset, expected] of [
      [SIX, 0n],
      [TWELVE, amount / 4n],
      [EIGHTEEN, amount / 2n],
      [TWENTY_FOUR, amount * 3n / 4n],
    ] as const) {
      expect(await vesting.vestedAmount(start + offset - 1n)).to.equal(expected);
      const atBoundary = offset === SIX ? amount / 4n : offset === TWELVE ? amount / 2n : offset === EIGHTEEN ? amount * 3n / 4n : amount;
      expect(await vesting.vestedAmount(start + offset)).to.equal(atBoundary);
    }
  });

  it("rejects zero token, beneficiary, and start constructor arguments", async function () {
    const [, beneficiary] = await ethers.getSigners();
    const token = await ethers.deployContract("Kindo");
    await token.waitForDeployment();
    const valid = await ethers.deployContract("KindoTeamVesting", [token.target, beneficiary.address, 1]);
    await valid.waitForDeployment();
    await expect(ethers.deployContract("KindoTeamVesting", [ethers.ZeroAddress, beneficiary.address, 1]))
      .to.be.revertedWithCustomError(valid, "ZeroAddress");
    await expect(ethers.deployContract("KindoTeamVesting", [token.target, ethers.ZeroAddress, 1]))
      .to.be.revertedWithCustomError(valid, "ZeroAddress");
    await expect(ethers.deployContract("KindoTeamVesting", [token.target, beneficiary.address, 0]))
      .to.be.revertedWithCustomError(valid, "InvalidStart");
  });

  it("keeps released tokens with the immutable beneficiary", async function () {
    const { vesting, token, beneficiary, outsider, start } = await deploy();
    await moveTo(start + SIX);
    await expect(vesting.connect(outsider).release()).to.be.revertedWithCustomError(vesting, "NotBeneficiary");
    const before = await token.balanceOf(beneficiary.address);
    await vesting.connect(beneficiary).release();
    expect(await token.balanceOf(beneficiary.address)).to.be.greaterThan(before);
    expect(await token.balanceOf(outsider.address)).to.equal(0);
  });

  it("preserves the allocation invariant across deposits and releases", async function () {
    const { vesting, token, beneficiary, deployer, amount, start } = await deploy();
    const extra = 37n;
    const allocation = amount + extra;
    await moveTo(start + SIX);
    await token.connect(deployer).transfer(vesting.target, extra);
    expect((await token.balanceOf(vesting.target)) + (await vesting.released())).to.equal(allocation);
    await vesting.connect(beneficiary).release();
    expect((await token.balanceOf(vesting.target)) + (await vesting.released())).to.equal(allocation);
    await moveTo(start + TWENTY_FOUR);
    await vesting.connect(beneficiary).release();
    expect((await token.balanceOf(vesting.target)) + (await vesting.released())).to.equal(allocation);
    expect(await vesting.released()).to.be.lte(allocation);
  });
});


