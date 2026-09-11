(() => {
  const cfg = window.KINDO_CONFIG || {};

  const fa = {
    "Story":"داستان", "Why":"چرا KINDO", "Tokenomics":"توکنومیک", "Transparency":"شفافیت", "Roadmap":"نقشه راه", "How to Buy":"راهنمای خرید", "FAQ":"سؤالات متداول", "NFT Collection":"مجموعه NFT", "Community":"جامعه",
    "FROM KINDORA TO EARTH":"از کیندورا تا زمین", "Meet Kindo.":"با کیندو آشنا شوید.", "A calm little traveler from a peaceful world, now wandering through the loudest place in the universe: crypto.":"یک مسافر آرام از جهانی صلح‌آمیز که حالا در شلوغ‌ترین جای کیهان، یعنی دنیای کریپتو، قدم می‌زند.", "Follow on X":"ما را در X دنبال کنید", "Buy KINDO":"خرید KINDO", "View Chart":"مشاهده نمودار", "CONTRACT":"قرارداد", "COMING SOON":"به‌زودی", "Copy":"کپی",
    "THE KINDO COLLECTION":"مجموعه KINDO", "555 moments from the journey.":"۵۵۵ لحظه از این سفر.", "A collection of calm travelers, Earth discoveries, and rare glimpses of Kindora, built with the same story, character, and care.":"مجموعه‌ای از مسافران آرام، کشف‌های زمینی و نگاه‌های نادری به کیندورا؛ با همان داستان، شخصیت و دقتی که شایسته‌ی آن است.", "Explore the collection ↗":"مشاهده مجموعه ↗", "STAY KINDO ✦":"KINDO بمانید ✦", "MARKET PANICS. KINDO DOESN’T. ✦":"بازار مضطرب است؛ KINDO نه. ✦", "FROM KINDORA TO EARTH ✦":"از کیندورا تا زمین ✦", "STAY CALM ✦":"آرام بمانید ✦", "STAY CURIOUS ✦":"کنجکاو بمانید ✦",
    "THE STORY OF KINDO":"داستان KINDO", "He came from a quieter world.":"او از جهانی آرام‌تر آمد.", "Are we alone in this universe?":"آیا در این جهان تنها هستیم؟", "WHY KINDO":"چرا KINDO", "Simple by design.":"ساده از روی طراحی.", "Memorable by nature.":"ماندگار از ذات.", "PEOPLE FIRST":"اولویت با مردم", "Community-driven":"جامعه‌محور", "Built around the people who join the journey.":"بر پایه‌ی آدم‌هایی که به این سفر می‌پیوندند.", "FIXED FOREVER":"برای همیشه ثابت", "1B supply":"عرضه ۱ میلیاردی", "KEEP IT CLEAN":"شفاف و ساده", "0% tax":"مالیات ۰٪", "NO EXTRA SUPPLY":"بدون عرضه اضافی", "No minting":"بدون مینت جدید", "OPEN BY DEFAULT":"شفاف از ابتدا", "No blacklist":"بدون بلک‌لیست", "LESS POWER, MORE TRUST":"قدرت کمتر، اعتماد بیشتر", "No owner tricks":"بدون ترفندهای مالکانه",
    "TOKENOMICS":"توکنومیک", "Nothing complicated.":"هیچ چیز پیچیده نیست.", "Kindo keeps the numbers easy to understand.":"KINDO اعداد را ساده و قابل‌فهم نگه می‌دارد.", "TOKEN ALLOCATION":"تخصیص توکن", "Public & Liquidity":"عمومی و نقدینگی", "Project Treasury":"خزانه پروژه", "Team":"تیم", "TRANSPARENT WALLETS":"کیف‌پول‌های شفاف", "TRANSPARENCY / ON-CHAIN":"شفافیت / آن‌چین", "Verify. Don’t assume.":"بررسی کنید؛ حدس نزنید.", "ROADMAP":"نقشه راه", "The journey begins here.":"سفر از اینجا آغاز می‌شود.", "IN PROGRESS":"در حال انجام", "NEXT":"بعدی", "LATER":"بعدتر", "OFFICIAL MARKETS & LINKS":"بازارها و لینک‌های رسمی", "Real links only.":"فقط لینک‌های واقعی.", "FAQ":"سؤالات متداول", "Quick answers for travelers.":"پاسخ‌های کوتاه برای مسافران.", "What is KINDO?":"KINDO چیست؟", "Which chain?":"روی کدام شبکه؟", "Is there a tax?":"آیا مالیاتی وجود دارد؟", "What is the supply?":"مقدار عرضه چقدر است؟", "Where can I buy KINDO?":"از کجا می‌توانم KINDO بخرم؟", "Where can I verify the contract and official links?":"قرارداد و لینک‌های رسمی را کجا بررسی کنم؟", "KINDO CULTURE":"فرهنگ KINDO", "Calm energy. Loud spirit.":"انرژی آرام؛ روحیه‌ای پرشور.", "HOW TO BUY":"راهنمای خرید", "Four simple steps.":"چهار قدم ساده.", "Get a wallet":"یک کیف‌پول بسازید", "Connect to Robinhood Chain":"به Robinhood Chain وصل شوید", "Fund your wallet":"کیف‌پولتان را شارژ کنید", "Swap for $KINDO":"با $KINDO معامله کنید", "JUST FOR FUN":"فقط برای سرگرمی", "A memecoin with a story. Not a promise.":"یک میم‌کوین با داستان؛ نه یک وعده.", "JOIN THE JOURNEY":"به این سفر بپیوندید", "Stay calm.":"آرام بمانید.", "Stay curious.":"کنجکاو بمانید.", "Stay Kindo.":"KINDO بمانید.", "CONTACT KINDO":"تماس با KINDO", "Want to reach the team?":"می‌خواهید با تیم در تماس باشید؟"
  };
  const translatePage = (enabled) => {
    document.documentElement.lang = enabled ? 'fa' : 'en';
    document.documentElement.dir = enabled ? 'rtl' : 'ltr';
    document.querySelectorAll('[data-language-toggle]').forEach((button) => { button.textContent = enabled ? 'English' : 'فارسی'; button.setAttribute('aria-label', enabled ? 'Switch to English' : 'Switch to Persian'); });
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((node) => { const key = node.nodeValue.trim(); if (enabled && fa[key]) node.nodeValue = node.nodeValue.replace(key, fa[key]); else if (!enabled && node.parentElement?.dataset.originalText) node.nodeValue = node.parentElement.dataset.originalText; });
    document.querySelectorAll('body *').forEach((el) => { if (!el.dataset.originalText && el.childNodes.length === 1 && el.firstChild.nodeType === 3) el.dataset.originalText = el.textContent; });
  };
  const languageToggle = document.querySelector('[data-language-toggle]');
  if (languageToggle) { languageToggle.addEventListener('click', () => { const next = document.documentElement.lang !== 'fa'; localStorage.setItem('kindo-language', next ? 'fa' : 'en'); location.reload(); }); const saved = localStorage.getItem('kindo-language'); const preferred = saved || ((navigator.language || '').toLowerCase().startsWith('fa') ? 'fa' : 'en'); if (preferred === 'fa') translatePage(true); }

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
    let touchTarget = null;
    carousel.addEventListener('touchstart', (e) => { touchX = e.changedTouches[0].clientX; clearInterval(timer); }, {passive:true});
    carousel.addEventListener('touchstart', (e) => { touchTarget = e.target.closest('img[data-nft-offset]'); }, {passive:true});
    carousel.addEventListener('touchend', (e) => { const delta = e.changedTouches[0].clientX - touchX; if (Math.abs(delta) > 45) move(delta < 0 ? 1 : -1); else if (touchTarget) { const offset = Number(touchTarget.dataset.nftOffset); if (offset !== 1) move(offset - 1); } touchTarget = null; startTimer(); }, {passive:true});
    const startTimer = () => { clearInterval(timer); timer = setInterval(() => move(1), 6500); };
    carousel.addEventListener('mouseenter', () => clearInterval(timer));
    carousel.addEventListener('mouseleave', startTimer);
    render(false); startTimer();
  }
})();
