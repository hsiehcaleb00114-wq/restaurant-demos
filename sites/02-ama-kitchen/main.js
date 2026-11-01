/* 阿嬤的古早味 — 互動與動態
   特效：招牌燈泡跑燈、招牌字蓋章落下、跑馬燈（隨捲動方向反轉）、手繪線條描繪、
         拍立得掉落、數字滾動、視差、價目表翻頁轉場 */
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';

  buildBulbs();
  initNav();
  initMenu();
  if (!hasGsap || reduce) return;

  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);

  /* 1. 招牌：字一個一個「蓋」上去，印章落下 */
  const tl = gsap.timeline({ defaults: { ease: 'back.out(2)' } });
  tl.from('.sign', { y: -30, rotate: -6, opacity: 0, duration: .8, ease: 'power3.out' })
    .from('.sign__small', { opacity: 0, y: 12, duration: .4 }, '-=.3')
    .from('.sign__big > span', { scale: 1.8, opacity: 0, duration: .45, stagger: .14 }, '-=.1')
    .from('.sign__sub, .sign__side', { opacity: 0, duration: .5, ease: 'power2.out' }, '-=.2')
    .from('.polaroid--hero', { y: 60, rotate: 12, opacity: 0, duration: .9, ease: 'power3.out' }, .2)
    .from('.hero__lead, .hero__cta', { y: 20, opacity: 0, duration: .7, stagger: .1, ease: 'power3.out' }, .5)
    .from('.stamp', { scale: 2.6, opacity: 0, rotate: 20, duration: .5, ease: 'power4.in' }, '-=.1')
    .to('.hero', { x: 3, duration: .05, repeat: 3, yoyo: true, ease: 'none' }) // 蓋章的震動
    .set('.hero', { x: 0 });

  /* 2. 跑馬燈：持續移動，往上捲時反轉方向 */
  const track = document.querySelector('.marquee__track');
  const loop = gsap.to(track, { xPercent: -50, duration: 22, ease: 'none', repeat: -1 });
  ScrollTrigger.create({
    onUpdate: self => gsap.to(loop, { timeScale: self.direction === 1 ? 1 : -1, duration: .4, overwrite: true })
  });

  /* 3. 手繪線條描繪 */
  document.querySelectorAll('.draw path').forEach((path, i) => {
    const len = path.getTotalLength();
    gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
    gsap.to(path, { strokeDashoffset: 0, duration: 1.1, delay: i * .5, ease: 'power2.inOut', scrollTrigger: { trigger: '.quote', start: 'top 65%', once: true } });
  });
  gsap.from('.quote blockquote', { y: 40, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: '.quote', start: 'top 75%', once: true } });

  /* 4. 拍立得掉落（像被丟到桌上） */
  document.querySelectorAll('[data-drop]').forEach(el => {
    const end = el.classList.contains('tilt-r') ? 2.5 : -3;
    gsap.fromTo(el, { y: -80, rotate: end * -4, opacity: 0 }, {
      y: 0, rotate: end, opacity: 1, duration: 1, ease: 'bounce.out',
      scrollTrigger: { trigger: el, start: 'top 85%', once: true },
      onComplete: () => gsap.set(el, { clearProps: 'transform' })
    });
  });
  gsap.utils.toArray('.era__text, .story__head, .sig__head, .visit__text').forEach(el => {
    gsap.from(el, { y: 40, opacity: 0, duration: .9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
  });

  /* 5. 數字滾動 */
  document.querySelectorAll('[data-count]').forEach(el => {
    const obj = { v: 0 }; const end = +el.dataset.count;
    el.textContent = '0';
    gsap.to(obj, { v: end, duration: 1.6, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true }, onUpdate: () => { el.textContent = Math.round(obj.v); } });
  });
  gsap.from('.numbers dl > div', { y: 50, opacity: 0, duration: .8, stagger: .1, ease: 'back.out(1.6)', scrollTrigger: { trigger: '.numbers', start: 'top 80%', once: true } });

  /* 6. 視差：圖片在框內緩慢移動、盤子漂浮 */
  document.querySelectorAll('.sig__img img').forEach(img => {
    gsap.fromTo(img, { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
  document.querySelectorAll('[data-parallax]').forEach(el => {
    const amt = +el.dataset.parallax;
    const target = el.tagName === 'IMG' ? el : el.closest('.sig');
    gsap.to(target, { yPercent: amt, ease: 'none', scrollTrigger: { trigger: target, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
  gsap.from('.tag', { rotate: 10, y: 30, opacity: 0, duration: .9, stagger: .15, ease: 'back.out(2)', scrollTrigger: { trigger: '.sig__grid', start: 'top 70%', once: true } });
  gsap.from('.board', { y: 80, rotate: -1.5, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: '.menu', start: 'top 80%', once: true } });

  window.addEventListener('load', () => ScrollTrigger.refresh());

  /* ---------- 不依賴動畫庫的功能 ---------- */
  function buildBulbs() {
    const box = document.querySelector('.sign__bulbs');
    if (!box) return;
    const perSide = { top: 14, side: 6 };
    const html = [];
    const put = (x, y) => html.push(`<span class="bulb" style="left:${x}%;top:${y}%"></span>`);
    for (let i = 0; i <= perSide.top; i++) put(i / perSide.top * 100, 0);
    for (let i = 1; i < perSide.side; i++) put(100, i / perSide.side * 100);
    for (let i = perSide.top; i >= 0; i--) put(i / perSide.top * 100, 100);
    for (let i = perSide.side - 1; i > 0; i--) put(0, i / perSide.side * 100);
    box.innerHTML = html.join('');
  }

  function initNav() {
    const btn = document.querySelector('.menu-btn');
    const nav = document.querySelector('.nav');
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', open);
      nav.classList.toggle('is-open', open);
    });
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => { btn.setAttribute('aria-expanded', 'false'); nav.classList.remove('is-open'); }));
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && nav.classList.contains('is-open')) { btn.click(); btn.focus(); } });
  }

  /* 價目表：像翻紅紙一樣切換 */
  function initMenu() {
    const tabs = [...document.querySelectorAll('.chop')];
    const select = (tab, focus) => {
      const cur = tabs.find(t => t.getAttribute('aria-selected') === 'true');
      if (cur === tab) return;
      const oldP = document.getElementById(cur.getAttribute('aria-controls'));
      const newP = document.getElementById(tab.getAttribute('aria-controls'));
      cur.setAttribute('aria-selected', 'false'); cur.tabIndex = -1;
      tab.setAttribute('aria-selected', 'true'); tab.tabIndex = 0;
      if (focus) tab.focus();
      const g = window.gsap;
      if (!g || reduce) { oldP.hidden = true; newP.hidden = false; return; }
      g.to(oldP, {
        rotateX: -80, opacity: 0, transformOrigin: '50% 0%', duration: .35, ease: 'power2.in',
        onComplete: () => {
          oldP.hidden = true; g.set(oldP, { clearProps: 'all' });
          newP.hidden = false;
          g.fromTo(newP, { rotateX: 70, opacity: 0, transformOrigin: '50% 0%' }, { rotateX: 0, opacity: 1, duration: .7, ease: 'back.out(1.4)' });
          g.from(newP.querySelectorAll('li'), { x: -16, opacity: 0, duration: .5, stagger: .06, delay: .15, ease: 'power3.out' });
        }
      });
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(t));
      t.addEventListener('keydown', e => {
        const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (d) { e.preventDefault(); select(tabs[(i + d + tabs.length) % tabs.length], true); }
      });
    });
  }
})();
