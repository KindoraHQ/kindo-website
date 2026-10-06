import { network } from "hardhat";

const CHAIN_ID = 46630n;
const OWNER = "0xDCf356f2C687e028FAC39De57dfE209258F9Fa3F";
const FOUNDER = "0x77741A12cFb134D61F9C4834CDd0E4A95f815A2e";
const TREASURY = "0xeFFb19507Ddb8b98C5855D680b62070322d14264";
const ROUTER = "0xe68c6bd57bc2497eccebb5bae5ae8e618b3daaaa";
const ROOT = "0xb7c7848715166e9237aa5b7289827e9840569bf5313852da2522aecb57764cde";

const { ethers } = await (network.connect() as any);
const chainId = (await ethers.provider.getNetwork()).chainId;
if (chainId !== CHAIN_ID) throw new Error(`Refusing deployment: expected chain ${CHAIN_ID}, got ${chainId}`);
const [signer] = await ethers.getSigners();
if (!signer) throw new Error("No testnet signer configured");
const deployer = await signer.getAddress();
if (deployer.toLowerCase() !== OWNER.toLowerCase()) throw new Error("Configured signer is not the testnet owner");

const now = (await ethers.provider.getBlock("latest"))?.timestamp ?? Math.floor(Date.now() / 1000);
const router = await ethers.getContractAt(["function requestFee() view returns (uint256)"], ROUTER);
const requestFee = await router.requestFee();
const start = BigInt(now) + 120n;
const factory = await ethers.getContractFactory("KindoEpochOpenVRFNFT", signer);
const config = {
  owner: OWNER, founder: FOUNDER, treasury: TREASURY, router: ROUTER,
  price: 0, start, epochDuration: 60, walletLimit: 10, transactionLimit: 3,
  callbackGasLimit: 100000, requestFee,
  placeholder: "TEST_ONLY_PLACEHOLDER/", finalBase: "TEST_ONLY_FINAL_BASE/",
  allocationRoot: ROOT,
};
console.log(JSON.stringify({ network: "Robinhood Chain Testnet", chainId: chainId.toString(), deployer, balance: (await ethers.provider.getBalance(deployer)).toString(), config: { ...config, start: start.toString(), requestFee: requestFee.toString() } }));
const contract = await factory.deploy(config);
const deploymentTx = contract.deploymentTransaction();
await contract.waitForDeployment();
const deployedAddress = await contract.getAddress();
if (!ethers.isAddress(deployedAddress) || !/^0x[0-9a-fA-F]{40}$/.test(deployedAddress)) {
  throw new Error("Deployment returned an invalid contract address");
}
const receipt = deploymentTx ? await deploymentTx.wait() : null;
console.log(JSON.stringify({ deployedAddress, deploymentTx: deploymentTx?.hash, deploymentBlock: receipt?.blockNumber, start: start.toString() }));
