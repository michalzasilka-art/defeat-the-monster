/* Pro-Mode round 2: CURE UPLOAD. No Rob on screen: a laptop (art/pro-laptop.webp) stands behind the cards and its screen
   shows green hacker text and a graph of the cure uploading. The game still counts Rob's HP (hidden): every right answer
   uploads part of the cure, a wrong one lets Rob's firewall push the upload back (Rob "heals"). At 100 % Rob's HP is 0 and
   the round ends as a win. The upload is read from the hidden HP counter (.hp-counter span / .hp-max) every frame.
   Active while Pro-Mode (html[data-dtm-mode=test2], assets/test2-mode.js) is in round 2 (main.level-2). */
(function () {
  var SX0 = 375 / 1672, SX1 = 1310 / 1672, SY0 = 205 / 941, SY1 = 690 / 941; // the laptop screen inside the picture
  var stage = null, term = null, pctEl = null, barEl = null, line = null, area = null, dots = null, state = null;
  var hist = [], lastPct = null, lastLine = 0;

  var IDLE = ['scanning rob.core ...', 'ping 10.0.0.66  ttl=64  ok', 'mounting /dev/antivirus', 'checksum 7f3a:c0de:91b2 ✓',
    'handshake with rob firmware v3.1', 'bypassing firewall layer 2', 'reading memory 0x00F4A2..0x00F4FF', 'patching glitch.dll',
    'decrypting cure.pkg  [aes-256]', 'tracing virus signature 0xBADC0DE', 'rob.mood = "angry"  // fixing', 'allocating 512MB for cure',
    'kill -9 virus.exe  (denied)', 'injecting packet #', 'compiling cure.c ... ok', 'net.uplink: 940 Mb/s'];

  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html) e.innerHTML = html; return e; }
  function on() {
    var main = document.querySelector('main.game');
    return document.documentElement.dataset.dtmMode === 'test2' && main && main.classList.contains('level-2') &&
      (main.classList.contains('screen-battle') || main.classList.contains('screen-countdown')) && main;
  }
  function build(main) {
    stage = el('div', 'cure-stage');
    stage.innerHTML = '<div class="cure-bg"></div><div class="cure-laptop"><img src="./art/pro-laptop.webp?v=1" alt="">' +
      '<div class="cure-screen"><div class="cure-term"><div class="ct-head">root@foxino:~/cure$</div><div class="ct-lines"></div></div>' +
      '<div class="cure-graph"><div class="cg-head"><span>CURE UPLOAD</span><b class="cg-pct">0%</b></div>' +
      '<svg class="cg-svg" viewBox="0 0 100 60" preserveAspectRatio="none"><g class="cg-grid"></g><path class="cg-area"/><path class="cg-line"/><g class="cg-dots"></g></svg>' +
      '<div class="cg-bar"><i></i></div></div><div class="cure-glitch"></div></div></div>';
    var g = '';
    for (var i = 1; i < 4; i++) g += '<line x1="0" x2="100" y1="' + i * 15 + '" y2="' + i * 15 + '"/>';
    for (var j = 1; j < 5; j++) g += '<line y1="0" y2="60" x1="' + j * 20 + '" x2="' + j * 20 + '"/>';
    stage.querySelector('.cg-grid').innerHTML = g;
    main.insertBefore(stage, main.firstChild);
    term = stage.querySelector('.ct-lines'); pctEl = stage.querySelector('.cg-pct'); barEl = stage.querySelector('.cg-bar i');
    line = stage.querySelector('.cg-line'); area = stage.querySelector('.cg-area'); dots = stage.querySelector('.cg-dots');
    hist = [0]; lastPct = null;
    for (var k = 0; k < 6; k++) say(IDLE[Math.floor(Math.random() * IDLE.length)], '');
    say('cure upload ready. answer to send packets.', 'ok');
  }
  function say(text, cls) {
    if (!term) return;
    var d = el('div', 'ct-l ' + (cls || ''));
    d.textContent = '> ' + text + (text === 'injecting packet #' ? Math.floor(Math.random() * 9000 + 1000) : '');
    term.appendChild(d);
    while (term.children.length > 40) term.removeChild(term.firstChild);
    term.scrollTop = term.scrollHeight;
  }
  function upload() {
    var hp = document.querySelector('.boss-health .hp-counter span'), max = document.querySelector('.boss-health .hp-max');
    var h = hp ? parseFloat(hp.textContent) : NaN, m = max ? parseFloat(max.textContent) : NaN;
    return isFinite(h) && isFinite(m) && m > 0 ? Math.max(0, Math.min(100, Math.round((1 - h / m) * 100))) : 0;
  }
  function graph() {
    var n = Math.max(2, hist.length), pts = hist.map(function (v, i) { return [i / (n - 1) * 100, 60 - v * .56 - 2]; });
    if (pts.length === 1) pts.push([100, pts[0][1]]);
    var d = pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(2) + ' ' + p[1].toFixed(2); }).join(' ');
    line.setAttribute('d', d);
    area.setAttribute('d', d + ' L100 60 L0 60 Z');
    dots.innerHTML = pts.slice(1).map(function (p, i) { return '<circle cx="' + p[0].toFixed(2) + '" cy="' + p[1].toFixed(2) + '" r="1.1" class="' + (hist[i + 1] < hist[i] ? 'down' : '') + '"/>'; }).join('');
  }
  function place(main) {
    var cards = main.querySelector('.battle-players');
    var top = cards ? cards.getBoundingClientRect().top : innerHeight * .48;
    var mb = main.getBoundingClientRect();
    var H = Math.max(260, (top - mb.top - 8) / SY1), W = H * 1672 / 941;
    var lap = stage.querySelector('.cure-laptop');
    lap.style.height = H + 'px'; lap.style.width = W + 'px';
    lap.style.left = (mb.width - W) / 2 + 'px'; lap.style.top = '0px';
    var sc = stage.querySelector('.cure-screen');
    sc.style.left = SX0 * W + 'px'; sc.style.top = SY0 * H + 'px'; sc.style.width = (SX1 - SX0) * W + 'px'; sc.style.height = (SY1 - SY0) * H - 6 + 'px';
  }
  function glitch(cls) {
    var g = stage.querySelector('.cure-glitch'); g.className = 'cure-glitch'; void g.offsetWidth; g.className = 'cure-glitch ' + cls;
  }
  function tick(now) {
    var main = on();
    document.documentElement.classList.toggle('dtm-cure', !!main);
    if (!main) { if (stage) { stage.remove(); stage = null; term = null; } state = null; return; }
    if (!stage || !stage.isConnected) build(main);
    place(main);
    var p = upload();
    if (lastPct === null) { lastPct = p; hist = [p]; graph(); }
    if (p !== lastPct) {
      if (p > lastPct) { say('packet sent  +' + (p - lastPct) + '%  cure ' + p + '%', 'ok'); glitch('up'); }
      else { say('FIREWALL BLOCKED  -' + (lastPct - p) + '%  rob fights back', 'bad'); glitch('down'); }
      if (p >= 100) { say('CURE UPLOADED 100%. rob.exe restarting ...', 'ok big'); stage.classList.add('done'); }
      hist.push(p); if (hist.length > 40) hist.shift();
      lastPct = p; graph();
    }
    if (now - lastLine > 650 && p < 100) { lastLine = now; say(IDLE[Math.floor(Math.random() * IDLE.length)], 'dim'); }
    pctEl.textContent = p + '%';
    barEl.style.width = p + '%';
  }
  (function loop(now) { try { tick(now || 0); } catch (e) {} requestAnimationFrame(loop); })();
})();
