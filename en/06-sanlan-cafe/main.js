/* 山嵐咖啡輕食 — 互動與動態
   特效：分層山景視差、山霧飄移、日夜模式切換（夜晚螢火蟲）、標題逐行浮現、
         sticky 圖片交疊敘事、有機形狀遮罩浮現、數字滾動、錯位照片視差、Lenis 平滑捲動 */
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  const root = document.documentElement;

  initTheme();
  buildFireflies();
  initJourney();
  if (!hasGsap || reduce) return;

  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);

  if (window.Lenis) {
    const lenis = new window.Lenis({ duration: 1.3 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
      const el = document.querySelector(a.getAttribute('href'));
      if (el) { e.preventDefault(); lenis.scrollTo(el, { offset: -60, duration: 1.6 }); }
    }));
  }

  /* 1. 開場：山由遠而近升起、標題逐行浮現 */
  const intro = gsap.timeline({ defaults: { ease: 'expo.out' } });
  intro.from('.m', { yPercent: 18, duration: 2, stagger: .12 })
    .from('.orb', { y: 80, opacity: 0, duration: 2 }, 0)
    .from('.hero__alt', { y: 20, opacity: 0, duration: 1 }, .4)
    .from('.ln > span', { yPercent: 105, duration: 1.3, stagger: .15 }, .5)
    .from('.hero__lead, .hero .btn', { y: 24, opacity: 0, duration: 1, stagger: .1 }, 1);

  /* 2. 分層視差：越近的山動越多 */
  const depth = { '.orb': 10, '.m1': 6, '.m2': 12, '.m3': 20, '.m4': 32, '.hero__content': -30 };
  Object.entries(depth).forEach(([sel, amt]) => {
    gsap.to(sel, { yPercent: amt, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  });

  const header = document.querySelector('.header');
  ScrollTrigger.create({ start: 60, onToggle: s => header.classList.toggle('is-scrolled', s.isActive) });

  /* 3. 數字滾動 */
  document.querySelectorAll('[data-count]').forEach(el => {
    const end = +el.dataset.count, o = { v: 0 };
    el.textContent = '0';
    gsap.to(o, { v: end, duration: 2, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true }, onUpdate: () => { el.textContent = Math.round(o.v); } });
  });

  /* 4. 有機遮罩：由小長大、輕微旋轉 */
  gsap.utils.toArray('.blob').forEach(b => {
    gsap.from(b, { scale: .7, rotate: -8, opacity: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: b, start: 'top 85%', once: true } });
  });
  gsap.utils.toArray('.sig__text, .sig-head, .journey__head, .menu__head, .mcol, .gallery__quote, .visit__card').forEach(el => {
    gsap.from(el, { y: 40, opacity: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
  });

  /* 5. 錯位照片視差 */
  gsap.utils.toArray('[data-speed]').forEach(el => {
    gsap.to(el, { yPercent: +el.dataset.speed, ease: 'none', scrollTrigger: { trigger: '.gallery', start: 'top bottom', end: 'bottom top', scrub: true } });
  });
  gsap.fromTo('.visit__bg img', { yPercent: -12 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.visit', start: 'top bottom', end: 'bottom top', scrub: true } });

  window.addEventListener('load', () => ScrollTrigger.refresh());

  /* ---------- 日夜模式 ---------- */
  function initTheme() {
    const btn = document.querySelector('.theme');
    const label = btn.querySelector('.theme__label');
    const sync = () => {
      const night = root.dataset.theme === 'night';
      btn.setAttribute('aria-pressed', night);
      label.textContent = night ? 'Night' : 'Day';
    };
    sync();
    btn.addEventListener('click', () => {
      root.dataset.theme = root.dataset.theme === 'night' ? 'day' : 'night';
      try { localStorage.setItem('sanlan-theme', root.dataset.theme); } catch (e) { /* 無法儲存時忽略 */ }
      sync();
    });
  }

  function buildFireflies() {
    if (reduce) return;
    const box = document.querySelector('.fireflies');
    const r = (a, b) => (Math.random() * (b - a) + a).toFixed(1);
    box.innerHTML = Array.from({ length: 18 }, () =>
      `<span class="fly" style="left:${r(0, 100)}%;top:${r(10, 100)}%;--x:${r(-90, 90)}px;--y:${r(-120, 40)}px;--d:${r(8, 16)}s;--b:${r(2, 5)}s;animation-delay:-${r(0, 8)}s,-${r(0, 4)}s"></span>`).join('');
  }

  /* ---------- 旅程：捲到哪一步，就換哪張圖 ---------- */
  function initJourney() {
    const steps = [...document.querySelectorAll('.step')];
    const imgs = [...document.querySelectorAll('.stack img')];
    const cur = document.querySelector('.stack__cur');
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const i = steps.indexOf(e.target);
        steps.forEach((s, j) => s.classList.toggle('is-active', i === j));
        imgs.forEach((im, j) => im.classList.toggle('is-active', i === j));
        cur.textContent = String(i + 1).padStart(2, '0');
      });
    }, { rootMargin: '-45% 0px -45% 0px' });
    steps.forEach(s => io.observe(s));
    // 圖片雖設 lazy，但在 sticky 容器中需預先載入，避免切換時空白
    imgs.forEach(im => { im.loading = 'eager'; });
  }
})();
