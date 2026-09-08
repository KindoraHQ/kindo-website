import { network } from "hardhat";

const EXPECTED_CHAIN_IDS: Record<string, bigint> = { robinhoodTestnet: 46630n, robinhoodMainnet: 4663n };
const { ethers, networkName } = await network.create();
const expectedChainId = EXPECTED_CHAIN_IDS[networkName];

if (expectedChainId === undefined) throw new Error("Deploy only with --network robinhoodTestnet or --network robinhoodMainnet");
const actualChainId = (await ethers.provider.getNetwork()).chainId;
if (actualChainId !== expectedChainId) throw new Error(`Network chain ID mismatch: expected ${expectedChainId}, received ${actualChainId}`);
if (networkName === "robinhoodMainnet" && process.env.CONFIRM_MAINNET_DEPLOYMENT !== "DEPLOY_KINDO_TO_MAINNET") {
  throw new Error("Mainnet deployment blocked. Complete testnet review, then set CONFIRM_MAINNET_DEPLOYMENT=DEPLOY_KINDO_TO_MAINNET.");
}

const [deployer] = await ethers.getSigners();
if (!deployer) throw new Error("DEPLOYER_PRIVATE_KEY is not configured");
console.log(`Deploying Kindo to ${networkName} (${actualChainId}) from ${deployer.address}`);
const token = await ethers.deployContract("Kindo");
await token.waitForDeployment();
console.log(`Kindo deployed at ${await token.getAddress()}`);
console.log(`Transaction: ${token.deploymentTransaction()?.hash ?? "unavailable"}`);
