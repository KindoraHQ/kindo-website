import "dotenv/config";
import { network } from "hardhat";

const VESTING = "0x6aB16251ED36aAA617EadC3F0D0373775bDADbaF";
const { ethers } = await network.create();

const [owner] = await ethers.getSigners();
const vesting = await ethers.getContractAt("KindoTeamVesting", VESTING, owner);
let repeatedReleaseRejected = false;
try { await (await vesting.release()).wait(); } catch { repeatedReleaseRejected = true; }
let nativeRejected = false;
try { await (await owner.sendTransaction({ to: VESTING, value: 1n })).wait(); } catch { nativeRejected = true; }
if (!repeatedReleaseRejected || !nativeRejected) throw new Error("A Vesting edge-case check did not reject as expected");
console.log(JSON.stringify({ repeatedReleaseRejected, nativeRejected }, null, 2));
