/* 作品集總覽：風格篩選、卡片進場 */
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cards = [...document.querySelectorAll('.card')];
  const btns = [...document.querySelectorAll('.filter')];
  const total = document.querySelector('[data-total]');

  btns.forEach(btn => btn.addEventListener('click', () => {
    const f = btn.dataset.filter;
    btns.forEach(b => { b.classList.toggle('is-on', b === btn); b.setAttribute('aria-pressed', b === btn); });
    let n = 0;
    cards.forEach(c => {
      const show = f === 'all' || c.dataset.cat.split(' ').includes(f);
      c.hidden = !show;
      if (show) { n++; if (!reduce) { c.classList.remove('is-in'); void c.offsetWidth; c.classList.add('is-in'); } }
    });
    total.textContent = n;
  }));

  // 捲動到才淡入
  if (!reduce && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    }), { rootMargin: '0px 0px -10% 0px' });
    cards.forEach(c => { if (c.getBoundingClientRect().top > innerHeight) { c.style.opacity = 0; io.observe(c); } });
    document.addEventListener('animationstart', e => { if (e.target.classList?.contains('card')) e.target.style.opacity = ''; });
  }
})();
