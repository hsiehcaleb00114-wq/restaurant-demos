/* 晨光早午餐 MORGON — 互動與動態
   特效：日出載入動畫、Hero 逐行浮現、Ken Burns、捲動上色文字、遮罩揭露、數字滾動、
         菜單分類轉場、太陽沿時間軸移動、Lenis 平滑捲動 */
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const loader = document.querySelector('.loader');
  const hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';

  initNav();
  initTabs();
  initBooking();

  if (!hasGsap || reduce) {
    loader?.remove();
    document.querySelectorAll('.day__list li').forEach(li => li.classList.add('is-lit'));
    return;
  }

  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);
  const ease = 'power3.out';

  /* Lenis 平滑捲動，與 ScrollTrigger 同步 */
  let lenis = null;
  if (typeof window.Lenis !== 'undefined') {
    lenis = new window.Lenis({ duration: 1.15, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: -40, duration: 1.4 });
    }));
  }

  /* 1. 日出載入動畫 → 揭開頁面 */
  const heroLines = gsap.utils.toArray('.hero__title .line > span');
  const heroFade = gsap.utils.toArray('.hero [data-fade], .hero__note');
  gsap.set(heroLines, { yPercent: 110 });
  gsap.set(heroFade, { opacity: 0, y: 24 });
  lenis?.stop();

  const intro = gsap.timeline({ defaults: { ease } });
  intro
    .to('.loader__horizon', { strokeDashoffset: 0, duration: .7, ease: 'power2.inOut' })
    .to('.loader__arc', { strokeDashoffset: 0, duration: .8, ease: 'power2.out' }, '-=.3')
    .to('.loader__word span', { opacity: 1, duration: .5, stagger: .12 }, '-=.4')
    .to('.loader', { yPercent: -100, duration: 1, ease: 'expo.inOut' }, '+=.25')
    .add(() => { loader.remove(); lenis?.start(); })
    .to(heroLines, { yPercent: 0, duration: 1.1, stagger: .14 }, '-=.55')
    .to(heroFade, { opacity: 1, y: 0, duration: .9, stagger: .08 }, '-=.8');

  /* 2. Ken Burns：Hero 圖片緩慢放大，捲動時輕微視差 */
  gsap.fromTo('.hero__img', { scale: 1.12 }, { scale: 1, duration: 2.6, ease: 'power2.out' });
  gsap.to('.hero__frame', {
    yPercent: 8, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
  });

  /* 頁首捲動狀態 */
  const header = document.querySelector('[data-header]');
  let lastY = 0;
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: self => {
      const y = self.scroll();
      header.classList.toggle('is-scrolled', y > 40);
      header.classList.toggle('is-hidden', y > 400 && y > lastY && !document.querySelector('.nav.is-open'));
      lastY = y;
    }
  });

  /* 3. 捲動上色文字（逐字） */
  document.querySelectorAll('[data-scrub]').forEach(el => {
    const text = el.textContent;
    el.innerHTML = `<span class="sr-only">${text}</span>` + [...text].map(c => `<span class="ch" aria-hidden="true">${c}</span>`).join('');
    gsap.to(el.querySelectorAll('.ch'), {
      opacity: 1, stagger: .05, ease: 'none',
      scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: .6 }
    });
  });

  /* 4. 遮罩揭露：外層上移、內層反向，只使用 transform */
  document.querySelectorAll('[data-mask]').forEach(fig => {
    const inner = fig.querySelector('.mask__inner');
    const img = fig.querySelector('img');
    const tl = gsap.timeline({ scrollTrigger: { trigger: fig, start: 'top 85%', once: true } });
    tl.fromTo(fig, { yPercent: 12, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1.2, ease })
      .fromTo(inner, { yPercent: 100 }, { yPercent: 0, duration: 1.2, ease: 'expo.out' }, 0)
      .fromTo(img, { yPercent: -60, scale: 1.25 }, { yPercent: 0, scale: 1, duration: 1.4, ease: 'expo.out' }, 0);
  });

  /* 一般區塊標題淡入 */
  gsap.utils.toArray('.h2, .eyebrow:not(.hero .eyebrow), .dish__text, .story__body p, .info, .booking').forEach(el => {
    gsap.from(el, { y: 36, opacity: 0, duration: 1, ease, scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
  });

  /* 招牌編號視差 */
  gsap.utils.toArray('.dish__no').forEach(no => {
    gsap.fromTo(no, { yPercent: 20 }, { yPercent: -20, ease: 'none', scrollTrigger: { trigger: no, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  /* 5. 數字滾動 */
  document.querySelectorAll('[data-count]').forEach(el => {
    const end = +el.dataset.count;
    const start = el.hasAttribute('data-nofmt') ? end - 40 : 0;
    const obj = { v: start };
    el.textContent = start;
    gsap.to(obj, {
      v: end, duration: 1.8, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      onUpdate: () => { el.textContent = Math.round(obj.v); }
    });
  });

  /* 6. 太陽沿著一日時間軸移動 */
  const mm = gsap.matchMedia();
  const items = gsap.utils.toArray('.day__list li');
  const lightUp = p => items.forEach((li, i) => li.classList.toggle('is-lit', p >= i / (items.length - 1) - .02));
  mm.add('(min-width: 900px)', () => {
    gsap.to('.day__sun', {
      x: () => document.querySelector('.day__line').offsetWidth - 19, ease: 'none',
      scrollTrigger: { trigger: '.day__track', start: 'top 75%', end: 'bottom 40%', scrub: .8, invalidateOnRefresh: true, onUpdate: s => lightUp(s.progress) }
    });
  });
  mm.add('(max-width: 899px)', () => {
    gsap.to('.day__sun', {
      y: () => document.querySelector('.day__line').offsetHeight - 19, ease: 'none',
      scrollTrigger: { trigger: '.day__track', start: 'top 70%', end: 'bottom 60%', scrub: .8, invalidateOnRefresh: true, onUpdate: s => lightUp(s.progress) }
    });
  });

  /* 頁尾大字 */
  gsap.from('.footer__big', { yPercent: 40, opacity: 0, duration: 1.2, ease, scrollTrigger: { trigger: '.footer', start: 'top 80%', once: true } });

  window.addEventListener('load', () => ScrollTrigger.refresh());

  /* ---------- 以下為不依賴動畫庫的功能 ---------- */
  function initNav() {
    const nav = document.querySelector('.nav');
    const toggle = nav.querySelector('.nav__toggle');
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', open);
      nav.classList.toggle('is-open', open);
      toggle.querySelector('.sr-only').textContent = open ? '關閉選單' : '開啟選單';
    });
    nav.querySelectorAll('.nav__list a').forEach(a => a.addEventListener('click', () => {
      toggle.setAttribute('aria-expanded', 'false');
      nav.classList.remove('is-open');
    }));
  }

  function initTabs() {
    const tabs = [...document.querySelectorAll('.tab')];
    const ink = document.querySelector('.tabs__ink');
    const moveInk = tab => { ink.style.width = '1px'; ink.style.transform = `translateX(${tab.offsetLeft}px) scaleX(${tab.offsetWidth})`; };
    const select = (tab, focus) => {
      const current = tabs.find(t => t.getAttribute('aria-selected') === 'true');
      if (current === tab) return;
      const oldPanel = document.getElementById(current.getAttribute('aria-controls'));
      const newPanel = document.getElementById(tab.getAttribute('aria-controls'));
      current.setAttribute('aria-selected', 'false'); current.tabIndex = -1;
      tab.setAttribute('aria-selected', 'true'); tab.tabIndex = 0;
      if (focus) tab.focus();
      moveInk(tab);
      const g = window.gsap;
      if (!g || reduce) { oldPanel.hidden = true; newPanel.hidden = false; return; }
      g.to(oldPanel.querySelectorAll('.item'), {
        opacity: 0, y: -12, duration: .3, stagger: .03, ease: 'power2.in',
        onComplete: () => {
          oldPanel.hidden = true; g.set(oldPanel.querySelectorAll('.item'), { clearProps: 'all' });
          newPanel.hidden = false;
          g.fromTo(newPanel.querySelectorAll('.item'), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: .7, stagger: .07, ease: 'power3.out' });
        }
      });
    };
    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => select(tab));
      tab.addEventListener('keydown', e => {
        const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (dir) { e.preventDefault(); select(tabs[(i + dir + tabs.length) % tabs.length], true); }
      });
    });
    const init = () => moveInk(tabs.find(t => t.getAttribute('aria-selected') === 'true'));
    init();
    window.addEventListener('resize', init);
    document.fonts?.ready.then(init);
  }

  function initBooking() {
    const form = document.querySelector('[data-booking]');
    const date = form.querySelector('#b-date');
    const today = new Date();
    const iso = d => d.toISOString().slice(0, 10);
    date.min = iso(today);
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
    date.value = iso(tomorrow);
    form.addEventListener('submit', e => {
      e.preventDefault();
      const d = new FormData(form);
      form.querySelector('.booking__msg').textContent = `已為你保留 ${d.get('date')} ${d.get('time')}，${d.get('people')}。（此為 Demo 網站，不會真的送出）`;
    });
  }
})();
