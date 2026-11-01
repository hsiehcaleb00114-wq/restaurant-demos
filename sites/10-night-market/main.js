/* 夜貓子小吃攤 — 互動與動態
   特效：霓虹字閃爍點亮、游標霓虹尾跡、收攤倒數時鐘、攤位圖片 RGB 錯位、
         「今晚吃什麼」轉盤、數字滾動、拼貼視差、地圖路線流動與定位脈衝 */
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  const gsap = window.gsap;

  initClock();
  initWheel();
  if (!hasGsap || reduce) return;

  const { ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);

  /* 1. 霓虹燈管點亮：不規則閃爍後穩定 */
  const flick = el => gsap.timeline()
    .set(el, { opacity: .08 })
    .to(el, { opacity: 1, duration: .05 }).to(el, { opacity: .15, duration: .06 })
    .to(el, { opacity: 1, duration: .04 }).to(el, { opacity: .3, duration: .12 })
    .to(el, { opacity: 1, duration: .05 }).to(el, { opacity: .6, duration: .05 })
    .to(el, { opacity: 1, duration: .3, ease: 'power2.out' });
  const intro = gsap.timeline({ delay: .2 });
  intro.from('.hero__bg img', { scale: 1.12, duration: 2.4, ease: 'power3.out' }, 0);
  document.querySelectorAll('[data-flicker]').forEach((el, i) => intro.add(flick(el), .3 + i * .45));
  intro.from('.hero__script', { opacity: 0, x: -30, duration: .8, ease: 'power3.out' }, .2)
    .from('.hero__lead, .hero__cta, .hero__tags li', { y: 24, opacity: 0, duration: .8, stagger: .08, ease: 'power3.out' }, 1.1);
  // 偶爾接觸不良地閃一下
  const pink = document.querySelector('.neon-title .neon--cyan');
  gsap.timeline({ repeat: -1, repeatDelay: 4.5, delay: 4 }).to(pink, { opacity: .25, duration: .05 }).to(pink, { opacity: 1, duration: .05 }).to(pink, { opacity: .5, duration: .04 }).to(pink, { opacity: 1, duration: .1 });

  gsap.to('.hero__bg', { yPercent: 14, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  /* 2. 游標霓虹尾跡 */
  if (fine) {
    const box = document.querySelector('.trail');
    const dots = Array.from({ length: 10 }, () => { const s = document.createElement('span'); box.appendChild(s); return s; });
    const pos = { x: innerWidth / 2, y: innerHeight / 2 };
    const pts = dots.map(() => ({ x: pos.x, y: pos.y }));
    gsap.set(dots, { opacity: 0 });
    window.addEventListener('pointermove', e => { pos.x = e.clientX; pos.y = e.clientY; gsap.to(dots, { opacity: 1, duration: .3, overwrite: 'auto' }); });
    document.addEventListener('pointerleave', () => gsap.to(dots, { opacity: 0, duration: .3 }));
    gsap.ticker.add(() => {
      let x = pos.x, y = pos.y;
      pts.forEach((p, i) => {
        p.x += (x - p.x) * .38; p.y += (y - p.y) * .38;
        gsap.set(dots[i], { x: p.x, y: p.y, scale: 1 - i / dots.length });
        x = p.x; y = p.y;
      });
    });
  }

  /* 3. 數字滾動 */
  document.querySelectorAll('[data-count]').forEach(el => {
    const end = +el.dataset.count, o = { v: 0 };
    el.textContent = '0';
    gsap.to(o, { v: end, duration: 1.8, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true }, onUpdate: () => { el.textContent = Math.round(o.v); } });
  });
  gsap.from('.stat', { y: 50, opacity: 0, duration: .9, stagger: .12, ease: 'power3.out', scrollTrigger: { trigger: '.stats', start: 'top 85%', once: true } });

  /* 4. 攤位：圖片閃爍亮起、文字浮現 */
  gsap.utils.toArray('.stall').forEach(st => {
    const img = st.querySelector('.stall__img');
    const tl = gsap.timeline({ scrollTrigger: { trigger: st, start: 'top 78%', once: true } });
    tl.from(img, { y: 60, opacity: 0, duration: .9, ease: 'power3.out' })
      .add(flick(img), .2)
      .from(st.querySelectorAll('.stall__no, h3, .items li'), { x: 30, opacity: 0, duration: .6, stagger: .06, ease: 'power3.out' }, .3);
  });
  gsap.utils.toArray('.sec-head, .spin__text, .map__text, .scene__quote').forEach(el => {
    gsap.from(el, { y: 40, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
  });

  /* 5. 拼貼視差 */
  [['.scene__a', -6], ['.scene__b', 12], ['.scene__c', -14]].forEach(([s, v]) => {
    gsap.to(s, { yPercent: v, ease: 'none', scrollTrigger: { trigger: '.scene', start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  /* 6. 地圖：路線流動、定位點脈衝 */
  gsap.to('.map__route', { strokeDashoffset: -32, duration: 1, ease: 'none', repeat: -1 });
  gsap.to('.map__pin circle:first-child', { scale: 1.6, opacity: .2, transformOrigin: '50% 50%', duration: 1.2, ease: 'power1.out', repeat: -1 });
  gsap.from('.wheel-wrap', { rotate: -90, scale: .7, opacity: 0, duration: 1.2, ease: 'back.out(1.4)', scrollTrigger: { trigger: '.spin', start: 'top 70%', once: true } });

  window.addEventListener('load', () => ScrollTrigger.refresh());

  /* ---------- 收攤倒數（台灣時間 18:00–01:00） ---------- */
  function initClock() {
    const el = document.querySelector('[data-clock]');
    const label = el.querySelector('.clock__label'), time = el.querySelector('.clock__time');
    const pad = n => String(n).padStart(2, '0');
    const tick = () => {
      const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Taipei' }));
      const s = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
      const wed = now.getDay() === 3;
      let diff, open;
      if (s >= 18 * 3600) { open = !wed; diff = 25 * 3600 - s; }
      else if (s < 3600) { open = now.getDay() !== 4; diff = 3600 - s; }
      else { open = false; diff = 18 * 3600 - s; }
      label.textContent = open ? '距離收攤' : (wed && s >= 3600 ? '今天公休・明天開攤' : '距離亮燈');
      time.textContent = `${pad(Math.floor(diff / 3600))}:${pad(Math.floor(diff % 3600 / 60))}:${pad(diff % 60)}`;
    };
    tick(); setInterval(tick, 1000);
  }

  /* ---------- 今晚吃什麼轉盤 ---------- */
  function initWheel() {
    const items = ['雞排', '臭豆腐', '大腸包小腸', '珍奶', '鹽酥雞', '蚵仔煎', '烤玉米', '地瓜球'];
    const colors = ['#FF3EA5', '#2DF5FF', '#B6FF3B', '#FFB938'];
    const svg = document.querySelector('[data-wheel]');
    const n = items.length, step = 360 / n, r = 100;
    const pt = a => [Math.sin(a * Math.PI / 180) * r, -Math.cos(a * Math.PI / 180) * r];
    svg.innerHTML = items.map((t, i) => {
      const [x1, y1] = pt(i * step - step / 2), [x2, y2] = pt(i * step + step / 2);
      return `<g><path d="M0 0L${x1.toFixed(2)} ${y1.toFixed(2)}A${r} ${r} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}Z" fill="${colors[i % 4]}" stroke="#0B0714" stroke-width="2"/>` +
        `<text transform="rotate(${i * step}) translate(0 -64)" text-anchor="middle" dominant-baseline="middle">${t}</text></g>`;
    }).join('') + `<circle r="${r}" fill="none" stroke="#F3EEFF" stroke-width="3"/>`;
    const btn = document.querySelector('[data-spin]');
    const out = document.querySelector('[data-result]');
    let rot = 0;
    btn.addEventListener('click', () => {
      const pick = Math.floor(Math.random() * n);
      const jitter = (Math.random() - .5) * step * .6; // 停在扇形內的隨機位置
      const target = 360 * 6 + (360 - pick * step) - (rot % 360) + jitter;
      btn.disabled = true;
      out.textContent = '轉轉轉……';
      const done = () => { btn.disabled = false; out.textContent = `今晚就吃「${items[pick]}」！出示畫面折 5 元`; };
      if (gsap && !reduce) {
        rot += target;
        gsap.to(svg, { rotation: rot, duration: 4, ease: 'power4.out', transformOrigin: '50% 50%', onComplete: done });
      } else {
        rot = 360 - pick * step;
        svg.style.transform = `rotate(${rot}deg)`;
        done();
      }
    });
  }
})();
