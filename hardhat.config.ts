import "dotenv/config";
import toolbox from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import { defineConfig } from "hardhat/config";

const accounts = process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [];

export default defineConfig({
  plugins: [toolbox],
  solidity: { version: "0.8.28", settings: { optimizer: { enabled: true, runs: 200 }, metadata: { bytecodeHash: "ipfs" } } },
  networks: {
    robinhoodTestnet: { type: "http", url: process.env.ROBINHOOD_TESTNET_RPC_URL ?? "https://rpc.testnet.chain.robinhood.com", chainId: 46630, accounts },
    robinhoodMainnet: { type: "http", url: process.env.ROBINHOOD_MAINNET_RPC_URL ?? "https://rpc.mainnet.chain.robinhood.com", chainId: 4663, accounts },
  },
  chainDescriptors: {
    46630: { name: "Robinhood Chain Testnet", blockExplorers: { blockscout: { name: "Robinhood Chain Testnet Explorer", url: "https://explorer.testnet.chain.robinhood.com/", apiUrl: "https://explorer.testnet.chain.robinhood.com/api/" } } },
    4663: { name: "Robinhood Chain", blockExplorers: { blockscout: { name: "Robinhood Chain Explorer", url: "https://robinhoodchain.blockscout.com/", apiUrl: "https://robinhoodchain.blockscout.com/api/" } } },
  },
  verify: { blockscout: { enabled: true, apiKey: process.env.BLOCKSCOUT_API_KEY ?? "empty" } },
});
