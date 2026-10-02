const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const WA = '77784181018';
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const num = n => n.toLocaleString('ru-RU').replace(/\s/g, ' ');
const tenge = n => num(n) + ' ₸';
const openWA = text => window.open('https://wa.me/' + WA + '?text=' + encodeURIComponent(text), '_blank', 'noopener');

/* ---------- header, mobile bar, menu ---------- */
const header = $('#header'), bar = $('.mobile-bar'), menu = $('#menu');
const onScroll = () => {
  header.classList.toggle('scrolled', scrollY > 10);
  bar.classList.toggle('show', scrollY > 560);
};
addEventListener('scroll', onScroll, { passive: true });
onScroll();
$$('a', menu).forEach(a => a.addEventListener('click', () => { if (menu.matches(':popover-open')) menu.hidePopover(); }));

/* ---------- open now (Astana, UTC+5) ---------- */
const hour = (new Date().getUTCHours() + 5) % 24;
if (hour >= 9) $('#status-text').textContent = 'Открыто сейчас · до 24:00 · Култегин, 14';
else { $('#status').classList.add('closed'); $('#status-text').textContent = 'Сейчас закрыто · откроемся в 9:00'; }

/* ---------- marquees: duplicate content for a seamless loop ---------- */
$$('.ticker-track, .rv-track').forEach(t => t.append(...[...t.children].map(n => {
  const c = n.cloneNode(true); c.setAttribute('aria-hidden', 'true'); return c;
})));

/* ---------- catalog cards get staggered reveal ---------- */
const grid = $('#grid'), cards = [...grid.children];
cards.forEach((c, i) => {
  c.classList.add('reveal');
  c.style.setProperty('--d', (i % 4) * 0.08 + 's');
  c.style.viewTransitionName = 'c-' + c.dataset.id;
});
$$('.why-grid .feat').forEach((el, i) => el.style.setProperty('--d', (i % 3) * 0.1 + 's'));
$$('.sale-grid .offer, .cats-row .cat').forEach((el, i) => el.style.setProperty('--d', (i % 5) * 0.08 + 's'));

/* ---------- reveal + count-up ---------- */
const countUp = el => {
  const to = parseFloat(el.dataset.count), dec = +el.dataset.dec || 0, t0 = performance.now();
  const step = t => {
    const k = Math.min((t - t0) / 1400, 1);
    el.textContent = (to * (1 - Math.pow(1 - k, 3))).toFixed(dec);
    if (k < 1) requestAnimationFrame(step);
  };
  if (!reduce) requestAnimationFrame(step);
};
const io = new IntersectionObserver(entries => entries.forEach(e => {
  if (!e.isIntersecting) return;
  e.target.classList.add('in');
  if (e.target.dataset.count) countUp(e.target);
  io.unobserve(e.target);
}), { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
$$('.reveal, [data-count]').forEach(el => io.observe(el));

/* ---------- falling petals in the hero ---------- */
const cv = $('.petals');
if (cv && !reduce) {
  const ctx = cv.getContext('2d'), colors = ['#F2C4C9', '#E8A3AE', '#F7DCD6', '#D97A8C', '#FBE9E4'];
  let W = 0, H = 0, raf = 0;
  const size = () => {
    const d = Math.min(devicePixelRatio || 1, 2);
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = W * d; cv.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0);
  };
  const petal = y => ({ x: Math.random() * W, y: y ?? -20, s: 5 + Math.random() * 9, vy: 0.35 + Math.random() * 0.6, vx: -0.2 + Math.random() * 0.4, a: Math.random() * 6.3, va: -0.02 + Math.random() * 0.04, w: Math.random() * 6.3, c: colors[Math.random() * colors.length | 0], o: 0.45 + Math.random() * 0.4 });
  size();
  const ps = Array.from({ length: W < 700 ? 12 : 24 }, () => petal(Math.random() * H));
  const draw = () => {
    ctx.clearRect(0, 0, W, H);
    for (const p of ps) {
      p.w += 0.02; p.x += p.vx + Math.sin(p.w) * 0.5; p.y += p.vy; p.a += p.va;
      if (p.y > H + 20) Object.assign(p, petal());
      ctx.save();
      ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.scale(1, 0.6 + 0.4 * Math.sin(p.w * 1.3));
      ctx.globalAlpha = p.o; ctx.fillStyle = p.c;
      ctx.beginPath(); ctx.moveTo(0, -p.s);
      ctx.bezierCurveTo(p.s * 0.9, -p.s * 0.6, p.s * 0.7, p.s * 0.7, 0, p.s);
      ctx.bezierCurveTo(-p.s * 0.7, p.s * 0.7, -p.s * 0.9, -p.s * 0.6, 0, -p.s);
      ctx.fill(); ctx.restore();
    }
    raf = requestAnimationFrame(draw);
  };
  new IntersectionObserver(([e]) => { cancelAnimationFrame(raf); if (e.isIntersecting) draw(); }).observe(cv);
  addEventListener('resize', size);
}

/* ---------- catalog filters (animated with View Transitions where supported) ---------- */
const filter = { cat: 'all', tier: 'all' };
const applyFilter = () => {
  let n = 0;
  for (const c of cards) {
    const ok = (filter.cat === 'all' || c.dataset.cat === filter.cat) && (filter.tier === 'all' || c.dataset.tier === filter.tier);
    c.hidden = !ok; n += ok;
  }
  $('#found').textContent = `Показано ${n} из ${cards.length}`;
  $('#empty').hidden = n > 0;
  // fewer cards shrink the page: keep the first results right under the sticky filters
  const gap = $('#found').getBoundingClientRect().top - $('.filters').getBoundingClientRect().bottom;
  if (gap < 0) scrollBy(0, gap - 4);
};
const setFilter = patch => {
  Object.assign(filter, patch);
  $$('[data-filter]').forEach(g => $$('button', g).forEach(b => b.setAttribute('aria-pressed', b.dataset.v === filter[g.dataset.filter])));
  if (document.startViewTransition && !reduce) document.startViewTransition(applyFilter); else applyFilter();
};
$$('[data-filter]').forEach(g => g.addEventListener('click', e => {
  const b = e.target.closest('button'); if (b) setFilter({ [g.dataset.filter]: b.dataset.v });
}));
$$('[data-go]').forEach(b => b.addEventListener('click', () => {
  setFilter({ cat: b.dataset.go, tier: 'all' });
  $('#catalog').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
}));

/* ---------- cart ---------- */
const P = Object.fromEntries(cards.map(c => [c.dataset.id, {
  name: $('h3', c).textContent,
  price: +c.dataset.price,
  approx: !!c.dataset.from || !+c.dataset.price,
  label: +c.dataset.price ? $('.price', c).textContent : 'цена по запросу',
  img: $('img', c),
}]));
let cart = {};
try { cart = JSON.parse(localStorage.getItem('amie-cart')) || {}; } catch { cart = {}; }
for (const id in cart) if (!P[id] || !(cart[id] > 0)) delete cart[id];
const save = () => { try { localStorage.setItem('amie-cart', JSON.stringify(cart)); } catch { /* private mode */ } };

const dlg = $('#cart'), list = $('#cart-list'), form = $('#cart-form');
const totalText = () => {
  const ids = Object.keys(cart);
  const sum = ids.reduce((s, id) => s + P[id].price * cart[id], 0);
  if (!sum) return 'по запросу';
  return (ids.some(id => P[id].approx) ? 'от ' : '') + tenge(sum);
};
const render = () => {
  const ids = Object.keys(cart), count = ids.reduce((s, id) => s + cart[id], 0);
  $$('[data-cart-count]').forEach(b => { b.textContent = count; b.hidden = !count; });
  list.innerHTML = ids.map(id => `<li data-id="${id}"><img src="${P[id].img.currentSrc || P[id].img.src}" alt="" width="60" height="72"><div><div class="ci-name">${P[id].name}</div><div class="ci-price">${P[id].label}</div></div><div class="qty"><button type="button" data-q="-1" aria-label="Убрать одну"><svg class="i"><use href="#i-minus"/></svg></button><span>${cart[id]}</span><button type="button" data-q="1" aria-label="Добавить ещё"><svg class="i"><use href="#i-plus"/></svg></button></div></li>`).join('');
  $('#cart-empty').hidden = !!count;
  form.hidden = $('#cart-foot').hidden = !count;
  $('#cart-total').textContent = totalText();
};

const toast = $('#toast');
let toastT;
const say = msg => { toast.textContent = msg; toast.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => toast.classList.remove('show'), 2200); };

const fly = img => {
  const target = $('.cart-btn');
  if (reduce || !img || !target) return;
  const a = img.getBoundingClientRect(), b = target.getBoundingClientRect();
  if (!a.width) return;
  const c = img.cloneNode();
  c.removeAttribute('loading'); c.className = 'fly'; c.alt = '';
  Object.assign(c.style, { left: a.left + 'px', top: a.top + 'px', width: a.width + 'px', height: a.height + 'px' });
  document.body.append(c);
  const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
  c.animate([
    { transform: 'none', opacity: 1 },
    { transform: `translate(${dx * 0.45}px, ${dy * 0.45 - 90}px) scale(.45) rotate(-8deg)`, opacity: 0.95, offset: 0.5 },
    { transform: `translate(${dx}px, ${dy}px) scale(.06)`, opacity: 0.3 },
  ], { duration: 850, easing: 'cubic-bezier(.45,0,.55,1)' }).onfinish = () => {
    c.remove();
    $$('[data-cart-count]').forEach(el => { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); });
  };
};

const add = (id, btn) => {
  cart[id] = (cart[id] || 0) + 1;
  save(); render(); fly(P[id].img);
  say(`«${P[id].name}» — в корзине`);
  if (btn && btn.classList.contains('add')) {
    btn.classList.add('done'); $('use', btn).setAttribute('href', '#i-check');
    setTimeout(() => { btn.classList.remove('done'); $('use', btn).setAttribute('href', '#i-plus'); }, 1400);
  }
};
grid.addEventListener('click', e => {
  const b = e.target.closest('.add'); if (b) add(b.closest('.card').dataset.id, b);
});
$$('[data-add]').forEach(b => b.addEventListener('click', () => add(b.dataset.add, b)));
list.addEventListener('click', e => {
  const b = e.target.closest('[data-q]'); if (!b) return;
  const id = b.closest('li').dataset.id;
  cart[id] += +b.dataset.q;
  if (cart[id] <= 0) delete cart[id];
  save(); render();
});

$$('[data-cart-open]').forEach(b => b.addEventListener('click', () => dlg.showModal()));
$$('[data-cart-close]').forEach(b => b.addEventListener('click', () => dlg.close()));
dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });

const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
form.elements.date.min = today;
form.addEventListener('change', () => { $('#addr-field').hidden = form.elements.how.value !== 'доставка'; });
form.addEventListener('submit', e => {
  e.preventDefault();
  const f = Object.fromEntries(new FormData(form)), ids = Object.keys(cart);
  if (!ids.length) return;
  const lines = ['Здравствуйте! Хочу оформить заказ с сайта Amie Flowers:', ...ids.map(id => `• ${P[id].name} × ${cart[id]} — ${P[id].label}`), `Ориентировочно: ${totalText()}`];
  lines.push('Получение: ' + (f.how === 'самовывоз' ? 'самовывоз (Култегин, 14)' : 'доставка'));
  if (f.how === 'доставка' && f.addr.trim()) lines.push('Адрес: ' + f.addr.trim());
  const when = [f.date && f.date.split('-').reverse().join('.'), f.time].filter(Boolean).join(', ');
  if (when) lines.push('Когда: ' + when);
  if (f.note.trim()) lines.push('Открытка: «' + f.note.trim() + '»');
  openWA(lines.join('\n'));
});
render();

/* ---------- budget builder: the bouquet grows with the budget ---------- */
const range = $('#budget-range'), bForm = $('#budget-form');
const MIN = +range.min, MAX = +range.max;
const MOODS = {
  'нежный': [['#F6C9CF', '#EFA9B5', '#C9677E'], ['#FBE3DF', '#F4C7C0', '#D98C8C'], ['#FFFFFF', '#F5E6E8', '#D6A3AE']],
  'яркий': [['#F48B6B', '#E8634A', '#B23A2B'], ['#F7C548', '#F0A92E', '#B8781A'], ['#E8607A', '#D23C5D', '#8E1E3A'], ['#C58BE0', '#A764C9', '#6E3590']],
  'белый': [['#FFFFFF', '#F3EEE7', '#CFC4B6'], ['#FAF6EE', '#EDE4D6', '#C2B39E']],
  'красный': [['#C8213B', '#A3122B', '#5E0A18'], ['#B3122E', '#8C0B22', '#4A0913']],
  'на вкус флориста': [['#F6C9CF', '#EFA9B5', '#C9677E'], ['#FFFFFF', '#F3EEE7', '#CFC4B6'], ['#C8213B', '#A3122B', '#5E0A18'], ['#F4D3B0', '#E9B98A', '#B07A47']],
};
const ring = (n, rx, ry, off) => Array.from({ length: n }, (_, i) => { const a = i / n * Math.PI * 2 - Math.PI / 2 + off; return [160 + Math.cos(a) * rx, 158 + Math.sin(a) * ry]; });
const outer = ring(10, 104, 64, 0.3);
const spots = [[160, 158], ...ring(6, 54, 38, 0), ...[0, 5, 2, 7, 4, 9, 1, 6, 3, 8].map(i => outer[i])];
const blooms = spots.map(([x, y], i) => {
  const s = i === 0 ? 1.3 : i < 7 ? 1.15 : 1.05, g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  let petals = '';
  for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; petals += `<circle cx="${(Math.cos(a) * 13 * s).toFixed(1)}" cy="${(Math.sin(a) * 13 * s).toFixed(1)}" r="${(12 * s).toFixed(1)}"/>`; }
  g.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
  g.innerHTML = `<g class="bloom" style="transition-delay:${i * 25}ms">${petals}<circle r="${(14 * s).toFixed(1)}"/><path d="M${-6 * s} ${-1 * s}a${6 * s} ${6 * s} 0 1 1 ${7 * s} ${7 * s}a${4 * s} ${4 * s} 0 1 1 ${-4 * s} ${-5 * s}"/></g>`;
  $('#bq-blooms').append(g);
  return g.firstChild;
});
const leaves = Array.from({ length: 8 }, (_, j) => {
  const a = j / 8 * Math.PI * 2 - Math.PI / 2 + 0.2, g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.setAttribute('transform', `translate(${(160 + Math.cos(a) * 124).toFixed(1)} ${(158 + Math.sin(a) * 80).toFixed(1)}) rotate(${(a * 180 / Math.PI + 90).toFixed(0)})`);
  g.innerHTML = `<ellipse class="leaf" rx="9" ry="24"/>`;
  $('#bq-leaves').append(g);
  return g.firstChild;
});
const paint = () => {
  const pal = MOODS[bForm.elements.mood.value];
  blooms.forEach((b, i) => {
    const [c1, c2, c3] = pal[i % pal.length], cs = $$('circle', b);
    cs.forEach((c, k) => { c.style.fill = k < 6 ? c1 : c2; });
    $('path', b).style.stroke = c3;
  });
};
const grow = () => {
  const v = +range.value, n = 5 + Math.round((v - MIN) / (MAX - MIN) * 12);
  $('#bv').textContent = num(v) + (v >= MAX ? '+' : '');
  range.style.setProperty('--p', (v - MIN) / (MAX - MIN) * 100 + '%');
  blooms.forEach((b, i) => b.classList.toggle('on', i < n));
  leaves.forEach((l, j) => l.classList.toggle('on', n > 4 + j * 1.4));
};
range.addEventListener('input', grow);
bForm.addEventListener('change', paint);
bForm.addEventListener('submit', e => {
  e.preventDefault();
  const v = +range.value, f = bForm.elements;
  openWA(`Здравствуйте! Хочу букет примерно на ${tenge(v)}${v >= MAX ? ' и больше' : ''}. Настроение: ${f.mood.value}. Повод: ${f.why.value}. Пишу с сайта Amie Flowers.`);
});
paint();
new IntersectionObserver(([e], o) => { if (e.isIntersecting) { grow(); o.disconnect(); } }, { threshold: 0.3 }).observe($('#bq'));
