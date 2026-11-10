// "Start game" button: one click (or tap / Enter / Space) and purple liquid quickly fills the stone frame
// from left to right (HOLD_MS), then the game starts. No holding needed: letting go doesn't stop it.
// The button markup comes from the game bundle (scripts/game-patches/07-hold-start);
// it calls DTMHoldStart.press(button, start) / DTMHoldStart.release(button).
(() => {
  const HOLD_MS = 250;
  const DRAIN_MS = 450;
  const states = new WeakMap();

  function state(btn) {
    let s = states.get(btn);
    if (!s) {
      s = { p: 0, holding: false, t0: 0, from: 0, raf: 0, done: null, finished: false,
            bubbles: [], blobs: makeBlobs(), clock: performance.now() };
      states.set(btn, s);
    }
    return s;
  }

  function makeBlobs() {
    return Array.from({ length: 7 }, (_, i) => ({
      x: Math.random(), y: Math.random(), r: 0.25 + Math.random() * 0.35,
      sx: 0.02 + Math.random() * 0.05, sy: 0.05 + Math.random() * 0.08, ph: i * 1.7,
      hue: i % 3 === 0 ? '236,150,255' : '170,120,255',
    }));
  }

  const ease = (t) => 1 - Math.pow(1 - t, 2.2);

  function press(btn, done) {
    const s = state(btn);
    if (s.holding || s.finished) return;
    s.holding = true; s.done = done; s.from = s.p;
    s.t0 = performance.now() - s.p * HOLD_MS; // resume from the current level
    btn.classList.add('is-holding');
    btn.classList.remove('is-nudged');
    loop(btn);
  }

  // a click starts the game by itself: letting go of the button changes nothing (kept for the bundle's calls)
  function release() {}

  function loop(btn) {
    const s = state(btn);
    if (s.raf) return;
    const tick = (now) => {
      s.raf = 0;
      if (!btn.isConnected) return;
      if (s.holding) {
        s.p = Math.min(1, (now - s.t0) / HOLD_MS);
      } else if (!s.finished) {
        const k = Math.min(1, (now - s.t0) / DRAIN_MS);
        s.p = s.from * (1 - ease(k));
      }
      draw(btn, s, now);
      if (s.holding && s.p >= 1 && !s.finished) {
        s.finished = true; s.holding = false;
        btn.classList.remove('is-holding');
        btn.classList.add('is-done');
        setTimeout(() => { s.done && s.done(); }, 280);
        // if this same button is shown again later, start from empty
        setTimeout(() => { s.finished = false; s.p = 0; btn.classList.remove('is-done'); draw(btn, s, performance.now()); }, 1500);
        return; // stays full until the game screen takes over
      }
      if (s.holding || s.p > 0.001) s.raf = requestAnimationFrame(tick);
      else draw(btn, s, now); // leave an empty well
    };
    s.raf = requestAnimationFrame(tick);
  }

  function draw(btn, s, now) {
    const cv = btn.querySelector('canvas');
    if (!cv) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = cv.clientWidth, h = cv.clientHeight;
    if (!w || !h) return;
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    }
    const g = cv.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, h);
    const t = (now - s.clock) / 1000;
    if (s.p <= 0.001) return;

    // wavy liquid front; the surface gets livelier while it is moving
    const moving = s.holding ? 1 : 0.6;
    const amp = (4 + h * 0.06) * moving;
    const front = s.p * (w + amp * 3) - amp;
    const edge = (y) => front
      + Math.sin(y * 0.09 + t * 5.2) * amp
      + Math.sin(y * 0.23 - t * 7.9) * amp * 0.45
      + Math.sin(t * 2.1) * amp * 0.5 * (y / h - 0.5);

    g.save();
    g.beginPath();
    g.moveTo(0, 0);
    for (let y = 0; y <= h; y += 2) g.lineTo(edge(y), y);
    g.lineTo(0, h);
    g.closePath();
    g.clip();

    // body of the liquid
    const body = g.createLinearGradient(0, 0, Math.max(front, 1), 0);
    body.addColorStop(0, '#5a2ccc');
    body.addColorStop(0.55, '#7a3ae6');
    body.addColorStop(0.9, '#9b4cf5');
    body.addColorStop(1, '#c58af8');
    g.fillStyle = body;
    g.fillRect(0, 0, w, h);

    // depth: darker bottom, lighter top
    const depth = g.createLinearGradient(0, 0, 0, h);
    depth.addColorStop(0, 'rgba(255,220,255,.28)');
    depth.addColorStop(0.45, 'rgba(255,255,255,0)');
    depth.addColorStop(1, 'rgba(40,10,90,.45)');
    g.fillStyle = depth;
    g.fillRect(0, 0, w, h);

    // drifting glow blobs (the swirling cloudy look)
    g.globalCompositeOperation = 'lighter';
    for (const b of s.blobs) {
      const bx = (((b.x + t * b.sx) % 1) * 1.1 - 0.05 + Math.sin(t * 0.7 + b.ph) * 0.04) * Math.max(front, 1);
      const by = (0.5 + Math.sin(t * b.sy * 5 + b.ph) * 0.4) * h;
      const r = b.r * h * 1.6;
      const rg = g.createRadialGradient(bx, by, 0, bx, by, r);
      rg.addColorStop(0, `rgba(${b.hue},.16)`);
      rg.addColorStop(1, `rgba(${b.hue},0)`);
      g.fillStyle = rg;
      g.fillRect(bx - r, by - r, r * 2, r * 2);
    }

    // bubbles rising inside the liquid
    if (s.holding && Math.random() < 0.35) {
      s.bubbles.push({ x: Math.random() * Math.max(front - 8, 4), y: h + 4, r: 1 + Math.random() * 2.6, v: 18 + Math.random() * 30 });
    }
    s.bubbles = s.bubbles.filter((b) => b.y > -6);
    g.globalCompositeOperation = 'source-over';
    for (const b of s.bubbles) {
      b.y -= b.v / 60; b.x += Math.sin((b.y + b.r * 10) * 0.2) * 0.3;
      g.beginPath(); g.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      g.fillStyle = 'rgba(245,220,255,.55)'; g.fill();
    }
    g.restore();

    // bright meniscus along the front edge
    g.save();
    g.beginPath();
    for (let y = 0; y <= h; y += 2) { const x = edge(y); y ? g.lineTo(x, y) : g.moveTo(x, y); }
    g.shadowColor = '#e7b8ff'; g.shadowBlur = 14;
    g.strokeStyle = 'rgba(250,225,255,.9)'; g.lineWidth = 2.5;
    g.stroke();
    g.restore();
  }

  // event handlers used by the button in the game bundle
  function pointerDown(e, done) {
    if (e.button > 0) return;
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) { /* not an active pointer */ }
    press(e.currentTarget, done);
  }
  function keyDown(e, done) {
    if (e.key !== ' ' && e.key !== 'Enter') return;
    e.preventDefault();
    if (!e.repeat) press(e.currentTarget, done);
  }
  function keyUp(e) {
    if (e.key === ' ' || e.key === 'Enter') release(e.currentTarget);
  }

  window.DTMHoldStart = { press, release, pointerDown, keyDown, keyUp, HOLD_MS };
})();
