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

  const menuToggle = document.querySelector('.mobile-menu-toggle');
  const mobileNav = document.getElementById('mobileNavigation');
  if (menuToggle && mobileNav) {
    const closeMenu = () => {
      mobileNav.classList.remove('is-open');
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.setAttribute('aria-label', 'Open navigation menu');
      menuToggle.textContent = '☰';
    };

    menuToggle.addEventListener('click', () => {
      const willOpen = menuToggle.getAttribute('aria-expanded') !== 'true';
      mobileNav.classList.toggle('is-open', willOpen);
      menuToggle.setAttribute('aria-expanded', String(willOpen));
      menuToggle.setAttribute('aria-label', willOpen ? 'Close navigation menu' : 'Open navigation menu');
      menuToggle.textContent = willOpen ? '×' : '☰';
    });

    mobileNav.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeMenu();
    });
  }

  const carousel = document.querySelector('[data-nft-carousel]');
  if (carousel) {
    const slides = [120,125,128,130,133,134,152,153,154,155,156];
    const slideWrap = carousel.querySelector('.nft-slides');
    const status = carousel.querySelector('[data-nft-status]');
    let start = 0;
    let timer;
    const render = (animate = true) => {
      slideWrap.classList.toggle('is-switching', animate);
      slideWrap.innerHTML = [0,1,2].map((offset) => {
        const n = slides[(start + offset) % slides.length];
        return `<img src="nft-collection/images/kindo-${n}.png" data-nft-offset="${offset}" alt="Featured KINDO moment ${n}" loading="lazy">`;
      }).join('');
      status.textContent = `${String(start + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
    };
    const move = (step) => { start = (start + step + slides.length) % slides.length; render(); };
    carousel.querySelector('[data-nft-prev]').addEventListener('click', () => move(-1));
    carousel.querySelector('[data-nft-next]').addEventListener('click', () => move(1));
    slideWrap.addEventListener('click', (event) => {
      const image = event.target.closest('img[data-nft-offset]');
      if (!image) return;
      const offset = Number(image.dataset.nftOffset);
      if (offset !== 1) move(offset - 1);
    });
    let touchX = 0;
    carousel.addEventListener('touchstart', (e) => { touchX = e.changedTouches[0].clientX; clearInterval(timer); }, {passive:true});
    carousel.addEventListener('touchend', (e) => { const delta = e.changedTouches[0].clientX - touchX; if (Math.abs(delta) > 45) move(delta < 0 ? 1 : -1); startTimer(); }, {passive:true});
    const startTimer = () => { clearInterval(timer); timer = setInterval(() => move(1), 6500); };
    carousel.addEventListener('mouseenter', () => clearInterval(timer));
    carousel.addEventListener('mouseleave', startTimer);
    render(false); startTimer();
  }
})();
