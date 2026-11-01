/* 巷口牛肉麵 — 互動與動態
   特效：滑鼠聚光燈、蒸氣、逐字浮現、自訂游標、磁吸按鈕、橫向捲動十八小時、
         菜單滑過圖片預覽、數字滾動、Lenis 平滑捲動、即時營業狀態 */
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';

  initStatus();
  if (!hasGsap || reduce) return;

  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);

  /* Lenis 平滑捲動 */
  let lenis = null;
  if (window.Lenis) {
    lenis = new window.Lenis({ duration: 1.2 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
      const el = document.querySelector(a.getAttribute('href'));
      if (el) { e.preventDefault(); lenis.scrollTo(el, { duration: 1.5 }); }
    }));
  }

  /* 1. 標題逐字浮現 */
  const title = document.querySelector('[data-split]');
  const label = title.textContent;
  title.innerHTML = `<span class="sr-only">${label.trim()}</span>` + title.innerHTML.split(/(<br>)/).map(part => part === '<br>' ? part : [...part].map(c => `<span class="ch" aria-hidden="true">${c}</span>`).join('')).join('');
  const intro = gsap.timeline({ defaults: { ease: 'expo.out' } });
  intro
    .from('.hero__bg img', { scale: 1.15, duration: 2.4, ease: 'power2.out' }, 0)
    .from('.hero__since', { y: 20, opacity: 0, duration: 1 }, .2)
    .from('.hero__title .ch', { yPercent: 90, opacity: 0, rotate: 6, duration: 1.1, stagger: .05 }, .3)
    .from('.hero__lead, .hero .btn, .hero__scroll', { y: 24, opacity: 0, duration: 1, stagger: .1 }, .9);

  /* Hero 捲動視差 */
  gsap.to('.hero__bg', { yPercent: 18, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero__content', { yPercent: -25, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: '30% top', end: 'bottom top', scrub: true } });

  /* 2. 聚光燈：滑鼠控制；觸控裝置自動緩慢漂移 */
  const spot = document.querySelector('.hero__spot');
  const hero = document.querySelector('.hero');
  if (finePointer) {
    const sx = gsap.quickTo(spot, 'x', { duration: .9, ease: 'power3.out' });
    const sy = gsap.quickTo(spot, 'y', { duration: .9, ease: 'power3.out' });
    gsap.set(spot, { x: innerWidth * .62, y: innerHeight * .45 });
    hero.addEventListener('pointermove', e => { const r = hero.getBoundingClientRect(); sx(e.clientX - r.left); sy(e.clientY - r.top); });
  } else {
    gsap.set(spot, { x: innerWidth * .55, y: innerHeight * .38 });
    gsap.to(spot, { x: innerWidth * .75, y: innerHeight * .5, duration: 5, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  }

  /* 3. 自訂游標 + 磁吸按鈕 */
  if (finePointer) {
    const dot = document.querySelector('.cursor__dot');
    const ring = document.querySelector('.cursor__ring');
    const cursor = document.querySelector('.cursor');
    const dx = gsap.quickTo(dot, 'x', { duration: .1 }), dy = gsap.quickTo(dot, 'y', { duration: .1 });
    const rx = gsap.quickTo(ring, 'x', { duration: .5, ease: 'power3.out' }), ry = gsap.quickTo(ring, 'y', { duration: .5, ease: 'power3.out' });
    gsap.set(cursor, { opacity: 0 });
    window.addEventListener('pointermove', e => { dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY); gsap.to(cursor, { opacity: 1, duration: .3, overwrite: 'auto' }); });
    document.addEventListener('pointerleave', () => gsap.to(cursor, { opacity: 0, duration: .3 }));
    document.querySelectorAll('a, button, .dish').forEach(el => {
      el.addEventListener('pointerenter', () => cursor.classList.add('is-hover'));
      el.addEventListener('pointerleave', () => cursor.classList.remove('is-hover'));
    });
    document.querySelectorAll('[data-magnet]').forEach(btn => {
      const inner = btn.querySelector('span');
      btn.addEventListener('pointermove', e => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
        gsap.to(btn, { x: x * .35, y: y * .45, duration: .6, ease: 'power3.out' });
        gsap.to(inner, { x: x * .15, y: y * .2, duration: .6, ease: 'power3.out' });
      });
      btn.addEventListener('pointerleave', () => gsap.to([btn, inner], { x: 0, y: 0, duration: .9, ease: 'elastic.out(1, .4)' }));
    });
  }

  /* Intro 文字壓圖：圖片視差、文字卡浮上 */
  gsap.fromTo('.intro__img img', { yPercent: -6, scale: 1.1 }, { yPercent: 6, scale: 1.1, ease: 'none', scrollTrigger: { trigger: '.intro', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.from('.intro__text', { y: 80, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.intro__text', start: 'top 90%', once: true } });

  /* 4. 十八小時：桌機釘住橫向捲動 */
  const mm = gsap.matchMedia();
  mm.add('(min-width: 900px)', () => {
    const track = document.querySelector('.craft__track');
    const dist = () => track.scrollWidth - innerWidth;
    const tween = gsap.to(track, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: { trigger: '.craft', pin: '.craft__pin', start: 'top top', end: () => '+=' + dist(), scrub: 1, invalidateOnRefresh: true }
    });
    gsap.utils.toArray('.step img').forEach(img => {
      gsap.fromTo(img, { scale: 1.25 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: img, containerAnimation: tween, start: 'left right', end: 'center center', scrub: true } });
    });
    gsap.utils.toArray('.step__time').forEach(t => {
      gsap.from(t, { opacity: 0, x: 60, ease: 'power2.out', scrollTrigger: { trigger: t, containerAnimation: tween, start: 'left 100%', end: 'left 75%', scrub: true } });
    });
  });

  /* 5. 數字滾動 */
  document.querySelectorAll('[data-count]').forEach(el => {
    const end = +el.dataset.count; const o = { v: 0 };
    el.textContent = '0';
    gsap.to(o, { v: end, duration: 2, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true }, onUpdate: () => { el.textContent = Math.round(o.v); } });
  });

  /* 區塊淡入 */
  gsap.utils.toArray('.menu__head, .menu__group, .voice, .visit__text, .visit__img').forEach(el => {
    gsap.from(el, { y: 60, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
  });
  gsap.from('.footer__big', { yPercent: 50, opacity: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.footer', start: 'top 85%', once: true } });

  /* 6. 菜單滑過圖片預覽（跟隨滑鼠） */
  if (finePointer) {
    const preview = document.querySelector('.preview');
    const inner = preview.querySelector('.preview__inner');
    const px = gsap.quickTo(preview, 'x', { duration: .6, ease: 'power3.out' });
    const py = gsap.quickTo(preview, 'y', { duration: .6, ease: 'power3.out' });
    const cache = {};
    window.addEventListener('pointermove', e => { px(e.clientX); py(e.clientY); });
    document.querySelectorAll('.dish[data-img]').forEach(d => {
      d.addEventListener('pointerenter', () => {
        const id = d.dataset.img;
        if (!cache[id]) {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.alt = '';
          img.src = `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=520`;
          cache[id] = img;
        }
        inner.replaceChildren(cache[id]);
        preview.classList.add('is-on');
      });
      d.addEventListener('pointerleave', () => preview.classList.remove('is-on'));
    });
  }

  window.addEventListener('load', () => ScrollTrigger.refresh());

  /* ---------- 即時營業狀態（以台灣時間計算） ---------- */
  function initStatus() {
    const el = document.querySelector('[data-status]');
    const text = el.querySelector('.status__text');
    const update = () => {
      const tw = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Taipei' }));
      const day = tw.getDay(); const m = tw.getHours() * 60 + tw.getMinutes();
      const slots = [[690, 870], [1020, 1260]];
      const open = day !== 0 && slots.some(([a, b]) => m >= a && m < b);
      el.classList.toggle('is-open', open);
      if (open) text.textContent = '現在營業中';
      else if (day === 0) text.textContent = '今日公休';
      else if (m < 690) text.textContent = '11:30 開門';
      else if (m < 1020) text.textContent = '休息中・17:00 開';
      else text.textContent = '今日已打烊';
    };
    update();
    setInterval(update, 60000);
  }
})();
