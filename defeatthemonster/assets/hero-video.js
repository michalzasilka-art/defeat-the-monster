/* Animated hero scenes: on the battle cards the video fills the whole scene rectangle
   (.battle-avatar) in place of the city background + round portrait (hearts stay on top); in the
   lobby it replaces the hero picture inside the round portrait (.portrait.hero-pick).
   Videos are pre-rendered forward+reverse (ping-pong) so the plain `loop` attribute looks seamless.
   Add more heroes to HERO_VIDEOS as art arrives. */
(function () {
  // zoom / oy (transform-origin y, %) frame the hero inside the round lobby portrait
  var HERO_VIDEOS = {
    'stela.png': { zoom: 1.3, oy: 41, src: './video/stela-card.mp4?v=1', poster: './video/stela-card-poster.jpg?v=1' },
    'foxino.png': { zoom: 1.3, oy: 50, src: './video/foxino-card.mp4?v=1', poster: './video/foxino-card-poster.jpg?v=1' },
    'charlie.png': { zoom: 1.3, oy: 28, src: './video/charlie-card.mp4?v=3', poster: './video/charlie-card-poster.jpg?v=3' },
    'pix.png': { zoom: 1.15, oy: 4, src: './video/pix-card.mp4?v=1', poster: './video/pix-card-poster.jpg?v=1' }
  };
  function videoFor(img) {
    var src = img ? img.getAttribute('src') || '' : '';
    for (var k in HERO_VIDEOS) if (src.indexOf(k) !== -1) return HERO_VIDEOS[k];
    return null;
  }
  function makeVideo(v) {
    var el = document.createElement('video');
    el.className = 'hero-video';
    el.dataset.src = v.src;
    el.muted = true; el.loop = true; el.autoplay = true; el.playsInline = true;
    el.setAttribute('muted', ''); el.setAttribute('playsinline', ''); el.setAttribute('aria-hidden', 'true');
    el.poster = v.poster; el.src = v.src; el.preload = 'auto';
    el.addEventListener('canplay', function () { kick(el); });
    return el;
  }
  function kick(el) { if (el.paused) { var p = el.play(); if (p && p.catch) p.catch(function () {}); } }
  function sync() {
    // battle cards: video covers the scene rectangle
    document.querySelectorAll('.battle-players .battle-avatar').forEach(function (scene) {
      var v = videoFor(scene.querySelector(':scope>span img.hero-art')), cur = scene.querySelector(':scope>video.hero-video');
      if (cur && (!v || cur.dataset.src !== v.src)) { cur.remove(); cur = null; }
      scene.classList.toggle('has-hero-video', !!v);
      if (!v || cur) return;
      var el = makeVideo(v); scene.prepend(el); kick(el);
    });
    // XP screen, round leaderboard + final podium: the same moving hero inside their round pictures
    document.querySelectorAll('.xp-portrait,.board-portrait,.final-portrait').forEach(function (box) {
      var img = box.querySelector('img.hero-art'), v = videoFor(img), cur = box.querySelector(':scope>video.hero-video');
      if (cur && (!v || cur.dataset.src !== v.src)) { cur.remove(); cur = null; }
      box.classList.toggle('has-hero-video', !!v);
      if (!v || cur) return;
      var el = makeVideo(v);
      el.style.transform = 'scale(' + (v.zoom || 1) + ')';
      el.style.transformOrigin = '50% ' + (v.oy == null ? 50 : v.oy) + '%';
      box.prepend(el); kick(el);
    });
    // lobby: video inside the round portrait
    document.querySelectorAll('.portrait.hero-pick').forEach(function (btn) {
      var img = btn.querySelector(':scope>img.hero-art'), v = videoFor(img), cur = btn.querySelector(':scope>video.hero-video');
      if (cur && (!v || cur.dataset.src !== v.src)) { cur.remove(); cur = null; }
      btn.classList.toggle('has-hero-video', !!v);
      if (!v || cur) return;
      var el = makeVideo(v);
      el.style.transform = 'scale(' + (v.zoom || 1) + ')';
      el.style.transformOrigin = '50% ' + (v.oy == null ? 50 : v.oy) + '%';
      img.after(el); kick(el);
    });
  }
  // turn timer drawn as an outline around the hearts tab: mirrors the width of the card's own
  // timer bar (.turn-timer .timer i), starting at the top centre and running clockwise
  var SVGNS = 'http://www.w3.org/2000/svg';
  function ringPath(w, h, r) {
    var x = 1.5, y = 1.5; w -= 3; h -= 3; r = Math.min(r, h / 2, w / 2);
    return 'M' + (x + w / 2) + ' ' + y + 'H' + (x + w - r) + 'A' + r + ' ' + r + ' 0 0 1 ' + (x + w) + ' ' + (y + r) +
      'V' + (y + h - r) + 'A' + r + ' ' + r + ' 0 0 1 ' + (x + w - r) + ' ' + (y + h) + 'H' + (x + r) +
      'A' + r + ' ' + r + ' 0 0 1 ' + x + ' ' + (y + h - r) + 'V' + (y + r) + 'A' + r + ' ' + r + ' 0 0 1 ' + (x + r) + ' ' + y + 'Z';
  }
  function tickRings() {
    document.querySelectorAll('.battle-players .battle-avatar.has-hero-video>.card-hearts').forEach(function (tab) {
      var svg = tab.querySelector(':scope>svg.hearts-timer');
      if (!svg) {
        svg = document.createElementNS(SVGNS, 'svg'); svg.setAttribute('class', 'hearts-timer'); svg.setAttribute('aria-hidden', 'true');
        svg.innerHTML = '<defs><linearGradient id="ht-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffbe57"/><stop offset="1" stop-color="#fa8f1e"/></linearGradient></defs>' +
          '<path class="ht-track" pathLength="100"/><path class="ht-bar" pathLength="100" stroke-dasharray="100 100"/>';
        tab.appendChild(svg);
      }
      var w = tab.offsetWidth + 6, h = tab.offsetHeight + 6, key = w + 'x' + h;
      if (svg.dataset.k !== key) {
        svg.dataset.k = key; svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
        var d = ringPath(w, h, 15);
        svg.querySelectorAll('path').forEach(function (p) { p.setAttribute('d', d); });
      }
      var card = tab.closest('.player'), bar = card && card.querySelector('.turn-timer .timer i');
      var pct = bar ? parseFloat(bar.style.width) || 0 : 0;
      pct = Math.max(0, Math.min(100, pct));
      var b = svg.querySelector('.ht-bar');
      b.setAttribute('stroke-dashoffset', String(100 - pct));
      b.style.opacity = pct > 0 ? 1 : 0;
      tab.classList.toggle('ht-low', pct > 0 && pct < 25);
    });
    requestAnimationFrame(tickRings);
  }
  requestAnimationFrame(tickRings);
  // autoplay can be refused until the page is visible / touched: retry then
  ['pointerdown', 'keydown', 'touchstart'].forEach(function (e) {
    document.addEventListener(e, function () { document.querySelectorAll('video.hero-video').forEach(kick); }, { passive: true });
  });
  document.addEventListener('visibilitychange', function () { document.querySelectorAll('video.hero-video').forEach(kick); });
  var queued = false;
  new MutationObserver(function () {
    if (queued) return; queued = true;
    setTimeout(function () { queued = false; sync(); }, 30);
  }).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['src'] });
  if (document.readyState !== 'loading') sync(); else document.addEventListener('DOMContentLoaded', sync);
})();
