import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.create();

describe("Kindo", function () {
  const INITIAL_SUPPLY = ethers.parseUnits("1000000000", 18);

  async function deployKindo() {
    const [deployer, holder, recipient, spender] = await ethers.getSigners();
    const token = await ethers.deployContract("Kindo");
    await token.waitForDeployment();
    return { token, deployer, holder, recipient, spender };
  }

  it("sets the expected metadata and 18 decimals", async function () {
    const { token } = await deployKindo();
    expect(await token.name()).to.equal("Kindo");
    expect(await token.symbol()).to.equal("KINDO");
    expect(await token.decimals()).to.equal(18);
  });

  it("mints the exact fixed supply to the deployer", async function () {
    const { token, deployer } = await deployKindo();
    expect(await token.INITIAL_SUPPLY()).to.equal(INITIAL_SUPPLY);
    expect(await token.totalSupply()).to.equal(INITIAL_SUPPLY);
    expect(await token.balanceOf(deployer.address)).to.equal(INITIAL_SUPPLY);
  });

  it("transfers tokens without deducting a fee", async function () {
    const { token, deployer, recipient } = await deployKindo();
    const amount = ethers.parseUnits("125", 18);
    const senderBefore = await token.balanceOf(deployer.address);
    await expect(token.transfer(recipient.address, amount)).to.emit(token, "Transfer").withArgs(deployer.address, recipient.address, amount);
    expect(await token.balanceOf(recipient.address)).to.equal(amount);
    expect(await token.balanceOf(deployer.address)).to.equal(senderBefore - amount);
    expect(await token.totalSupply()).to.equal(INITIAL_SUPPLY);
  });

  it("records approvals and allowances", async function () {
    const { token, deployer, spender } = await deployKindo();
    const amount = ethers.parseUnits("500", 18);
    await expect(token.approve(spender.address, amount)).to.emit(token, "Approval").withArgs(deployer.address, spender.address, amount);
    expect(await token.allowance(deployer.address, spender.address)).to.equal(amount);
  });

  it("supports transferFrom without deducting a fee", async function () {
    const { token, deployer, holder, recipient, spender } = await deployKindo();
    const funded = ethers.parseUnits("1000", 18);
    const amount = ethers.parseUnits("400", 18);
    await token.transfer(holder.address, funded);
    await token.connect(holder).approve(spender.address, amount);
    await expect(token.connect(spender).transferFrom(holder.address, recipient.address, amount)).to.emit(token, "Transfer").withArgs(holder.address, recipient.address, amount);
    expect(await token.balanceOf(holder.address)).to.equal(funded - amount);
    expect(await token.balanceOf(recipient.address)).to.equal(amount);
    expect(await token.allowance(holder.address, spender.address)).to.equal(0);
    expect(await token.balanceOf(deployer.address)).to.equal(INITIAL_SUPPLY - funded);
    expect(await token.totalSupply()).to.equal(INITIAL_SUPPLY);
  });

  it("exposes no mint, pause, blacklist, ownership, or privileged balance controls", async function () {
    const { token } = await deployKindo();
    const forbiddenFunctions = ["mint", "burn", "burnFrom", "pause", "unpause", "paused", "blacklist", "whitelist", "owner", "transferOwnership", "renounceOwnership", "setBalance", "setTax", "setFee", "upgradeToAndCall"];
    for (const functionName of forbiddenFunctions) {
      expect(token.interface.hasFunction(functionName), `${functionName} must not exist`).to.equal(false);
    }
  });

  it("keeps total supply fixed across multiple transfers and approvals", async function () {
    const { token, holder, recipient, spender } = await deployKindo();
    await token.transfer(holder.address, ethers.parseUnits("10000", 18));
    await token.connect(holder).transfer(recipient.address, ethers.parseUnits("2500", 18));
    await token.connect(recipient).approve(spender.address, ethers.parseUnits("500", 18));
    await token.connect(spender).transferFrom(recipient.address, holder.address, ethers.parseUnits("500", 18));
    expect(await token.totalSupply()).to.equal(INITIAL_SUPPLY);
  });
});
