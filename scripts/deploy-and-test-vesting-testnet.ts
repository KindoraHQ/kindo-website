import "dotenv/config";
import { config as loadEnv } from "dotenv";
import { network } from "hardhat";
import { parseUnits } from "ethers";

loadEnv({ path: ".env.test-users" });

const TOKEN = "0xD353660E2cecaD218dCFE33E002085e1f64dec5f";
const BENEFICIARY = "0x1EA15a20D42C58D875689EDc6706092a86D000AA";
const OUTSIDER = "0xD78120f1f14a95A4B83A70da8728258Bb4196955";
const AMOUNT = parseUnits("1000", 18);

const { ethers } = await network.create();

async function main() {
  const [owner] = await ethers.getSigners();
  const beneficiaryKey = process.env.WALLET_39_PRIVATE_KEY;
  const outsiderKey = process.env.WALLET_40_PRIVATE_KEY;
  if (!beneficiaryKey || !outsiderKey) throw new Error("Test wallet keys are missing from .env.test-users");
  const beneficiary = new ethers.Wallet(beneficiaryKey, owner.provider);
  const outsider = new ethers.Wallet(outsiderKey, owner.provider);
  if (beneficiary.address.toLowerCase() !== BENEFICIARY.toLowerCase()) throw new Error("Wallet 39 address mismatch");
  if (outsider.address.toLowerCase() !== OUTSIDER.toLowerCase()) throw new Error("Wallet 40 address mismatch");

  // Start six months ago so the first 25% milestone is immediately testable.
  const start = BigInt(Math.floor(Date.now() / 1000) - 181 * 24 * 60 * 60);
  const Vesting = await ethers.getContractFactory("KindoTeamVesting", owner);
  const vesting = await Vesting.deploy(TOKEN, BENEFICIARY, start);
  await vesting.waitForDeployment();
  const vestingAddress = await vesting.getAddress();

  const token = await ethers.getContractAt("Kindo", TOKEN, owner);
  await (await token.transfer(vestingAddress, AMOUNT)).wait();
  const releasableBefore = await vesting.releasable();
  if (releasableBefore !== AMOUNT / 4n) throw new Error(`Unexpected releasable amount: ${releasableBefore}`);

  let outsiderRejected = false;
  try { await (await vesting.connect(outsider).release()).wait(); } catch { outsiderRejected = true; }
  if (!outsiderRejected) throw new Error("Unauthorized release was not rejected");
  const beneficiaryBefore = await token.balanceOf(BENEFICIARY);
  await (await vesting.connect(beneficiary).release()).wait();
  const beneficiaryAfter = await token.balanceOf(BENEFICIARY);
  if (beneficiaryAfter - beneficiaryBefore !== AMOUNT / 4n) throw new Error("Beneficiary did not receive 25% release");

  console.log(JSON.stringify({ network: "robinhoodTestnet", vesting: vestingAddress, token: TOKEN, beneficiary: BENEFICIARY, allocation: "1000", released: "250", outsiderRejected }, null, 2));
}

main().catch(error => { console.error(error); process.exitCode = 1; });
