import { network } from "hardhat";

const CONSUMER = "0x3fB6857fa5fFE0d507e0310B08064B6fC7AB0334";
const ROUTER = "0xe68c6bd57bc2497eccebb5bae5ae8e618b3daaaa";
const EXPECTED_CHAIN = 46630n;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const { ethers } = await network.connect();
if ((await ethers.provider.getNetwork()).chainId !== EXPECTED_CHAIN) throw new Error("wrong chain");
const consumer = await ethers.getContractAt(["function request() payable returns (uint256,uint256)", "event RandomnessRequested(uint256 indexed localId,uint256 indexed routerRequestId)"], CONSUMER);
const router = await ethers.getContractAt(["function requestFee() view returns (uint256)", "function requests(uint256) view returns (address,uint64,uint32,bool,bool,uint256,uint256)"], ROUTER);
const fee = await router.requestFee();
const tx = await consumer.request({ value: fee });
const receipt = await tx.wait();
let routerRequestId: bigint | undefined;
for (const log of receipt!.logs) { try { const p = consumer.interface.parseLog(log); if (p?.name === "RandomnessRequested") routerRequestId = p.args.routerRequestId; } catch {} }
if (routerRequestId === undefined) throw new Error("request id missing");
const before = await router.requests(routerRequestId);
console.log(JSON.stringify({ chainId: EXPECTED_CHAIN.toString(), consumer: CONSUMER, router: ROUTER, requestTx: tx.hash, routerRequestId: routerRequestId.toString(), fulfilledBeforeBackup: before[3], deliveredBeforeBackup: before[4] }));
for (let i = 0; i < 180; i++) { const r = await router.requests(routerRequestId); if (r[3] && r[4]) { console.log(JSON.stringify({ routerRequestId: routerRequestId.toString(), fulfilled: r[3], delivered: r[4], randomWord: r[5].toString() })); process.exit(0); } await sleep(2000); }
throw new Error("backup fulfillment timeout");
