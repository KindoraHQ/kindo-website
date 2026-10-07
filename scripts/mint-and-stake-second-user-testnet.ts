import "dotenv/config";
import dotenv from "dotenv";
import { JsonRpcProvider, Wallet, Contract, parseEther } from "ethers";
dotenv.config({ path: ".env.test-users", override: false });

const provider = new JsonRpcProvider(process.env.ROBINHOOD_TESTNET_RPC_URL ?? "https://rpc.testnet.chain.robinhood.com");
const owner = new Wallet(process.env.DEPLOYER_PRIVATE_KEY!, provider);
const user40 = new Wallet(process.env.WALLET_40_PRIVATE_KEY!, provider);
const nftAddress = "0xd6b0FBF43df68d43845bDDc6661B56ab1c17163E";
const providerAddress = "0x2DC5096BD26E38b22B37c079d652Dac4272BF223";
const stakingAddress = "0x9D985701Fa20Ca95174D3ccF3e862DbdfAF26125";
const nft = new Contract(nftAddress, [
  "function publicMint(uint256) payable returns(uint256)",
  "function transferFrom(address,address,uint256)",
  "function approve(address,uint256)",
], owner);
const randomness = new Contract(providerAddress, ["function fulfill(address,uint256,uint256)"], owner);
const staking = new Contract(stakingAddress, ["function stake(uint256)", "function totalStaked() view returns(uint256)"], user40);

const mint = await nft.publicMint(1, { value: parseEther("0.001") }); await mint.wait();
const receipt = await provider.getTransactionReceipt(mint.hash);
const requestId = 2n;
console.log(`Mint NFT 2: ${mint.hash}`);
const fulfill = await randomness.fulfill(nftAddress, requestId, 987654321n); await fulfill.wait();
console.log(`Fulfill request 2: ${fulfill.hash}`);
const finalize = await nft.finalizeRandomness(requestId); await finalize.wait();
console.log(`Finalize request 2: ${finalize.hash}`);
const transfer = await nft.transferFrom(owner.address, user40.address, 2); await transfer.wait();
console.log(`Transfer NFT 2: ${transfer.hash}`);
const approval = await nft.connect(user40).approve(stakingAddress, 2); await approval.wait();
const stake = await staking.stake(2); await stake.wait();
console.log(`Wallet 40 stake: ${stake.hash}`);
console.log(`Staked count: ${(await staking.totalStaked()).toString()}`);
