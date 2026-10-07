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

  // Luz de cursor: solo con ratón (no táctil) y sin "menos movimiento".
  if (!calm && matchMedia('(pointer: fine)').matches) {
    const g = document.createElement('div');
    g.id = 'glow'; g.setAttribute('aria-hidden', 'true');
    document.body.appendChild(g);
    let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
    const loop = () => {
      cx += (tx - cx) * 0.12; cy += (ty - cy) * 0.12;
      g.style.transform = `translate(${cx}px,${cy}px)`;
      raf = (Math.abs(tx - cx) + Math.abs(ty - cy) > 0.5) ? requestAnimationFrame(loop) : 0;
    };
    addEventListener('mousemove', e => {
      tx = e.clientX; ty = e.clientY; g.classList.add('on');
      if (!raf) raf = requestAnimationFrame(loop);
    }, { passive: true });
    document.addEventListener('mouseleave', () => g.classList.remove('on'));
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
