// ID de Google Analytics 4 (formato G-XXXXXXXXXX). Mientras sea el de ejemplo, no se carga nada.
const GA_ID = 'G-XXXXXXXXXX';

// Trazo (stroke) de tinta que sigue al ratón/dedo
(() => {
  const c = document.getElementById('ink');
  if (!c) return;
  const x = c.getContext('2d');
  const fit = () => { c.width = innerWidth; c.height = innerHeight; };
  fit(); addEventListener('resize', fit);
  let pts = [];
  const add = (px, py) => pts.push({ x: px, y: py, t: performance.now() });
  addEventListener('mousemove', e => add(e.clientX, e.clientY));
  addEventListener('touchmove', e => add(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
  (function draw(now) {
    x.clearRect(0, 0, c.width, c.height);
    pts = pts.filter(p => now - p.t < 900);
    x.lineCap = x.lineJoin = 'round';
    for (let i = 1; i < pts.length; i++) {
      const a = 1 - (now - pts[i].t) / 900;
      x.strokeStyle = `rgba(198,255,61,${a})`;
      x.lineWidth = 2 + 8 * a;
      x.beginPath(); x.moveTo(pts[i - 1].x, pts[i - 1].y); x.lineTo(pts[i].x, pts[i].y); x.stroke();
    }
    requestAnimationFrame(draw);
  })(performance.now());
})();

const yearEl = document.getElementById('y');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Formulario por fetch (Formspree/Web3Forms)
const f = document.getElementById('lead'), s = document.getElementById('status');
if (f) {
  f.addEventListener('submit', async e => {
    e.preventDefault(); s.textContent = 'Enviando…';
    try {
      const r = await fetch(f.action, { method: 'POST', body: new FormData(f), headers: { Accept: 'application/json' } });
      if (!r.ok) throw new Error('form');
      f.reset(); s.textContent = '¡Recibido! Te respondemos hoy.';
      if (window.gtag) gtag('event', 'generate_lead');
    } catch { s.textContent = 'Algo falló. Escríbenos por WhatsApp.'; }
  });
}
document.querySelectorAll('[data-wa]').forEach(a =>
  a.addEventListener('click', () => window.gtag && gtag('event', 'whatsapp_click')));

// Consentimiento de cookies: Analytics solo se carga si la persona acepta.
(() => {
  const KEY = 'ds_consent';
  const read = () => { try { return localStorage.getItem(KEY); } catch { return null; } };
  const write = v => { try { localStorage.setItem(KEY, v); } catch { /* sin almacenamiento */ } };
  const clear = () => { try { localStorage.removeItem(KEY); } catch { /* sin almacenamiento */ } };
  const gaReady = /^G-[A-Z0-9]{6,}$/.test(GA_ID) && GA_ID !== 'G-XXXXXXXXXX';

  function loadGA() {
    if (!gaReady || window.gtag) return;
    const sc = document.createElement('script');
    sc.async = true; sc.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(sc);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { dataLayer.push(arguments); };
    gtag('js', new Date());
    gtag('config', GA_ID, { anonymize_ip: true });
  }

  function banner() {
    if (document.getElementById('cookie-banner')) return;
    const b = document.createElement('div');
    b.id = 'cookie-banner'; b.setAttribute('role', 'dialog'); b.setAttribute('aria-label', 'Cookies');
    const base = /\/(aviso-legal|politica-privacidad|politica-cookies|cuanto-cuesta-una-pagina-web)\//.test(location.pathname) ? '../' : '';
    b.innerHTML = '<p>Usamos cookies analíticas (Google Analytics) para medir visitas, solo si las aceptas. ' +
      '<a href="' + base + 'politica-cookies/">Más información</a>.</p>' +
      '<div><button type="button" class="btn btn-ghost btn-sm" data-c="no">Rechazar</button> ' +
      '<button type="button" class="btn btn-sm" data-c="yes">Aceptar</button></div>';
    b.addEventListener('click', e => {
      const v = e.target.dataset && e.target.dataset.c;
      if (!v) return;
      write(v); b.remove();
      if (v === 'yes') loadGA();
    });
    document.body.appendChild(b);
  }

  const saved = read();
  if (saved === 'yes') loadGA();
  else if (!saved) banner();

  const reset = document.getElementById('cookie-reset');
  if (reset) reset.addEventListener('click', () => { clear(); banner(); });
})();

// Capa visual: luz que sigue al cursor y aparición suave al hacer scroll.
(() => {
  const root = document.documentElement;
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Luz que sigue al ratón o al dedo (se desactiva con "reducir movimiento").
  if (!calm) {
    const g = document.createElement('div');
    g.id = 'glow'; g.setAttribute('aria-hidden', 'true');
    document.body.appendChild(g);
    let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0, off = 0;
    const loop = () => {
      cx += (tx - cx) * 0.18; cy += (ty - cy) * 0.18;
      g.style.transform = `translate(${cx}px,${cy}px)`;
      raf = (Math.abs(tx - cx) + Math.abs(ty - cy) > 0.5) ? requestAnimationFrame(loop) : 0;
    };
    const move = (x, y, snap) => {
      tx = x; ty = y;
      if (snap) { cx = x; cy = y; }
      g.classList.add('on');
      if (!raf) raf = requestAnimationFrame(loop);
    };
    addEventListener('mousemove', e => move(e.clientX, e.clientY, false), { passive: true });
    document.addEventListener('mouseleave', () => g.classList.remove('on'));
    // Táctil: la luz aparece bajo el dedo y se apaga suavemente al soltar.
    const touch = (e, snap) => {
      clearTimeout(off);
      const t = e.touches[0]; if (t) move(t.clientX, t.clientY, snap);
    };
    addEventListener('touchstart', e => touch(e, true), { passive: true });
    addEventListener('touchmove', e => touch(e, false), { passive: true });
    addEventListener('touchend', () => { off = setTimeout(() => g.classList.remove('on'), 700); }, { passive: true });
    addEventListener('touchcancel', () => g.classList.remove('on'), { passive: true });
  }

  // Aparición al hacer scroll (si falla algo, el contenido se ve igualmente).
  if (calm || !('IntersectionObserver' in window)) return;
  const targets = document.querySelectorAll(
    '.problem h2, .cols article, .process h2, .process li, .price .card, .faq h2, .faq details, .contact h2, .contact form, .article h2, .article .cta-box');
  if (!targets.length) return;
  root.classList.add('js');
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      en.target.classList.add('in'); io.unobserve(en.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  targets.forEach((el, i) => {
    el.classList.add('rv');
    el.style.transitionDelay = ((i % 4) * 90) + 'ms';
    io.observe(el);
  });
})();

// Hilo de trazo: cuelga de la lámpara y se va dibujando al hacer scroll hasta el formulario.
(() => {
  const lamp = document.querySelector('.lamp');
  const h1 = document.querySelector('.hero h1');
  if (!lamp || !h1) return; // solo en la portada
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.id = 'thread'; svg.setAttribute('aria-hidden', 'true');
  const mk = (tag, cls) => { const e = document.createElementNS(NS, tag); e.setAttribute('class', cls); svg.appendChild(e); return e; };
  const guide = mk('path', 't-guide'), outline = mk('path', 't-out'), line = mk('path', 't-line'),
        dome = mk('path', 't-dome'), tip = mk('circle', 't-tip');
  tip.setAttribute('r', 6);
  document.body.appendChild(svg);
  document.documentElement.classList.add('threaded');

  let cum = [], lens = [], total = 0, minDrawn = 0, raf = 0;
  const steps = [...document.querySelectorAll('.days li')].map(el => ({ el, y: 0 }));
  const docY = el => { let y = 0; for (let e = el; e; e = e.offsetParent) y += e.offsetTop; return y; };

  function update() {
    raf = 0;
    if (!total) return;
    let drawn = total;
    if (!calm) {
      const target = scrollY + innerHeight * 0.62;
      let lo = 0, hi = cum.length - 1;
      while (lo < hi) { const mid = (lo + hi) >> 1; if (cum[mid] > target) hi = mid; else lo = mid + 1; }
      drawn = Math.max(lens[lo], minDrawn);
      if (scrollY + innerHeight >= document.documentElement.scrollHeight - 6) drawn = total;
    }
    drawn = Math.min(drawn, total);
    const dash = drawn + ' ' + total;
    line.style.strokeDasharray = dash; outline.style.strokeDasharray = dash;
    const done = calm || drawn >= total;
    const p = done ? null : line.getPointAtLength(drawn);
    steps.forEach(st => st.el.classList.toggle('lit', done || p.y >= st.y));
    if (done) { tip.style.display = 'none'; return; }
    tip.style.display = ''; tip.setAttribute('cx', p.x); tip.setAttribute('cy', p.y);
  }

  function build() {
    svg.setAttribute('height', 0);
    const sx = scrollX, sy = scrollY;
    const W = document.documentElement.clientWidth, H = document.documentElement.scrollHeight;
    svg.setAttribute('width', W); svg.setAttribute('height', H); svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    const at = el => { const r = el.getBoundingClientRect(); return { l: r.left + sx, t: r.top + sy, b: r.bottom + sy, w: r.width, h: r.height }; };

    const L = at(lamp), lx = Math.round(L.l + L.w / 2), ly = Math.round(L.b);
    const dw = W <= 1100 ? 60 : 92, dh = dw / 2;
    const lane = Math.max(8, Math.round(at(h1).l - (W <= 560 ? 12 : 36)));
    document.documentElement.style.setProperty('--lane', Math.round(at(h1).l - lane) + 'px');
    steps.forEach(st => { st.y = docY(st.el) + parseFloat(getComputedStyle(st.el, '::before').top) + 8; });
    const heroB = Math.round(at(document.querySelector('.hero')).b);
    const btn = document.querySelector('#lead button');
    const B = btn ? at(btn) : null;
    const endY = B ? Math.round(B.t + B.h / 2) : H - 200;
    const endX = B ? Math.max(lane + 24, Math.round(B.l - 14)) : lane + 120;

    let d = 'M' + lx + ' 0 L' + lx + ' ' + ly, y;
    if (W <= 560) {
      y = Math.round(ly + dh + 26);
      d += ' L' + lx + ' ' + (y - 30) + ' C' + lx + ' ' + y + ' ' + (lane + 60) + ' ' + (y - 6) + ' ' + lane + ' ' + (y + 18);
      y += 18;
    } else {
      const yb = Math.max(heroB - 120, ly + dh + 60), ys = Math.max(heroB + 10, yb + 90);
      d += ' L' + lx + ' ' + yb
        + ' C' + lx + ' ' + (yb + 70) + ' ' + (lx - 40) + ' ' + (ys - 14) + ' ' + (lx - 200) + ' ' + ys
        + ' C' + (lx - 420) + ' ' + (ys + 14) + ' ' + (lane + 260) + ' ' + (ys - 14) + ' ' + (lane + 70) + ' ' + (ys + 8)
        + ' C' + (lane + 10) + ' ' + (ys + 12) + ' ' + lane + ' ' + (ys + 40) + ' ' + lane + ' ' + (ys + 90);
      y = ys + 90;
    }
    const yStop = Math.max(y + 200, endY - 200);
    let side = 1;
    while (y + 420 < yStop) {
      d += ' C' + (lane + 7 * side) + ' ' + (y + 130) + ' ' + (lane - 7 * side) + ' ' + (y + 290) + ' ' + lane + ' ' + (y + 420);
      y += 420; side = -side;
    }
    d += ' L' + lane + ' ' + yStop
      + ' C' + lane + ' ' + (yStop + 90) + ' ' + (endX - 140) + ' ' + (endY + 10) + ' ' + endX + ' ' + endY;

    [guide, outline, line].forEach(p => p.setAttribute('d', d));
    dome.setAttribute('d', 'M' + (lx - dw / 2) + ' ' + (ly + dh) + ' A' + (dw / 2) + ' ' + dh + ' 0 0 1 ' + (lx + dw / 2) + ' ' + (ly + dh) + ' Z');

    total = line.getTotalLength();
    minDrawn = ly + dh + 22;
    const N = 600; lens = []; cum = []; let m = 0;
    for (let i = 0; i <= N; i++) {
      const len = total * i / N, p = line.getPointAtLength(len);
      m = Math.max(m, p.y); lens.push(len); cum.push(m);
    }
    update();
  }

  addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
  let t; const rebuild = () => { clearTimeout(t); t = setTimeout(build, 120); };
  addEventListener('resize', rebuild);
  addEventListener('load', build);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(build);
  if ('ResizeObserver' in window) new ResizeObserver(rebuild).observe(document.body);
  build();
})();
