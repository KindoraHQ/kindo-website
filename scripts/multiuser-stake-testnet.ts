import "dotenv/config";
import dotenv from "dotenv";
import { JsonRpcProvider, Wallet, Contract } from "ethers";

dotenv.config({ path: ".env.test-users", override: false });

const provider = new JsonRpcProvider(process.env.ROBINHOOD_TESTNET_RPC_URL ?? "https://rpc.testnet.chain.robinhood.com");
const owner = new Wallet(process.env.DEPLOYER_PRIVATE_KEY!, provider);
const user39 = new Wallet(process.env.WALLET_39_PRIVATE_KEY!, provider);
const nftAddress = "0xd6b0FBF43df68d43845bDDc6661B56ab1c17163E";
const stakingAddress = "0x9D985701Fa20Ca95174D3ccF3e862DbdfAF26125";
const nft = new Contract(nftAddress, [
  "function ownerOf(uint256) view returns(address)",
  "function transferFrom(address,address,uint256)",
  "function approve(address,uint256)",
], owner);
const staking = new Contract(stakingAddress, [
  "function stake(uint256)",
  "function totalStaked() view returns(uint256)",
], user39);

const before1 = await nft.ownerOf(1);
const before555 = await nft.ownerOf(555);
if (before1.toLowerCase() !== owner.address.toLowerCase()) throw new Error(`NFT 1 is owned by ${before1}, not Owner wallet`);
if (before555.toLowerCase() !== owner.address.toLowerCase()) throw new Error(`NFT 555 is not owned by Owner wallet`);
const transfer = await nft.transferFrom(owner.address, user39.address, 1); await transfer.wait();
const approval = await nft.connect(user39).approve(stakingAddress, 1); await approval.wait();
const stake = await staking.stake(1); await stake.wait();
console.log(`Transfer NFT 1: ${transfer.hash}`);
console.log(`Approve NFT 1: ${approval.hash}`);
console.log(`Wallet 39 stake: ${stake.hash}`);
console.log(`Owner NFT 555: ${await nft.ownerOf(555)}`);
console.log(`Staked count: ${(await staking.totalStaked()).toString()}`);
