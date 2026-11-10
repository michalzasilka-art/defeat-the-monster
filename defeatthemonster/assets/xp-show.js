// XP screen show (no "Collect XP" buttons): each player's XP counts up 1 XP at a time, P1 → P4,
// and is collected automatically when its count finishes (the hidden button is clicked, so the
// game's own sparks and team bar still run). When all four are in, a bolt in each player's colour
// strikes a circle above the cards; the circle crackles with purple lightning and shows the total damage.
// The game then moves on by itself (overload → podium), as before.
(() => {
  const STEP_MS = 22, MAX_COUNT_MS = 800, PAUSE_MS = 140; // faster count-up
  let running = null, best = 1;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  async function show(screen) {
    const cards = [...screen.querySelectorAll('.xp-player')];
    const targets = cards.map((c) => parseInt(c.querySelector('.xp-amount')?.textContent, 10) || 0);
    best = Math.max(1, ...targets); // each card's own bar (--xpp) is full for the top scorer
    const head = screen.querySelector('.xpb-header');
    if (head && !head.querySelector('.xpb-tag')) head.insertAdjacentHTML('beforeend', '<span class="xpb-tag">ROB DEFEATED · MISSION COMPLETE</span>');
    cards.forEach((c) => setXp(c, 0));
    await wait(300);
    for (let i = 0; i < cards.length; i++) {
      if (!screen.isConnected) return;
      const c = cards[i], n = targets[i];
      c.classList.add('xps-active');
      const step = Math.max(8, Math.min(STEP_MS, MAX_COUNT_MS / Math.max(1, n)));
      for (let x = 1; x <= n; x++) { setXp(c, x); c.classList.remove('xps-tick'); void c.offsetWidth; c.classList.add('xps-tick'); await wait(step); }
      setXp(c, n);
      c.querySelector('.collect')?.click(); // the game's own collect: sparks fly into the team bar
      c.classList.remove('xps-active'); c.classList.add('xps-done');
      await wait(PAUSE_MS);
    }
    if (screen.isConnected) strike(screen, cards, targets.reduce((a, b) => a + b, 0));
  }
  function setXp(card, x) {
    const el = card.querySelector('.xp-amount'); if (el && el.firstChild) el.firstChild.nodeValue = String(x);
    card.style.setProperty('--xpp', (x / best).toFixed(3));
  }

  // ---- the finale ----
  function strike(screen, cards, total) {
    const grid = screen.querySelector('.player-grid'), head = screen.querySelector('.xpb-header');
    if (!grid) return;
    const g = grid.getBoundingClientRect(), h = head ? head.getBoundingClientRect() : null;
    const R = Math.max(60, Math.min(110, g.width * 0.09));
    const cx = g.left + g.width / 2, cy = h ? h.top + h.height * 0.52 : g.top - R - 30;

    const layer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    layer.setAttribute('class', 'xps-layer'); layer.setAttribute('width', innerWidth); layer.setAttribute('height', innerHeight);
    layer.innerHTML = `<defs><radialGradient id="xpsCore"><stop offset="0" stop-color="#2a1260"/><stop offset=".7" stop-color="#1a0d40"/><stop offset="1" stop-color="#0b0726"/></radialGradient></defs>
      <g class="xps-bolts"></g>
      <g class="xps-orb" style="transform-origin:${cx}px ${cy}px">
        <circle cx="${cx}" cy="${cy}" r="${R}" fill="url(#xpsCore)" stroke="#b46bff" stroke-width="4"/>
        <circle cx="${cx}" cy="${cy}" r="${R + 9}" fill="none" stroke="#d6a5ff" stroke-opacity=".35" stroke-width="2"/>
        <g class="xps-ring"></g>
        <text x="${cx}" y="${cy - R * 0.32}" class="xps-k">TOTAL DAMAGE</text>
        <text x="${cx}" y="${cy + R * 0.3}" class="xps-n" style="font-size:${Math.round(R * 0.62)}px">0</text>
      </g>`;
    document.body.appendChild(layer);
    document.documentElement.classList.add('xps-final');
    const orb = layer.querySelector('.xps-orb'), ring = layer.querySelector('.xps-ring'), num = layer.querySelector('.xps-n');

    // one bolt from each card (its player colour) to the circle, one after another
    cards.forEach((c, i) => setTimeout(() => {
      const r = (c.querySelector('.xp-portrait') || c).getBoundingClientRect();
      const col = getComputedStyle(c).getPropertyValue('--hero').trim() || '#b46bff';
      const ang = Math.atan2(r.top - cy, r.left + r.width / 2 - cx);
      bolt(layer.querySelector('.xps-bolts'), r.left + r.width / 2, r.top + 4, cx + Math.cos(ang) * R, cy + Math.sin(ang) * R, col);
      c.classList.add('xps-fired');
    }, i * 140));

    // circle charges up: pops in, then the total counts up inside it
    setTimeout(() => {
      orb.classList.add('on');
      const t0 = performance.now(), dur = 900;
      const run = (now) => {
        const k = Math.min(1, (now - t0) / dur);
        num.textContent = Math.round(total * (1 - Math.pow(1 - k, 3))).toLocaleString('en-US');
        if (k < 1 && layer.isConnected) requestAnimationFrame(run);
      };
      requestAnimationFrame(run);
    }, cards.length * 140 + 120);

    // purple lightning crackling around the circle until the game moves on
    const crackle = () => {
      if (!layer.isConnected) return;
      if (!screen.isConnected) { layer.remove(); return; }
      let html = '';
      for (let k = 0; k < 3; k++) {
        const a0 = Math.random() * Math.PI * 2, span = .5 + Math.random() * .7, n = 7;
        const pts = [];
        for (let j = 0; j <= n; j++) {
          const a = a0 + span * j / n, rr = R + 6 + (j % 2 ? 1 : -1) * (3 + Math.random() * 9);
          pts.push(`${(cx + Math.cos(a) * rr).toFixed(1)},${(cy + Math.sin(a) * rr).toFixed(1)}`);
        }
        html += `<polyline points="${pts.join(' ')}" class="xps-arc"/>`;
      }
      ring.innerHTML = html;
      setTimeout(crackle, reduced() ? 400 : 90);
    };
    setTimeout(crackle, cards.length * 140 + 120);
  }

  function bolt(parent, x1, y1, x2, y2, col) {
    const n = 7, pts = [];
    const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len;
    for (let i = 0; i <= n; i++) {
      const t = i / n, off = i === 0 || i === n ? 0 : (i % 2 ? 1 : -1) * (8 + Math.random() * 14);
      pts.push([x1 + dx * t + nx * off, y1 + dy * t + ny * off]);
    }
    const P = pts.map((p) => p.map((v) => v.toFixed(1)).join(',')).join(' ');
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.innerHTML = `<polyline points="${P}" fill="none" stroke="${col}" stroke-width="8" stroke-linejoin="round" stroke-linecap="round" style="filter:drop-shadow(0 0 8px ${col})"/>
      <polyline points="${P}" fill="none" stroke="#fff" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>`;
    parent.appendChild(g);
    g.querySelectorAll('polyline').forEach((pl) => {
      const L = pl.getTotalLength() + 1; pl.style.strokeDasharray = `${L} ${L}`;
      pl.animate([{strokeDashoffset: L}, {strokeDashoffset: 0, offset: .35}, {strokeDashoffset: 0, opacity: 1, offset: .7}, {strokeDashoffset: 0, opacity: 0}], {duration: 650, easing: 'ease-out', fill: 'forwards'});
    });
  }

  // start once per XP screen
  new MutationObserver(() => {
    const s = document.querySelector('.xpb-screen');
    if (s && s !== running) { running = s; show(s); }
    if (!s) { running = null; document.documentElement.classList.remove('xps-final'); document.querySelectorAll('.xps-layer').forEach((l) => l.remove()); }
  }).observe(document.documentElement, {childList: true, subtree: true});
})();
