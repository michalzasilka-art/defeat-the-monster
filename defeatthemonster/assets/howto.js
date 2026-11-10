/* "How to play" screen: seven steps, each a real game screenshot (art/howto-*.webp, 1600x913) with circles, arrows and
   labels that point at what to do. The game bundle renders an empty <div class="h2-root"> on the rules screen and calls
   window.dtmHowto(el, done); done() goes on to the menu. Keys: arrows / Enter / Esc. Coordinates are screenshot pixels. */
(function () {
  var W = 1600, H = 913;
  var STEPS = [
    { img: 'menu', title: 'Pick your team', text: '2–4 players. Each player gets a hero card and stands at their own station. Choose the questions: a level (A0–A2) and a grammar or vocabulary topic.',
      rings: [[386, 331, 232, 68], [316, 525, 64, 64], [1400, 441, 26, 26], [800, 825, 300, 60], ['r', 168, 772, 324, 104]],
      notes: [
        { at: [300, 196], t: 'Set the answer time', from: [300, 218], to: [330, 262] },
        { at: [235, 655], t: 'Tap a hero to change character', from: [235, 632], to: [300, 582] },
        { at: [1250, 196], t: '× removes a player', from: [1330, 218], to: [1394, 412] },
        { at: [1310, 826], t: 'Ready? Press Start!', from: [1186, 826], to: [1104, 826] },
        { at: [800, 748], t: 'Choose the questions', from: [640, 760], to: [470, 792] }
      ] },
    { img: 'turn', title: 'Wait for your turn', text: 'The glowing card is the player who answers now. Everyone else waits for their turn.',
      rings: [['r', 22, 432, 350, 478], [800, 149, 160, 30]],
      notes: [
        { at: [420, 330], t: 'Glowing card = your turn', from: [330, 352], to: [230, 428] },
        { at: [1180, 210], t: 'The game says who is up', from: [1040, 200], to: [962, 158] },
        { at: [1200, 380], t: 'Everyone else waits', from: [1160, 402], to: [1030, 700] }
      ] },
    { img: 'turn', title: 'Fill the gap', text: 'Read the sentence and tap the word that fits the gap, or press keys 1–3. Watch the clock!',
      rings: [[197, 784, 140, 30], [197, 837, 62, 16], ['r', 30, 850, 334, 56]],
      notes: [
        { at: [600, 560], t: 'Which word fits the gap?', from: [430, 572], to: [300, 756] },
        { at: [600, 676], t: 'Answer before time runs out', from: [400, 690], to: [262, 830] },
        { at: [610, 846], t: 'Tap a word or press 1–3', from: [430, 856], to: [366, 872] }
      ] },
    { img: 'hit', title: 'Hit Rob', text: 'A right answer damages Rob. The faster you answer, the harder you hit: 10 to 22 damage.',
      rings: [[800, 64, 232, 62], [197, 734, 140, 32], [326, 465, 40, 20]],
      notes: [
        { at: [1270, 176], t: 'Right answer → Rob loses HP', from: [1100, 168], to: [1014, 100] },
        { at: [470, 330], t: 'Faster = bigger hit', from: [400, 352], to: [336, 448] },
        { at: [560, 620], t: '✓ Correct!', from: [470, 640], to: [330, 722] }
      ] },
    { img: 'miss', title: "Don't miss", text: 'A wrong answer, or running out of time, costs one of your 3 hearts and heals Rob.',
      rings: [[598, 660, 72, 26], [599, 734, 140, 32], [800, 64, 232, 62]],
      notes: [
        { at: [380, 330], t: 'Mistake = lose a heart', from: [440, 352], to: [560, 630] },
        { at: [1270, 176], t: 'Rob heals a little', from: [1120, 168], to: [1014, 100] },
        { at: [1000, 560], t: 'Shows the right sentence', from: [860, 580], to: [736, 722] }
      ] },
    { img: 'streak', title: 'Build a streak', text: '3 right answers in a row set you on fire: bonus damage. Cards are ranked by damage.',
      rings: [[256, 661, 50, 20], [50, 464, 20, 20], [1257, 464, 20, 20], [1530, 464, 44, 20]],
      notes: [
        { at: [470, 330], t: '3 in a row = 🔥 bonus damage', from: [380, 352], to: [270, 636] },
        { at: [1200, 330], t: 'Rank and damage', from: [1240, 352], to: [1258, 440] },
        { at: [190, 250], t: '#1 = most damage', from: [120, 272], to: [56, 442] }
      ] },
    { img: 'results', title: 'Most damage wins', text: 'Beat Rob together to win the round. Round 3 is the Rocket Round: answer 3 questions to load and fire your rocket. Right and fast answers make a bigger rocket!',
      rings: [[520, 250, 360, 70], ['r', 166, 422, 1268, 82]],
      notes: [
        { at: [300, 140], t: 'Beat Rob together', from: [330, 162], to: [380, 196] },
        { at: [1200, 372], t: 'Most damage = winner', from: [1250, 392], to: [1300, 424] }
      ] }
  ];
  var IMG = function (n) { return './art/howto-' + n + '.webp?v=2'; };
  var pct = function (v, of) { return (v / of * 100).toFixed(3) + '%'; };

  function curve(a, b) {
    var mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = b[0] - a[0], dy = b[1] - a[1];
    var k = 0.18; // bend sideways a little
    return 'M' + a[0] + ' ' + a[1] + ' Q' + (mx - dy * k).toFixed(1) + ' ' + (my + dx * k).toFixed(1) + ' ' + b[0] + ' ' + b[1];
  }
  function ring(r, i) {
    var d = 'style="--d:' + (0.15 + i * 0.12).toFixed(2) + 's"';
    if (r[0] === 'r') return '<rect class="h2-ring" ' + d + ' pathLength="1" x="' + r[1] + '" y="' + r[2] + '" width="' + r[3] + '" height="' + r[4] + '" rx="26"/>';
    return '<ellipse class="h2-ring" ' + d + ' pathLength="1" cx="' + r[0] + '" cy="' + r[1] + '" rx="' + r[2] + '" ry="' + r[3] + '"/>';
  }
  function slide(s, n) {
    var svg = '<svg class="h2-marks" viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true"><defs><marker id="h2-head" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 10 5 0 10 2.5 5z" fill="#ffd23f"/></marker></defs>' +
      s.rings.map(ring).join('') +
      s.notes.map(function (o, i) { return '<path class="h2-arrow" style="--d:' + (0.5 + i * 0.25).toFixed(2) + 's" pathLength="1" d="' + curve(o.from, o.to) + '" marker-end="url(#h2-head)"/>'; }).join('') + '</svg>';
    var notes = s.notes.map(function (o, i) {
      return '<span class="h2-note" style="left:' + pct(o.at[0], W) + ';top:' + pct(o.at[1], H) + ';--d:' + (0.45 + i * 0.25).toFixed(2) + 's"><b>' + String.fromCharCode(65 + i) + '</b>' + o.t + '</span>';
    }).join('');
    return '<figure class="h2-shot" data-step="' + n + '"><img src="' + IMG(s.img) + '" alt="Game screenshot: ' + s.title + '">' + svg + notes + '</figure>';
  }

  window.dtmHowto = function (el, done) {
    if (!el) return;
    el._done = done;
    if (el.dataset.ready) return;
    el.dataset.ready = '1';
    var cur = 0;
    STEPS.forEach(function (s) { var i = new Image(); i.src = IMG(s.img); });
    el.innerHTML =
      '<header class="h2-head"><h1>HOW TO PLAY</h1><nav class="h2-dots" aria-label="Steps">' +
      STEPS.map(function (s, i) { return '<button type="button" data-go="' + i + '" aria-label="Step ' + (i + 1) + ': ' + s.title + '">' + (i + 1) + '</button>'; }).join('') +
      '</nav><button type="button" class="h2-skip" data-act="skip">Skip ➜</button></header>' +
      '<div class="h2-body"><div class="h2-stage"></div>' +
      '<aside class="h2-side"><span class="h2-tag">STEP <b class="h2-n"></b> / ' + STEPS.length + '</span><h2 class="h2-title"></h2><p class="h2-text"></p>' +
      '<div class="h2-nav"><button type="button" class="h2-prev" data-act="prev">← Back</button><button type="button" class="h2-next primary" data-act="next"></button></div></aside></div>';
    var stage = el.querySelector('.h2-stage');

    function show(i) {
      cur = Math.max(0, Math.min(STEPS.length - 1, i));
      var s = STEPS[cur];
      stage.innerHTML = slide(s, cur);
      el.querySelector('.h2-n').textContent = cur + 1;
      el.querySelector('.h2-title').textContent = s.title;
      el.querySelector('.h2-text').textContent = s.text;
      el.querySelector('.h2-prev').disabled = cur === 0;
      el.querySelector('.h2-next').textContent = cur === STEPS.length - 1 ? "Got it. Let's play!" : 'Next →';
      el.querySelectorAll('[data-go]').forEach(function (b, k) {
        b.classList.toggle('on', k === cur); b.classList.toggle('seen', k < cur);
        b.setAttribute('aria-current', k === cur ? 'step' : 'false');
      });
    }
    function finish() { if (el._done) el._done(); }
    el.addEventListener('click', function (e) {
      var go = e.target.closest('[data-go]'), act = e.target.closest('[data-act]');
      if (go) show(+go.dataset.go);
      else if (act && act.dataset.act === 'prev') show(cur - 1);
      else if (act && act.dataset.act === 'next') { if (cur === STEPS.length - 1) finish(); else show(cur + 1); }
      else if (act && act.dataset.act === 'skip') finish();
    });
    function key(e) {
      if (!el.isConnected) { document.removeEventListener('keydown', key); return; }
      if (e.key === 'ArrowRight' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (cur === STEPS.length - 1) finish(); else show(cur + 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); show(cur - 1); }
      else if (e.key === 'Escape') finish();
    }
    document.addEventListener('keydown', key);
    show(0);
  };
})();
