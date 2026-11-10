// Team XP bar on the Collect XP screen: purple liquid that flows up to the level in the
// canvas's data-fill attribute (0-100). Each player's collected XP adds its share of the
// team total, so the bar is full once everyone has collected.
// The canvas comes from the game bundle (scripts/game-patches/08-xp-bar).
(() => {
  const FLOW_PER_S = 0.55;   // how fast the level catches up (fraction of the bar per second)
  let raf = 0, p = 0, clock = performance.now(), last = clock, bubbles = [], canvas = null;
  const blobs = Array.from({ length: 9 }, (_, i) => ({
    x: Math.random(), r: 0.5 + Math.random() * 0.6, sx: 0.015 + Math.random() * 0.03,
    sy: 0.4 + Math.random() * 0.5, ph: i * 1.9, hue: i % 3 === 0 ? '240,140,255' : '185,120,255',
  }));

  function tick(now) {
    raf = 0;
    const cv = document.querySelector('.xpb-liquid');
    if (cv !== canvas) { canvas = cv; p = 0; bubbles = []; } // new screen: start empty
    if (!cv) return;
    const target = Math.max(0, Math.min(1, (parseFloat(cv.dataset.fill) || 0) / 100));
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const moving = Math.abs(target - p) > 0.0005;
    if (moving) p += Math.sign(target - p) * Math.min(Math.abs(target - p), FLOW_PER_S * dt * (0.35 + Math.abs(target - p) * 2));
    draw(cv, now, moving);
    raf = requestAnimationFrame(tick);
  }

  function draw(cv, now, moving) {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = cv.clientWidth, h = cv.clientHeight;
    if (!w || !h) return;
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    }
    const g = cv.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, h);
    if (p <= 0.001) return;
    const t = (now - clock) / 1000;

    // wavy front, livelier while the level is rising
    const amp = (3 + h * 0.07) * (moving ? 1 : 0.55);
    const front = p >= 0.999 ? w + amp * 3 : p * w;
    const edge = (y) => front
      + Math.sin(y * 0.11 + t * 4.6) * amp
      + Math.sin(y * 0.27 - t * 7.3) * amp * 0.45
      + Math.sin(t * 1.9) * amp * 0.6 * (y / h - 0.5);

    g.save();
    g.beginPath();
    g.moveTo(0, 0);
    for (let y = 0; y <= h; y += 2) g.lineTo(edge(y), y);
    g.lineTo(0, h);
    g.closePath();
    g.clip();

    const body = g.createLinearGradient(0, 0, Math.max(front, 1), 0);
    body.addColorStop(0, '#5a22c8');
    body.addColorStop(0.5, '#7a34e6');
    body.addColorStop(0.88, '#9d4cf6');
    body.addColorStop(1, '#d08cff');
    g.fillStyle = body;
    g.fillRect(0, 0, w, h);

    const depth = g.createLinearGradient(0, 0, 0, h);
    depth.addColorStop(0, 'rgba(255,215,255,.32)');
    depth.addColorStop(0.4, 'rgba(255,255,255,0)');
    depth.addColorStop(1, 'rgba(35,8,85,.5)');
    g.fillStyle = depth;
    g.fillRect(0, 0, w, h);

    // swirling pink clouds like the reference art
    g.globalCompositeOperation = 'lighter';
    for (const b of blobs) {
      const bx = (((b.x + t * b.sx) % 1) * 1.1 - 0.05) * Math.max(front, 1);
      const by = (0.45 + Math.sin(t * b.sy + b.ph) * 0.35) * h;
      const r = b.r * h * 1.4;
      const rg = g.createRadialGradient(bx, by, 0, bx, by, r);
      rg.addColorStop(0, `rgba(${b.hue},.22)`);
      rg.addColorStop(1, `rgba(${b.hue},0)`);
      g.fillStyle = rg;
      g.fillRect(bx - r, by - r, r * 2, r * 2);
    }

    // glowing bubbles drifting inside the liquid
    if (bubbles.length < 18 && Math.random() < (moving ? 0.5 : 0.12)) {
      bubbles.push({ x: Math.random() * Math.max(front - 10, 4), y: h + 4, r: 1.2 + Math.random() * h * 0.06, v: 10 + Math.random() * 22 });
    }
    bubbles = bubbles.filter((b) => b.y > -8);
    for (const b of bubbles) {
      b.y -= b.v / 60; b.x += Math.sin((b.y + b.r * 10) * 0.18) * 0.35;
      const rg = g.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r * 2.4);
      rg.addColorStop(0, 'rgba(255,225,255,.9)');
      rg.addColorStop(0.4, 'rgba(230,160,255,.45)');
      rg.addColorStop(1, 'rgba(230,160,255,0)');
      g.fillStyle = rg;
      g.fillRect(b.x - b.r * 2.4, b.y - b.r * 2.4, b.r * 4.8, b.r * 4.8);
    }

    // bright rim along the surface
    g.globalCompositeOperation = 'source-over';
    g.beginPath();
    for (let y = 0; y <= h; y += 2) (y ? g.lineTo : g.moveTo).call(g, edge(y) - 1.5, y);
    g.strokeStyle = 'rgba(245,200,255,.8)';
    g.lineWidth = 2.5;
    g.shadowColor = '#e7a6ff';
    g.shadowBlur = 10;
    g.stroke();
    g.restore();
  }

  // start drawing whenever the XP screen shows up
  new MutationObserver(() => {
    if (!raf && document.querySelector('.xpb-liquid')) { last = performance.now(); raf = requestAnimationFrame(tick); }
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
