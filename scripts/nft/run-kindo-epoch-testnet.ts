import { network } from "hardhat";

const CHAIN_ID = 46630n;
const MAX_WAIT_MS = 30 * 60 * 1000;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const address = process.env.KINDO_EPOCH_NFT_ADDRESS;
if (!address) throw new Error("Set KINDO_EPOCH_NFT_ADDRESS to the deployed testnet NFT address");
const { ethers } = await (network.connect() as any);
if ((await ethers.provider.getNetwork()).chainId !== CHAIN_ID) throw new Error("Refusing non-testnet network");
const [signer] = await ethers.getSigners();
if (!signer) throw new Error("No testnet signer configured");
const nft = await ethers.getContractAt("KindoEpochOpenVRFNFT", address, signer);
const latest = async () => (await ethers.provider.getBlock("latest"))!.timestamp;
const waitUntil = async (predicate: () => Promise<boolean>, label: string) => {
  const end = Date.now() + MAX_WAIT_MS;
  while (!(await predicate())) { if (Date.now() > end) throw new Error(`Timed out waiting for ${label}`); await sleep(5000); }
};
const epoch = async () => Number(await nft.epochAt(await latest()));
const ep = async (e: number) => nft.epochs(e);
const send = async (label: string, estimate: () => Promise<bigint>, submit: () => Promise<any>) => {
  const gas = await estimate();
  console.log(JSON.stringify({ plannedWrite: label, estimatedGas: gas.toString() }));
  const sent = await submit(); await sent.wait(); return sent.hash;
};
const sendWhenReady = async (label: string, estimate: () => Promise<bigint>, submit: () => Promise<any>) => {
  const end = Date.now() + MAX_WAIT_MS;
  let gas: bigint;
  while (true) {
    try { gas = await estimate(); break; }
    catch (error) {
      if (Date.now() > end) throw error;
      console.log(JSON.stringify({ waiting: label, reason: "chain state not yet ready" }));
      await sleep(5000);
    }
  }
  console.log(JSON.stringify({ plannedWrite: label, estimatedGas: gas.toString() }));
  const sent = await submit(); await sent.wait(); return sent.hash;
};

// Epoch 0 must remain empty. Read the live chain timestamp until epoch 1 is active.
await waitUntil(async () => { try { return await epoch() >= 1; } catch { return false; } }, "epoch 1 start");
const minted = Number(await nft.publicMinted());
if (minted === 0) {
  const e = await epoch();
  await send(`mint 1 in epoch ${e}`, () => nft.mint.estimateGas(1, { value: 0 }), () => nft.mint(1, { value: 0 }));
}
const firstEpoch = Number(await nft.tokenEpoch(1));
while (Number(await nft.nextEpochToFinalize()) < firstEpoch) {
  const next = Number(await nft.nextEpochToFinalize());
  const state = await ep(next);
  if (Number(state.count) !== 0) throw new Error(`Unexpected non-empty earlier epoch ${next}`);
  if ((await latest()) < Number(await nft.epochEnd(next))) { await sleep(5000); continue; }
  await sendWhenReady(`skip empty epoch ${next}`, () => nft.skipEmptyEpoch.estimateGas(next), () => nft.skipEmptyEpoch(next));
}
if (!((await latest()) >= Number(await nft.epochEnd(firstEpoch)))) await waitUntil(async () => (await latest()) >= Number(await nft.epochEnd(firstEpoch)), `epoch ${firstEpoch} end`);
let state = await ep(firstEpoch);
if (!state.requested) await send(`request randomness for epoch ${firstEpoch}`, () => nft.requestEpochRandomness.estimateGas(firstEpoch, { value: 0 }), () => nft.requestEpochRandomness(firstEpoch, { value: 0 }));
await waitUntil(async () => (await ep(firstEpoch)).seedReceived, `randomness for epoch ${firstEpoch}`);
state = await ep(firstEpoch);
if (!state.finalized) await send(`finalize epoch ${firstEpoch}`, () => nft.finalize.estimateGas(firstEpoch), () => nft.finalize(firstEpoch));
if ((await nft.packageOf(1)) === 0n) throw new Error("First package was not assigned");
console.log(JSON.stringify({ phase: "A", epoch: firstEpoch, token: 1, package: (await nft.packageOf(1)).toString(), tokenURI: await nft.tokenURI(1), nextEpochToFinalize: (await nft.nextEpochToFinalize()).toString() }));

const secondEpoch = firstEpoch + 1;
await waitUntil(async () => await epoch() >= secondEpoch, `epoch ${secondEpoch}`);
if (Number(await nft.publicMinted()) === 1) await send(`mint 2 in epoch ${secondEpoch}`, () => nft.mint.estimateGas(2, { value: 0 }), () => nft.mint(2, { value: 0 }));
if ((await latest()) < Number(await nft.epochEnd(secondEpoch))) await waitUntil(async () => (await latest()) >= Number(await nft.epochEnd(secondEpoch)), `epoch ${secondEpoch} end`);
state = await ep(secondEpoch);
if (!state.requested) await send(`request randomness for epoch ${secondEpoch}`, () => nft.requestEpochRandomness.estimateGas(secondEpoch, { value: 0 }), () => nft.requestEpochRandomness(secondEpoch, { value: 0 }));
await waitUntil(async () => (await ep(secondEpoch)).seedReceived, `randomness for epoch ${secondEpoch}`);
state = await ep(secondEpoch);
if (!state.finalized) await send(`finalize epoch ${secondEpoch}`, () => nft.finalize.estimateGas(secondEpoch), () => nft.finalize(secondEpoch));
const p2 = await nft.packageOf(2); const p3 = await nft.packageOf(3);
if (p2 === 0n || p3 === 0n || p2 === p3) throw new Error("Second epoch package invariant failed");
if (Number(await nft.publicMinted()) !== 3) throw new Error("Expected exactly 3 public mints");
console.log(JSON.stringify({ phase: "B", epoch: secondEpoch, packages: [p2.toString(), p3.toString()], tokenURIs: [await nft.tokenURI(2), await nft.tokenURI(3)], nextEpochToFinalize: (await nft.nextEpochToFinalize()).toString() }));
