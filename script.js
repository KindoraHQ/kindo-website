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
    // activeIndex is the NFT shown in the center. The DOM order is always
    // previous / active / next, so a tap maps directly to a new active index.
    let activeIndex = 1;
    let timer;
    const render = (animate = true) => {
      slideWrap.classList.toggle('is-switching', animate);
      const positions = [-1, 0, 1];
      slideWrap.innerHTML = positions.map((relativePosition) => {
        const offset = relativePosition + 1;
        const n = slides[(activeIndex + relativePosition + slides.length) % slides.length];
        return `<img src="nft-collection/images/kindo-${n}.png" data-nft-offset="${offset}" class="${offset === 1 ? 'is-active' : ''}" aria-current="${offset === 1 ? 'true' : 'false'}" alt="Featured KINDO moment ${n}" loading="lazy">`;
      }).join('');
      status.textContent = `${String(activeIndex + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
    };
    const setActiveIndex = (index) => {
      activeIndex = (index + slides.length) % slides.length;
      render();
    };
    const move = (step) => setActiveIndex(activeIndex + step);
    carousel.querySelector('[data-nft-prev]').addEventListener('click', () => move(-1));
    carousel.querySelector('[data-nft-next]').addEventListener('click', () => move(1));
    slideWrap.addEventListener('click', (event) => {
      const image = event.target.closest('img[data-nft-offset]');
      if (!image) return;
      const offset = Number(image.dataset.nftOffset);
      if (offset !== 1) setActiveIndex(activeIndex + offset - 1);
    });
    let touchX = 0;
    let touchStartY = 0;
    carousel.addEventListener('touchstart', (e) => {
      const touch = e.changedTouches[0];
      touchX = touch.clientX;
      touchStartY = touch.clientY;
      clearInterval(timer);
    }, {passive:true});
    carousel.addEventListener('touchend', (e) => {
      const delta = e.changedTouches[0].clientX - touchX;
      if (Math.abs(delta) > 45) {
        move(delta < 0 ? 1 : -1);
      } else if (Math.abs(e.changedTouches[0].clientY - touchStartY) < 45) {
        const bounds = carousel.getBoundingClientRect();
        const relativeX = e.changedTouches[0].clientX - bounds.left;
        const center = bounds.width / 2;
        const deadZone = Math.min(bounds.width * 0.14, 56);
        if (relativeX < center - deadZone) {
          setActiveIndex(activeIndex - 1);
        } else if (relativeX > center + deadZone) {
          setActiveIndex(activeIndex + 1);
        }
      }
      startTimer();
    }, {passive:true});
    const startTimer = () => { clearInterval(timer); timer = setInterval(() => move(1), 6500); };
    carousel.addEventListener('mouseenter', () => clearInterval(timer));
    carousel.addEventListener('mouseleave', startTimer);
    render(false); startTimer();
  }

  const medallion = document.querySelector('[data-medallion-prototype]');
  if (medallion) {
    const sidewall = medallion.querySelector('[data-medallion-sidewall]');
    sidewall.innerHTML = Array.from({ length: 48 }, () => '<i></i>').join('');
    const images = [120,125,128,130,133,134,152,153,154,155,156];
    const image = medallion.querySelector('[data-medallion-image]');
    const status = medallion.querySelector('[data-medallion-status]');
    let index = 0;
    const cycleMs = 14000;
    const showNext = () => {
      image.style.opacity = '0';
      window.setTimeout(() => {
        index = (index + 1) % images.length;
        image.src = `nft-collection/images/kindo-${images[index]}.png`;
        status.textContent = `${String(index + 1).padStart(2, '0')} / ${String(images.length).padStart(2, '0')}`;
        image.style.opacity = '1';
      }, 650);
    };
    window.setInterval(showNext, cycleMs);
  }
})();
