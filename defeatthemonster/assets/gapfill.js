/* Defeat the Monster asks gap-fill sentences, like Gummy the Fisherman: the same A0–A2 curriculum packages
   (assets/packages.js, built by Gummy the Fisherman/content/curriculum/build.py) and the same package browser
   (/shared/pack-picker.js). The game bundle asks window.dtmNext(round, playerId) for every question (the old
   missing-letter words are only used if this file is missing) and calls window.dtmNewRound() when a round starts.
   A question: {word: the whole right sentence, correct, prompt: "She ___ happy.", options, gap: true, before, after}.
   Round 1 asks the package's easy third first, round 2 the middle, round 3 the hardest; when a round's third has been
   used up it carries on with the rest, and only after every question of the package has come up do they repeat.
   Packages are chosen on the QUESTIONS card next to Start game; several can be ticked and their questions are mixed
   (round 1 = all their easy thirds, …). Kept in this browser (localStorage dtm.packs). */
(function () {
  var KEY = 'dtm.packs';
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  var PACKS = window.FugioPacks ? FugioPacks.sort(window.GUMMY_PACKAGES || []) : (window.GUMMY_PACKAGES || []);
  var packIds = []; try { packIds = JSON.parse(get(KEY) || '[]'); } catch (e) {}
  if (!Array.isArray(packIds)) packIds = [];
  if (!packIds.length && get('dtm.pack')) packIds = [get('dtm.pack')]; // the earlier single choice
  packIds = packIds.filter(function (id) { return PACKS.some(function (p) { return p.id === id; }); });
  if (!packIds.length && PACKS.length) packIds = [PACKS[0].id];
  var packNow = function () { return window.FugioPacks ? FugioPacks.merge(PACKS, packIds) : PACKS.find(function (p) { return p.id === packIds[0]; }) || null; };
  var used = new Set();
  window.dtmTaskLabel = 'Pick the right word';

  var shuffle = function (a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; };
  // answers of the same kind always sit in the same place (was before were, a before an, I do / I does …), as in Gummy
  var SLOT = new Set(['do', 'does', "don't", "doesn't", 'did', "didn't", 'was', 'were', "wasn't", "weren't", 'is', 'are', 'am',
    "isn't", "aren't", 'a', 'an', 'the', 'more', 'most', 'less', 'least', 'because', 'so', 'and', 'but', 'or', 'have', 'has', 'not']);
  var slotKey = function (t) { return t.toLowerCase().replace(/[^a-z' ]/g, '').split(/\s+/).filter(Boolean).map(function (w) { return SLOT.has(w) ? w : '_'; }).join(' '); };
  // comparisons: half the time "the tallest … of all" instead of "taller … than Ben" (as in Gummy)
  var mix = function (s) {
    var m = s.match(/^(.*)\[([^|\]]+)\|(the [^|\]]+)\]( \([^)]*\)) than [^.?!]*([.?!])$/);
    return m && Math.random() < .5 ? m[1] + '[' + m[3] + '|' + m[2] + ']' + m[4] + ' of all' + m[5] : s;
  };

  function toQuestion(s) {
    s = mix(s);
    var m = s.match(/\[([^\]]+)\]/); if (!m) return null;
    var parts = m[1].split('|'), right = parts[0];
    var opts = [right].concat(shuffle(parts.slice(1)).slice(0, 2));
    opts.sort(function (x, y) { return slotKey(x).localeCompare(slotKey(y)) || x.localeCompare(y); });
    var before = s.slice(0, m.index), after = s.slice(m.index + m[0].length);
    return {word: before + right + after, missing: 0, correct: right, prompt: before + '___' + after, options: opts, gap: true, before: before, after: after};
  }
  window.dtmNext = function (round) {
    var pk = packNow(); if (!pk) return null;
    var r = Math.max(0, Math.min(2, (round || 1) - 1));
    var mine = pk.rounds[r] || [], rest = pk.rounds.filter(function (_, i) { return i !== r; }).flat();
    var pick = function (list) { var free = list.filter(function (s) { return !used.has(s); }); return free.length ? free[Math.floor(Math.random() * free.length)] : null; };
    var s = pick(mine) || pick(rest);
    if (!s) { used = new Set(); s = pick(mine) || pick(rest); } // the whole package has been asked: start over
    if (!s) return null;
    used.add(s);
    return toQuestion(s);
  };
  window.dtmNewRound = function () {};
  // a new game asks every question afresh (the bundle resets the answer review at the same moment)
  function hookReview() {
    if (!window.dtmReview || window.dtmReview._gap) return;
    var reset = window.dtmReview.reset;
    window.dtmReview.reset = function () { used = new Set(); return reset.apply(this, arguments); };
    window.dtmReview._gap = true;
  }
  hookReview(); document.addEventListener('DOMContentLoaded', hookReview);

  // the QUESTIONS card next to Start game: the chosen package; tapping it opens the package browser
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]; }); };
  var LV = {A0: '#5ee08a', A1: '#4fb4ff', A2: '#b57bff'};
  function card() {
    var bottom = document.querySelector('.screen-setup .setup-bottom'); if (!bottom) return;
    var c = bottom.querySelector('.pack-card');
    var sum = window.FugioPacks ? FugioPacks.summary(PACKS, packIds) : {title: 'Questions', sub: '', level: '–'};
    var html = '<span class="eyebrow">QUESTIONS</span><span class="pc-lv" style="--c:' + (LV[sum.level] || '#ff9a3c') + '">' + esc(sum.level) + '</span>' +
      '<span class="pc-t"><b>' + esc(sum.title) + '</b><small>' + esc(sum.sub) + '</small></span>' +
      '<span class="pc-go" aria-hidden="true">&#10140;</span>';
    if (!c) {
      c = document.createElement('button'); c.type = 'button'; c.className = 'pack-card';
      c.setAttribute('aria-label', 'Choose the questions');
      c.addEventListener('click', function () {
        if (!window.FugioPacks) return;
        FugioPacks.open(PACKS, packIds, {theme: 'dtm', kicker: 'CHOOSE YOUR MISSION'}).then(function (ids) { if (ids && ids.length) { packIds = ids; set(KEY, JSON.stringify(ids)); used = new Set(); card(); } });
      });
      bottom.insertBefore(c, bottom.firstChild);
    }
    var key = packIds.join('+'); if (c.dataset.id !== key) { c.innerHTML = html; c.dataset.id = key; }
  }
  // longer sentences get a smaller size, so a sentence always fits in the card's screen (2–3 lines)
  function fit() {
    document.querySelectorAll('.battle-players .word-screen :is(strong,.waiting)').forEach(function (el) {
      var n = el.textContent.length, k = n <= 22 ? 1 : n <= 38 ? .88 : n <= 56 ? .76 : n <= 76 ? .66 : .58;
      var v = 'clamp(' + Math.round(16 * Math.max(k, .8)) + 'px,' + (1.45 * k).toFixed(2) + 'vw,' + Math.round(23 * k) + 'px)';
      if (el.style.getPropertyValue('--gf-size') !== v) el.style.setProperty('--gf-size', v);
    });
  }
  document.documentElement.classList.add('dtm-gap');
  // the menu and the cards are drawn by the game (React) and can be redrawn at any time: keep the card and sizes right
  new MutationObserver(function () { card(); fit(); }).observe(document.documentElement, {childList: true, subtree: true, characterData: true});
  document.addEventListener('DOMContentLoaded', card);
})();
