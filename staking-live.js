(() => {
  const CHAIN_ID = 46630n;
  const STAKING = '0x9D985701Fa20Ca95174D3ccF3e862DbdfAF26125';
  const NFT = '0xd6b0FBF43df68d43845bDDc6661B56ab1c17163E';
  const KINDO = '0xD353660E2cecaD218dCFE33E002085e1f64dec5f';
  const stakingAbi = ['function stake(uint256)','function claim(uint256)','function unstake(uint256)','function pendingReward(uint256) view returns(uint256)','function totalStaked() view returns(uint256)','function rewardRatePerDay() view returns(uint256)','function stakes(uint256) view returns(address owner,uint64 startedAt,uint256 claimed)'];
  const nftAbi = ['function ownerOf(uint256) view returns(address)','function approve(address,uint256)'];
  const tokenAbi = ['function balanceOf(address) view returns(uint256)'];
  const $ = id => document.getElementById(id);
  let provider, signer, account, staking, nft, token, selectedId;
  const setStatus = text => { const el = $('walletStatusText'); if (el) el.textContent = text; };
  const errorText = e => e?.shortMessage || e?.reason || e?.info?.error?.message || e?.message || 'Transaction failed.';
  const busy = (value, label = 'Stake NFT') => { const button = $('stakeButton'); if (button) { button.disabled = value; button.textContent = value ? 'Waiting for wallet…' : label; } };
  const format = value => Number(value).toLocaleString(undefined, {maximumFractionDigits: 4});
  async function connect() {
    if (!window.ethereum || !window.ethers) return setStatus('Install an EVM wallet to use the testnet preview.');
    provider = new window.ethers.BrowserProvider(window.ethereum);
    const network = await provider.getNetwork();
    if (network.chainId !== CHAIN_ID) {
      try { await window.ethereum.request({method:'wallet_switchEthereumChain', params:[{chainId:'0xb626'}]}); }
      catch { return setStatus('Please switch your wallet to Robinhood Chain Testnet.'); }
    }
    let accounts;
    try {
      // Re-open MetaMask's account selector so a previously-authorized account
      // cannot silently remain selected when the user switched accounts.
      await window.ethereum.request({method:'wallet_requestPermissions', params:[{eth_accounts:{}}]});
      accounts = await window.ethereum.request({method:'eth_accounts'});
    } catch {
      accounts = await provider.send('eth_requestAccounts', []);
    }
    if (!accounts?.length) return setStatus('Select an account in your wallet first.');
    signer = await provider.getSigner(accounts[0]); account = await signer.getAddress();
    staking = new window.ethers.Contract(STAKING, stakingAbi, signer);
    nft = new window.ethers.Contract(NFT, nftAbi, signer);
    token = new window.ethers.Contract(KINDO, tokenAbi, provider);
    $('connectWallet').textContent = `${account.slice(0,6)}…${account.slice(-4)}`;
    setStatus(`Connected · ${account.slice(0,6)}…${account.slice(-4)}`);
    await refresh();
  }
  async function syncAccount(accounts) {
    if (!accounts?.length || !provider) return;
    account = accounts[0];
    signer = await provider.getSigner(account);
    staking = new window.ethers.Contract(STAKING, stakingAbi, signer);
    nft = new window.ethers.Contract(NFT, nftAbi, signer);
    $('connectWallet').textContent = `${account.slice(0,6)}…${account.slice(-4)}`;
    setStatus(`Connected · ${account.slice(0,6)}…${account.slice(-4)}`);
    await refresh();
  }
  async function refresh() {
    if (!staking) return;
    $('rateValue').textContent = `${format(ethers.formatUnits(await staking.rewardRatePerDay(),18))} KINDO/day`;
    $('stakedCount').textContent = `${await staking.totalStaked()} / 555`;
    if (selectedId) $('pendingValue').textContent = `${format(ethers.formatUnits(await staking.pendingReward(selectedId),18))} KINDO`;
  }
  async function stake() {
    const id = Number($('nftNumber').value);
    if (!Number.isInteger(id) || id < 1) return setStatus('Enter a valid NFT token ID first.');
    if (!signer || !nft || !staking) return setStatus('Connect the testnet wallet first.');
    busy(true); setStatus(`Checking NFT #${id}…`);
    try {
      selectedId = id;
      const owner = await nft.ownerOf(id);
      if (owner.toLowerCase() !== account.toLowerCase()) throw new Error('This NFT is not owned by the connected wallet.');
      const info = await staking.stakes(id);
      if (info.owner !== window.ethers.ZeroAddress) throw new Error('This NFT is already staked.');
      setStatus(`Confirm approval for NFT #${id} in your wallet…`);
      const approval = await nft.approve(STAKING, id); await approval.wait();
      setStatus(`Approval confirmed. Confirm staking NFT #${id} in your wallet…`);
      const tx = await staking.stake(id); await tx.wait();
      setStatus(`NFT #${id} staked successfully.`); await refresh();
    } catch (e) { console.error('Stake flow failed', e); setStatus(errorText(e)); }
    finally { busy(false); }
  }
  async function claim() { if (!selectedId) return setStatus('Select a staked NFT first.'); try { const tx=await staking.claim(selectedId); await tx.wait(); setStatus('Reward claimed successfully.'); await refresh(); } catch(e) { setStatus(e.shortMessage || 'Claim transaction failed.'); } }
  async function unstake() { if (!selectedId) return setStatus('Select a staked NFT first.'); try { const tx=await staking.unstake(selectedId); await tx.wait(); setStatus('NFT unstaked successfully.'); await refresh(); } catch(e) { setStatus(e.shortMessage || 'Unstake transaction failed.'); } }
  $('connectWallet')?.addEventListener('click', connect);
  $('stakeButton')?.addEventListener('click', stake);
  $('claimButton')?.addEventListener('click', claim);
  $('unstakeButton')?.addEventListener('click', unstake);
  if (window.ethereum?.on) window.ethereum.on('accountsChanged', accounts => syncAccount(accounts).catch(e => setStatus(errorText(e))));
  setInterval(() => refresh().catch(()=>{}), 15000);
})();
