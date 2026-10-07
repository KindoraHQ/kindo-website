import "dotenv/config";
import { JsonRpcProvider, Wallet, Contract, parseUnits, formatUnits } from "ethers";

const rpc = process.env.ROBINHOOD_TESTNET_RPC_URL ?? "https://rpc.testnet.chain.robinhood.com";
const provider = new JsonRpcProvider(rpc);
const signer = new Wallet(process.env.DEPLOYER_PRIVATE_KEY!, provider);
const tokenAddress = "0xD353660E2cecaD218dCFE33E002085e1f64dec5f";
const nftAddress = "0xd6b0FBF43df68d43845bDDc6661B56ab1c17163E";
const stakingAddress = "0x9D985701Fa20Ca95174D3ccF3e862DbdfAF26125";
const amount = parseUnits("100000", 18);

const token = new Contract(tokenAddress, [
  "function approve(address,uint256) returns(bool)",
  "function balanceOf(address) view returns(uint256)",
], signer);
const nft = new Contract(nftAddress, ["function approve(address,uint256)"], signer);
const staking = new Contract(stakingAddress, [
  "function fundRewards(uint256)",
  "function stake(uint256)",
  "function pendingReward(uint256) view returns(uint256)",
  "function totalStaked() view returns(uint256)",
], signer);

console.log(`Signer: ${signer.address}`);
console.log(`KINDO before: ${formatUnits(await token.balanceOf(signer.address), 18)}`);
const approval = await token.approve(stakingAddress, amount); await approval.wait(); console.log(`Token approval: ${approval.hash}`);
const funding = await staking.fundRewards(amount); await funding.wait(); console.log(`Funding: ${funding.hash}`);
const nftApproval = await nft.approve(stakingAddress, 1); await nftApproval.wait(); console.log(`NFT approval: ${nftApproval.hash}`);
const stakeTx = await staking.stake(1); await stakeTx.wait(); console.log(`Stake: ${stakeTx.hash}`);
console.log(`Staked count: ${(await staking.totalStaked()).toString()}`);
console.log(`Pending reward immediately: ${formatUnits(await staking.pendingReward(1), 18)}`);
console.log(`Staking KINDO balance: ${formatUnits(await token.balanceOf(stakingAddress), 18)}`);
