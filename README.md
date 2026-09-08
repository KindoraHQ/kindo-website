# KINDO

KINDO is a community-driven token for the Kindo story and community on Robinhood Chain. This repository contains the static website and the intentionally minimal KINDO ERC-20 project.

> **Status:** prepared and tested locally only. This repository does not claim a testnet or mainnet deployment and publishes no contract address.

## Token parameters

| Parameter | Value |
| --- | --- |
| Name | Kindo |
| Symbol | KINDO |
| Decimals | 18 |
| Fixed supply | 1,000,000,000 KINDO |
| Initial recipient | Deployment sender |
| Transfer, buy, or sell tax | 0% |

The planned allocation is 85% Public & Liquidity, 10% Treasury, and 5% Team. Those percentages are intentionally not encoded in the contract; distribution is a separate post-deployment operation.

## Intentionally minimal design

`contracts/Kindo.sol` inherits only OpenZeppelin's community-vetted `ERC20`. The constructor mints the entire supply once to `msg.sender`. There is no external or public mint function and no ownership, access-control, burn, pause, blacklist, fee, anti-whale, cooldown, proxy, or upgrade module.

The token therefore provides standard transfers, approvals, allowances, and `transferFrom`, with:

- Fixed supply after construction.
- No transfer, buy, or sell tax.
- No mint, blacklist, whitelist, pause, max-wallet, or max-transaction controls.
- No owner/admin and no privileged way to seize, freeze, burn, mint, or block tokens.
- No proxy or upgrade path.

## Setup and testing

Use Node.js 22.10 or newer and npm. Install the pinned dependency tree, then compile, test, lint, run coverage, and audit dependencies:

```bash
npm ci
npm run compile
npm test
npm run lint:sol
npm run coverage
npm audit
```

Tests cover metadata, 18 decimals, exact supply, deployer allocation, transfers, approvals, allowances, `transferFrom`, zero-fee behavior, supply invariance, and absence of common privileged interfaces.

## Robinhood Chain configuration

These values come from the official Robinhood Chain documentation:

| Network | Chain ID | Public RPC | Explorer | Verification API |
| --- | ---: | --- | --- | --- |
| Robinhood Chain Testnet | 46630 | `https://rpc.testnet.chain.robinhood.com` | `https://explorer.testnet.chain.robinhood.com/` | `https://explorer.testnet.chain.robinhood.com/api/` |
| Robinhood Chain | 4663 | `https://rpc.mainnet.chain.robinhood.com` | `https://robinhoodchain.blockscout.com/` | `https://robinhoodchain.blockscout.com/api/` |

Public RPC endpoints are rate-limited. Production operators should override them with private provider URLs through environment variables.

## Environment safety

Copy `.env.example` to `.env` and set only a dedicated, minimally funded deployment key:

```text
DEPLOYER_PRIVATE_KEY=0x...
```

Never supply a seed phrase. Never use a valuable wallet for development. `.env` and all `.env.*` files except `.env.example` are ignored. Check `git status` and run a secret scanner before every commit.

## Testnet deployment and verification

Test locally first, fund a dedicated wallet with testnet ETH, and run:

```bash
npm run compile
npm test
npm run deploy:testnet
npm run verify:testnet -- <TESTNET_CONTRACT_ADDRESS>
```

The constructor has no arguments. Independently confirm chain ID `46630`, the constructor mint event, exact supply, and deployer balance in Blockscout. No testnet deployment is performed by this setup task.

## Mainnet deployment procedure

Mainnet deployment is intentionally blocked unless `CONFIRM_MAINNET_DEPLOYMENT` exactly equals `DEPLOY_KINDO_TO_MAINNET`. Do not set it until:

1. Testnet deployment and Blockscout verification succeed.
2. Source, compiler settings, dependency lockfile, bytecode, deployer, and distribution plan receive independent review.
3. Treasury, team, and Public & Liquidity recipients and transaction sequencing are approved.
4. A dedicated deployment wallet is secured and minimally funded.
5. Official channels are ready to publish the single verified address.

Only after those controls are complete:

```bash
CONFIRM_MAINNET_DEPLOYMENT=DEPLOY_KINDO_TO_MAINNET npm run deploy:mainnet
npm run verify:mainnet -- <MAINNET_CONTRACT_ADDRESS>
```

On PowerShell, set the acknowledgement only for the deployment process and remove it afterward. Never place secrets in command history, repository files, CI logs, or support messages.

## Verification and reproducibility

Hardhat uses Solidity `0.8.28`, optimizer enabled with 200 runs, and IPFS bytecode metadata. `package-lock.json` pins dependencies. Blockscout custom-chain settings cover both Robinhood Chain networks.

Before verification, compare the deployed bytecode and constructor arguments (none) with local artifacts. Run the appropriate verification command and confirm Blockscout shows the expected source and compiler configuration.

## Security considerations

Minimal code reduces attack surface but does not replace an independent audit. The token makes no unsafe external calls and has no meaningful reentrancy exposure. Standard ERC-20 approval semantics still apply: changing a nonzero allowance directly to another nonzero value has a known transaction-ordering risk; users can first set it to zero or use wallet/application mitigations.

The token cannot enforce off-chain distribution promises, liquidity handling, listings, wallet security, or market prices. Verify operational actions independently on-chain. Never claim locked liquidity, renounced ownership, or completed allocations unless verifiable.

## Website

Open `index.html` to preview the static site. Future public contract and market values are centralized in `config.js`; do not publish them until they are verified.

## Official references

- [Robinhood Chain deployment guide](https://docs.robinhood.com/chain/deploy-smart-contracts/)
- [Robinhood Chain network configuration](https://docs.robinhood.com/chain/connecting/)
- [OpenZeppelin Contracts 5.x](https://docs.openzeppelin.com/contracts/5.x)
