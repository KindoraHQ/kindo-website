import "dotenv/config";
import { network } from "hardhat";
import { parseUnits } from "ethers";

const NFT = "0xd6b0FBF43df68d43845bDDc6661B56ab1c17163E";
const KINDO = "0xD353660E2cecaD218dCFE33E002085e1f64dec5f";
const TESTNET_CHAIN_ID = 46630n;

const { ethers } = await network.create();
const chainId = BigInt((await ethers.provider.getNetwork()).chainId);
if (chainId !== TESTNET_CHAIN_ID) throw new Error(`Refusing deployment: expected chain ${TESTNET_CHAIN_ID}, got ${chainId}`);

const [deployer] = await ethers.getSigners();
const rate = parseUnits("100", 18);
const cap = parseUnits("200000000", 18);
console.log(`Deploying from ${deployer.address}`);
console.log(`NFT: ${NFT}`);
console.log(`KINDO: ${KINDO}`);
const staking = await ethers.deployContract("KindoNFTStaking", [NFT, KINDO, rate, cap]);
await staking.waitForDeployment();
console.log(`KindoNFTStaking deployed at ${staking.target}`);
console.log(`Initial rate: ${rate}`);
console.log(`Reward cap: ${cap}`);
