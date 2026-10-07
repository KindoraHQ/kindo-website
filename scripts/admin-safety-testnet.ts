import "dotenv/config";
import dotenv from "dotenv";
import { JsonRpcProvider, Wallet, Contract, parseUnits } from "ethers";
dotenv.config({ path: ".env.test-users", override: false });

const p = new JsonRpcProvider(process.env.ROBINHOOD_TESTNET_RPC_URL ?? "https://rpc.testnet.chain.robinhood.com");
const owner = new Wallet(process.env.DEPLOYER_PRIVATE_KEY!, p);
const user39 = new Wallet(process.env.WALLET_39_PRIVATE_KEY!, p);
const token = new Contract("0xD353660E2cecaD218dCFE33E002085e1f64dec5f", ["function balanceOf(address) view returns(uint256)"], p);
const nft = new Contract("0xd6b0FBF43df68d43845bDDc6661B56ab1c17163E", ["function approve(address,uint256)","function ownerOf(uint256) view returns(address)"], user39);
const admin = new Contract("0x9D985701Fa20Ca95174D3ccF3e862DbdfAF26125", [
  "function setRewardRatePerDay(uint256)","function rewardRatePerDay() view returns(uint256)","function pause()","function unpause()","function paused() view returns(bool)","function totalStaked() view returns(uint256)"
], owner);
const user = new Contract("0x9D985701Fa20Ca95174D3ccF3e862DbdfAF26125", [
  "function setRewardRatePerDay(uint256)","function stake(uint256)","function claim(uint256)","function unstake(uint256)"
], user39);
const stakingAddress = await admin.getAddress();
const rate100 = parseUnits("100", 18);
const rate150 = parseUnits("150", 18);
const change = await admin.setRewardRatePerDay(rate150); await change.wait(); console.log(`Rate changed to 150: ${change.hash}`);
let rejected = false;
try { await user.setRewardRatePerDay(rate100); } catch { rejected = true; }
console.log(`Unauthorized rate change rejected: ${rejected}`);
const restore = await admin.setRewardRatePerDay(rate100); await restore.wait(); console.log(`Rate restored to 100: ${restore.hash}`);
await nft.approve(stakingAddress, 1).then((x: any) => x.wait());
const stake = await user.stake(1); await stake.wait(); console.log(`Stake for pause test: ${stake.hash}`);
const pause = await admin.pause(); await pause.wait(); console.log(`Paused: ${pause.hash}`);
let claimRejected = false;
try { await user.claim(1); } catch { claimRejected = true; }
console.log(`Claim while paused rejected: ${claimRejected}`);
const unstake = await user.unstake(1); await unstake.wait(); console.log(`Emergency unstake while paused: ${unstake.hash}`);
const unpause = await admin.unpause(); await unpause.wait(); console.log(`Unpaused: ${unpause.hash}`);
console.log(`Final paused state: ${await admin.paused()}`);
console.log(`Final staked count: ${(await admin.totalStaked()).toString()}`);
