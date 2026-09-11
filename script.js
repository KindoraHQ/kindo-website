(() => {
  const cfg = window.KINDO_CONFIG || {};

  const fa = {
    "THE KINDO NFT COLLECTION":"مجموعه NFT کیندو", "Coming":"به‌زودی", "soon.":".", "555 unique moments from Kindo’s journey, from the quiet skies of Kindora to the strange, beautiful noise of Earth.":"۵۵۵ لحظه‌ی منحصربه‌فرد از سفر کیندو؛ از آسمان‌های آرام کیندورا تا هیاهوی عجیب و زیبای زمین.", "Minting is not live yet · No wallet connection required":"فرایند مینت هنوز فعال نیست · اتصال کیف‌پول لازم نیست", "Earthbound Traveler":"مسافر زمین", "Curious Explorer":"کاوشگر کنجکاو", "Quiet Confidence":"اعتمادبه‌نفس آرام", "One of 555 story moments · Preview":"یکی از ۵۵۵ لحظه‌ی داستان · پیش‌نمایش", "A NEW CHAPTER AWAITS":"فصل تازه‌ای در راه است", "Every Kindo carries a little piece of Kindora.":"هر کیندو تکه‌ای کوچک از کیندورا را با خود دارد.", "The collection will open when the artwork, metadata, and mint experience are ready. Until then, this page is a window into the world, not a request to connect a wallet.":"این مجموعه زمانی گشوده می‌شود که آثار، متادیتا و تجربه‌ی مینت آماده باشند. تا آن زمان، این صفحه پنجره‌ای به این جهان است، نه درخواستی برای اتصال کیف‌پول.", "Mint Coming Soon":"مینت به‌زودی", "Join the journey ↗":"به این سفر بپیوندید ↗", "Back to home":"بازگشت به صفحه اصلی", "Return to kindora.foundation ↗":"بازگشت به kindora.foundation ↗",
    "FIXED SUPPLY":"عرضه ثابت", "NO MINT":"بدون مینت", "TAX":"مالیات", "LET HIM COOK":"بگذارید کار خودش را بکند", "SEND IT":"بفرستیدش", "BULLISH":"نگاه صعودی", "NO PANIC":"بدون نگرانی", "STAY KINDO":"KINDO بمانید", "Important:":"مهم:", "Never trust a contract address from replies, DMs, or random posts. Verify it here before swapping.":"هرگز به آدرس قراردادی که در پاسخ‌ها، پیام‌های خصوصی یا پست‌های تصادفی می‌بینید اعتماد نکنید. پیش از معامله آن را در همین‌جا بررسی کنید.", "A fixed total supply of 1,000,000,000 KINDO, with allocation wallets published at launch.":"مجموع عرضه ثابت ۱٬۰۰۰٬۰۰۰٬۰۰۰ واحد KINDO است و کیف‌پول‌های تخصیص‌یافته هم‌زمان با راه‌اندازی منتشر می‌شوند.", "“Are we alone in this universe?”":"«آیا در این جهان تنها هستیم؟»", "Arrival":"ورود", "Find the travelers":"پیدا کردن مسافران", "Beyond Earth":"فراتر از زمین", "IN PROGRESS":"در حال انجام", "NEXT":"بعدی", "LATER":"بعدتر", "TRANSPARENT WALLETS":"کیف‌پول‌های شفاف", "Contract":"قرارداد", "Treasury wallet":"کیف‌پول خزانه", "Team wallet":"کیف‌پول تیم", "Explorer":"اکسپلورر", "Liquidity status":"وضعیت نقدینگی", "Published at launch":"هم‌زمان با راه‌اندازی منتشر می‌شود",
    "Story":"داستان", "Why":"چرا KINDO", "Tokenomics":"توکنومیک", "Transparency":"شفافیت", "Roadmap":"نقشه راه", "How to Buy":"راهنمای خرید", "FAQ":"سؤالات متداول", "NFT Collection":"مجموعه NFT", "Community":"جامعه",
    "FROM KINDORA TO EARTH":"از کیندورا تا زمین", "Meet Kindo.":"با کیندو آشنا شوید.", "A calm little traveler from a peaceful world, now wandering through the loudest place in the universe: crypto.":"یک مسافر آرام از جهانی صلح‌آمیز که حالا در شلوغ‌ترین جای کیهان، یعنی دنیای کریپتو، قدم می‌زند.", "Follow on X":"ما را در X دنبال کنید", "Buy KINDO":"خرید KINDO", "View Chart":"مشاهده نمودار", "CONTRACT":"قرارداد", "COMING SOON":"به‌زودی", "Coming Soon":"به‌زودی", "LIQUIDITY STATUS":"وضعیت نقدینگی", "EXPLORER":"اکسپلورر", "TEAM WALLET":"کیف‌پول تیم", "TREASURY WALLET":"کیف‌پول خزانه", "Copy":"کپی",
    "THE KINDO COLLECTION":"مجموعه KINDO", "555 moments from the journey.":"۵۵۵ لحظه از این سفر.", "A collection of calm travelers, Earth discoveries, and rare glimpses of Kindora, built with the same story, character, and care.":"مجموعه‌ای از مسافران آرام، کشف‌های زمینی و نگاه‌های نادری به کیندورا؛ با همان داستان، شخصیت و دقتی که شایسته‌ی آن است.", "Explore the collection ↗":"مشاهده مجموعه ↗", "STAY KINDO ✦":"KINDO بمانید ✦", "MARKET PANICS. KINDO DOESN’T. ✦":"بازار مضطرب است؛ KINDO نه. ✦", "FROM KINDORA TO EARTH ✦":"از کیندورا تا زمین ✦", "STAY CALM ✦":"آرام بمانید ✦", "STAY CURIOUS ✦":"کنجکاو بمانید ✦",
    "THE STORY OF KINDO":"داستان KINDO", "He came from a quieter world.":"او از جهانی آرام‌تر آمد.", "Are we alone in this universe?":"آیا در این جهان تنها هستیم؟", "WHY KINDO":"چرا KINDO", "Simple by design.":"ساده از روی طراحی.", "Memorable by nature.":"ماندگار از ذات.", "PEOPLE FIRST":"اولویت با مردم", "Community-driven":"جامعه‌محور", "Built around the people who join the journey.":"بر پایه‌ی آدم‌هایی که به این سفر می‌پیوندند.", "FIXED FOREVER":"برای همیشه ثابت", "1B supply":"عرضه ۱ میلیاردی", "KEEP IT CLEAN":"شفاف و ساده", "0% tax":"مالیات ۰٪", "NO EXTRA SUPPLY":"بدون عرضه اضافی", "No minting":"بدون مینت جدید", "OPEN BY DEFAULT":"شفاف از ابتدا", "No blacklist":"بدون بلک‌لیست", "LESS POWER, MORE TRUST":"قدرت کمتر، اعتماد بیشتر", "No owner tricks":"بدون ترفندهای مالکانه",
    "TOKENOMICS":"توکنومیک", "Nothing complicated.":"هیچ چیز پیچیده نیست.", "Kindo keeps the numbers easy to understand.":"KINDO اعداد را ساده و قابل‌فهم نگه می‌دارد.", "TOKEN ALLOCATION":"تخصیص توکن", "Public & Liquidity":"عمومی و نقدینگی", "Project Treasury":"خزانه پروژه", "Team":"تیم", "TRANSPARENT WALLETS":"کیف‌پول‌های شفاف", "TRANSPARENCY / ON-CHAIN":"شفافیت / آن‌چین", "Verify. Don’t assume.":"بررسی کنید؛ حدس نزنید.", "ROADMAP":"نقشه راه", "The journey begins here.":"سفر از اینجا آغاز می‌شود.", "IN PROGRESS":"در حال انجام", "NEXT":"بعدی", "LATER":"بعدتر", "OFFICIAL MARKETS & LINKS":"بازارها و لینک‌های رسمی", "Real links only.":"فقط لینک‌های واقعی.", "FAQ":"سؤالات متداول", "Quick answers for travelers.":"پاسخ‌های کوتاه برای مسافران.", "What is KINDO?":"KINDO چیست؟", "Which chain?":"روی کدام شبکه؟", "Is there a tax?":"آیا مالیاتی وجود دارد؟", "What is the supply?":"مقدار عرضه چقدر است؟", "Where can I buy KINDO?":"از کجا می‌توانم KINDO بخرم؟", "Where can I verify the contract and official links?":"قرارداد و لینک‌های رسمی را کجا بررسی کنم؟", "KINDO CULTURE":"فرهنگ KINDO", "Calm energy. Loud spirit.":"انرژی آرام؛ روحیه‌ای پرشور.", "HOW TO BUY":"راهنمای خرید", "Four simple steps.":"چهار قدم ساده.", "Get a wallet":"یک کیف‌پول بسازید", "Connect to Robinhood Chain":"به Robinhood Chain وصل شوید", "Fund your wallet":"کیف‌پولتان را شارژ کنید", "Swap for $KINDO":"با $KINDO معامله کنید", "JUST FOR FUN":"فقط برای سرگرمی", "A memecoin with a story. Not a promise.":"یک میم‌کوین با داستان؛ نه یک وعده.", "JOIN THE JOURNEY":"به این سفر بپیوندید", "Stay calm.":"آرام بمانید.", "Stay curious.":"کنجکاو بمانید.", "Stay Kindo.":"KINDO بمانید.", "CONTACT KINDO":"تماس با KINDO", "Want to reach the team?":"می‌خواهید با تیم در تماس باشید؟"
  };
  const faBlocks = new Map(Object.entries({
    "“Are we alone in this universe?”": "«آیا در این جهان تنها هستیم؟»",
    "If you found Kindo, perhaps it was actually Kindo who found you.": "اگر شما کیندو را پیدا کرده‌اید، شاید در واقع این کیندو بوده که شما را پیدا کرده است.",
    "Stay Kindo.To Kindora. 🚀": "KINDO بمانید.<br><strong>به سوی کیندورا. 🚀</strong>",
    "Kindo’s journey from Kindora has only just begun. New chapters, characters, and adventures may be added over time as the community grows.": "سفر کیندو از کیندورا تازه آغاز شده است. با رشد جامعه، فصل‌ها، شخصیت‌ها و ماجراهای تازه‌ای ممکن است به این داستان اضافه شوند.",
    "Far across the galaxy lies a small, peaceful planet called Kindora. There lived a curious and playful little kid named Kindo, who had carried one question with him for as long as he could remember:": "آن‌سوی دوردست‌های کهکشان، سیاره‌ای کوچک و آرام به نام کیندورا قرار دارد. آنجا کودکی کنجکاو و بازیگوش به نام کیندو زندگی می‌کرد؛ کودکی که از همان ابتدا یک سؤال را با خود داشت:",
    "Kindo spent countless hours gazing at the skies until one day, among countless worlds, he discovered something different: a blue planet, alive and full of wonder — Earth.": "کیندو ساعت‌های بی‌شماری به آسمان خیره می‌شد تا اینکه روزی، میان جهان‌های بی‌شمار، چیزی متفاوت پیدا کرد: سیاره‌ای آبی، زنده و سرشار از شگفتی؛ زمین.",
    "His desire to explore grew so strong that Kindo climbed into his little spaceship and set off for Earth. But what he found was different from what he had imagined. Earth was beautiful and full of dreams, yet within all that beauty, there was also fear, noise, and an endless rush. Still, amid all the chaos, Kindo noticed people who were simply searching for a little peace and light.": "اشتیاق کیندو برای کشف جهان آن‌قدر زیاد شد که سوار سفینه‌ی کوچک خود شد و به سوی زمین حرکت کرد. اما آنچه پیدا کرد با تصورش فرق داشت. زمین زیبا و پر از رؤیا بود، اما در دل این زیبایی، ترس، هیاهو و شتابی بی‌پایان هم وجود داشت. بااین‌حال، کیندو در میان این آشوب آدم‌هایی را دید که فقط به دنبال کمی آرامش و روشنایی بودند.",
    "That was the moment Kindo’s journey found a new meaning. He decided to stay and find those people — the ones who still believe that kindness, hope, and compassion are worth holding on to.": "همان لحظه بود که سفر کیندو معنای تازه‌ای پیدا کرد. او تصمیم گرفت بماند و آن آدم‌ها را پیدا کند؛ کسانی که هنوز باور دارند مهربانی، امید و همدلی ارزش آن را دارند که به آن‌ها وفادار بمانیم.",
    "But Kindo won’t stay on Earth forever. One day, he will return home to Kindora — and this time, he won’t be going back alone.": "اما کیندو برای همیشه روی زمین نمی‌ماند. روزی به خانه‌اش، کیندورا، بازخواهد گشت؛ و این بار تنها برنمی‌گردد.",
    "No maze of mechanics. No unnecessary tricks. Just a clean token model wrapped around a character people can actually remember.": "نه هزارتویی از قوانین پیچیده، نه ترفندهای اضافی؛ فقط یک مدل توکن شفاف، در کنار شخصیتی که واقعاً می‌شود او را به خاطر سپرد.",
    "The source of truth will always be the official contract, wallets, and explorer records. Until launch, these fields stay clearly marked.": "منبع حقیقت همیشه قرارداد رسمی، کیف‌پول‌ها و سوابق اکسپلورر خواهد بود. تا زمان راه‌اندازی، وضعیت این موارد به‌روشنی مشخص می‌ماند.",
    "Clear stages. No fantasy dates. Kindo moves when the pieces are ready.": "مراحل روشن، بدون وعده‌های خیالی. کیندو زمانی حرکت می‌کند که همه‌چیز آماده باشد.",
    "These destinations remain unavailable until verified official links exist. Never trust links shared through unsolicited replies or DMs.": "این مقصدها تا زمانی که لینک رسمی و تأییدشده‌ای وجود نداشته باشد، در دسترس نیستند. هرگز به لینک‌هایی که در پاسخ‌های ناخواسته یا پیام‌های خصوصی ارسال می‌شوند اعتماد نکنید.",
    "Short, clear, and grounded in what is publicly verifiable today.": "کوتاه، روشن و بر پایه‌ی چیزهایی که امروز به‌صورت عمومی قابل بررسی هستند.",
    "Use an EVM-compatible wallet you trust and always verify the official KINDO contract address on this website before you swap.": "از یک کیف‌پول سازگار با EVM که به آن اعتماد دارید استفاده کنید و پیش از هر معامله، آدرس رسمی قرارداد KINDO را در همین وب‌سایت بررسی کنید.",
    "Partnerships, community inquiries, media, or general questions? Drop us a line.": "برای همکاری، پرسش‌های جامعه، رسانه یا هر سؤال دیگری، با ما در تماس باشید.",
    "KINDO is a community-driven memecoin built around Kindo, a calm traveler from Kindora navigating the noise of crypto.": "KINDO یک میم‌کوین جامعه‌محور است که حول شخصیت کیندو ساخته شده؛ مسافری آرام از کیندورا که در هیاهوی کریپتو راه خود را پیدا می‌کند.",
    "The fixed supply is 1,000,000,000 KINDO, with no mint function for additional supply.": "عرضه‌ی ثابت برابر با ۱٬۰۰۰٬۰۰۰٬۰۰۰ واحد KINDO است و هیچ تابعی برای ایجاد عرضه‌ی بیشتر وجود ندارد.",
    "The official Buy link is Coming Soon. Do not use unverified market links or contract addresses.": "لینک رسمی خرید به‌زودی منتشر می‌شود. از لینک‌های بازار یا آدرس‌های قراردادی که تأیید نشده‌اند استفاده نکنید.",
    "Telegram access starts through our official channel.": "دسترسی به تلگرام از کانال رسمی ما آغاز می‌شود."
    ,"$KINDO is a community-driven memecoin created for fun, storytelling, memes, and community culture. It does not represent ownership in a company, promise financial returns, or carry any guaranteed value.": "$KINDO یک میم‌کوین جامعه‌محور است که برای سرگرمی، داستان‌گویی، میم‌ها و فرهنگ جامعه ساخته شده است. این پروژه نشان‌دهنده‌ی مالکیت در یک شرکت نیست، وعده‌ی بازدهی مالی نمی‌دهد و هیچ ارزش تضمین‌شده‌ای ندارد."
    ,"1,000,000,000 KINDO. No hidden expansion.": "۱٬۰۰۰٬۰۰۰٬۰۰۰ واحد KINDO؛ بدون افزایش پنهانی.",
    "No buy tax. No sell tax.": "بدون مالیات خرید و بدون مالیات فروش.",
    "No additional KINDO after deployment.": "پس از راه‌اندازی، KINDO جدیدی ایجاد نمی‌شود.",
    "No wallet blacklist mechanism.": "هیچ سازوکار بلک‌لیست کیف‌پول وجود ندارد.",
    "Published at launch": "هم‌زمان با راه‌اندازی منتشر می‌شود",
    "KINDO is planned for Robinhood Chain.": "KINDO برای عرضه روی Robinhood Chain برنامه‌ریزی شده است.",
    "No. KINDO has 0% buy tax and 0% sell tax.": "خیر. KINDO مالیات خرید و فروش ندارد؛ هر دو ۰٪ هستند.",
    "Use this website’s Transparency and Official Markets & Links sections. Contract, explorer, wallets, and market links will be published only when they are ready to verify.": "بخش‌های «شفافیت» و «بازارها و لینک‌های رسمی» همین وب‌سایت را بررسی کنید. قرارداد، اکسپلورر، کیف‌پول‌ها و لینک‌های بازار فقط زمانی منتشر می‌شوند که آماده‌ی راستی‌آزمایی باشند.",
    "Community growth, memes, partnerships, and wider discovery.": "رشد جامعه، میم‌ها، همکاری‌ها و معرفی گسترده‌تر.",
    "Ecosystem growth and whatever the community builds next.": "رشد اکوسیستم و هر چیزی که جامعه در ادامه بسازد.",
    "Website, official channels, launch preparation, and transparent on-chain details.": "وب‌سایت، کانال‌های رسمی، آماده‌سازی راه‌اندازی و جزئیات شفاف آن‌چین.",
    "Use Robinhood Wallet for the easiest experience, or use another EVM-compatible wallet such as MetaMask, Rabby, or Trust Wallet.": "برای تجربه‌ای ساده‌تر از Robinhood Wallet استفاده کنید؛ یا یکی از کیف‌پول‌های سازگار با EVM مانند MetaMask، Rabby یا Trust Wallet را انتخاب کنید.",
    "Robinhood Wallet supports Robinhood Chain natively. Other EVM-compatible wallets may require you to add the network using the official network settings.": "Robinhood Wallet به‌صورت پیش‌فرض از Robinhood Chain پشتیبانی می‌کند. در کیف‌پول‌های سازگار با EVM دیگر، ممکن است لازم باشد شبکه را با تنظیمات رسمی اضافه کنید.",
    "Make sure you have the required asset for the swap and keep a small amount of ETH for network fees.": "مطمئن شوید دارایی لازم برای معامله را دارید و مقدار کمی ETH نیز برای کارمزد شبکه نگه دارید.",
    "Use the official Buy link, confirm the contract address, review the transaction, and then swap.": "از لینک رسمی خرید استفاده کنید، آدرس قرارداد را تأیید کنید، تراکنش را بررسی کنید و سپس معامله را انجام دهید.",
    "Important:": "مهم:",
    "Never trust a contract address from replies, DMs, or random posts. Verify it here before swapping.": "هرگز به آدرس قراردادی که در پاسخ‌ها، پیام‌های خصوصی یا پست‌های تصادفی می‌بینید اعتماد نکنید. پیش از معامله آن را در همین‌جا بررسی کنید."
  }));
  const translatePage = (enabled) => {
    document.documentElement.lang = enabled ? 'fa' : 'en';
    document.documentElement.dir = enabled ? 'rtl' : 'ltr';
    document.querySelectorAll('[data-language-toggle]').forEach((button) => { button.textContent = enabled ? 'English' : 'فارسی'; button.setAttribute('aria-label', enabled ? 'Switch to English' : 'Switch to Persian'); });
    document.querySelectorAll('p, h1, h2, h3, summary, dt, dd, a, span').forEach((el) => {
      const key = el.textContent.trim();
      if (enabled && faBlocks.has(key)) el.innerHTML = faBlocks.get(key);
    });
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
