(() => {
  const cfg = window.KINDO_CONFIG || {};

  document.querySelectorAll('[data-link]').forEach((el) => {
    const url = cfg[el.dataset.link];
    if (url && url !== '#') {
      el.href = url;
      el.target = '_blank';
      el.rel = 'noopener noreferrer';
      if (el.classList.contains('optional-link')) el.hidden = false;
    }
  });

  const contract = document.getElementById('contractAddress');
  const copyBtn = document.getElementById('copyContract');
  if (contract && cfg.contractAddress) contract.textContent = cfg.contractAddress;
  if (copyBtn && cfg.contractAddress && cfg.contractAddress !== 'COMING SOON') {
    copyBtn.disabled = false;
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(cfg.contractAddress);
        copyBtn.textContent = 'Copied';
        setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1200);
      } catch {
        copyBtn.textContent = 'Copy failed';
      }
    });
  }

  const supply = document.getElementById('totalSupply');
  const tax = document.getElementById('tax');
  if (supply && cfg.totalSupply) supply.textContent = cfg.totalSupply;
  if (tax && cfg.tax) tax.textContent = cfg.tax;

  const email = cfg.contactEmail || 'info@kindora.foundation';
  document.querySelectorAll('[data-email-link]').forEach((el) => {
    el.textContent = email;
    el.href = `mailto:${email}`;
  });

  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
