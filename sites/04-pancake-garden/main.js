/* Pancake Garden 鬆餅花園 — 互動與動態
   特效：插畫漂浮＋滑鼠/捲動視差、旋轉圓形文字徽章、果凍彈跳按鈕、螢光筆標記、
         Swiper 季節限定輪播、菜單篩選轉場、3D 傾斜卡片、數字滾動、流動波浪 */
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  const gsap = window.gsap;

  initSwiper();
  initFilter();
  if (!hasGsap || reduce) return;

  const { ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);

  /* 1. 開場：彈跳進場 */
  const tl = gsap.timeline({ defaults: { ease: 'back.out(1.8)' } });
  tl.from('.hero__img', { scale: .6, rotate: -12, opacity: 0, duration: 1 })
    .from('.blob-bg', { scale: 0, duration: 1.1, ease: 'elastic.out(1, .6)' }, 0)
    .from('.chip-label, .hero__title, .hero__lead, .hero__cta, .hero__facts li', { y: 30, opacity: 0, duration: .7, stagger: .08 }, .15)
    .from('.doodle', { scale: 0, rotate: -90, opacity: 0, duration: .8, stagger: .08 }, .5)
    .from('.badge', { scale: 0, duration: .8, ease: 'elastic.out(1, .5)' }, .8);

  /* 螢光筆標記：由左往右畫出 */
  document.querySelectorAll('.hl').forEach(hl => {
    gsap.fromTo(hl, { '--hl': 0 }, { '--hl': 1, duration: .8, ease: 'power2.out', delay: hl.closest('.hero') ? 1 : 0, scrollTrigger: hl.closest('.hero') ? null : { trigger: hl, start: 'top 85%', once: true } });
  });

  /* 2. 插畫：持續漂浮 + 滑鼠視差 + 捲動視差 */
  const doodles = gsap.utils.toArray('.doodle');
  doodles.forEach((d, i) => {
    gsap.to(d, { y: '+=14', rotate: i % 2 ? 10 : -10, duration: 2.4 + i * .3, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    gsap.to(d, { yPercent: -120 * +d.dataset.depth, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  });
  if (fine) {
    const art = document.querySelector('.hero__art');
    const movers = doodles.map(d => ({ x: gsap.quickTo(d, 'x', { duration: .8, ease: 'power3.out' }), depth: +d.dataset.depth }));
    const imgX = gsap.quickTo('.hero__img', 'x', { duration: 1, ease: 'power3.out' });
    const imgY = gsap.quickTo('.hero__img', 'y', { duration: 1, ease: 'power3.out' });
    window.addEventListener('pointermove', e => {
      const nx = e.clientX / innerWidth - .5, ny = e.clientY / innerHeight - .5;
      movers.forEach(m => m.x(nx * 40 * m.depth));
      imgX(nx * -14); imgY(ny * -10);
    });
    art.addEventListener('pointerleave', () => { imgX(0); imgY(0); });
  }

  /* 3. Bento 彈出 + 數字 */
  gsap.from('.tile', { y: 60, opacity: 0, scale: .92, duration: .9, stagger: .08, ease: 'back.out(1.6)', scrollTrigger: { trigger: '.bento', start: 'top 80%', once: true } });
  document.querySelectorAll('[data-count]').forEach(el => {
    const o = { v: 0 }, end = +el.dataset.count;
    el.textContent = '0';
    gsap.to(o, { v: end, duration: 1.6, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true }, onUpdate: () => { el.textContent = Math.round(o.v); } });
  });

  gsap.utils.toArray('.sec-head, .party__inner, .visit__card').forEach(el => {
    gsap.from(el, { y: 50, opacity: 0, duration: .9, ease: 'back.out(1.4)', scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
  });
  gsap.from('.card', { y: 50, opacity: 0, rotate: () => gsap.utils.random(-6, 6), duration: .8, stagger: .05, ease: 'back.out(1.7)', scrollTrigger: { trigger: '.cards', start: 'top 80%', once: true } });

  /* 4. 3D 傾斜卡片 */
  if (fine) {
    document.querySelectorAll('.card').forEach(card => {
      const rx = gsap.quickTo(card, 'rotationX', { duration: .5, ease: 'power3.out' });
      const ry = gsap.quickTo(card, 'rotationY', { duration: .5, ease: 'power3.out' });
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        ry(((e.clientX - r.left) / r.width - .5) * 18);
        rx(((e.clientY - r.top) / r.height - .5) * -18);
      });
      card.addEventListener('pointerleave', () => { rx(0); ry(0); });
    });
  }

  window.addEventListener('load', () => ScrollTrigger.refresh());

  /* ---------- Swiper 季節限定 ---------- */
  function initSwiper() {
    if (!window.Swiper) return;
    new window.Swiper('.season-swiper', {
      slidesPerView: 'auto', centeredSlides: true, spaceBetween: 18, rewind: true, initialSlide: 1, grabCursor: true, speed: reduce ? 0 : 700,
      keyboard: { enabled: true }, a11y: { prevSlideMessage: '上一個', nextSlideMessage: '下一個', paginationBulletMessage: '前往第 {{index}} 個' },
      pagination: { el: '.swiper-pagination', clickable: true },
      navigation: { prevEl: '.swiper-btn--prev', nextEl: '.swiper-btn--next' },
      breakpoints: { 900: { spaceBetween: 32 } }
    });
  }

  /* ---------- 菜單篩選（FLIP 轉場） ---------- */
  function initFilter() {
    const btns = [...document.querySelectorAll('.filter')];
    const cards = [...document.querySelectorAll('.card')];
    btns.forEach(btn => btn.addEventListener('click', () => {
      btns.forEach(b => { b.classList.toggle('is-active', b === btn); b.setAttribute('aria-pressed', b === btn); });
      const f = btn.dataset.filter;
      const show = c => f === 'all' || c.dataset.cat === f;
      if (!gsap || reduce) { cards.forEach(c => { c.hidden = !show(c); }); return; }
      const first = new Map(cards.filter(c => !c.hidden).map(c => [c, c.getBoundingClientRect()]));
      const leaving = cards.filter(c => !c.hidden && !show(c));
      gsap.to(leaving, {
        scale: .6, opacity: 0, duration: .25, ease: 'power2.in', onComplete: () => {
          cards.forEach(c => { c.hidden = !show(c); });
          gsap.set(leaving, { clearProps: 'scale,opacity' });
          cards.filter(c => !c.hidden).forEach((c, i) => {
            const last = c.getBoundingClientRect();
            const prev = first.get(c);
            if (prev) gsap.from(c, { x: prev.left - last.left, y: prev.top - last.top, duration: .6, ease: 'power3.out' });
            else gsap.from(c, { scale: .5, opacity: 0, rotate: gsap.utils.random(-10, 10), duration: .6, delay: i * .04, ease: 'back.out(1.8)' });
          });
        }
      });
    }));
  }
})();
