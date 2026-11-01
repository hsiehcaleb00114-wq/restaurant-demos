/* 夜燈 居酒屋 — 互動與動態
   特效：暖簾掀開開場、直書標題逐字浮現、燈籠搖晃、筆刷擦出圖片（墨跡遮罩）、
         印章蓋下、木札掉落與滑過搖晃、背景視差 */
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  const noren = document.querySelector('.noren');

  if (!hasGsap || reduce) { noren?.remove(); return; }

  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);

  /* 直書逐字拆分（保留可讀文字給輔助科技） */
  document.querySelectorAll('[data-vchars]').forEach(el => {
    const label = el.textContent.trim();
    el.querySelectorAll(':scope > span').forEach(span => {
      span.innerHTML = [...span.textContent].map(c => `<span class="ch" aria-hidden="true">${c}</span>`).join('');
    });
    el.insertAdjacentHTML('afterbegin', `<span class="sr-only">${label}</span>`);
  });

  /* 1. 暖簾掀開 → Hero 直書標題逐字落下 */
  const intro = gsap.timeline({ defaults: { ease: 'expo.inOut' } });
  intro
    .to('.noren__half', { skewX: (i) => i ? -3 : 3, duration: .5, ease: 'sine.inOut' }, .2)
    .to('.noren__half--l', { xPercent: -104, skewX: 8, duration: 1.2 }, .6)
    .to('.noren__half--r', { xPercent: 104, skewX: -8, duration: 1.2 }, .6)
    .to('.noren__rod', { yPercent: -120, duration: .6, ease: 'power2.in' }, 1.4)
    .add(() => noren.remove())
    .from('.hero__bg img', { scale: 1.15, duration: 2.4, ease: 'power3.out' }, .6)
    .from('.hero__title .ch', { y: -30, opacity: 0, duration: .9, stagger: .06, ease: 'power3.out' }, 1.1)
    .from('.hero__foot > *', { y: 20, opacity: 0, duration: .9, stagger: .12, ease: 'power3.out' }, 1.6)
    .from('.hanko--hero', { scale: 2.4, opacity: 0, rotate: 20, duration: .45, ease: 'power4.in' }, 2.2)
    .from('.lantern', { y: -200, duration: 1.4, ease: 'bounce.out' }, 1);

  gsap.to('.hero__bg', { yPercent: 16, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  /* 2. 其餘直書標題：捲到時逐字浮現 */
  gsap.utils.toArray('[data-vchars]:not(.hero__title)').forEach(el => {
    gsap.from(el.querySelectorAll('.ch'), { y: -24, opacity: 0, duration: .8, stagger: .07, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 80%', once: true } });
  });

  /* 3. 筆刷擦出圖片：每張圖各自產生一個遮罩 */
  let n = 0;
  document.querySelectorAll('.ink').forEach(fig => {
    const id = `bm${n++}`;
    const svg = `<svg class="ink__mask" viewBox="0 0 400 260" preserveAspectRatio="none" aria-hidden="true">
      <mask id="${id}" maskUnits="userSpaceOnUse" x="-50" y="-50" width="500" height="360">
        <rect x="-50" y="-50" width="500" height="360" fill="#fff"/>
        <path d="M-40 30 C 80 10, 260 50, 440 20 C 300 90, 120 70, -40 110 C 120 130, 300 150, 440 130 C 280 190, 120 180, -40 220 C 120 250, 300 262, 440 250" fill="none" stroke="#000" stroke-width="96" stroke-linecap="round" filter="url(#rough)" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="1"/>
      </mask>
      <rect x="-50" y="-50" width="500" height="360" fill="currentColor" mask="url(#${id})"/>
    </svg>`;
    fig.insertAdjacentHTML('beforeend', svg);
    const path = fig.querySelector('.ink__mask path');
    const tl = gsap.timeline({ scrollTrigger: { trigger: fig, start: 'top 78%', once: true } });
    tl.to(path, { attr: { 'stroke-dashoffset': 0 }, duration: 1.6, ease: 'power2.inOut' })
      .from(fig.querySelector('img'), { scale: 1.18, duration: 2, ease: 'power3.out' }, 0)
      .add(() => fig.querySelector('.ink__mask').remove());
  });

  gsap.utils.toArray('.story__text > *, .dish__text > *').forEach(el => {
    gsap.from(el, { y: 30, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
  });
  gsap.utils.toArray('.dish__no').forEach(no => {
    gsap.from(no, { scale: 1.8, opacity: 0, duration: .8, ease: 'power4.out', scrollTrigger: { trigger: no, start: 'top 85%', once: true } });
  });

  /* 4. 木札：一塊塊掛上牆 */
  gsap.utils.toArray('.plaques').forEach(row => {
    gsap.from(row.children, { y: -60, rotate: () => gsap.utils.random(-14, 14), opacity: 0, duration: 1, stagger: .07, ease: 'elastic.out(1, .5)', scrollTrigger: { trigger: row, start: 'top 85%', once: true } });
  });

  /* 5. 來店須知：直書短句 */
  gsap.from('.rules__list li', { y: -40, opacity: 0, duration: 1, stagger: .15, ease: 'power3.out', scrollTrigger: { trigger: '.rules', start: 'top 75%', once: true } });
  gsap.utils.toArray('.rules__photos img').forEach((img, i) => {
    gsap.fromTo(img, { yPercent: i ? 8 : -8 }, { yPercent: i ? -8 : 8, ease: 'none', scrollTrigger: { trigger: '.rules', start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  /* 6. 印章蓋下 */
  gsap.from('.hanko--visit', { scale: 2.6, opacity: 0, rotate: -30, duration: .5, ease: 'power4.in', scrollTrigger: { trigger: '.visit', start: 'top 60%', once: true } });

  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
