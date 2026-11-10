/* Game mode switch on the menu: CLASSIC or PRO-MODE (stored as 'test2'). Pro-Mode is locked until a team wins the whole game
   (the "City saved / mission complete" screen); after that the menu can switch to it. In Pro-Mode, round 1 is the
   white robot (assets/rob-video.js asks window.dtmMode()) with white-hot red lava lasers (assets/lava-beam.css),
   Pro-Mode has 3 rounds (no cutscenes yet, window.dtmPro is read by the game bundle): 1 = the white robot, 2 = the laptop
   "cure upload" (assets/cure.js), 3 = the white robot again.
   Pro-Mode also caps the answer time at 8 s (was 5 s with single letters): the bundle clamps it while dtmPro() is true; the menu slider shows the cap.
   Unlock and choice are kept in this browser (localStorage). */
(function () {
  var KEY_UNLOCK = 'dtm.test2.unlocked', KEY_MODE = 'dtm.mode';
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  var unlocked = get(KEY_UNLOCK) === '1';
  var mode = unlocked && get(KEY_MODE) === 'test2' ? 'test2' : 'classic';
  window.dtmMode = function () { return mode; };
  // Pro-Mode skips the cutscenes between rounds (the game bundle asks this)
  window.dtmPro = function () { return mode === 'test2'; };
  function apply() { document.documentElement.dataset.dtmMode = mode; }
  var SHIELD = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5z" fill="currentColor" opacity=".25"/><path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="m8.5 12 2.5 2.5 4.5-5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var FLAME = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2c1 4 5 6 5 11a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5 0 2 1 3 2 3 0-4-1-6 1-9.5z" fill="currentColor"/><path d="M12 14c.6 1.5 2 2.2 2 3.8a2 2 0 0 1-4 0c0-1.3.9-2 2-3.8z" fill="#fff"/></svg>';
  // difficulty: Pro-Mode is the harder second half of the story (3 flames vs 1)
  var FL = '<i>' + '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2c1 4 5 6 5 11a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5 0 2 1 3 2 3 0-4-1-6 1-9.5z" fill="currentColor"/></svg></i>';
  var LOCK = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2" fill="currentColor"/><path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="2.4"/></svg>';

  function card() {
    var box = document.querySelector('.screen-setup .setup-controls');
    if (!box) return;
    var tab = box.querySelector('.mode-tab');
    if (!tab) {
      tab = document.createElement('div'); tab.className = 'mode-tab';
      tab.innerHTML = '<span class="eyebrow">GAME MODE</span><div class="mode-card" role="group" aria-label="Game mode">' +
        '<button type="button" data-mode="classic"><span class="mc-part">STORY <b>1</b>/2<i class="on"></i><i></i></span><span class="mc-top"><i class="mc-ic">' + SHIELD + '</i><b>CLASSIC</b></span><small>Basic game with immersive experience</small><span class="mc-diff">' + FL + FL.replace('<i>', '<i class="off">') + FL.replace('<i>', '<i class="off">') + 'NORMAL</span></button>' +
        '<button type="button" data-mode="test2"><span class="mc-part">STORY <b>2</b>/2<i class="on"></i><i class="on"></i></span><span class="mc-lock">' + LOCK + 'LOCKED</span><span class="mc-top"><i class="mc-ic">' + FLAME + '</i><b>PRO-MODE</b></span><small>ONLY for professionals</small><span class="mc-diff">' + FL + FL + FL + 'HARD</span></button></div>';
      tab.addEventListener('click', function (e) {
        var b = e.target.closest('[data-mode]'); if (!b) return;
        if (b.dataset.mode === 'test2' && !unlocked) {
          b.classList.remove('nope'); void b.offsetWidth; b.classList.add('nope');
          var sm = b.querySelector('small'); sm.textContent = 'Win all 3 rounds to unlock';
          clearTimeout(b._t); b._t = setTimeout(function () { sm.textContent = 'ONLY for professionals'; }, 1800);
          return;
        }
        mode = b.dataset.mode; set(KEY_MODE, mode); apply(); paint(tab);
        if (window.dtmRerender) window.dtmRerender(); // Pro-Mode caps the answer time at 8 s (game bundle)
      });
      var how = box.querySelector('.howto-tab');
      box.insertBefore(tab, how || null);
    }
    paint(tab);
  }
  function paint(tab) {
    tab.querySelectorAll('[data-mode]').forEach(function (b) {
      b.classList.toggle('on', b.dataset.mode === mode);
      b.setAttribute('aria-pressed', b.dataset.mode === mode);
    });
    var t = tab.querySelector('[data-mode="test2"]');
    t.classList.toggle('locked', !unlocked);
    t.setAttribute('aria-disabled', !unlocked);
  }
  // winning the whole game unlocks TEST2 (once), with a banner on the victory screen
  function victory() {
    var win = document.querySelector('.podium-screen.final-heroes');
    if (!win || win.querySelector('.test2-unlocked')) return;
    var fresh = !unlocked;
    unlocked = true; set(KEY_UNLOCK, '1');
    if (fresh) {
      var b = document.createElement('div'); b.className = 'test2-unlocked';
      b.innerHTML = '<b>NEW MODE UNLOCKED: PRO-MODE</b><small>Switch to it on the menu</small>';
      win.appendChild(b);
    }
  }
  function scan() { card(); victory(); }
  function start() { apply(); new MutationObserver(scan).observe(document.body, {childList: true, subtree: true}); scan(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
