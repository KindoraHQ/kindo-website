(() => {
  const CHAIN_ID = 46630n;
  const STAKING = '0x9D985701Fa20Ca95174D3ccF3e862DbdfAF26125';
  const NFT = '0xd6b0FBF43df68d43845bDDc6661B56ab1c17163E';
  const KINDO = '0xD353660E2cecaD218dCFE33E002085e1f64dec5f';
  const stakingAbi = ['function stake(uint256)','function claim(uint256)','function unstake(uint256)','function pendingReward(uint256) view returns(uint256)','function totalStaked() view returns(uint256)','function rewardRatePerDay() view returns(uint256)'];
  const nftAbi = ['function ownerOf(uint256) view returns(address)','function approve(address,uint256)'];
  const tokenAbi = ['function balanceOf(address) view returns(uint256)'];
  const $ = id => document.getElementById(id);
  let provider, signer, account, staking, nft, token, selectedId;
  const setStatus = text => { const el = $('walletStatusText'); if (el) el.textContent = text; };
  const format = value => Number(value).toLocaleString(undefined, {maximumFractionDigits: 4});
  async function connect() {
    if (!window.ethereum || !window.ethers) return setStatus('Install an EVM wallet to use the testnet preview.');
    provider = new ethers.BrowserProvider(window.ethereum);
    const network = await provider.getNetwork();
    if (network.chainId !== CHAIN_ID) {
      try { await window.ethereum.request({method:'wallet_switchEthereumChain', params:[{chainId:'0xb626'}]}); }
      catch { return setStatus('Please switch your wallet to Robinhood Chain Testnet.'); }
    }
    await provider.send('eth_requestAccounts', []);
    signer = await provider.getSigner(); account = await signer.getAddress();
    staking = new ethers.Contract(STAKING, stakingAbi, signer);
    nft = new ethers.Contract(NFT, nftAbi, signer);
    token = new ethers.Contract(KINDO, tokenAbi, provider);
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
    const id = Number($('nftNumber').value); if (!id) return setStatus('Enter an NFT number first.');
    try { selectedId=id; if ((await nft.ownerOf(id)).toLowerCase() !== account.toLowerCase()) return setStatus('This NFT is not owned by the connected wallet.'); const a=await nft.approve(STAKING,id); await a.wait(); const tx=await staking.stake(id); await tx.wait(); setStatus(`NFT #${id} staked successfully.`); await refresh(); } catch(e) { setStatus(e.shortMessage || 'Stake transaction failed.'); }
  }
  async function claim() { if (!selectedId) return setStatus('Select a staked NFT first.'); try { const tx=await staking.claim(selectedId); await tx.wait(); setStatus('Reward claimed successfully.'); await refresh(); } catch(e) { setStatus(e.shortMessage || 'Claim transaction failed.'); } }
  async function unstake() { if (!selectedId) return setStatus('Select a staked NFT first.'); try { const tx=await staking.unstake(selectedId); await tx.wait(); setStatus('NFT unstaked successfully.'); await refresh(); } catch(e) { setStatus(e.shortMessage || 'Unstake transaction failed.'); } }
  $('connectWallet')?.addEventListener('click', connect); $('stakeButton')?.addEventListener('click', stake); $('claimButton')?.addEventListener('click', claim); $('unstakeButton')?.addEventListener('click', unstake); setInterval(() => refresh().catch(()=>{}), 15000);
})();
