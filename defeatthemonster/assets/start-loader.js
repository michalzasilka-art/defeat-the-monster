// Start-up loading screen. Covers the game's own loader and waits for EVERYTHING:
//  - the files below (hero card videos + their stills, countdown, frames, titles, icons) which the game
//    does not preload itself, downloaded here;
//  - the game's own list (20 pictures + the 2 cutscenes needed first: the intro and the one between
//    round 1 and 2), read from its loader's counter so nothing is downloaded twice. The game downloads the
//    other 5 cutscenes (losing round 1, rounds 2 and 3) one by one in the background during the menu and round 1.
// It disappears once both are finished and the game has moved past its loader.
(() => {
  const OWN = [
    './video/stela-card-poster.jpg?v=1', './video/foxino-card-poster.jpg?v=1', './video/pix-card-poster.jpg?v=1', './video/charlie-card-poster.jpg?v=3',
    './video/stela-card.mp4?v=1', './video/foxino-card.mp4?v=1', './video/pix-card.mp4?v=1', './video/charlie-card.mp4?v=3',
    './art/card-frame.webp', './art/card-ring.webp', './art/hp-frame.webp', './art/start-frame.webp',
    './art/count-1.webp', './art/count-2.webp', './art/count-3.webp', './art/count-go.webp',
    './art/defeat-title.webp', './art/rob-won-title.webp',
    './assets/xp-badge.svg', './assets/xp-frame.svg', './assets/xp-swords.svg',
    // Rob in round 1 (assets/rob-video.js picks the same file: HEVC with alpha for Safari, WebM for the rest)
    './video/rob-level-1-poster.webp?v=2',
    /AppleWebKit/.test(navigator.userAgent) && !/Chrome|Chromium|CriOS|Edg|OPR|Firefox|FxiOS|Android/.test(navigator.userAgent) ? './video/rob-level-1.mov?v=2' : './video/rob-level-1.webm?v=2',
  ];
  const GAME_IMAGES = 20, GAME_VIDEOS = 2, VIDEO_WEIGHT = 6; // a cutscene counts like 6 pictures (they are ~10 MB each)
  const el = document.getElementById('sl');
  if (!el) return;
  const fill = el.querySelector('.sl-bar i'), pct = el.querySelector('.sl-pct'), what = el.querySelector('.sl-what');
  const heroes = [...el.querySelectorAll('.sl-hero')];
  let own = 0, gImg = 0, gVid = 0, gameLoaded = false, finished = false, shown = 0;

  const one = (src) => (/\.(mp4|webm|mov)/.test(src) ? fetch(src).then((r) => r.blob()) : new Promise((res) => { const im = new Image(); im.onload = im.onerror = res; im.src = src; }))
    .catch(() => {}).then(() => { own++; update(); });
  const queue = OWN.slice();
  const worker = async () => { while (queue.length) await one(queue.shift()); };
  Promise.all([worker(), worker(), worker(), worker()]).then(update);

  // read the game's own loader: "3 / 20 images · 1 / 2 cutscenes ready"; gone = the game is past loading
  function readGame() {
    const box = document.querySelector('#root .loading-screen');
    if (!box) { if (document.querySelector('#root')?.children.length) { gImg = GAME_IMAGES; gVid = GAME_VIDEOS; gameLoaded = true; } return; }
    const m = (box.querySelector('span')?.textContent || '').match(/(\d+)\s*\/\s*\d+\s*images.*?(\d+)\s*\/\s*\d+\s*cutscenes/);
    if (m) { gImg = +m[1]; gVid = +m[2]; }
    const failed = /interrupted/i.test(box.querySelector('h1')?.textContent || '');
    el.classList.toggle('err', failed);
  }
  function update() {
    readGame();
    const total = OWN.length + GAME_IMAGES + GAME_VIDEOS * VIDEO_WEIGHT;
    const done = own + gImg + gVid * VIDEO_WEIGHT;
    const p = Math.min(100, Math.floor(done / total * 100));
    shown = Math.max(shown, p); // never goes backwards
    fill.style.width = shown + '%'; pct.textContent = shown + '%';
    el.setAttribute('aria-valuenow', shown);
    heroes.forEach((h, i) => h.classList.toggle('on', shown >= (i + 1) * 25 - 1));
    what.textContent = own < OWN.length ? `Heroes & arena · ${own} / ${OWN.length}` : gVid < GAME_VIDEOS ? `Cutscenes · ${gVid} / ${GAME_VIDEOS}` : gImg < GAME_IMAGES ? `Pictures · ${gImg} / ${GAME_IMAGES}` : 'Ready!';
    if (!finished && own >= OWN.length && gameLoaded) {
      finished = true; fill.style.width = '100%'; pct.textContent = '100%'; heroes.forEach((h) => h.classList.add('on'));
      setTimeout(() => el.classList.add('done'), 400);
      setTimeout(() => el.remove(), 1100);
    }
  }
  el.querySelector('.sl-err button').addEventListener('click', () => { document.querySelector('#root .loading-screen button')?.click(); el.classList.remove('err'); });
  new MutationObserver(update).observe(document.getElementById('root'), {childList: true, subtree: true, characterData: true});
  setInterval(update, 400);
  update();
})();
