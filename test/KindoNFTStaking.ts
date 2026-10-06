import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.create();
const DAY = 24n * 60n * 60n;

async function advance(seconds: bigint) {
  await ethers.provider.send("evm_increaseTime", [Number(seconds)]);
  await ethers.provider.send("evm_mine");
}

describe("KindoNFTStaking", function () {
  async function deploy() {
    const [owner, alice, bob] = await ethers.getSigners();
    const token = await ethers.deployContract("Kindo");
    await token.waitForDeployment();
    const nft = await ethers.deployContract("MockStakingNFT");
    await nft.waitForDeployment();
    const rate = ethers.parseUnits("100", 18);
    const cap = ethers.parseUnits("200000000", 18);
    const staking = await ethers.deployContract("KindoNFTStaking", [nft.target, token.target, rate, cap]);
    await staking.waitForDeployment();
    await token.transfer(staking.target, ethers.parseUnits("100000", 18));
    await nft.mint(alice.address, 1);
    await nft.mint(alice.address, 2);
    await nft.connect(alice).setApprovalForAll(staking.target, true);
    return { owner, alice, bob, token, nft, staking, rate };
  }

  it("stakes, accrues from stake time, claims, unstakes, and permits restaking", async function () {
    const { alice, nft, staking, token, rate } = await deploy();
    await staking.connect(alice).stake(1);
    await expect(staking.connect(alice).stake(1)).to.be.revertedWithCustomError(staking, "AlreadyStaked");
    await advance(DAY);
    expect(await staking.pendingReward(1)).to.be.closeTo(rate, ethers.parseUnits("1", 18));
    await staking.connect(alice).claim(1);
    expect(await token.balanceOf(alice.address)).to.be.gt(0);
    await advance(DAY);
    await staking.connect(alice).unstake(1);
    expect(await nft.ownerOf(1)).to.equal(alice.address);
    await staking.connect(alice).stake(1);
  });

  it("rejects unauthorized admin actions and permits the owner to change rate", async function () {
    const { owner, bob, staking, rate } = await deploy();
    const newRate = rate * 2n;
    await expect(staking.connect(bob).setRewardRatePerDay(newRate)).to.be.revertedWithCustomError(staking, "OwnableUnauthorizedAccount");
    await expect(staking.connect(owner).setRewardRatePerDay(newRate)).to.emit(staking, "RewardRateUpdated").withArgs(rate, newRate);
    expect(await staking.rewardRatePerDay()).to.equal(newRate);
  });

  it("supports pause and unpause without trapping unstake", async function () {
    const { owner, alice, staking } = await deploy();
    await staking.connect(alice).stake(1);
    await staking.connect(owner).pause();
    await expect(staking.connect(alice).stake(2)).to.be.revertedWithCustomError(staking, "EnforcedPause");
    await staking.connect(alice).unstake(1);
    await staking.connect(owner).unpause();
    await staking.connect(alice).stake(2);
  });

  it("does not pay beyond the configured cap", async function () {
    const { alice, nft, staking, token, rate } = await deploy();
    await staking.setRewardCap(rate);
    await staking.connect(alice).stake(1);
    await advance(DAY * 3n);
    await staking.connect(alice).claim(1);
    expect(await token.balanceOf(alice.address)).to.equal(rate);
    expect(await staking.totalRewardsPaid()).to.equal(rate);
  });

  it("enforces ownership, approvals, funding, and invalid admin values", async function () {
    const { owner, alice, bob, nft, staking, token, rate } = await deploy();
    await expect(staking.connect(bob).stake(1)).to.be.revert(ethers);
    await expect(staking.connect(alice).unstake(1)).to.be.revertedWithCustomError(staking, "NotStaked");
    await nft.connect(alice).approve(staking.target, 1);
    await expect(staking.connect(alice).stake(1)).to.emit(staking, "Staked");
    await expect(staking.connect(bob).claim(1)).to.be.revertedWithCustomError(staking, "NotStakeOwner");
    await expect(staking.connect(owner).setRewardRatePerDay(0)).to.be.revertedWithCustomError(staking, "InvalidRate");
    await expect(staking.connect(owner).setRewardCap(0)).to.be.revertedWithCustomError(staking, "InvalidCap");
    await expect(staking.connect(owner).withdrawUnusedRewards(1, owner.address)).to.be.revertedWithCustomError(staking, "ActiveStakesExist");
    await staking.connect(alice).unstake(1);
    await staking.connect(owner).withdrawUnusedRewards(rate, owner.address);
    expect(await token.balanceOf(staking.target)).to.be.closeTo(ethers.parseUnits("100000", 18) - rate, ethers.parseUnits("1", 18));
  });

  it("handles insufficient reward balance and allows emergency unstake while paused", async function () {
    const { owner, alice, staking, token } = await deploy();
    const balance = await token.balanceOf(staking.target);
    await token.connect(owner).transfer(alice.address, 1);
    await staking.connect(owner).withdrawUnusedRewards(balance, owner.address);
    await staking.connect(alice).stake(1);
    await advance(DAY);
    await expect(staking.connect(alice).claim(1)).to.be.revertedWithCustomError(staking, "InsufficientRewards");
    await token.transfer(staking.target, ethers.parseUnits("1000", 18));
    await staking.connect(owner).pause();
    await expect(staking.connect(alice).claim(1)).to.be.revertedWithCustomError(staking, "EnforcedPause");
    await expect(staking.connect(alice).unstake(1)).to.not.be.revert(ethers);
  });
});
