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
  }
  function toast(msg) {
    var t = h('div', { class: 'pill', text: msg, style: 'position:fixed;left:50%;bottom:30px;transform:translateX(-50%);z-index:3000;max-width:90vw;text-align:center' });
    document.body.appendChild(t);
    setTimeout(function () { if (t.parentNode) t.remove(); }, 2600);
  }
  function press(btn, fn) {
    btn.addEventListener('click', function (e) { try { RG.sfx.pop(); } catch (x) { /* ignore */ } fn(e); });
    return btn;
  }
  function modal(contentBuilder) {
    var m = h('div', { class: 'modal' });
    var sheet = h('div', { class: 'sheet' });
    function close() { if (m.parentNode) m.remove(); }
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
  function gearButton() {
    var btn = h('button', { class: 'iconbtn', 'aria-label': 'Grown-ups: hold for 3 seconds', text: '⚙️', style: '-webkit-touch-callout:none' });
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
      if (done === true) openGrownUps(); else toast('Grown-ups: hold the gear for 3 seconds');
    }
    btn.addEventListener('pointerdown', start);
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) { btn.addEventListener(ev, function () { stop(false); }); });
    btn.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (!e.repeat) start(e); } });
    btn.addEventListener('keyup', function (e) { if (e.key === 'Enter' || e.key === ' ') stop(false); });
    btn.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    return btn;
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
        RG.speak('Welcome aboard, captain!');
        pickScreen();
      }));
    show(s);
  }

  /* ---------- profile picker ---------- */
  function pickScreen() {
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
    RG.speak('Who is sailing today?');
  }

  /* ---------- map ---------- */
  function mapScreen(greet) {
    var p = RG.profile(), rk = RG.rank();
    var games = RG.games.filter(function (g) { return !g.tracks || g.tracks.indexOf(p.track) >= 0; });
    var quiz = games.filter(function (g) { return g.id === 'captains-quiz'; })[0];
    var normal = games.filter(function (g) { return g.id !== 'captains-quiz'; });
    var ordered = normal.concat(quiz ? [quiz] : []);

    var path = h('div', { class: 'path' });
    var pattern = ['l', 'm', 'r', 'm'];
    ordered.forEach(function (g, i) {
      var isQ = g === quiz;
      var b = h('button', { class: 'island' + (isQ ? ' challenge' : ''), 'aria-label': g.title },
        h('div', { class: 'land', text: g.emoji }),
        h('div', { class: 'name', text: isQ ? "Captain's Challenge" : g.title }));
      var busy = false;
      press(b, function () {
        if (busy) return; busy = true;
        b.classList.add('go');
        var tok = screenToken;
        var say = RG.speak(g.blurb || g.title);
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
      press(h('button', { class: 'btn' }, '📜 Why Read?'), openWhyRead));

    var s = h('div', { class: 'screen' }, top,
      h('div', { class: 'scroll' }, h('div', { class: 'map-body' }, boatEl(), path)), tools);
    show(s);
    if (greet) RG.speak('Ahoy, ' + p.name + '! Pick an island.');
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
      sheet._onclose = function () { };
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
    if (s.cleanup) { var c = s.cleanup; s.cleanup = null; try { c(); } catch (e) { /* ignore */ } }
    try { RG.stopSpeaking(); } catch (e) { /* ignore */ }
  }

  function launch(def) {
    var prof = RG.profile(), total = def.rounds || 5;
    var ss = { def: def, alive: true, finishing: false, rounds: 0, wrong: false, earned: 0, cleanup: null };
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
      finish: function () {
        if (!ss.alive || ss.finishing) return;
        ss.finishing = true;
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
      h('div', { class: 'right' }, h('div', { class: 'pill coin-pill' }, '🪙', h('span', { class: 'coin-count', text: RG.coins.balance() })), replay));
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
    var bonus = 5, coinsTotal = ss.earned + bonus;
    var chest = h('div', { html: chestSVG() });
    var rewards = h('div', { class: 'rewards' });
    var playAgain = press(h('button', { class: 'btn primary', text: '🔁 Play again' }), function () { launch(def); });
    var backBtn = press(h('button', { class: 'btn green', text: '🗺️ Back to map' }), function () { mapScreen(false); });
    var s = h('div', { class: 'screen treasure' },
      h('h2', { text: 'You found treasure!' }), chest, rewards,
      h('div', { class: 'btns' }, playAgain, backBtn));
    show(s);
    var tok = screenToken;
    RG.sfx.win();
    RG.speak('Hooray! You found treasure! You earned ' + total + ' stars and a new sticker!');
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
    modal(function (sheet) {
      sheet.classList.add('gu');
      var body = h('div');
      sheet.appendChild(h('h2', { text: '⚙️ Grown-ups' }));
      sheet.appendChild(body);
      var confirmId = null;
      function skillsList() {
        var seen = {}, out = [];
        RG.games.forEach(function (g) { if (!seen[g.skill]) { seen[g.skill] = 1; out.push(g.skill); } });
        return out;
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
          sel.addEventListener('change', function () { RG.settings.voiceURI = sel.value; RG.saveSettings(); RG.speak('Ahoy! This is my voice.'); });
          body.appendChild(h('div', { class: 'gu-row' }, h('label', { text: 'Voice' }), sel));
        }
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
            return press(h('button', { class: p.track === t[0] ? 'sel' : '', text: t[1] }), function () { RG.updateProfile(p.id, { track: t[0] }); render(); });
          }));
          body.appendChild(h('div', { class: 'gu-row' }, h('label', { text: 'Level' }), seg));
          body.appendChild(h('div', { class: 'note' }, rk.emoji + ' ' + rk.name + '   |   🪙 ' + d.lifetime + ' earned in total, ' + d.coins + ' to spend   |   ⭐ ' + d.stars + '   |   🎟️ ' + d.stickers.length + ' stickers   |   🦸 ' + d.powers.length + ' superpowers'));
          var rows = skillsList().map(function (sk) {
            var st = d.skills[sk];
            var acc = st && st.hist.length ? Math.round(100 * st.hist.reduce(function (a, b) { return a + b; }, 0) / st.hist.length) + '%' : '-';
            return h('tr', {}, h('td', { text: sk }), h('td', { text: acc }), h('td', { text: st ? st.level : 1 }), h('td', { text: st ? st.total : 0 }));
          });
          body.appendChild(h('table', {}, h('tr', {}, h('th', { text: 'Skill' }), h('th', { text: 'Recent' }), h('th', { text: 'Level' }), h('th', { text: 'Tries' })), rows));
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
    });
  }

  /* ---------- go ---------- */
  startScreen();
})();
