/* Classic round 3 = ROCKET ROUND. Every player has a rocket launcher standing on top of their battle card, with a
   3-part load bar under it. Each answer fills one part (green = right, red = wrong); on a player's third answer
   their launcher fires at Rob: a smoke-trailed rocket on a curved path, an explosion and the damage it did.
   Rob has no health bar this round. Damage depends on the right answers AND how fast they came: 0 right = a dud that falls
   short, 1–2 = a hit, 3 = a PERFECT golden rocket; the speed of the right answers scales it from ×0.7 (last moment) through
   ×1 (half the time left) to ×1.3 (instant). The team beats Rob when the rockets together do at least half his HP.
   The game bundle calls: dtmRocket.reset(round, ids) when a round starts, dtmRocket.on(round), dtmRocket.left(id),
   and dtmRocket.answer(id, correct, players, beep) for each answer (it returns the damage and when the round ends). */
(function () {
  var ROB_HP = 220;                    // round 3 (120 + 2 × 50)
  var SHARE = [0, 0.25, 0.55, 1];      // part of a player's share of Rob's HP, by right answers out of 3
  var speedMult = function (sp) { return 0.7 + 0.6 * sp; }; // average speed of the right answers: 0 → ×0.7, 0.5 → ×1, 1 → ×1.3
  var st = {round: 0, ids: [], marks: {}, dmg: {}, total: 0, n: 0, introShown: false};
  var layer = null, units = {}, beep = function () {};

  function pro() { return !!(window.dtmPro && window.dtmPro()); }
  function onRound(r) { return r === 3 && !pro(); }

  window.dtmRocket = {
    reset: function (round, ids) {
      st = {round: round, ids: ids.slice(), marks: {}, speed: {}, dmg: {}, total: 0, n: ids.length, introShown: false};
      ids.forEach(function (id) { st.marks[id] = []; st.speed[id] = []; });
      clearUnits();
    },
    on: function (round) { return onRound(round) && st.round === 3; },
    left: function (id) { return 3 - ((st.marks[id] || []).length); },
    answer: function (id, correct, players, b, speed) {
      if (b) beep = b;
      var m = st.marks[id] || (st.marks[id] = []);
      m.push(!!correct);
      (st.speed[id] || (st.speed[id] = [])).push(correct ? Math.max(0, Math.min(1, +speed || 0)) : 0);
      var res = {fire: false, dmg: 0, allDone: false, win: false, wait: 3200};
      if (m.length === 3) {
        var rights = m.filter(Boolean).length;
        res.fire = true;
        var sps = st.speed[id].filter(function (v, k) { return m[k]; });
        var sp = sps.length ? sps.reduce(function (a, v) { return a + v; }, 0) / sps.length : 0;
        res.dmg = Math.round(ROB_HP / Math.max(1, players || st.n) * SHARE[rights] * (rights ? speedMult(sp) : 0));
        st.dmg[id] = res.dmg; st.total += res.dmg;
        setTimeout(function () { fire(id, rights, res.dmg, sp); }, 380);
      }
      res.allDone = st.ids.every(function (k) { return (st.marks[k] || []).length >= 3; });
      res.win = st.total >= ROB_HP / 2;
      if (res.allDone) setTimeout(function () { finale(res.win); }, 2300);
      return res;
    }
  };

  /* ---------- art ---------- */
  // launcher drawn pointing right (viewBox 160×100); the tube turns around (70,50), the tripod stays put
  var LAUNCHER =
    '<svg class="rk-svg" viewBox="0 0 160 100" aria-hidden="true"><defs>' +
    '<linearGradient id="rkTube" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5b616b"/><stop offset=".45" stop-color="#2b3038"/><stop offset="1" stop-color="#14171c"/></linearGradient>' +
    '<linearGradient id="rkOr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb35c"/><stop offset=".5" stop-color="#e0701c"/><stop offset="1" stop-color="#8a3d0c"/></linearGradient>' +
    '<radialGradient id="rkHot"><stop offset="0" stop-color="#fff6c8"/><stop offset=".5" stop-color="#ff9a38"/><stop offset="1" stop-color="#ff5a1a" stop-opacity="0"/></radialGradient></defs>' +
    '<g class="rk-tripod"><path d="M70 56 48 96M70 56 92 96M70 56 70 98" stroke="#1d2026" stroke-width="7" stroke-linecap="round"/>' +
    '<path d="M70 56 48 96M70 56 92 96M70 56 70 98" stroke="#4a505a" stroke-width="2.5" stroke-linecap="round"/>' +
    '<rect x="42" y="93" width="12" height="5" rx="2" fill="#e0701c"/><rect x="86" y="93" width="12" height="5" rx="2" fill="#e0701c"/><rect x="64" y="95" width="12" height="5" rx="2" fill="#e0701c"/>' +
    '<rect x="62" y="48" width="16" height="14" rx="3" fill="#2b3038" stroke="#e0701c" stroke-width="2"/></g>' +
    '<g class="rk-tube">' +
    '<rect x="6" y="37" width="20" height="26" rx="5" fill="url(#rkOr)" stroke="#3a1a06" stroke-width="2"/>' +
    '<rect x="20" y="33" width="110" height="34" rx="9" fill="url(#rkTube)" stroke="#0c0e12" stroke-width="2.5"/>' +
    '<rect x="34" y="31" width="9" height="38" rx="3" fill="url(#rkOr)" stroke="#3a1a06" stroke-width="1.5"/>' +
    '<rect x="98" y="31" width="11" height="38" rx="3" fill="url(#rkOr)" stroke="#3a1a06" stroke-width="1.5"/>' +
    '<rect x="50" y="38" width="40" height="5" rx="2.5" fill="#ffffff22"/>' +
    '<rect x="78" y="23" width="18" height="9" rx="2" fill="#2b3038" stroke="#e0701c" stroke-width="1.5"/><circle cx="94" cy="27.5" r="2.6" fill="#7fd3ff"/>' +
    '<rect x="60" y="64" width="11" height="15" rx="3" fill="#2b3038" stroke="#0c0e12" stroke-width="2"/>' +
    '<circle cx="28" cy="50" r="1.8" fill="#9aa0aa"/><circle cx="52" cy="62" r="1.6" fill="#9aa0aa"/><circle cx="88" cy="62" r="1.6" fill="#9aa0aa"/><circle cx="120" cy="40" r="1.6" fill="#9aa0aa"/>' +
    '<rect x="124" y="27" width="22" height="46" rx="7" fill="url(#rkOr)" stroke="#3a1a06" stroke-width="2.5"/>' +
    '<ellipse cx="146" cy="50" rx="6" ry="20" fill="#2a1608" stroke="#ffb35c" stroke-width="2"/>' +
    '<ellipse class="rk-glow" cx="146" cy="50" rx="5" ry="16" fill="url(#rkHot)"/>' +
    '<g class="rk-loaded"><path d="M120 50h18" stroke="#ffd36b" stroke-width="0"/></g>' +
    '</g></svg>';
  function rocketSvg(kind) {
    var body = kind === 'gold' ? ['#fff3b0', '#ffc93c', '#b77a00'] : ['#ffd0a0', '#e0701c', '#7a3208'];
    return '<svg class="rk-rocket-svg" viewBox="0 0 90 30" aria-hidden="true">' +
      '<defs><linearGradient id="rkB' + kind + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + body[0] + '"/><stop offset=".5" stop-color="' + body[1] + '"/><stop offset="1" stop-color="' + body[2] + '"/></linearGradient></defs>' +
      '<path class="rk-flame" d="M18 15 0 8 6 15 0 22z" fill="#ffb347"/><path class="rk-flame2" d="M18 15 7 11 10 15 7 19z" fill="#fff4c2"/>' +
      '<path d="M22 4 34 9H22zM22 26 34 21H22z" fill="#3a3f47" stroke="#111" stroke-width="1"/>' +
      '<path d="M18 9h46l16 6-16 6H18z" fill="url(#rkB' + kind + ')" stroke="#2a1205" stroke-width="1.6" stroke-linejoin="round"/>' +
      '<path d="M64 9l16 6-16 6z" fill="' + (kind === 'gold' ? '#fff8d8' : '#c9cdd4') + '" stroke="#2a1205" stroke-width="1.4" stroke-linejoin="round"/>' +
      '<rect x="40" y="9" width="5" height="12" fill="#2b3038"/><path d="M22 12 30 15 22 18z" fill="#3a3f47"/></svg>';
  }

  /* ---------- launchers on the cards ---------- */
  function ensureLayer() {
    if (layer && layer.isConnected) return layer;
    layer = document.createElement('div'); layer.className = 'rk-layer'; document.body.appendChild(layer);
    return layer;
  }
  function clearUnits() {
    Object.keys(units).forEach(function (k) { units[k].el.remove(); });
    units = {};
    if (layer) layer.querySelectorAll('.rk-banner,.rk-cap').forEach(function (e) { e.remove(); });
  }
  function robBox() {
    var r = document.querySelector('video.arena-robot:not(.rob-board)') || document.querySelector('.arena-robot');
    if (!r) return null;
    var b = r.getBoundingClientRect();
    return b.width ? {x: b.left + b.width / 2, y: b.top + b.height * 0.47, w: b.width, h: b.height, el: r} : null;
  }
  function unitFor(card) {
    var id = card.dataset.playerId, u = units[id];
    if (!u) {
      var el = document.createElement('div'); el.className = 'rk-unit';
      el.innerHTML = '<div class="rk-launcher">' + LAUNCHER + '</div><div class="rk-bar"><i></i><i></i><i></i></div><div class="rk-label">LOAD 0/3</div>';
      ensureLayer().appendChild(el);
      u = units[id] = {el: el, id: id, svg: el.querySelector('.rk-svg'), tube: el.querySelector('.rk-tube'), segs: el.querySelectorAll('.rk-bar i'),
        label: el.querySelector('.rk-label'), angle: -30, mirror: false, shown: -1};
    }
    return u;
  }
  function place() {
    var on = document.querySelector('.screen-battle section.battle, section.battle.screen-battle') && /Level\s*3/.test((document.querySelector('.level-pill') || {}).textContent || '') && !pro() && st.round === 3;
    document.documentElement.classList.toggle('dtm-rocket', !!on);
    if (layer) layer.style.display = on ? '' : 'none';
    if (!on) { if (Object.keys(units).length && !document.querySelector('section.battle')) clearUnits(); return; }
    ensureLayer();
    if (!st.introShown) { st.introShown = true; banner(); }
    var rob = robBox();
    document.querySelectorAll('section.battle [data-player-id]').forEach(function (card) {
      var u = unitFor(card), b = card.getBoundingClientRect();
      if (!b.width) return;
      var w = Math.max(110, Math.min(230, b.width * 0.46));
      var left = rob && b.left + b.width / 2 > rob.x;   // card right of Rob → launcher sits on its outer side and faces left
      var cx = b.left + b.width / 2 + (left ? 1 : -1) * b.width * 0.16;
      u.el.style.width = w + 'px';
      u.el.style.left = (cx - w / 2) + 'px';
      u.el.style.top = (b.top - w * 0.625 - 30) + 'px';
      u.el.style.setProperty('--hero', getComputedStyle(card).getPropertyValue('--hero') || '#7fb4ff');
      u.mirror = left;
      u.el.classList.toggle('mirror', left);
      if (rob) {   // aim the tube at Rob
        var s = w / 160, px = cx - w / 2 + (left ? (160 - 70) : 70) * s, py = b.top - w * 0.625 - 30 + 50 * s;
        var dx = Math.abs(rob.x - px), dy = rob.y - py;
        u.angle = Math.max(-62, Math.min(-8, Math.atan2(dy, dx) * 180 / Math.PI));
        u.tube.setAttribute('transform', 'rotate(' + u.angle.toFixed(1) + ' 70 50)');
      }
      paintBar(u);
    });
  }
  function paintBar(u) {
    var m = st.marks[u.id] || [];
    if (u.shown === m.length + (st.dmg[u.id] != null ? 10 : 0)) return;
    u.shown = m.length + (st.dmg[u.id] != null ? 10 : 0);
    var sp = st.speed[u.id] || [];
    u.segs.forEach(function (s, i) {
      var fast = i < m.length && m[i] && sp[i] >= 2 / 3;
      s.className = i < m.length ? (m[i] ? 'ok' : 'no') + (fast ? ' fast' : '') : '';
      s.textContent = i < m.length ? (m[i] ? (fast ? '⚡' : '✓') : '✗') : '';
    });
    u.el.classList.toggle('armed', m.length === 3);
    if (st.dmg[u.id] == null) u.label.textContent = 'LOAD ' + m.length + '/3';
  }
  // point on the launcher (svg coords) → screen, after the tube's turn and the mirror
  function worldPoint(u, lx, ly) {
    var b = u.svg.getBoundingClientRect(), s = b.width / 160, a = u.angle * Math.PI / 180;
    var x = 70 + (lx - 70) * Math.cos(a) - (ly - 50) * Math.sin(a), y = 50 + (lx - 70) * Math.sin(a) + (ly - 50) * Math.cos(a);
    return {x: b.left + (u.mirror ? 160 - x : x) * s, y: b.top + y * s, dir: u.mirror ? -1 : 1, s: s};
  }

  /* ---------- effects ---------- */
  function puff(x, y, size, kind, life, dx, dy) {
    var p = document.createElement('i');
    p.className = 'rk-puff ' + kind;
    p.style.cssText = 'left:' + x + 'px;top:' + y + 'px;--s:' + size + 'px;--dx:' + (dx || 0) + 'px;--dy:' + (dy || 0) + 'px;animation-duration:' + life + 'ms';
    layer.appendChild(p);
    setTimeout(function () { p.remove(); }, life + 50);
  }
  function burst(x, y, big) {
    var k = big ? 1.6 : 1;
    var b = document.createElement('div'); b.className = 'rk-boom' + (big ? ' big' : '');
    b.style.cssText = 'left:' + x + 'px;top:' + y + 'px;--k:' + k;
    b.innerHTML = '<i class="f"></i><i class="r"></i><i class="r r2"></i>';
    for (var i = 0; i < 14; i++) {
      var a = Math.random() * Math.PI * 2, d = (60 + Math.random() * 90) * k;
      b.innerHTML += '<i class="sp" style="--x:' + (Math.cos(a) * d).toFixed(0) + 'px;--y:' + (Math.sin(a) * d).toFixed(0) + 'px;animation-delay:' + (Math.random() * 80).toFixed(0) + 'ms"></i>';
    }
    layer.appendChild(b);
    setTimeout(function () { b.remove(); }, 1400);
    for (var j = 0; j < (big ? 16 : 10); j++) {
      var aa = Math.random() * Math.PI * 2, dd = (20 + Math.random() * 50) * k;
      puff(x + Math.cos(aa) * dd * .4, y + Math.sin(aa) * dd * .4, (34 + Math.random() * 30) * k, j % 3 ? 'smoke' : 'fire', 1200 + Math.random() * 700, Math.cos(aa) * dd, Math.sin(aa) * dd - 30);
    }
  }
  function floatText(x, y, main, sub, cls) {
    var t = document.createElement('div'); t.className = 'rk-dmg ' + (cls || '');
    t.style.cssText = 'left:' + x + 'px;top:' + y + 'px';
    t.innerHTML = '<b>' + main + '</b>' + (sub ? '<small>' + sub + '</small>' : '');
    layer.appendChild(t);
    setTimeout(function () { t.remove(); }, 2200);
  }
  function shake(el, cls) { if (!el) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); setTimeout(function () { el.classList.remove(cls); }, 700); }

  function fire(id, rights, dmg, sp) {
    var u = units[id];
    if (!u || !layer) return;
    var rob = robBox();
    var gold = rights === 3, dud = rights === 0;
    var m = worldPoint(u, 150, 50), back = worldPoint(u, 4, 50);
    u.el.classList.remove('armed'); shake(u.el, 'kick');
    u.el.classList.add('fired');
    try { beep(dud ? 90 : 160, dud ? .3 : .5); } catch (e) {}
    // back-blast and muzzle flash
    for (var i = 0; i < 9; i++) puff(back.x, back.y, 24 + Math.random() * 26, i % 2 ? 'smoke' : 'fire', 900 + Math.random() * 600, -m.dir * (30 + Math.random() * 70), -10 + Math.random() * 30);
    if (!dud) puff(m.x, m.y, 46 * (gold ? 1.4 : 1), 'flash', 260, 0, 0);

    var target = rob && !dud ? {x: rob.x + (Math.random() - .5) * rob.w * .18, y: rob.y + (Math.random() - .5) * rob.h * .12}
      : {x: m.x + m.dir * (140 + Math.random() * 60), y: m.y + 70};
    var dist = Math.hypot(target.x - m.x, target.y - m.y);
    var c = dud ? {x: (m.x + target.x) / 2 + m.dir * 10, y: m.y - 50} : {x: (m.x + target.x) / 2, y: Math.min(m.y, target.y) - dist * 0.38};
    var dur = dud ? 900 : 1050 + dist * 0.35;

    var path = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    path.setAttribute('class', 'rk-trail' + (gold ? ' gold' : ''));
    path.innerHTML = '<path pathLength="1" d="M' + m.x + ' ' + m.y + ' Q' + c.x + ' ' + c.y + ' ' + target.x + ' ' + target.y + '"/>';
    layer.appendChild(path);
    var line = path.firstChild;

    var r = document.createElement('div'); r.className = 'rk-rocket' + (gold ? ' gold' : '') + (dud ? ' dud' : '');
    r.style.setProperty('--w', (gold ? 88 : 66) * Math.max(.8, m.s * 1.1) + 'px');
    r.innerHTML = rocketSvg(gold ? 'gold' : 'std');
    layer.appendChild(r);

    var t0 = performance.now(), lastPuff = 0;
    function bez(t, a, b, d) { return (1 - t) * (1 - t) * a + 2 * (1 - t) * t * b + t * t * d; }
    (function step(now) {
      var lin = Math.min(1, (now - t0) / dur), t = dud ? lin : Math.pow(lin, 1.55);
      var x = bez(t, m.x, c.x, target.x), y = bez(t, m.y, c.y, target.y);
      var tx = 2 * (1 - t) * (c.x - m.x) + 2 * t * (target.x - c.x), ty = 2 * (1 - t) * (c.y - m.y) + 2 * t * (target.y - c.y);
      var ang = Math.atan2(ty, tx) * 180 / Math.PI;
      r.style.transform = 'translate(' + x + 'px,' + y + 'px) translate(-50%,-50%) rotate(' + ang + 'deg)' + (dud ? ' rotate(' + (lin * 160 * m.dir) + 'deg)' : '');
      line.style.strokeDashoffset = (1 - t).toFixed(4);
      if (now - lastPuff > 14) {
        lastPuff = now;
        var tail = {x: x - Math.cos(ang * Math.PI / 180) * 30, y: y - Math.sin(ang * Math.PI / 180) * 30};
        var side = (Math.random() - .5) * 14, nx = -Math.sin(ang * Math.PI / 180), ny = Math.cos(ang * Math.PI / 180);
        puff(tail.x + nx * side, tail.y + ny * side, (dud ? 12 : 14) + Math.random() * (gold ? 34 : 26), 'smoke' + (gold ? ' warm' : ''), 1500 + Math.random() * 900, (Math.random() - .5) * 26, -8 - Math.random() * 22);
        if (!dud) puff(tail.x, tail.y, 12 + Math.random() * 12, gold ? 'fire gold' : 'fire', 320, 0, 0);
      }
      if (lin < 1) return requestAnimationFrame(step);
      r.remove();
      setTimeout(function () { path.classList.add('fade'); setTimeout(function () { path.remove(); }, 900); }, 500);
      if (dud) {
        for (var k = 0; k < 6; k++) puff(target.x, target.y, 26 + Math.random() * 20, 'smoke', 1100, (Math.random() - .5) * 60, -20 - Math.random() * 30);
        floatText(target.x, target.y - 30, 'DUD', '0 damage · no right answers', 'dud');
      } else {
        burst(target.x, target.y, gold);
        try { beep(gold ? 55 : 70, gold ? .9 : .6); } catch (e) {}
        if (rob) shake(rob.el, 'rk-hit');
        if (gold) shake(document.querySelector('section.battle'), 'rk-quake');
        floatText(target.x, target.y + (rob ? rob.h * .05 : 0), '−' + dmg, (gold ? 'PERFECT HIT!' : rights + '/3 right') + ' · speed ' + Math.round(sp * 100) + '%', gold ? 'gold' : '');
      }
      u.label.textContent = dud ? 'DUD · 0' : (gold ? 'PERFECT · −' : 'HIT · −') + dmg;
      u.el.classList.add(dud ? 'was-dud' : 'was-hit');
      // the barrel keeps smoking for a bit
      var n = 0, smoke = setInterval(function () {
        if (!u.el.isConnected || ++n > 14) return clearInterval(smoke);
        var p = worldPoint(u, 150, 50); puff(p.x, p.y, 12 + Math.random() * 10, 'smoke', 1300, m.dir * 6, -30);
      }, 220);
    })(t0);
  }

  function banner() {
    var b = document.createElement('div'); b.className = 'rk-banner';
    b.innerHTML = '<b>ROCKET ROUND!</b><small>Answer 3 questions to load your rocket · right AND fast = bigger rocket</small>';
    layer.appendChild(b);
    setTimeout(function () { b.classList.add('out'); setTimeout(function () { b.remove(); }, 600); }, 3000);
    var cap = document.createElement('div'); cap.className = 'rk-cap';
    cap.innerHTML = '🚀 ROCKET ROUND · <span>3 answers = 1 rocket</span>';
    layer.appendChild(cap);
  }
  function finale(win) {
    if (!layer) return;
    var b = document.createElement('div'); b.className = 'rk-banner end ' + (win ? 'win' : 'lose');
    b.innerHTML = win ? '<b>ROB IS DOWN!</b><small>The rockets did ' + st.total + ' damage</small>' : '<b>ROB SURVIVED</b><small>The rockets did ' + st.total + ' damage · more right answers next time!</small>';
    layer.appendChild(b);
    setTimeout(function () { b.remove(); }, 2600);
    if (win) { var rob = robBox(); if (rob) { burst(rob.x - 40, rob.y, true); setTimeout(function () { burst(rob.x + 50, rob.y - 30, true); }, 250); } }
  }

  (function loop() { try { place(); } catch (e) {} requestAnimationFrame(loop); })();
})();
