/* 港邊海產熱炒 — 互動與動態
   特效：巨型標題隨捲動速度橫移、交叉膠帶跑馬燈（捲越快跑越快）、貼紙彈跳、
         捲動放大標語、斜切遮罩揭露、數字滾動、3D 翻牌菜單 */
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';

  initFlips();
  if (!hasGsap || reduce) return;

  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);

  /* 1. Hero 進場：字塊砸下來 */
  const intro = gsap.timeline({ defaults: { ease: 'power4.out' } });
  intro.from('.row--a', { yPercent: 100, opacity: 0, duration: .8 })
    .from('.row--b', { yPercent: 100, opacity: 0, duration: .8 }, .12)
    .from('.hero__img', { y: 80, rotate: 8, opacity: 0, duration: .9, ease: 'back.out(1.6)' }, .25)
    .from('.hero__copy > *', { x: 40, opacity: 0, duration: .6, stagger: .08 }, .4)
    .from('.sticker', { scale: 0, rotate: -180, duration: .7, stagger: .12, ease: 'back.out(2.2)' }, .6);

  /* 巨型標題：跟著捲動橫移 */
  gsap.utils.toArray('.row').forEach(row => {
    const dir = +row.dataset.dir;
    gsap.to(row, { xPercent: dir * 18, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: .5 } });
  });

  /* 2. 膠帶跑馬燈：基本速度 + 捲動速度加成 */
  const loops = gsap.utils.toArray('.tape__track').map((t, i) => gsap.to(t, { xPercent: i ? 0 : -50, startAt: { xPercent: i ? -50 : 0 }, duration: 18, ease: 'none', repeat: -1 }));
  let boostTween;
  ScrollTrigger.create({
    onUpdate: self => {
      const v = Math.min(Math.abs(self.getVelocity()) / 300, 6);
      loops.forEach(l => l.timeScale(1 + v));
      boostTween?.kill();
      boostTween = gsap.to(loops, { timeScale: 1, duration: 1, ease: 'power2.out', delay: .1 });
    }
  });

  /* 貼紙：持續晃動 */
  gsap.to('.sticker--yellow', { rotate: 22, duration: .9, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 1.4 });
  gsap.to('.sticker--blue', { rotate: 360, duration: 12, ease: 'none', repeat: -1 });

  /* 3. 標語隨捲動放大 */
  gsap.fromTo('[data-grow]', { scale: .55 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '[data-grow]', start: 'top 95%', end: 'top 35%', scrub: .6 } });

  /* 4. 數字滾動 */
  document.querySelectorAll('[data-count]').forEach(el => {
    const end = +el.dataset.count, start = end > 1000 ? end - 30 : 0, o = { v: start };
    el.textContent = start;
    gsap.to(o, { v: end, duration: 1.4, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true }, onUpdate: () => { el.textContent = Math.round(o.v); } });
  });
  gsap.from('.stats > div', { scale: .7, opacity: 0, duration: .5, stagger: .08, ease: 'back.out(2)', scrollTrigger: { trigger: '.stats', start: 'top 85%', once: true } });

  /* 5. 斜切遮罩揭露 */
  document.querySelectorAll('[data-wipe]').forEach(el => {
    const cover = document.createElement('span');
    cover.className = 'wipe';
    cover.setAttribute('aria-hidden', 'true');
    el.appendChild(cover);
    const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 82%', once: true }, onComplete: () => cover.remove() });
    tl.to(cover, { xPercent: 130, duration: 1, ease: 'power3.inOut' })
      .from(el.querySelector('img'), { scale: 1.3, duration: 1.4, ease: 'power3.out' }, 0);
  });
  gsap.utils.toArray('.t5__text').forEach(t => {
    gsap.from(t.children, { y: 40, opacity: 0, duration: .6, stagger: .07, ease: 'power3.out', scrollTrigger: { trigger: t, start: 'top 85%', once: true } });
  });
  gsap.utils.toArray('.t5__no').forEach(n => {
    gsap.fromTo(n, { yPercent: 30 }, { yPercent: -30, ease: 'none', scrollTrigger: { trigger: n, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  /* 菜單卡片彈入 */
  gsap.utils.toArray('.flips').forEach(list => {
    gsap.from(list.children, { y: 50, rotate: () => gsap.utils.random(-8, 8), opacity: 0, duration: .5, stagger: .05, ease: 'back.out(2)', scrollTrigger: { trigger: list, start: 'top 85%', once: true } });
  });

  /* 揪團方案 */
  gsap.from('.group__title', { xPercent: -30, opacity: 0, duration: .8, ease: 'power4.out', scrollTrigger: { trigger: '.group', start: 'top 70%', once: true } });
  gsap.from('.plan', { y: 100, opacity: 0, duration: .7, stagger: .12, ease: 'back.out(1.8)', scrollTrigger: { trigger: '.plans', start: 'top 85%', once: true } });
  gsap.from('.visit__big', { scale: .8, opacity: 0, duration: .8, ease: 'back.out(1.6)', scrollTrigger: { trigger: '.visit', start: 'top 75%', once: true } });
  gsap.fromTo('.footer__big', { xPercent: 10 }, { xPercent: -12, ease: 'none', scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: true } });

  window.addEventListener('load', () => ScrollTrigger.refresh());

  /* ---------- 翻牌：觸控裝置點一下翻面 ---------- */
  function initFlips() {
    document.querySelectorAll('.flip').forEach(btn => btn.addEventListener('click', () => {
      btn.setAttribute('aria-pressed', btn.getAttribute('aria-pressed') !== 'true');
    }));
  }
})();
