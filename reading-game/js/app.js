/* Treasure Island Readers - app shell: screens, game host, shop, grown-ups. Loaded last. */
(function () {
  'use strict';
  var RG = window.RG, h = RG.el;
  var root = document.getElementById('app');
  var screenToken = 0;      // changes on every screen switch (lets async work detect navigation)
  var session = null;       // active game session

  /* ---------- background ---------- */
  document.body.insertBefore(h('div', { class: 'ocean', 'aria-hidden': 'true' },
    h('div', { class: 'sun', text: '☀️' }),
    h('div', { class: 'cloud c1', text: '☁️' }),
    h('div', { class: 'cloud c2', text: '☁️' }),
    h('div', { class: 'waves' }, h('div', { class: 'wave w1' }), h('div', { class: 'wave w2' }), h('div', { class: 'wave w3' }))
  ), root);

  function show(node) {
    endSession();
    screenToken++;
    root.innerHTML = '';
    root.appendChild(node);
    try { RG.coins.refresh(); } catch (e) { /* ignore */ }
    // a rank-up earned mid-game celebrates once the child is off the game screen
    if (!node.querySelector('.game-stage')) { try { RG.flushRankUp(4500); } catch (e) { /* ignore */ } }
  }
  function toast(msg, ms) {
    var t = h('div', { class: 'pill toast', role: 'status', text: msg, style: 'position:fixed;left:50%;bottom:30px;transform:translateX(-50%);z-index:3000;max-width:90vw;text-align:center' });
    document.body.appendChild(t);
    setTimeout(function () { if (t.parentNode) t.remove(); }, ms || 2600);
  }

  /* ---------- full screen ---------- */
  var FS_ICON_ON = '<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 4v5H4M20 9h-5V4M15 20v-5h5M4 15h5v5"/></svg>';
  var FS_ICON_OFF = '<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/></svg>';
  function fsHint(force) {
    // friendly one-time toast when full screen is unavailable or refused (iPhone Safari, sandboxed iframes)
    if (!force) { if (RG.settings.fsHinted) return; RG.settings.fsHinted = true; RG.saveSettings(); }
    toast(RG.fullscreen.isIOS()
      ? 'For full screen: tap Share, then Add to Home Screen.'
      : "Full screen isn't available here. Try opening the game in its own browser tab.", 5200);
  }
  function syncFs(btn) {
    var on = RG.fullscreen.active();
    btn.classList.toggle('on', on);
    btn.setAttribute('aria-label', on ? 'Exit full screen' : 'Full screen');
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    var ic = btn.querySelector('.fs-ic'); if (ic) ic.innerHTML = on ? FS_ICON_ON : FS_ICON_OFF;
  }
  RG.fullscreen.onchange(function () {
    Array.prototype.forEach.call(document.querySelectorAll('.fs-toggle'), syncFs);
  });
  // returns null (nothing drawn) when full screen cannot work here
  function fsButton(withLabel) {
    if (!RG.fullscreen.supported()) return null;
    var b = h('button', { class: (withLabel ? 'btn' : 'iconbtn') + ' fs-toggle', type: 'button' },
      h('span', { class: 'fs-ic' }), withLabel ? h('span', { class: 'fs-lbl', text: 'Full screen' }) : null);
    syncFs(b);
    return press(b, function () {
      RG.fullscreen.toggle().then(function (ok) { if (!ok) fsHint(true); });
    });
  }
  function press(btn, fn) {
    btn.addEventListener('click', function (e) { try { RG.sfx.pop(); } catch (x) { /* ignore */ } fn(e); });
    return btn;
  }
  function modal(contentBuilder) {
    var m = h('div', { class: 'modal' });
    var sheet = h('div', { class: 'sheet' });
    function close() { if (m.parentNode) { m.remove(); if (typeof sheet._onclose === 'function') { try { sheet._onclose(); } catch (e) { /* ignore */ } } } }
    m.addEventListener('click', function (e) { if (e.target === m) close(); });
    sheet.appendChild(press(h('button', { class: 'btn round close', 'aria-label': 'Close', text: '✖' }), close));
    contentBuilder(sheet, close);
    m.appendChild(sheet);
    document.body.appendChild(m);
    return { close: close, sheet: sheet, el: m };
  }

  /* ---------- boat (shows shop items) ---------- */
  function boatSVG(profile, equipped) {
    var eq = equipped || {}, g = RG.shop;
    function it(cat) { return eq[cat] ? g.get(eq[cat]) : null; }
    var hull = it('hull'), sail = it('sail'), flag = it('flag'), pet = it('pet'), hat = it('hat');
    var hullC = hull ? hull.color : '#b9783a';
    var sailFill = '#ffffff', sailMark = '';
    if (sail) {
      sailFill = sail.color === 'rainbow' ? 'url(#rbw)' : sail.color;
      if (sail.mark) sailMark = '<text x="150" y="92" font-size="30" text-anchor="middle">' + sail.mark + '</text>';
    }
    var flagSvg = flag
      ? '<text x="132" y="34" font-size="26" text-anchor="middle">' + flag.emoji + '</text>'
      : '<path d="M118 14 L146 24 L118 34Z" fill="#ff5e5e"/>';
    var petSvg = '';
    if (pet) {
      if (pet.id === 'pet-dolphin') petSvg = '<text x="205" y="178" font-size="40" text-anchor="middle">' + pet.emoji + '</text>';
      else petSvg = '<text x="165" y="120" font-size="34" text-anchor="middle">' + pet.emoji + '</text>';
    }
    var hatSvg = hat ? '<text x="84" y="84" font-size="28" text-anchor="middle">' + hat.emoji + '</text>' : '';
    return '<svg viewBox="0 0 230 190" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<defs><linearGradient id="rbw" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff5e7e"/><stop offset=".25" stop-color="#ffc93c"/><stop offset=".5" stop-color="#34c759"/><stop offset=".75" stop-color="#4cc3ff"/><stop offset="1" stop-color="#a77bff"/></linearGradient></defs>' +
      '<rect x="113" y="14" width="6" height="108" rx="3" fill="#7a4a1e"/>' +
      '<path d="M121 30 L121 112 L190 112Z" fill="' + sailFill + '" stroke="#12395e" stroke-width="3" stroke-linejoin="round"/>' +
      '<path d="M111 44 L111 112 L56 112Z" fill="' + (sail && sail.color !== 'rainbow' ? sailFill : '#ffe9a8') + '" stroke="#12395e" stroke-width="3" stroke-linejoin="round"/>' +
      sailMark + flagSvg +
      '<text x="84" y="122" font-size="44" text-anchor="middle">' + profile.avatar + '</text>' + hatSvg + petSvg +
      '<path d="M24 118 H206 L180 164 Q176 172 164 172 H66 Q54 172 50 164Z" fill="' + hullC + '" stroke="#12395e" stroke-width="4" stroke-linejoin="round"/>' +
      '<path d="M34 134 H196" stroke="#fff" stroke-opacity=".55" stroke-width="5" stroke-linecap="round"/>' +
      '<circle cx="80" cy="150" r="6" fill="#fff" stroke="#12395e" stroke-width="2"/><circle cx="115" cy="150" r="6" fill="#fff" stroke="#12395e" stroke-width="2"/><circle cx="150" cy="150" r="6" fill="#fff" stroke="#12395e" stroke-width="2"/>' +
      '<path d="M20 176 Q45 166 70 176 T120 176 T170 176 T220 176" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".8"/>' +
      '</svg>';
  }
  function boatEl() {
    var p = RG.profile();
    return h('div', { class: 'map-boat', html: boatSVG(p, RG.shop.equipped()) });
  }

  /* ---------- grown-ups hold gate ---------- */
  // attaches a 3-second press-and-hold gate to any button; fn runs only after a full hold
  function holdGate(btn, fn, hint) {
    var ring = h('div', { class: 'hold-ring' });
    ring.style.webkitMask = ring.style.mask = 'radial-gradient(circle, transparent 58%, #000 60%)';
    btn.appendChild(ring);
    var active = false, t0 = 0, raf = 0, MS = 3000;
    function frame() {
      if (!active) return;
      var p = Math.min(1, (performance.now() - t0) / MS);
      ring.style.background = 'conic-gradient(#2fbf5b ' + (p * 360) + 'deg, rgba(255,255,255,.35) 0)';
      if (p >= 1) { stop(true); return; }
      raf = requestAnimationFrame(frame);
    }
    function start(e) {
      if (active) return; active = true; t0 = performance.now(); btn.classList.add('holding'); frame();
      if (e && e.preventDefault && e.type !== 'pointerdown') e.preventDefault();
    }
    function stop(done) {
      if (!active) return; active = false; cancelAnimationFrame(raf); btn.classList.remove('holding');
      if (done === true) fn(); else toast(hint || 'Grown-ups: hold the gear for 3 seconds');
    }
    btn.addEventListener('pointerdown', start);
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) { btn.addEventListener(ev, function () { stop(false); }); });
    btn.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (!e.repeat) start(e); } });
    btn.addEventListener('keyup', function (e) { if (e.key === 'Enter' || e.key === ' ') stop(false); });
    btn.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    return btn;
  }
  function gearButton() {
    return holdGate(h('button', { class: 'iconbtn', 'aria-label': 'Grown-ups: hold for 3 seconds', text: '⚙️', style: '-webkit-touch-callout:none' }), openGrownUps);
  }

  /* ---------- start ---------- */
  function startScreen() {
    var s = h('div', { class: 'screen start' },
      h('div', { style: 'position:absolute;top:10px;right:10px' }, gearButton()),
      h('div', { class: 'boat-hero', text: '⛵' }),
      h('h1', { text: 'Treasure Island Readers' }),
      h('div', { class: 'subtitle', text: 'Sail, read, and find treasure!' }),
      press(h('button', { class: 'btn primary', text: 'Tap to start ⛵' }), function () {
        RG.unlockAudio();
        // full screen must be requested inside this tap (user gesture)
        if (RG.settings.autoFullscreen !== false) RG.fullscreen.enter().then(function (ok) { if (!ok) fsHint(false); });
        RG.speak('Welcome aboard, captain!', { mood: 'excited' });
        pickScreen();
      }));
    show(s);
  }

  /* ---------- profile picker ---------- */
  function pickScreen(quiet) {
    var cards = RG.profiles().map(function (p) {
      return press(h('button', { class: 'captain-card' },
        h('div', { class: 'av', text: p.avatar }),
        h('div', { text: p.name }),
        h('small', { text: p.track === 'little' ? 'Letters & sounds' : 'Words & stories' })), function () {
        RG.setActiveProfile(p.id);
        mapScreen(true);
      });
    });
    var s = h('div', { class: 'screen pick' },
      h('div', { style: 'position:absolute;top:10px;right:10px' }, gearButton()),
      h('h2', { text: 'Who is sailing today?' }),
      h('div', { class: 'captains' }, cards));
    show(s);
    if (quiet !== true) RG.speak('Who is sailing today?', { mood: 'question' });
  }

  /* ---------- map ---------- */
  // map order for the big track (games that are not registered are simply skipped)
  var BIG_ORDER = ['rhyme-boat', 'word-builder', 'blend-cannon', 'syllable-saw', 'sight-fishing', 'sentence-match', 'story-cove', 'reading-quest', 'captains-quiz'];
  function orderIslands(games, track) {
    var quiz = games.filter(function (g) { return g.id === RG.CHALLENGE_ID; })[0];
    var normal = games.filter(function (g) { return g.id !== RG.CHALLENGE_ID; });
    if (track === 'big') {
      var rank = function (g) { var i = BIG_ORDER.indexOf(g.id); return i < 0 ? 100 : i; };
      normal = normal.map(function (g, i) { return { g: g, i: i }; })
        .sort(function (a, b) { return rank(a.g) - rank(b.g) || a.i - b.i; }).map(function (x) { return x.g; });
    }
    return { quiz: quiz, ordered: normal.concat(quiz ? [quiz] : []) };
  }
  // kid-facing growth line: only ever compares him with himself
  function growthLine() {
    var w = RG.progress.weekly(), parts = [];
    if (w.learned > 0) parts.push('You learned ' + w.learned + ' new word' + (w.learned === 1 ? '' : 's') + ' this week!');
    if (w.stories > 0) parts.push('You read ' + w.stories + ' stor' + (w.stories === 1 ? 'y' : 'ies') + '!');
    if (!parts.length && w.voyages > 0) parts.push('You finished ' + w.voyages + ' voyage' + (w.voyages === 1 ? '' : 's') + ' this week!');
    return parts.join(' ');
  }

  function mapScreen(greet) {
    if (!RG.progress.placed()) { checkIn(); return; }
    var p = RG.profile(), rk = RG.rank();
    var games = RG.games.filter(function (g) { return !g.tracks || g.tracks.indexOf(p.track) >= 0; });
    var od = orderIslands(games, p.track), quiz = od.quiz, ordered = od.ordered;

    var path = h('div', { class: 'path' });
    var pattern = ['l', 'm', 'r', 'm'];
    var ch = RG.progress.challenge();
    var recommended = RG.progress.recommended();
    ordered.forEach(function (g, i) {
      var isQ = g === quiz, locked = isQ && ch.locked;
      var pending = ch.locked && !isQ && ch.missing.indexOf(g.id) >= 0;
      var practice = !isQ && recommended.indexOf(g.id) >= 0;
      var b = h('button', { class: 'island' + (isQ ? ' challenge' : '') + (locked ? ' locked' : '') + (pending ? ' pending' : ''), 'aria-label': g.title, 'aria-disabled': locked ? 'true' : false, dataset: { id: g.id } },
        h('div', { class: 'land', text: g.emoji }),
        h('div', { class: 'name', text: isQ ? "Captain's Challenge" : g.title }),
        locked ? h('div', { class: 'lock-badge', 'aria-hidden': 'true', text: '🔒' }) : null,
        locked ? h('div', { class: 'prog-badge', text: ch.done + ' of ' + ch.total }) : null,
        pending ? h('div', { class: 'new-mark', text: '✨ new' }) : null,
        practice ? h('div', { class: 'practice-flag', text: '🚩 Practice me!' }) : null);
      var busy = false;
      press(b, function () {
        if (busy) return;
        var now = RG.progress.challenge();
        if (isQ && now.locked) { // gentle "not yet": explain and pulse what is left
          var n = now.missing.length, msg = 'Finish all the other islands first! Just ' + n + ' more to go.';
          RG.speak(msg, { mood: 'gentle' });
          toast(msg, 3200);
          RG.wobble(b);
          Array.prototype.forEach.call(path.querySelectorAll('.island.pending'), function (x) {
            x.classList.remove('nudge'); void x.offsetWidth; x.classList.add('nudge');
            setTimeout(function () { x.classList.remove('nudge'); }, 2600);
          });
          return;
        }
        busy = true;
        b.classList.add('go');
        var tok = screenToken;
        var say = RG.speak(g.blurb || g.title, { mood: 'happy' });
        Promise.race([say, RG.wait(3200)]).then(function () {
          if (tok === screenToken) launch(g); else busy = false;
        });
      });
      path.appendChild(h('div', { class: 'island-row ' + (isQ ? 'm' : pattern[i % 4]) }, b));
    });
    if (!ordered.length) path.appendChild(h('div', { class: 'empty-note', text: 'No islands to explore yet!' }));

    var top = h('div', { class: 'topbar' },
      h('div', { class: 'grp' },
        press(h('button', { class: 'iconbtn', 'aria-label': 'Switch captain', text: p.avatar }), pickScreen),
        h('div', { class: 'pill rank-badge' }, h('span', { text: rk.emoji }),
          h('div', {}, h('div', { text: rk.name }), h('small', { text: rk.next ? rk.coinsToNext + ' 🪙 to ' + rk.next : 'Top rank!' })))),
      h('div', { class: 'grp' },
        h('div', { class: 'pill coin-pill', 'aria-label': 'Gold coins' }, '🪙', h('span', { class: 'coin-count', text: RG.coins.balance() })),
        h('div', { class: 'pill', 'aria-label': 'Stars' }, '⭐', h('span', { text: RG.progress.stars() })),
        gearButton()));

    var tools = h('div', { class: 'toolbar' },
      press(h('button', { class: 'btn' }, '🏪 Shop'), openShop),
      press(h('button', { class: 'btn' }, '📒 Stickers'), openStickers),
      press(h('button', { class: 'btn' }, '📜 Why Read?'), openWhyRead),
      fsButton(true));

    var gl = growthLine();
    var s = h('div', { class: 'screen' }, top,
      h('div', { class: 'scroll' }, h('div', { class: 'map-body' }, boatEl(),
        gl ? h('div', { class: 'growth', role: 'status', text: '🌟 ' + gl }) : null, path)), tools);
    show(s);
    if (quiz && ch.allDone && !ch.unlocked) { // first return to the map after the final voyage
      RG.progress.setUnlocked(true);
      var utok = screenToken;
      setTimeout(function () { if (utok === screenToken) unlockCelebration(); }, 500);
    } else if (greet) RG.speak('Ahoy, ' + p.name + '! Pick an island.', { mood: 'happy' });
  }

  function unlockCelebration() {
    var overlay = h('div', { class: 'rankup unlock', role: 'dialog' },
      h('div', { class: 'rankup-card' },
        h('div', { class: 'rankup-emoji', text: '🏆' }),
        h('div', { class: 'rankup-title', text: 'The Challenge Island is open!' }),
        h('div', { class: 'rankup-text', text: "You finished every island. Ready for the Captain's Challenge?" }),
        h('button', { class: 'btn primary', text: 'Hooray!', on: { click: function () { overlay.remove(); } } })));
    document.body.appendChild(overlay);
    RG.sfx.win(); RG.celebrate(overlay.querySelector('.rankup-emoji'));
    RG.speak('The Challenge Island is open!', { mood: 'excited' });
    var isl = root.querySelector('.island.challenge'); if (isl) isl.classList.add('just-unlocked');
    setTimeout(function () { if (overlay.parentNode) overlay.remove(); }, 7000);
  }

  /* ---------- shop ---------- */
  function openShop() {
    modal(function (sheet) {
      var body = h('div');
      sheet.appendChild(h('h2', { text: '🏪 Harbor Shop' }));
      sheet.appendChild(body);
      var cats = [['hull', 'Boat colors'], ['sail', 'Sails'], ['flag', 'Flags'], ['pet', 'Pets'], ['hat', 'Hats']];
      function render() {
        body.innerHTML = '';
        var bal = RG.coins.balance(), eq = RG.shop.equipped();
        body.appendChild(h('div', { class: 'shop-preview' }, h('div', { class: 'map-boat', html: boatSVG(RG.profile(), eq) })));
        body.appendChild(h('div', { class: 'pill coin-pill', style: 'margin-bottom:8px' }, '🪙', h('span', { class: 'coin-count', text: bal }), ' to spend'));
        cats.forEach(function (c) {
          body.appendChild(h('h3', { text: c[1] }));
          var grid = h('div', { class: 'shop-grid' });
          RG.shop.items.filter(function (i) { return i.cat === c[0]; }).forEach(function (item) {
            var owned = RG.shop.owned(item.id), on = eq[item.cat] === item.id, can = bal >= item.price;
            var pv = item.emoji ? h('div', { class: 'pv', text: item.emoji })
              : h('div', { class: 'pv' }, h('div', { class: 'sw', style: 'background:' + (item.color === 'rainbow' ? 'linear-gradient(90deg,#ff5e7e,#ffc93c,#34c759,#4cc3ff,#a77bff)' : item.color) }));
            var btn = h('button', { class: 'btn small ' + (owned ? (on ? 'green' : '') : (can ? 'primary' : '')), text: owned ? (on ? 'On!' : 'Wear') : '🪙 ' + item.price });
            press(btn, function () {
              if (owned) { RG.shop.toggle(item.id); render(); return; }
              if (RG.shop.buy(item.id)) { RG.celebrate(btn); RG.sfx.win(); RG.speak('You got the ' + item.name + '!'); render(); }
              else { RG.wobble(btn); RG.speak('Collect more coins by playing the islands!'); }
            });
            grid.appendChild(h('div', { class: 'shop-item' + (on ? ' equipped' : '') + (!owned && !can ? ' cant' : '') }, pv, h('div', { text: item.name }), btn));
          });
          body.appendChild(grid);
        });
      }
      render();
      sheet._onclose = function () { // show newly bought/worn items on the map boat
        var old = document.querySelector('.map-body .map-boat');
        if (old) old.replaceWith(boatEl());
      };
    });
  }

  /* ---------- stickers ---------- */
  function openStickers() {
    var mine = RG.progress.stickers();
    var counts = {};
    mine.forEach(function (s) { counts[s] = (counts[s] || 0) + 1; });
    modal(function (sheet) {
      var have = RG.stickerPool.filter(function (s) { return counts[s.e]; }).length;
      sheet.appendChild(h('h2', { text: '📒 Sticker Book' }));
      sheet.appendChild(h('div', { class: 'note', text: have + ' of ' + RG.stickerPool.length + ' found. Finish a voyage to win a new sticker!' }));
      var grid = h('div', { class: 'sticker-grid' });
      RG.stickerPool.forEach(function (s) {
        var got = counts[s.e];
        var cell = h('button', { class: 'sticker' + (got ? '' : ' locked'), style: 'font-family:inherit', 'aria-label': got ? s.n : 'Not found yet' },
          h('span', { text: s.e }), got ? h('small', { text: s.n }) : null, got > 1 ? h('span', { class: 'n', text: '×' + got }) : null);
        if (got) press(cell, function () { RG.speak(s.n); RG.wobble(cell); });
        grid.appendChild(cell);
      });
      sheet.appendChild(grid);
    });
  }

  /* ---------- why read ---------- */
  function openWhyRead() {
    var list = RG.superpowers.list();
    modal(function (sheet) {
      sheet.appendChild(h('h2', { text: '📜 Why Read?' }));
      sheet.appendChild(h('div', { class: 'note', text: 'Reading is a superpower! Every time reading helps you in a Reading Quest, you unlock a new power.' }));
      if (!list.length) sheet.appendChild(h('div', { class: 'empty-note', text: 'No superpowers yet. Sail to the Reading Quest island to find some!' }));
      list.forEach(function (p) {
        sheet.appendChild(press(h('button', { class: 'power', style: 'width:100%;border:0;text-align:left;font-family:inherit' },
          h('span', { class: 'e', text: p.emoji || '🦸' }), h('span', { text: p.label })), function () { RG.speak(p.label); }));
      });
    });
  }

  /* ---------- game host ---------- */
  function endSession() {
    var s = session; session = null;
    if (!s) return;
    s.alive = false;
    try { // time played (a long idle stretch is capped so one forgotten tab does not inflate the weekly summary)
      var secs = Math.min((Date.now() - s.t0) / 1000, 20 * 60);
      if (secs >= 3) RG.progress.addPlayTime(secs);
    } catch (e) { /* ignore */ }
    if (s.cleanup) { var c = s.cleanup; s.cleanup = null; try { c(); } catch (e) { /* ignore */ } }
    try { RG.stopSpeaking(); } catch (e) { /* ignore */ }
  }

  function launch(def) {
    var prof = RG.profile(), total = 5;
    try { // def.rounds may be a number or function(profile) -> number
      var rr = typeof def.rounds === 'function' ? def.rounds(prof) : def.rounds;
      if (typeof rr === 'number' && rr >= 1 && rr <= 30) total = Math.round(rr);
    } catch (e) { total = 5; }
    var ss = { def: def, alive: true, finishing: false, rounds: 0, wrong: false, earned: 0, cleanup: null, t0: Date.now() };
    var dots = [];
    var dotsEl = h('div', { class: 'dots' + (total > 6 ? ' many' : ''), role: 'progressbar', 'aria-valuemax': total });
    for (var i = 0; i < total; i++) { var d = h('div', { class: 'dot' }); dots.push(d); dotsEl.appendChild(d); }
    var stage = h('div', { class: 'game-stage' });
    var ctx = {
      level: RG.progress.level(def.skill), rounds: total, profile: prof, onReplay: null,
      answer: function (correct) {
        if (!ss.alive || ss.finishing) return;
        RG.progress.record(def.skill, !!correct);
        if (correct) {
          RG.sfx.correct();
          var c = ss.wrong ? 1 : 3; ss.earned += c; RG.coins.add(c, 'correct');
        } else { RG.sfx.wrong(); ss.wrong = true; }
      },
      roundDone: function () {
        if (!ss.alive || ss.finishing) return;
        if (ss.rounds < total) { dots[ss.rounds].classList.add('done'); ss.rounds++; dotsEl.setAttribute('aria-valuenow', ss.rounds); }
        ss.wrong = false;
      },
      award: function (n, reason) { if (!ss.alive || ss.finishing) return; ss.earned += n; RG.coins.add(n, reason); },
      finish: function (opts) {
        if (!ss.alive || ss.finishing) return;
        ss.finishing = true;
        ss.next = opts && typeof opts.next === 'string' ? opts.next : null;
        dots.forEach(function (d) { d.classList.add('done'); });
        var tok = screenToken;
        setTimeout(function () { if (tok === screenToken && session === ss) treasure(def, ss, total); }, 650);
      },
      exit: function () { if (!ss.alive) return; mapScreen(false); }
    };
    session = ss;
    var replay = press(h('button', { class: 'iconbtn', 'aria-label': 'Say it again', text: '🔊' }), function () {
      if (typeof ctx.onReplay === 'function') { try { ctx.onReplay(); } catch (e) { /* ignore */ } }
    });
    var back = press(h('button', { class: 'iconbtn', 'aria-label': 'Back to map', text: '⬅️' }), function () { ctx.exit(); });
    var header = h('div', { class: 'host-header' },
      h('div', { class: 'left' }, back), dotsEl,
      h('div', { class: 'right' }, h('div', { class: 'pill coin-pill' }, '🪙', h('span', { class: 'coin-count', text: RG.coins.balance() })), fsButton(false), replay));
    var screen = h('div', { class: 'screen' }, header, h('div', { class: 'host-body' }, stage));
    // show() calls endSession(), which would kill ss; so swap temporarily
    session = null; show(screen); session = ss;
    try {
      var cleanup = def.mount(stage, ctx);
      if (!ss.alive) { if (typeof cleanup === 'function') try { cleanup(); } catch (e) { /* ignore */ } }
      else ss.cleanup = typeof cleanup === 'function' ? cleanup : null;
    } catch (err) {
      if (window.console) console.error('Game failed to start', def.id, err);
      stage.innerHTML = '';
      stage.appendChild(h('div', { class: 'crashed' }, 'Oops! This island is foggy. ',
        press(h('button', { class: 'btn primary', text: 'Back to map' }), function () { mapScreen(false); })));
    }
  }

  /* ---------- treasure ---------- */
  function chestSVG() {
    return '<svg class="chest" viewBox="0 0 200 170" aria-hidden="true">' +
      '<ellipse class="glow" cx="100" cy="70" rx="90" ry="60" fill="#ffe27a" opacity=".8"/>' +
      '<g class="glow"><text x="60" y="80" font-size="34">🪙</text><text x="105" y="70" font-size="34">💎</text><text x="82" y="62" font-size="30">⭐</text></g>' +
      '<rect x="20" y="70" width="160" height="82" rx="10" fill="#a9622a" stroke="#5a2f0e" stroke-width="5"/>' +
      '<rect x="20" y="96" width="160" height="10" fill="#ffc93c" stroke="#5a2f0e" stroke-width="3"/>' +
      '<rect x="86" y="86" width="28" height="34" rx="6" fill="#ffc93c" stroke="#5a2f0e" stroke-width="4"/><circle cx="100" cy="102" r="5" fill="#5a2f0e"/>' +
      '<g class="lid"><path d="M20 70 Q20 22 100 22 Q180 22 180 70Z" fill="#c27a38" stroke="#5a2f0e" stroke-width="5"/>' +
      '<path d="M60 26 V70 M140 26 V70" stroke="#ffc93c" stroke-width="9"/></g></svg>';
  }
  function treasure(def, ss, total) {
    var sticker = RG.sample(RG.stickerPool);
    RG.progress.addStars(total);
    RG.progress.addSticker(sticker.e);
    RG.progress.markComplete(def.id);
    var bonus = 5, coinsTotal = ss.earned + bonus;
    var chest = h('div', { html: chestSVG() });
    var rewards = h('div', { class: 'rewards' });
    var nextDef = null, prof = RG.profile();
    RG.games.forEach(function (g) {
      if (ss.next && g.id === ss.next && g.id !== def.id && g.id !== RG.CHALLENGE_ID && (!g.tracks || g.tracks.indexOf(prof.track) >= 0)) nextDef = g;
    });
    var sail = nextDef ? press(h('button', { class: 'btn primary sail', text: '⛵ Sail to ' + nextDef.title }), function () { launch(nextDef); }) : null;
    var playAgain = press(h('button', { class: 'btn' + (nextDef ? '' : ' primary'), text: '🔁 Play again' }), function () { launch(def); });
    var backBtn = press(h('button', { class: 'btn green', text: '🗺️ Back to map' }), function () { mapScreen(false); });
    var s = h('div', { class: 'screen treasure' },
      h('h2', { text: 'You found treasure!' }), chest, rewards,
      h('div', { class: 'btns' }, sail, playAgain, backBtn));
    show(s);
    var tok = screenToken;
    RG.sfx.win();
    RG.speak('Hooray! You found treasure! You earned ' + total + ' stars and a new sticker!', { mood: 'excited' });
    setTimeout(function () {
      if (tok !== screenToken) return;
      chest.firstChild.classList.add('open');
      RG.celebrate(chest);
      rewards.appendChild(h('div', { class: 'reward', style: 'animation-delay:.2s' }, h('span', { class: 'big', text: '⭐' }), '+' + total + ' stars'));
      rewards.appendChild(h('div', { class: 'reward', style: 'animation-delay:.5s' }, h('span', { class: 'big', text: sticker.e }), 'New sticker!'));
      rewards.appendChild(h('div', { class: 'reward coin-pill', style: 'animation-delay:.8s' }, h('span', { class: 'big', text: '🪙' }), '+' + coinsTotal + ' coins'));
      RG.coins.add(bonus, 'voyage');
    }, 500);
  }

  /* ---------- grown-ups panel ---------- */
  var AVATARS = ['🐣', '🦊', '🐱', '🐶', '🐰', '🐼', '🦁', '🐸', '🐙', '🦄', '🐯', '🐵', '🐧', '🦖', '🧜‍♀️', '🧑‍🚀'];
  function openGrownUps() {
    var closeGU = function () {};
    modal(function (sheet, close) {
      closeGU = close;
      sheet.classList.add('gu');
      var body = h('div');
      sheet.appendChild(h('h2', { text: '⚙️ Grown-ups' }));
      sheet.appendChild(body);
      var confirmId = null;
      var SKILL_NAMES = { letters: 'Letters', 'beginning-sounds': 'First sounds', writing: 'Writing letters', rhyme: 'Rhymes', phonics: 'Reading words (decoding)',
        blends: 'Blends (frog, not fog)', 'long-words': 'Long words', 'sight-words': 'Sight words', comprehension: 'Sentences', fluency: 'Story fluency',
        'real-world': 'Real-world reading', quiz: "Captain's Challenge" };
      function skillsFor(p) {
        var seen = {}, out = [];
        RG.games.forEach(function (g) {
          if (g.tracks && g.tracks.indexOf(p.track) < 0) return;
          if (!seen[g.skill]) { seen[g.skill] = 1; out.push(g.skill); }
        });
        return out;
      }
      var PATTERNS = {
        'dropped-consonant': { text: 'Often drops a letter in blends (frog read as fog)', tip: 'Say the word slowly and tap a finger for each sound: f, r, o, g.' },
        'skipped-chunk': { text: 'Skips a chunk when reading long words', tip: 'Clap the beats in the word, then read one chunk at a time and blend the chunks.' },
        'wrong-split': { text: 'Cuts long words in the wrong place', tip: 'Find the vowels, then cut between the consonants in the middle (rab | bit).' }
      };
      function patternsFor(p) {
        var cutoff = Date.now() - 7 * 86400000, by = {};
        RG.progress.errors(p.id).forEach(function (e) {
          if (+new Date(e.at) < cutoff) return;
          var b = by[e.type] || (by[e.type] = { n: 0, words: [], skill: e.skill });
          b.n++; if (e.word && b.words.indexOf(e.word) < 0 && b.words.length < 3) b.words.push(e.word);
        });
        return Object.keys(by).map(function (k) {
          var m = PATTERNS[k] || { text: 'A pattern to watch in ' + (SKILL_NAMES[by[k].skill] || by[k].skill).toLowerCase() + ' (' + k.replace(/-/g, ' ') + ')', tip: 'Replay that island together for five minutes and talk about the tricky spots.' };
          return { type: k, n: by[k].n, words: by[k].words, text: m.text, tip: m.tip };
        }).sort(function (a, b) { return b.n - a.n; });
      }
      function sampleVoice(uri) {
        RG.speak("Ahoy, captain! You can read this. Can you find the treasure? Yes, you can!", { mood: 'happy', voiceURI: uri || undefined });
      }
      function toggleSwitch(on, onChange, label) {
        var b = h('button', { class: 'switch' + (on ? ' on' : ''), type: 'button', role: 'switch', 'aria-checked': on ? 'true' : 'false', 'aria-label': label }, h('span', { class: 'knob' }));
        return press(b, function () { on = !on; b.classList.toggle('on', on); b.setAttribute('aria-checked', on ? 'true' : 'false'); onChange(on); });
      }
      function switchRow(label, help, key, dflt, after) {
        var on = RG.settings[key] === undefined ? dflt : RG.settings[key] !== false;
        return h('div', { class: 'gu-row' }, h('label', { text: label }),
          toggleSwitch(on, function (v) { RG.settings[key] = v; RG.saveSettings(); if (after && v) after(); }, label),
          h('span', { class: 'gu-help', text: help }));
      }
      function statBox(n, label) { return h('div', { class: 'stat' }, h('b', { text: String(n) }), h('small', { text: label })); }
      function niceDate(iso) { try { return new Date(iso).toLocaleDateString(); } catch (e) { return ''; } }
      function rerunCheckIn(p) {
        RG.progress.setPlaced(false, p.id);
        if (p.id === RG.profile().id && root.querySelector('.map-body')) { closeGU(); }
        else toast('The check-in will start the next time ' + p.name + ' opens the map.', 3600);
      }
      function render() {
        body.innerHTML = '';
        // speech
        body.appendChild(h('h3', { text: 'Voice' }));
        var rateVal = h('b', { text: RG.settings.speechRate.toFixed(2) + 'x' });
        var slider = h('input', { type: 'range', min: '0.5', max: '1.3', step: '0.05', value: RG.settings.speechRate, 'aria-label': 'Speech speed' });
        slider.addEventListener('input', function () { RG.settings.speechRate = parseFloat(slider.value); rateVal.textContent = RG.settings.speechRate.toFixed(2) + 'x'; });
        slider.addEventListener('change', function () { RG.saveSettings(); RG.speak('This is how fast I talk.'); });
        body.appendChild(h('div', { class: 'gu-row' }, h('label', { text: 'Speed' }), slider, rateVal));
        var voices = RG.voices();
        if (voices.length) {
          var sel = h('select', { 'aria-label': 'Voice' }, h('option', { value: '', text: 'Automatic (best English voice)' }),
            voices.map(function (v) { return h('option', { value: v.voiceURI, text: v.name + ' (' + v.lang + ')', selected: v.voiceURI === RG.settings.voiceURI }); }));
          sel.addEventListener('change', function () { RG.settings.voiceURI = sel.value; RG.saveSettings(); sampleVoice(sel.value); });
          var test = press(h('button', { class: 'btn small test-voice', 'aria-label': 'Test this voice', text: '▶ Test' }), function () { sampleVoice(sel.value); });
          body.appendChild(h('div', { class: 'gu-row' }, h('label', { text: 'Voice' }), sel, test));
        }
        body.appendChild(switchRow('Expressive voice', 'Varies pitch and pacing so praise sounds happy and "try again" sounds gentle. Off = flat voice.', 'expressive', true,
          function () { sampleVoice(sel ? sel.value : ''); }));
        body.appendChild(switchRow('Full screen', 'Open in full screen on start', 'autoFullscreen', true));
        body.appendChild(switchRow('Beat your time', 'Story Cove shows a friendly timer so a child can try to read a page faster than last time. Off keeps reading calm and pressure-free.', 'beatTime', false));
        // profiles
        RG.profiles().forEach(function (p) {
          var d = RG.profileData(p.id), rk = RG.rank(p.id);
          body.appendChild(h('h3', { text: p.avatar + ' ' + p.name }));
          var nameIn = h('input', { type: 'text', value: p.name, maxlength: '20', 'aria-label': 'Name' });
          nameIn.addEventListener('change', function () { RG.updateProfile(p.id, { name: nameIn.value.trim() || p.name }); render(); });
          body.appendChild(h('div', { class: 'gu-row' }, h('label', { text: 'Name' }), nameIn));
          var av = h('div', { class: 'av-pick' }, AVATARS.map(function (a) {
            return press(h('button', { class: a === p.avatar ? 'sel' : '', text: a, 'aria-label': 'Avatar ' + a }), function () { RG.updateProfile(p.id, { avatar: a }); render(); });
          }));
          body.appendChild(h('div', { class: 'gu-row' }, h('label', { text: 'Avatar' }), av));
          var seg = h('div', { class: 'seg' }, [['little', 'Little (ages 3-5)'], ['big', 'Big (ages 6-8)']].map(function (t) {
            return press(h('button', { class: p.track === t[0] ? 'sel' : '', text: t[1] }), function () {
              if (p.track !== t[0]) RG.progress.setPlaced(false, p.id); // a different track needs a fresh check-in
              RG.updateProfile(p.id, { track: t[0] }); render();
            });
          }));
          body.appendChild(h('div', { class: 'gu-row' }, h('label', { text: 'Track' }), seg));
          body.appendChild(h('div', { class: 'note' }, rk.emoji + ' ' + rk.name + '   |   🪙 ' + d.lifetime + ' earned in total, ' + d.coins + ' to spend   |   ⭐ ' + d.stars + '   |   🎟️ ' + d.stickers.length + ' stickers   |   🦸 ' + d.powers.length + ' superpowers'));
          var cs = RG.progress.challenge(p.id);
          body.appendChild(h('div', { class: 'gu-row' }, h('label', { text: 'Challenge Island' }),
            toggleSwitch(cs.override, function (v) { RG.progress.setUnlockOverride(v, p.id); render(); }, 'Unlock Challenge Island now for ' + p.name),
            h('span', { class: 'gu-help', text: 'Unlock Challenge Island now (' + (cs.locked ? cs.done + ' of ' + cs.total + ' islands finished' : 'currently open') + ')' })));
          // weekly summary
          var wk = RG.progress.weekly(p.id), mins = Math.round(wk.secs / 60);
          body.appendChild(h('div', { class: 'gu-sub', text: 'This week' }));
          body.appendChild(h('div', { class: 'gu-stats' },
            statBox(wk.mastered, 'words mastered'), statBox(wk.learned, 'tricky words practised'), statBox(wk.stories, 'stories read'),
            statBox(wk.voyages, 'voyages finished'), statBox(mins, mins === 1 ? 'minute played' : 'minutes played')));
          // skills with level override
          var rows = skillsFor(p).map(function (sk) {
            var st = d.skills[sk], lv = RG.progress.level(sk, p.id), max = RG.progress.maxLevel(sk, p.id);
            var acc = st && st.hist && st.hist.length ? Math.round(100 * st.hist.reduce(function (a, b) { return a + b; }, 0) / st.hist.length) + '%' : '-';
            var minus = press(h('button', { class: 'btn small lvl-btn', type: 'button', 'aria-label': 'Lower ' + sk + ' level', text: '−', disabled: lv <= 1, dataset: { skill: sk, dir: '-1' } }), function () { RG.progress.setLevel(sk, lv - 1, p.id); render(); });
            var plus = press(h('button', { class: 'btn small lvl-btn', type: 'button', 'aria-label': 'Raise ' + sk + ' level', text: '+', disabled: lv >= max, dataset: { skill: sk, dir: '1' } }), function () { RG.progress.setLevel(sk, lv + 1, p.id); render(); });
            return h('tr', {}, h('td', { text: SKILL_NAMES[sk] || sk }), h('td', { text: acc }),
              h('td', { class: 'lvl-cell' }, minus, h('b', { class: 'lvl-val', text: lv + ' / ' + max }), plus), h('td', { text: st ? st.total : 0 }));
          });
          body.appendChild(h('div', { class: 'gu-tablewrap' }, h('table', {}, h('tr', {}, h('th', { text: 'Skill' }), h('th', { text: 'Recent' }), h('th', { text: 'Level (grown-ups only)' }), h('th', { text: 'Tries' })), rows)));
          var chk = RG.progress.get('checkin', p.id);
          body.appendChild(h('div', { class: 'gu-row' },
            press(h('button', { class: 'btn small', type: 'button', text: '🧭 Re-run check-in', dataset: { rerun: p.id } }), function () { rerunCheckIn(p); }),
            h('span', { class: 'gu-help', text: chk && chk.at ? 'Last check-in: ' + niceDate(chk.at) + '. It sets where each skill starts, one step below the best result.' : 'The check-in sets where each skill starts.' })));
          // tricky words
          var tw = RG.progress.tricky.list(null, p.id);
          body.appendChild(h('div', { class: 'gu-sub', text: 'Tricky words' + (tw.length ? ' (' + tw.length + ')' : '') }));
          if (!tw.length) body.appendChild(h('div', { class: 'note', text: 'None right now. Words missed in games land here and leave after 3 correct days.' }));
          else {
            body.appendChild(h('div', { class: 'chips tricky-list' }, tw.map(function (t) {
              return h('span', { class: 'chip', title: t.skill }, h('b', { text: t.word }), h('small', { text: ' ' + t.days + '/3 days' }));
            })));
            body.appendChild(h('div', { class: 'gu-help', style: 'flex-basis:100%', text: 'Practice these on paper or the fridge: say the word, spell it aloud, use it in a sentence.' }));
          }
          // patterns we noticed
          var pats = patternsFor(p);
          body.appendChild(h('div', { class: 'gu-sub', text: 'Patterns we noticed' }));
          if (!pats.length) body.appendChild(h('div', { class: 'note', text: 'Nothing to report this week. Keep playing and patterns will show up here.' }));
          pats.forEach(function (x) {
            body.appendChild(h('div', { class: 'note pattern' },
              h('div', { text: x.text + ': ' + x.n + (x.n === 1 ? ' time' : ' times') + ' this week.' + (x.words.length ? ' (' + x.words.join(', ') + ')' : '') }),
              h('div', { class: 'tip', text: 'Practice: ' + x.tip })));
          });
          // what to practice at home
          var home = [];
          if (pats.length) home.push(pats[0].tip);
          if (tw.length) home.push('Read the ' + tw.length + ' tricky word' + (tw.length === 1 ? '' : 's') + ' together for two minutes.');
          if (p.track === 'big') home.push('Read one short page aloud together every day: you read a line, then your child reads it back.');
          else home.push('Point out a letter on a sign or a cereal box and say its sound.');
          body.appendChild(h('div', { class: 'gu-sub', text: 'What to practice at home' }));
          body.appendChild(h('ul', { class: 'gu-list' }, home.map(function (t) { return h('li', { text: t }); })));
          var q = d.quiz;
          body.appendChild(h('div', { style: 'font-weight:800;margin:10px 0 4px', text: "Captain's Challenge history" }));
          if (!q.length) body.appendChild(h('div', { text: 'No challenges yet.' }));
          q.slice(0, 8).forEach(function (e) {
            var when = ''; try { when = new Date(e.date).toLocaleDateString(); } catch (x) { when = ''; }
            var by = e.bySkill ? Object.keys(e.bySkill).map(function (k) { return k + ' ' + e.bySkill[k][0] + '/' + e.bySkill[k][1]; }).join(', ') : '';
            body.appendChild(h('div', { class: 'note', text: when + ': ' + e.score + '/' + e.total + (by ? '   (' + by + ')' : '') }));
          });
          var isC = confirmId === p.id;
          body.appendChild(press(h('button', { class: 'btn small danger', text: isC ? 'Tap again to really reset ' + p.name : 'Reset ' + p.name + "'s progress" }), function () {
            if (!isC) { confirmId = p.id; render(); return; }
            RG.progress.resetAll(p.id); confirmId = null; render(); toast('Progress reset');
          }));
        });
      }
      render();
      sheet._onclose = function () { // name / avatar / track may have changed
        if (root.querySelector('.map-body')) mapScreen(false);
        else if (root.querySelector('.pick')) pickScreen(true);
      };
    });
  }

  /* ---------- Captain's Check-in (placement) ---------- */
  // A playful ladder of short picture / word puzzles. Nothing is ever marked wrong: every tap gets the same friendly
  // "thanks" and the result only decides where each skill starts (one rung lower than the best rung passed).
  var CI = RG._checkin = {};
  function arr(x) { return Array.isArray(x) ? x : []; }
  function deck(list) { // endless shuffled draw without repeats until the list runs out
    var bag = [];
    return function () { if (!bag.length) bag = RG.shuffle(list); return bag.pop(); };
  }
  function emojiOf(w) { try { return RG.emojiFor(w) || ''; } catch (e) { return ''; } }
  function levelWords(n) {
    var C = RG.content || {}, pw = C.phonicsWords && C.phonicsWords[n];
    if (arr(pw).length) return pw.filter(function (w) { return w.word && w.emoji; });
    return arr(C.digraphWords).filter(function (w) { return (w.level || 1) === n && w.emoji; });
  }
  function pickDistractors(target, pool, n) {
    var seen = {}; seen[target.emoji] = 1;
    var cands = RG.shuffle(pool).filter(function (w) { if (!w.emoji || seen[w.emoji]) return false; seen[w.emoji] = 1; return true; });
    var same = cands.filter(function (w) { return w.word.charAt(0) === target.word.charAt(0); });
    var out = same.length ? [same[0]] : [];
    cands.forEach(function (w) { if (out.length < n && out.indexOf(w) < 0) out.push(w); });
    return out.slice(0, n);
  }
  function qWord(text, speak) { return h('div', { class: 'word ci-word', text: text }); }

  function decodingRungs() {
    var C = RG.content || {}, cvc = arr(C.cvcWords).filter(function (w) { return w.word && w.emoji; });
    var l1 = levelWords(1), l2 = levelWords(2), l3 = levelWords(3), l4 = levelWords(4), l5 = levelWords(5);
    var vce = l2.filter(function (w) { return /[aeiou][^aeiou]e$/.test(w.word); });
    var blend = l2.filter(function (w) { return vce.indexOf(w) < 0; });
    var all = cvc.concat(l1, l2, l3, l4, l5);
    var defs = [[cvc, 1], [l1, 1], [blend, 2], [vce, 2], [l3, 3], [l4, 4], [l5, 5]];
    defs = defs.filter(function (d) { return d[0].length >= 2; });
    return defs.map(function (d, di) {
      var next = deck(d[0]);
      var near = []; defs.slice(Math.max(0, di - 1), di + 1).forEach(function (x) { near = near.concat(x[0]); }); // distractors from this rung and the one below
      return { lvl: d[1], n: 3, need: 2, make: function () {
        var t = next(), ds = pickDistractors(t, near.length >= 4 ? near : all, 2);
        return { speak: 'Which picture goes with this word?', prompt: 'Which picture is this word?', show: qWord(t.word),
          opts: RG.shuffle([t].concat(ds)).map(function (w) { return { emoji: w.emoji, correct: w === t, aria: 'picture' }; }) };
      } };
    });
  }
  var BLEND_ITEMS = {
    1: [['flag', '🚩', ['flag', 'lag', 'flap']], ['clock', '⏰', ['clock', 'lock', 'cluck']], ['sled', '🛷', ['sled', 'led', 'shed']]],
    2: [['frog', '🐸', ['frog', 'fog', 'fig']], ['crab', '🦀', ['crab', 'cab', 'cob']], ['truck', '🚚', ['truck', 'tuck', 'track']]],
    3: [['lamp', '🪔', ['lamp', 'lap', 'lamb']], ['tent', '⛺', ['tent', 'ten', 'test']], ['nest', '🪺', ['nest', 'net', 'neck']]]
  };
  function blendRungs() {
    return [1, 2, 3].map(function (lv) {
      var next = deck(BLEND_ITEMS[lv]);
      return { lvl: lv, n: 3, need: 2, make: function () {
        var it = next();
        return { speak: 'Which word goes with the picture?', prompt: 'Which word goes with the picture?', show: h('div', { class: 'big-emoji', text: it[1] }),
          opts: RG.shuffle(it[2]).map(function (w) { return { label: w, correct: w === it[0], say: w, cls: 'wordopt' }; }) };
      } };
    });
  }
  var LONG_ITEMS = {
    1: [['sunset', 'sun|set'], ['catfish', 'cat|fish'], ['cupcake', 'cup|cake']],
    2: [['napkin', 'nap|kin'], ['rabbit', 'rab|bit'], ['basket', 'bas|ket']],
    3: [['robot', 'ro|bot'], ['turtle', 'tur|tle'], ['tiger', 'ti|ger']],
    5: [['octopus', 'oc|to|pus'], ['fantastic', 'fan|tas|tic'], ['butterfly', 'but|ter|fly']]
  };
  function wrongCuts(word, cuts) { // shift the first cut one letter either way to make plausible wrong splits
    var out = [], first = cuts[0];
    [first - 1, first + 1].forEach(function (c) {
      if (c < 1 || c >= word.length - 1 || c === first) return;
      var cc = [c].concat(cuts.slice(1));
      if (cc.length > 1 && cc[1] <= c) return;
      out.push(cc);
    });
    var extra = [word.length - 2];
    if (cuts.length === 1 && extra[0] !== first && extra[0] > 0 && !out.some(function (o) { return o[0] === extra[0]; })) out.push(extra);
    return out;
  }
  function cutLabel(word, cuts) {
    var parts = [], last = 0;
    cuts.forEach(function (c) { parts.push(word.slice(last, c)); last = c; });
    parts.push(word.slice(last));
    return parts.join(' | ');
  }
  function longRungs() {
    return [1, 2, 3, 5].map(function (lv) {
      var next = deck(LONG_ITEMS[lv]);
      return { lvl: lv, n: 3, need: 2, make: function () {
        var it = next(), word = it[0], good = it[1].split('|'), cuts = [], acc = 0;
        good.slice(0, -1).forEach(function (g) { acc += g.length; cuts.push(acc); });
        var wrongs = wrongCuts(word, cuts).slice(0, 2);
        var opts = [{ label: cutLabel(word, cuts), correct: true, cls: 'wordopt' }].concat(wrongs.map(function (c) { return { label: cutLabel(word, c), correct: false, cls: 'wordopt' }; }));
        return { speak: 'Where would you saw this word into chunks?', prompt: 'Where would you saw the word?', show: qWord(word), opts: RG.shuffle(opts) };
      } };
    });
  }
  function sightRungs() {
    var C = RG.content || {}, sw = C.sightWords || {};
    return [1, 2, 3, 4].map(function (lv) {
      var list = arr(sw['level' + lv]).filter(function (w) { return w.length >= 3; });
      if (lv === 1) list = list.slice(Math.floor(list.length / 2)); // the primer half of level 1
      if (list.length < 4) list = ['they', 'what', 'want', 'with', 'said'];
      var next = deck(list);
      return { lvl: lv, n: 3, need: 2, make: function () {
        var t = next(), ds = RG.shuffle(list.filter(function (w) { return w !== t; })).slice(0, 2);
        return { speak: 'Find the word ' + t + '.', prompt: 'Find the word ' + t, show: null,
          opts: RG.shuffle([t].concat(ds)).map(function (w) { return { label: w, correct: w === t, say: w, cls: 'wordopt' }; }) };
      } };
    });
  }
  function sentenceRungs() {
    var C = RG.content || {}, all = arr(C.sentences).filter(function (s) { return s.text && s.emoji && arr(s.distractors).length >= 2; });
    return [1, 2, 3, 4].map(function (lv) {
      var list = all.filter(function (s) { return s.level === lv; });
      if (list.length < 2) list = all.filter(function (s) { return Math.abs((s.level || 1) - lv) <= 1; });
      if (!list.length) return null;
      var next = deck(list);
      return { lvl: lv, n: 3, need: 2, make: function () {
        var s = next();
        return { speak: 'Read the sentence. Which picture matches?', prompt: 'Read it. Which picture matches?', show: h('div', { class: 'ci-sentence', text: s.text }),
          opts: RG.shuffle([{ emoji: s.emoji, correct: true }, { emoji: s.distractors[0], correct: false }, { emoji: s.distractors[1], correct: false }]) };
      } };
    }).filter(Boolean);
  }
  // little track
  function letterRungs() {
    var L = arr((RG.content || {}).letters).filter(function (x) { return x.letter; });
    var starter = L.filter(function (x) { return 'satpinmd'.indexOf(x.letter) >= 0; });
    var rest = L.filter(function (x) { return 'satpinmd'.indexOf(x.letter) < 0 && 'qx'.indexOf(x.letter) < 0; });
    function mk(pool, lower, lvl) {
      var next = deck(pool);
      return { lvl: lvl, n: 2, need: 2, make: function () {
        var t = next(), others = RG.shuffle(L.filter(function (x) { return x.letter !== t.letter; })).slice(0, 2);
        function lab(x) { return lower ? x.letter : x.letter.toUpperCase(); }
        return { speak: null, say: function () { return RG.speak('Find the letter').then(function () { return RG.sayLetter(t.letter); }); },
          prompt: 'Find the letter ' + lab(t), show: null,
          opts: RG.shuffle([t].concat(others)).map(function (x) { return { label: lab(x), correct: x === t, cls: 'letteropt', say: null, letter: x.letter }; }) };
      } };
    }
    return [mk(starter, false, 1), mk(rest, false, 2), mk(L.filter(function (x) { return 'qx'.indexOf(x.letter) < 0; }), true, 3)];
  }
  function soundRungs() {
    var L = arr((RG.content || {}).letters).filter(function (x) { return x.letter && x.sound; });
    var easy = L.filter(function (x) { return 'smbtfn'.indexOf(x.letter) >= 0; });
    var withPic = L.filter(function (x) { return x.emoji && x.word && x.word.charAt(0) === x.letter; });
    function mkSound(pool, lvl) {
      var next = deck(pool);
      return { lvl: lvl, n: 2, need: 2, make: function () {
        var t = next(), others = RG.shuffle(L.filter(function (x) { return x.letter !== t.letter && x.sound !== t.sound; })).slice(0, 2);
        var q = 'Which letter says ' + t.sound + '?';
        return { speak: q, prompt: q, show: null, opts: RG.shuffle([t].concat(others)).map(function (x) { return { label: x.letter.toUpperCase(), correct: x === t, cls: 'letteropt', letter: x.letter }; }) };
      } };
    }
    function mkPic(pool, lvl) {
      var next = deck(pool);
      return { lvl: lvl, n: 2, need: 2, make: function () {
        var t = next(), others = RG.shuffle(withPic.filter(function (x) { return x.letter !== t.letter && x.sound !== t.sound; })).slice(0, 2);
        var q = t.word + '. What sound does ' + t.word + ' start with?';
        return { speak: q, prompt: 'What sound does it start with?', show: h('div', { class: 'big-emoji', text: t.emoji }),
          opts: RG.shuffle([t].concat(others)).map(function (x) { return { label: x.letter, correct: x === t, cls: 'letteropt', letter: x.letter }; }) };
      } };
    }
    return [mkSound(easy.length >= 3 ? easy : L, 1), mkSound(L, 2), mkPic(withPic.length >= 4 ? withPic : L, 3)];
  }
  function rhymeRungs() {
    var fam = (RG.content || {}).rhymeFamilies || {}, keys = Object.keys(fam);
    var fams = keys.map(function (k) { return fam[k].filter(function (w) { return emojiOf(w); }); }).filter(function (f) { return f.length >= 2; });
    if (fams.length < 3) return [];
    function mk(pool, nOpts, lvl) {
      var next = deck(pool);
      return { lvl: lvl, n: 1, need: 1, make: function () {
        var f = next(), two = RG.shuffle(f).slice(0, 2), target = two[0], right = two[1];
        var others = [];
        fams.forEach(function (g) { if (g !== f) others = others.concat(g); });
        others = others.filter(function (w) { return f.indexOf(w) < 0; });
        var wrong = RG.shuffle(others).slice(0, nOpts - 1);
        var q = 'Which one rhymes with ' + target + '?';
        return { speak: q, prompt: q, show: h('div', { class: 'big-emoji', text: emojiOf(target) }),
          opts: RG.shuffle([right].concat(wrong)).map(function (w) { return { emoji: emojiOf(w), correct: w === right, say: null }; }) };
      } };
    }
    var easyF = fams.filter(function (f) { return f.length >= 3; });
    return [mk(easyF.length ? easyF : fams, 3, 1), mk(fams, 3, 2), mk(fams, 4, 3)];
  }

  function checkInPlan(track) {
    function has(id) { return RG.games.some(function (g) { return g.id === id; }); }
    var plan = [];
    if (track === 'little') {
      plan.push({ id: 'letters', skills: ['letters', 'writing'], rungs: letterRungs() });
      plan.push({ id: 'sounds', skills: ['beginning-sounds', 'letter-sounds'], rungs: soundRungs() });
      plan.push({ id: 'rhyme', skills: ['rhyme'], rungs: rhymeRungs() });
    } else {
      plan.push({ id: 'decode', skills: ['phonics'], rungs: decodingRungs(), main: true });
      if (has('blend-cannon')) plan.push({ id: 'blends', skills: ['blends'], rungs: blendRungs() });
      if (has('syllable-saw')) plan.push({ id: 'long', skills: ['long-words'], rungs: longRungs() });
      plan.push({ id: 'sight', skills: ['sight-words'], rungs: sightRungs() });
      plan.push({ id: 'sentence', skills: ['comprehension'], rungs: sentenceRungs() });
    }
    return plan.filter(function (l) { return l.rungs.length; });
  }
  // highest rung passed (2/2 style), then ONE RUNG LOWER so the first sessions feel easy
  function levelFromLadder(rungs, passedIdx) {
    if (passedIdx <= 0) return rungs[0] ? rungs[0].lvl : 1;
    return rungs[passedIdx - 1].lvl;
  }
  CI.levelFromLadder = levelFromLadder;

  function applyPlacement(prof, plan, passed) {
    var levels = {}, phonicsLevel = 1;
    plan.forEach(function (lad) {
      var lv = levelFromLadder(lad.rungs, passed[lad.id]);
      lad.skills.forEach(function (sk) { levels[sk] = lv; });
      if (lad.main) phonicsLevel = lv;
    });
    if (prof.track === 'big') { // unmeasured skills follow phonics
      ['fluency', 'real-world', 'quiz', 'rhyme'].forEach(function (sk) { if (levels[sk] == null) levels[sk] = phonicsLevel; });
      ['blends', 'long-words'].forEach(function (sk) { if (levels[sk] == null) levels[sk] = phonicsLevel; });
    } else {
      var l = levels.letters || 1;
      ['quiz', 'real-world', 'signs'].forEach(function (sk) { if (levels[sk] == null) levels[sk] = l; });
    }
    Object.keys(levels).forEach(function (sk) { RG.progress.setLevel(sk, levels[sk], prof.id); });
    RG.progress.set('checkin', { at: new Date().toISOString(), passed: passed, levels: levels });
    RG.progress.setPlaced(true, prof.id);
    return levels;
  }

  var THANKS = ['Thanks, Captain!', 'Got it!', 'On we sail!', 'Nice sailing!', 'Thank you!', 'Ahoy!'];
  function checkIn() {
    var prof = RG.profile(), tok0, plan = checkInPlan(prof.track), alive = true;
    var passed = {};
    plan.forEach(function (l) { passed[l.id] = -1; });
    var li = 0, ri = 0, asked = 0, right = 0, miss = 0, locked = false;

    function skip() { alive = false; RG.progress.setPlaced(true); mapScreen(true); }
    var skipBtn = holdGate(h('button', { class: 'btn small ci-skip', type: 'button', 'aria-label': 'Grown-ups: hold for 3 seconds to skip the check-in' }, '⏭ Grown-ups: hold to skip'),
      skip, 'Grown-ups: hold the button for 3 seconds to skip');

    function frame(inner) {
      var stop = Math.min(li + 1, plan.length);
      var s = h('div', { class: 'screen ci' },
        h('div', { class: 'ci-top' }, h('div', { class: 'pill' }, '🧭 Check-in'),
          press(h('button', { class: 'iconbtn ci-replay', type: 'button', 'aria-label': 'Say it again', text: '🔊' }), function () { if (RG._ciReplay) RG._ciReplay(); }),
          h('div', { class: 'ci-stops', role: 'progressbar', 'aria-valuemax': plan.length, 'aria-valuenow': stop },
            plan.map(function (l, i) { return h('span', { class: 'ci-stop' + (i < li ? ' done' : (i === li ? ' now' : '')), text: i < li ? '🏝️' : (i === li ? '⛵' : '·') }); }))),
        h('div', { class: 'ci-body' }, inner),
        h('div', { class: 'ci-foot' }, skipBtn));
      show(s);
      tok0 = screenToken;
    }

    function intro() {
      frame(h('div', { class: 'ci-card' },
        h('div', { class: 'ci-emoji', text: '🧭' }),
        h('h2', { text: "Captain's Check-in" }),
        h('div', { class: 'ci-text', text: "Let's find the best islands for you! Tap what you think. There are no wrong answers." }),
        press(h('button', { class: 'btn primary', id: 'ci-start', type: 'button', text: "⛵ Let's go!" }), function () { RG.unlockAudio(); nextQuestion(true); })));
      RG.speak("Ahoy, " + prof.name + "! Let's find the best islands for you. There are no wrong answers!", { mood: 'happy' });
    }

    function startRung() { asked = 0; right = 0; miss = 0; }
    function nextQuestion(first) {
      if (!alive) return;
      if (first) { li = 0; ri = 0; startRung(); }
      var lad = plan[li];
      if (!lad) { finish(); return; }
      var rung = lad.rungs[ri];
      if (!rung) { li++; ri = 0; startRung(); nextQuestion(); return; }
      var q = rung.make();
      locked = false;
      var choices = h('div', { class: 'choices ci-choices' });
      q.opts.forEach(function (o) {
        var b = h('button', { class: 'choice ci-opt ' + (o.cls || ''), type: 'button', 'aria-label': o.aria || o.label || o.emoji, dataset: { ok: o.correct ? '1' : '0' } },
          o.emoji ? h('span', { class: 'ci-oe', text: o.emoji }) : null, o.label ? h('span', { class: 'ci-ol', text: o.label }) : null);
        b.addEventListener('click', function () {
          if (locked || !alive) return; locked = true;
          RG.sfx.pop();
          Array.prototype.forEach.call(choices.querySelectorAll('button'), function (x) { x.disabled = true; });
          b.classList.add('picked');
          asked++; if (o.correct) right++; else miss++;
          var thanks = RG.sample(THANKS);
          RG.speak(thanks, { mood: 'happy' });
          var tk = tok0;
          RG.wait(850).then(function () { if (!alive || tk !== screenToken) return; afterAnswer(); });
        });
        choices.appendChild(b);
      });
      var tk2 = h('div', { class: 'prompt ci-prompt', text: q.prompt });
      frame(h('div', { class: 'ci-q' }, tk2, q.show ? h('div', { class: 'ci-show' }, q.show) : null, choices));
      replay = function () { return q.say ? q.say() : RG.speak(q.speak || q.prompt); };
      replay();
    }
    var replay = null;

    function afterAnswer() {
      var lad = plan[li], rung = lad.rungs[ri];
      var done = false;
      if (right >= rung.need) { passed[lad.id] = ri; ri++; startRung(); done = false; }
      else if (miss > rung.n - rung.need || asked >= rung.n) { li++; ri = 0; startRung(); done = true; }
      void done;
      nextQuestion();
    }

    function finish() {
      alive = false;
      var levels = applyPlacement(prof, plan, passed);
      void levels;
      try { RG.coins.add(5, 'check-in'); } catch (e) { /* ignore */ }
      var s = h('div', { class: 'screen ci' },
        h('div', { class: 'ci-body' }, h('div', { class: 'ci-card' },
          h('div', { class: 'ci-emoji bounce', text: '🏝️' }),
          h('h2', { text: 'All set, Captain!' }),
          h('div', { class: 'ci-text', text: 'I picked islands that fit you just right. Time to sail!' }),
          press(h('button', { class: 'btn primary', id: 'ci-done', type: 'button', text: '🗺️ To the map!' }), function () { mapScreen(true); }))));
      show(s);
      RG.sfx.win(); RG.celebrate();
      RG.speak("All set, captain! I picked islands that fit you just right.", { mood: 'excited' });
    }

    if (!plan.length) { RG.progress.setPlaced(true); mapScreen(true); return; }
    intro();
    // expose the repeat button for the 🔊 helper in the check-in
    RG._ciReplay = function () { if (replay) replay(); };
  }

  /* ---------- go ---------- */
  startScreen();
})();
