import { network } from "hardhat";

const ROUTER = "0xe68c6bd57bc2497eccebb5bae5ae8e618b3daaaa";
const OWNER = "0xDCf356f2C687e028FAC39De57dfE209258F9Fa3F";
const EXPECTED_CHAIN = 46630n;

const { ethers } = await network.connect();
const chain = (await ethers.provider.getNetwork()).chainId;
if (chain !== EXPECTED_CHAIN) throw new Error(`wrong chain: ${chain}`);
const [signer] = await ethers.getSigners();
if (!signer || (await signer.getAddress()).toLowerCase() !== OWNER.toLowerCase()) throw new Error("owner signer mismatch");

const factory = await ethers.getContractFactory("KindoOpenVRFTestConsumer", signer);
const consumer = await factory.deploy(ROUTER, 100_000, 0);
await consumer.waitForDeployment();
const consumerAddress = await consumer.getAddress();

const router = await ethers.getContractAt(["function setConsumerAuthorization(address,bool) external", "function authorizedConsumers(address) view returns (bool)"], ROUTER, signer);
const authTx = await router.setConsumerAuthorization(consumerAddress, true);
await authTx.wait();
if (!(await router.authorizedConsumers(consumerAddress))) throw new Error("consumer authorization failed");

console.log(JSON.stringify({ chainId: chain.toString(), owner: await signer.getAddress(), router: ROUTER, consumer: consumerAddress, authorizationTx: authTx.hash }));
