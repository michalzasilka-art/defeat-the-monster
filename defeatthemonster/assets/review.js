// Review answers: after the game, every sentence each player was asked (gap-fill, assets/gapfill.js), the word they
// picked and the right one. Old missing-letter questions (q.gap not set) still show as a word with the letter highlighted.
// The game bundle calls dtmReview.reset() on a new game, .round(n) when round n starts (a replay wipes that round),
// .log(...) on every answer, and .open(players) from the "Our Heroes!" screen.
(function () {
  const HEROES = [ // same order as the game: player 1..4
    {art: './art/stela.png', ring: '#a777ff'},
    {art: './art/foxino.png', ring: '#ff9a38'},
    {art: './art/pix.png', ring: '#7dde99'},
    {art: './art/charlie.png', ring: '#b8c5dc'},
  ];
  const ROUNDS = [1, 2, 3];
  let log = {}; // player id -> {1: [entries], 2: [...], 3: [...]}

  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
  const hero = (p, i) => HEROES[(p.hero ?? i) % HEROES.length];
  const rounds = (id) => (log[id] = log[id] || {1: [], 2: [], 3: []});

  window.dtmReview = {
    reset() { log = {}; },
    round(n) { Object.values(log).forEach((r) => ROUNDS.forEach((k) => { if (k >= n) r[k] = []; })); },
    log(round, player, q, pick, ok) {
      if (!player || !q) return;
      rounds(player.id)[round].push({word: q.word, missing: q.missing, correct: q.correct, options: [...q.options], pick: pick ?? null, ok: !!ok,
        gap: !!q.gap, before: q.before, after: q.after});
    },
    open: show,
  };

  // the sentence with the right word in the gap (or the word with its missing letter), highlighted
  const wordHtml = (e) => e.gap ? `${esc(e.before)}<b class="dr-gap">${esc(e.correct)}</b>${esc(e.after)}`
    : [...e.word].map((ch, i) => i === e.missing ? `<b class="dr-gap">${esc(ch)}</b>` : esc(ch)).join('');

  function entryHtml(e, k) {
    const opts = e.options.map((o, i) => {
      const cls = o === e.correct ? 'g' : o === e.pick ? 'r' : '';
      return `<span class="dr-opt ${cls}"><small>${i + 1}</small>${esc(o)}${o === e.pick ? '<em>PICKED</em>' : ''}</span>`;
    }).join('');
    const note = e.pick === null ? '<span class="dr-note">&#9203; Time ran out</span>'
      : e.ok ? '' : `<span class="dr-note">Picked <b class="r">${esc(e.pick)}</b> &middot; right ${e.gap ? 'word' : 'letter'} <b class="g">${esc(e.correct)}</b></span>`;
    return `<div class="dr-ans"><span class="dr-dot ${e.ok ? 'ok' : 'no'}">${k + 1}</span><div>
      <div class="dr-word${e.gap ? ' gap' : ''}">${wordHtml(e)}</div><div class="dr-opts${e.gap ? ' gap' : ''}">${opts}</div>${note}</div></div>`;
  }

  function show(players) {
    if (!players || !players.length) return;
    document.querySelectorAll('.dtm-review').forEach((x) => x.remove());
    const el = document.createElement('div');
    el.className = 'dtm-review';
    el.innerHTML = `<div class="dr-top"><div><span class="dr-eyebrow">MISSION DEBRIEF</span><h2>Review answers</h2></div>
      <div class="dr-actions"><button class="secondary" data-drdl>&#11015; Download</button><button class="primary" data-drclose>Back to heroes</button>
        <div class="dr-menu" hidden><div class="dr-mh">DOWNLOAD A4 PDF FOR</div>
          <button data-pdf="all"><span class="dr-allic">&#9733;</span>All players</button>
          ${players.map((p, i) => `<button data-pdf="${i}" style="--hero:${hero(p, i).ring}"><img src="${hero(p, i).art}" alt="">${esc(p.name)}</button>`).join('')}</div></div></div>
      <div class="dr-cols" style="--n:${players.length}">${players.map((p, i) => {
        const r = rounds(p.id), all = ROUNDS.flatMap((k) => r[k]), right = all.filter((e) => e.ok).length;
        return `<div class="dr-col" style="--hero:${hero(p, i).ring}"><div class="dr-head"><span class="dr-portrait"><img src="${hero(p, i).art}" alt=""></span>
            <b>${esc(p.name)}</b><span>${right}/${all.length} right</span></div>
          ${ROUNDS.map((k) => `<div class="dr-round ${k === 1 ? 'open' : ''}" data-r="${k}">
            <button class="dr-rh"><span class="nm">Round ${k}</span><span class="dr-dots">${r[k].map((e) => `<span class="dr-dot ${e.ok ? 'ok' : 'no'}"></span>`).join('')}</span><i>&#9662;</i></button>
            <div class="dr-body">${r[k].map(entryHtml).join('') || '<span class="dr-note">No answers this round</span>'}</div></div>`).join('')}</div>`;
      }).join('')}</div>`;
    document.body.appendChild(el);
    const menu = el.querySelector('.dr-menu');
    el.onclick = (e) => {
      if (e.target.closest('[data-drclose]')) { el.remove(); return; }
      if (e.target.closest('[data-drdl]')) { menu.hidden = !menu.hidden; return; }
      const pick = e.target.closest('[data-pdf]');
      if (pick) { menu.hidden = true; download(pick.dataset.pdf === 'all' ? players : [players[+pick.dataset.pdf]]); return; }
      if (!e.target.closest('.dr-menu')) menu.hidden = true;
      const h = e.target.closest('.dr-rh'); if (!h) return;
      // open/close the same round in every column, so the players stay side by side
      const k = h.parentElement.dataset.r, open = !h.parentElement.classList.contains('open');
      el.querySelectorAll(`.dr-round[data-r="${k}"]`).forEach((x) => x.classList.toggle('open', open));
    };
    const onKey = (e) => { if (e.key === 'Escape' && el.isConnected) { e.stopPropagation(); el.remove(); } };
    window.addEventListener('keydown', onKey, true);
    new MutationObserver((_, mo) => { if (!el.isConnected) { window.removeEventListener('keydown', onKey, true); mo.disconnect(); } }).observe(document.body, {childList: true});
  }

  // A4 PDF of every answer (jsPDF, loaded only when someone downloads). One page (or more) per player.
  let jsPdfLoad = null;
  function loadJsPdf() {
    return jsPdfLoad = jsPdfLoad || new Promise((res, rej) => {
      const sc = document.createElement('script');
      sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      sc.onload = () => res(window.jspdf.jsPDF); sc.onerror = () => { jsPdfLoad = null; rej(new Error('PDF library failed to load')); };
      document.head.appendChild(sc);
    });
  }
  async function download(list) {
    let JsPDF;
    try { JsPDF = await loadJsPdf(); } catch (e) { alert('Could not create the PDF (no internet?). Try again.'); return; }
    const doc = new JsPDF({unit: 'mm', format: 'a4'});
    const W = 210, H = 297, M = 16, maxW = W - 2 * M;
    // the built-in PDF font only knows Western letters, so accents are dropped (č -> c)
    const t = (x) => String(x ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\x20-\x7e]/g, '');
    const C = {ink: [20, 30, 50], muted: [110, 120, 140], g: [22, 140, 75], r: [200, 45, 50], line: [220, 226, 236], band: [238, 234, 252]};
    const color = (c) => doc.setTextColor(...c);
    let y = M;
    const room = (h) => { if (y + h > H - M) { doc.addPage(); y = M; } };
    const date = new Date().toLocaleDateString('en-GB', {day: 'numeric', month: 'long', year: 'numeric'});
    list.forEach((p, n) => {
      if (n) { doc.addPage(); y = M; }
      const r = rounds(p.id), all = ROUNDS.flatMap((k) => r[k]), right = all.filter((e) => e.ok).length;
      color(C.muted); doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
      doc.text('DEFEAT THE MONSTER  -  ANSWER REVIEW', M, y); doc.text(t(date), W - M, y, {align: 'right'}); y += 9;
      color(C.ink); doc.setFontSize(22); doc.text(t(p.name), M, y); y += 7;
      color(C.muted); doc.setFont('helvetica', 'normal'); doc.setFontSize(11);
      doc.text(t(`${right} of ${all.length} right  -  ${Math.max(0, p.damage || 0)} XP`), M, y); y += 4;
      doc.setDrawColor(...C.line); doc.setLineWidth(.5); doc.line(M, y, W - M, y); y += 7;
      ROUNDS.forEach((k) => {
        room(16);
        doc.setFillColor(...C.band); doc.roundedRect(M, y - 5, maxW, 8, 2, 2, 'F');
        color(C.ink); doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.text(`Round ${k}`, M + 3, y + .6);
        const rr = r[k].filter((e) => e.ok).length;
        color(r[k].length && rr === r[k].length ? C.g : rr ? C.ink : C.r); doc.text(`${rr}/${r[k].length} right`, W - M - 3, y + .6, {align: 'right'});
        y += 9;
        if (!r[k].length) { color(C.muted); doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.text('No answers this round', M + 7, y); y += 7; return; }
        r[k].forEach((e, i) => {
          room(13);
          doc.setFillColor(...(e.ok ? C.g : C.r)); doc.circle(M + 2.2, y - 1.3, 2.2, 'F');
          doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.text(String(i + 1), M + 2.2, y - .3, {align: 'center'});
          // the sentence with the right word (or the word with its missing letter) in green and underlined
          let x = M + 7; doc.setFontSize(e.gap ? 11 : 13);
          if (e.gap) { // a long sentence gets smaller until it fits on its line
            doc.setFont('helvetica', 'bold');
            for (let fs = 11; fs > 7 && doc.getTextWidth(t(e.before + e.correct + e.after)) > maxW - 9; fs -= .5) doc.setFontSize(fs);
          }
          const bits = e.gap ? [[e.before, false], [e.correct, true], [e.after, false]] : [...e.word].map((ch, j) => [ch, j === e.missing]);
          bits.forEach(([txt, hit]) => {
            if (!txt) return;
            doc.setFont('helvetica', 'bold'); color(hit ? C.g : C.ink);
            doc.text(t(txt), x, y); const w = doc.getTextWidth(t(txt));
            if (hit) { doc.setDrawColor(...C.g); doc.setLineWidth(.4); doc.line(x, y + 1, x + w, y + 1); }
            x += w + (e.gap ? 0 : .3);
          });
          const head = e.pick === null ? 'WRONG - time ran out' : e.ok ? 'RIGHT' : 'WRONG';
          // a sentence uses the whole line, so its RIGHT / WRONG goes on the answers line below
          color(e.ok ? C.g : C.r); doc.setFontSize(10); doc.text(head, W - M, e.gap ? y + 5.5 : y, {align: 'right'}); y += 5.5;
          x = M + 7; doc.setFontSize(10);
          e.options.forEach((o) => {
            const c = o === e.correct ? C.g : o === e.pick ? C.r : C.muted;
            doc.setFont('helvetica', o === e.correct || o === e.pick ? 'bold' : 'normal'); color(c);
            const label = t(o) + (o === e.pick ? ' (picked)' : '');
            doc.text(label, x, y); x += doc.getTextWidth(label) + 8;
          });
          y += 7;
        });
        y += 3;
      });
    });
    const who = list.length > 1 ? 'all-players' : t(list[0].name).toLowerCase().replace(/[^a-z0-9]+/g, '-');
    doc.save(`defeat-the-monster-answers-${who}-${new Date().toISOString().slice(0, 10)}.pdf`);
  }
})();
