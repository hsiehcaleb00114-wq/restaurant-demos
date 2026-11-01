/* 早安好日早餐店 — 互動與動態
   特效／功能：太陽光芒旋轉、荷包蛋搖擺、跑馬燈、分類籤條 scrollspy、
              線上點餐（＋／－、飛入購物袋動畫、數字彈跳、點餐單對話框）、數字滾動、進場彈跳 */
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  const gsap = window.gsap;

  /* ---------- 點餐狀態 ---------- */
  const cart = new Map(); // id -> { name, price, qty }
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const bar = $('[data-cartbar]');
  const badge = $('[data-count-badge]');
  const live = $('[data-live]');
  const dialog = $('#cart');

  try {
    const saved = JSON.parse(sessionStorage.getItem('gm-cart') || '[]');
    saved.forEach(([id, v]) => cart.set(id, v));
  } catch (e) { /* 無法讀取時從空的開始 */ }

  const save = () => { try { sessionStorage.setItem('gm-cart', JSON.stringify([...cart])); } catch (e) { /* 忽略 */ } };
  const total = () => [...cart.values()].reduce((s, v) => s + v.price * v.qty, 0);
  const count = () => [...cart.values()].reduce((s, v) => s + v.qty, 0);

  function render(bump) {
    const t = total(), c = count();
    $$('[data-total]').forEach(el => { el.textContent = t; });
    badge.textContent = c;
    bar.hidden = c === 0;
    $$('.item').forEach(li => {
      const q = cart.get(li.dataset.id)?.qty || 0;
      li.querySelector('.qty__n').textContent = q;
      li.querySelector('.qty__minus').disabled = q === 0;
      li.classList.toggle('is-picked', q > 0);
    });
    if (bump && gsap && !reduce) gsap.fromTo('.cartbar__count', { scale: 1.6 }, { scale: 1, duration: .5, ease: 'elastic.out(1, .4)' });
    save();
  }

  function add(id, name, price, from) {
    const cur = cart.get(id) || { name, price, qty: 0 };
    cur.qty += 1; cart.set(id, cur);
    live.textContent = `已加入 ${name}，共 ${count()} 份，合計 ${total()} 元`;
    const wasHidden = bar.hidden;
    render(!wasHidden);
    if (wasHidden && gsap && !reduce) gsap.from('.cartbar', { yPercent: 160, duration: .6, ease: 'back.out(1.6)' });
    if (from && gsap && !reduce) flyFrom(from);
  }
  function remove(id) {
    const cur = cart.get(id); if (!cur) return;
    cur.qty -= 1;
    if (cur.qty <= 0) cart.delete(id);
    live.textContent = `已減少 ${cur.name}，合計 ${total()} 元`;
    render(true);
  }

  /* 小圓點從按鈕飛到點餐列 */
  function flyFrom(el) {
    const a = el.getBoundingClientRect();
    const b = $('.cartbar__count').getBoundingClientRect();
    const dot = document.createElement('span');
    dot.className = 'fly';
    document.body.appendChild(dot);
    const sx = a.left + a.width / 2 - 11, sy = a.top + a.height / 2 - 11;
    const ex = b.left + b.width / 2 - 11, ey = b.top + b.height / 2 - 11;
    gsap.set(dot, { x: sx, y: sy });
    gsap.timeline({ onComplete: () => dot.remove() })
      .to(dot, { x: ex, duration: .7, ease: 'power1.inOut' }, 0)
      .to(dot, { y: Math.min(sy, ey) - 120, duration: .32, ease: 'power2.out' }, 0)
      .to(dot, { y: ey, duration: .38, ease: 'power2.in' }, .32)
      .to(dot, { scale: .3, duration: .2 }, .5);
  }

  $$('.add').forEach(btn => btn.addEventListener('click', () => add(btn.dataset.id, btn.dataset.name, +btn.dataset.price, btn)));
  $$('.qty__minus').forEach(btn => btn.addEventListener('click', () => remove(btn.closest('.item').dataset.id)));

  /* 點餐單 */
  const list = $('[data-cart-list]');
  const pickup = $('[data-pickup]');
  const msg = $('[data-msg]');
  function fillPickup() {
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Taipei' }));
    const opts = [];
    const d = new Date(now); d.setSeconds(0, 0);
    d.setMinutes(Math.ceil((d.getMinutes() + 10) / 10) * 10);
    const open = 5 * 60 + 30, close = 12 * 60 + 50;
    let m = d.getHours() * 60 + d.getMinutes();
    let label = '今天';
    if (m > close) { m = open + 10; label = '明天'; }
    if (m < open + 10) m = open + 10;
    for (let i = 0; i < 12 && m <= close; i++, m += 10) {
      const hh = String(Math.floor(m / 60)).padStart(2, '0'), mm = String(m % 60).padStart(2, '0');
      opts.push(`<option>${label} ${hh}:${mm}</option>`);
    }
    pickup.innerHTML = opts.join('');
  }
  $('.cartbar__btn').addEventListener('click', () => {
    list.innerHTML = [...cart.values()].map(v => `<li><span>${v.name} × ${v.qty}</span><b>$${v.price * v.qty}</b></li>`).join('');
    fillPickup();
    msg.textContent = '';
    if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open', '');
  });
  $('[data-submit]').addEventListener('click', () => {
    const phone = $('[data-phone]');
    if (!/^\d{3}$/.test(phone.value)) { msg.textContent = '請輸入手機末三碼，方便取餐時核對喔！'; phone.focus(); return; }
    const no = String(Math.floor(Math.random() * 900) + 100);
    msg.textContent = `訂單 #${no} 已送出！${pickup.value} 到櫃台報「${phone.value}」取餐。（這是設計作品，不會真的送出）`;
    cart.clear(); render(false);
  });
  render(false);

  /* ---------- 分類籤條 scrollspy ---------- */
  const chips = $$('.chip');
  const strip = $('.chips__inner');
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      chips.forEach(c => {
        const on = c.getAttribute('href') === '#' + e.target.id;
        c.classList.toggle('is-active', on);
        // 只捲動籤條本身，避免 scrollIntoView 連帶捲動整個頁面
        if (on) strip.scrollTo({ left: c.offsetLeft - strip.clientWidth / 2 + c.offsetWidth / 2, behavior: reduce ? 'auto' : 'smooth' });
      });
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  $$('.cat').forEach(c => io.observe(c));

  if (!hasGsap || reduce) return;
  const { ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);

  /* ---------- 進場與捲動動畫 ---------- */
  gsap.timeline({ defaults: { ease: 'back.out(1.7)' } })
    .from('.hero__hello', { y: -20, opacity: 0, duration: .5 })
    .from('.hero__title', { y: 40, opacity: 0, duration: .7 }, .1)
    .from('.hero__lead, .hero__cta', { y: 20, opacity: 0, duration: .6, stagger: .1 }, .3)
    .from('.hero__img', { scale: .7, rotate: 12, opacity: 0, duration: .9 }, .2)
    .from('.egg', { x: -80, rotate: -120, opacity: 0, duration: 1, ease: 'elastic.out(1, .5)' }, .6)
    .from('.price-tag', { scale: 0, duration: .6, stagger: .15, ease: 'elastic.out(1, .45)' }, .8);

  gsap.from('.how__steps li', { y: 60, opacity: 0, duration: .7, stagger: .12, ease: 'back.out(1.7)', scrollTrigger: { trigger: '.how', start: 'top 75%', once: true } });
  gsap.from('.ticket', { y: 60, rotate: (i) => [-6, 0, 6][i], opacity: 0, duration: .8, stagger: .12, ease: 'back.out(1.6)', scrollTrigger: { trigger: '.combo', start: 'top 75%', once: true } });
  gsap.utils.toArray('.cat').forEach(cat => {
    gsap.from(cat.querySelectorAll('.item'), { y: 30, opacity: 0, duration: .5, stagger: .04, ease: 'power3.out', scrollTrigger: { trigger: cat, start: 'top 80%', once: true } });
    gsap.from(cat.querySelector('.cat__head img'), { rotate: -180, scale: .4, duration: .9, ease: 'back.out(1.6)', scrollTrigger: { trigger: cat, start: 'top 85%', once: true } });
  });
  $$('[data-count]').forEach(el => {
    const end = +el.dataset.count, o = { v: 0 };
    el.textContent = '0';
    gsap.to(o, { v: end, duration: 1.6, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true }, onUpdate: () => { el.textContent = Math.round(o.v); } });
  });
  gsap.from('.story__img, .visit__card', { y: 50, opacity: 0, duration: .9, ease: 'back.out(1.5)', stagger: .1, scrollTrigger: { trigger: '.story', start: 'top 75%', once: true } });

  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
