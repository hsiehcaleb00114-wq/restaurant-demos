/* Bistro 32 小酒館 — 互動與動態
   特效：拱形遮罩揭開 Hero、義大利體標題逐行浮現、標籤游標（Voir）、
         圖片捲動縮放（zoom-out reveal）、菜單卡飾線描繪與逐項浮現、
         餐酒搭配切換（酒杯液面與顏色轉場）、數字滾動、Lenis 平滑捲動 */
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  const gsap = window.gsap;

  const wines = [
    { region: 'Bourgogne · Pinot Noir', name: 'Domaine Lafarge, Bourgogne Rouge 2021', note: 'Cherry and forest berries with soft tannins, just right with the rich duck and cherry sauce.', price: 'Glass NT$ 380 / Bottle NT$ 1,900', color: '#B3263C', level: 60 },
    { region: 'Bordeaux · Cabernet / Merlot', name: 'Château Puy-Blanquet, Saint-Émilion 2018', note: 'Blackcurrant, cedar and a touch of tobacco. Full-bodied, a classic match for charcoal-grilled ribeye.', price: 'Glass NT$ 420 / Bottle NT$ 2,200', color: '#6E1426', level: 70 },
    { region: 'Chablis · Chardonnay', name: 'Domaine Pattes Loup, Chablis 2022', note: 'Crisp minerality and lemon peel that cut through the garlic butter, so the next snail tastes even better.', price: 'Glass NT$ 360 / Bottle NT$ 1,800', color: '#E4C66A', level: 55 },
    { region: 'Sauternes · Sémillon', name: 'Château Doisy-Védrines, Sauternes 2017', note: 'Apricot, honey and toasted almond. Sweet but not heavy, and lovely with crème brûlée.', price: 'Glass NT$ 450 (60 ml)', color: '#D99A2B', level: 40 }
  ];

  initPairing();
  initForm();
  if (!hasGsap || reduce) return;

  const { ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);

  if (window.Lenis) {
    const lenis = new window.Lenis({ duration: 1.25 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
      const el = document.querySelector(a.getAttribute('href'));
      if (el) { e.preventDefault(); lenis.scrollTo(el, { duration: 1.6 }); }
    }));
  }

  /* 1. 開場：拱形遮罩由下往上揭開、標題逐行浮現 */
  gsap.timeline({ defaults: { ease: 'expo.out' } })
    .to('.hero__cover', { scaleY: 0, duration: 1.6, ease: 'expo.inOut' })
    .from('.hero__frame img', { scale: 1.35, duration: 2.2 }, 0)
    .from('.hero__kicker', { y: 20, opacity: 0, duration: 1 }, .5)
    .from('.hero__title .line > span', { yPercent: 110, duration: 1.3, stagger: .12 }, .6)
    .from('.hero__zh, .hero__media figcaption, .hero__foot', { y: 20, opacity: 0, duration: 1, stagger: .1 }, 1.1)
    .from('.header', { y: -30, opacity: 0, duration: 1 }, 1);

  gsap.to('.hero__frame img', { yPercent: 10, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  /* 2. 圖片捲動縮放 */
  gsap.utils.toArray('[data-zoom], .plat__img').forEach(fig => {
    gsap.fromTo(fig.querySelector('img'), { scale: 1.3 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: fig, start: 'top bottom', end: 'center 45%', scrub: true } });
    gsap.from(fig, { y: 60, opacity: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: fig, start: 'top 92%', once: true } });
  });

  /* 標題與文字淡入 */
  gsap.utils.toArray('.h2, .maison__lead, .maison__body, .plat__text, .vin__intro p, .info').forEach(el => {
    gsap.from(el, { y: 50, opacity: 0, duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
  });
  gsap.from('.ornament path', { strokeDasharray: 200, strokeDashoffset: 200, duration: 1.6, ease: 'power2.inOut', scrollTrigger: { trigger: '.ornament', start: 'top 85%', once: true } });

  /* 3. 數字滾動 */
  document.querySelectorAll('[data-count]').forEach(el => {
    const end = +el.dataset.count, o = { v: 0 };
    el.textContent = '0';
    gsap.to(o, { v: end, duration: 2, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true }, onUpdate: () => { el.textContent = Math.round(o.v); } });
  });

  /* 4. 菜單卡：紙張浮起、飾線畫出、品項逐行出現 */
  gsap.from('.carte__paper', { y: 120, rotate: -1.5, opacity: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.carte', start: 'top 70%', once: true } });
  gsap.utils.toArray('.course').forEach(c => {
    const tl = gsap.timeline({ scrollTrigger: { trigger: c, start: 'top 80%', once: true } });
    tl.fromTo(c.querySelector('h3'), { '--draw': 0 }, { '--draw': 1, duration: .9, ease: 'power2.inOut' })
      .from(c.querySelectorAll('li'), { y: 16, opacity: 0, duration: .7, stagger: .07, ease: 'power3.out' }, .2);
  });
  gsap.utils.toArray('.carte__photo').forEach((p, i) => {
    gsap.fromTo(p, { yPercent: i ? 30 : -10 }, { yPercent: i ? -20 : 25, ease: 'none', scrollTrigger: { trigger: '.carte', start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  /* 5. 標籤游標 */
  if (fine) {
    const cur = document.querySelector('.cursor');
    const x = gsap.quickTo(cur, 'x', { duration: .5, ease: 'power3.out' });
    const y = gsap.quickTo(cur, 'y', { duration: .5, ease: 'power3.out' });
    window.addEventListener('pointermove', e => { x(e.clientX); y(e.clientY); });
    document.querySelectorAll('[data-cursor]').forEach(el => {
      el.addEventListener('pointerenter', () => gsap.to(cur, { scale: 1, duration: .5, ease: 'back.out(2)' }));
      el.addEventListener('pointerleave', () => gsap.to(cur, { scale: 0, duration: .35, ease: 'power2.in' }));
    });
  }

  window.addEventListener('load', () => ScrollTrigger.refresh());

  /* ---------- 餐酒搭配 ---------- */
  function initPairing() {
    const btns = [...document.querySelectorAll('.pair')];
    const card = document.querySelector('.wine__card');
    const fill = document.querySelector('.wine__fill');
    const set = w => {
      Object.keys(w).forEach(k => { const el = card.querySelector(`[data-w="${k}"]`); if (el) el.textContent = w[k]; });
    };
    const choose = (btn, focus) => {
      btns.forEach(b => { const on = b === btn; b.classList.toggle('is-active', on); b.setAttribute('aria-checked', on); b.tabIndex = on ? 0 : -1; });
      if (focus) btn.focus();
      const w = wines[+btn.dataset.wine];
      const levelY = 106 - w.level * .86;
      if (!gsap || reduce) { set(w); fill.style.fill = w.color; fill.setAttribute('y', levelY); return; }
      gsap.timeline()
        .to(card.children, { y: -14, opacity: 0, duration: .3, stagger: .04, ease: 'power2.in', onComplete: () => set(w) })
        .to(fill, { attr: { y: 110 }, duration: .45, ease: 'power2.in' }, 0)
        .set(fill, { fill: w.color })
        .to(fill, { attr: { y: levelY }, duration: 1, ease: 'elastic.out(1, .6)' })
        .fromTo(card.children, { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: .7, stagger: .06, ease: 'power3.out' }, '<');
    };
    btns.forEach((b, i) => {
      b.addEventListener('click', () => choose(b));
      b.addEventListener('keydown', e => {
        const d = ['ArrowRight', 'ArrowDown'].includes(e.key) ? 1 : ['ArrowLeft', 'ArrowUp'].includes(e.key) ? -1 : 0;
        if (d) { e.preventDefault(); choose(btns[(i + d + btns.length) % btns.length], true); }
      });
    });
  }

  function initForm() {
    const form = document.querySelector('[data-form]');
    const date = form.querySelector('[name="date"]');
    const t = new Date(); t.setDate(t.getDate() + 1);
    date.min = new Date().toISOString().slice(0, 10);
    date.value = t.toISOString().slice(0, 10);
    form.addEventListener('submit', e => {
      e.preventDefault();
      const d = new FormData(form);
      form.querySelector('.form__msg').textContent = `Merci, ${d.get('name')}! Your table for ${d.get('people')} on ${d.get('date')} at ${d.get('time')} is held. (This is a design sample, nothing was sent.)`;
    });
  }
})();
