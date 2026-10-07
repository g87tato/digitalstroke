// Trazo de tinta que sigue al ratón/dedo
(() => {
  const c = document.getElementById('ink'), x = c.getContext('2d');
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

document.getElementById('y').textContent = new Date().getFullYear();

// Formulario por fetch (Formspree/Web3Forms)
const f = document.getElementById('lead'), s = document.getElementById('status');
f.addEventListener('submit', async e => {
  e.preventDefault(); s.textContent = 'Enviando…';
  try {
    const r = await fetch(f.action, { method: 'POST', body: new FormData(f), headers: { Accept: 'application/json' } });
    if (!r.ok) throw new Error('form');
    f.reset(); s.textContent = '¡Recibido! Te respondemos hoy.';
    if (window.gtag) gtag('event', 'generate_lead');
  } catch { s.textContent = 'Algo falló. Escríbenos por WhatsApp.'; }
});
document.querySelector('[data-wa]').addEventListener('click', () => window.gtag && gtag('event', 'whatsapp_click'));
