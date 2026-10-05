/* Treasure Island Readers - app shell: screens, game host, shop, grown-ups. Loaded last. */
(function () {
  'use strict';
  var RG = window.RG, h = RG.el;
  var root = document.getElementById('app');
  var screenToken = 0;      // changes on every screen switch (lets async work detect navigation)
  var session = null;       // active game session

  /* ---------- background: plain sea only (the horizon lives inside each self-contained scene, never in the viewport) ---------- */
  document.body.insertBefore(h('div', { class: 'ocean', 'aria-hidden': 'true' },
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

  /* ---------- art helpers (RG.art is optional: every call falls back to the old SVG / emoji) ---------- */
  function artHas(kind, id) { try { return !!(RG.art && typeof RG.art.has === 'function' && RG.art.has(kind, id) && typeof RG.art[kind] === 'function'); } catch (e) { return false; } }
  function artHTML(kind, id, opts) {
    if (!artHas(kind, id)) return '';
    try { var r = RG.art[kind](id, opts); return typeof r === 'string' ? r : ''; } catch (e) { return ''; }
  }
  function artFn(kind, arg) { // chest / coin / scene take no id
    try { if (RG.art && typeof RG.art[kind] === 'function') { var r = RG.art[kind](arg); return typeof r === 'string' ? r : ''; } } catch (e) { /* ignore */ }
    return '';
  }
  function waterline(shipId) { // fraction of the art's height from the top: per-ship RG.art.waterline('ship', id), else RG.art.WATERLINE, else 0.78
    var w = null;
    try { if (shipId && RG.art && typeof RG.art.waterline === 'function' && artHas('ship', shipId)) w = RG.art.waterline('ship', shipId); } catch (e) { w = null; }
    if (typeof w !== 'number' || !(w > 0.3 && w < 1)) w = RG.art && RG.art.WATERLINE;
    return typeof w === 'number' && w > 0.3 && w < 1 ? w : 0.78;
  }

  /* ---------- boat (shows shop items) ---------- */
  // fallback boat: the original inline SVG (also used for every ship id when RG.art has no art for it)
  function boatSVG(profile, equipped, noAvatar) {
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
    var hatSvg = hat && !noAvatar ? '<text x="84" y="84" font-size="28" text-anchor="middle">' + hat.emoji + '</text>' : '';
    return '<svg viewBox="0 0 230 190" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<defs><linearGradient id="rbw" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff5e7e"/><stop offset=".25" stop-color="#ffc93c"/><stop offset=".5" stop-color="#34c759"/><stop offset=".75" stop-color="#4cc3ff"/><stop offset="1" stop-color="#a77bff"/></linearGradient></defs>' +
      '<rect x="113" y="14" width="6" height="108" rx="3" fill="#7a4a1e"/>' +
      '<path d="M121 30 L121 112 L190 112Z" fill="' + sailFill + '" stroke="#12395e" stroke-width="3" stroke-linejoin="round"/>' +
      '<path d="M111 44 L111 112 L56 112Z" fill="' + (sail && sail.color !== 'rainbow' ? sailFill : '#ffe9a8') + '" stroke="#12395e" stroke-width="3" stroke-linejoin="round"/>' +
      sailMark + flagSvg +
      (noAvatar ? '' : '<text x="84" y="122" font-size="44" text-anchor="middle">' + profile.avatar + '</text>') + hatSvg + petSvg +
      '<path d="M24 118 H206 L180 164 Q176 172 164 172 H66 Q54 172 50 164Z" fill="' + hullC + '" stroke="#12395e" stroke-width="4" stroke-linejoin="round"/>' +
      '<path d="M34 134 H196" stroke="#fff" stroke-opacity=".55" stroke-width="5" stroke-linecap="round"/>' +
      '<circle cx="80" cy="150" r="6" fill="#fff" stroke="#12395e" stroke-width="2"/><circle cx="115" cy="150" r="6" fill="#fff" stroke="#12395e" stroke-width="2"/><circle cx="150" cy="150" r="6" fill="#fff" stroke="#12395e" stroke-width="2"/>' +
      '</svg>';
  }
  // shop cosmetics -> RG.art.ship options
  function shipOpts(eq) {
    var g = RG.shop, o = {};
    function it(cat) { return eq && eq[cat] ? g.get(eq[cat]) : null; }
    var sail = it('sail'), hull = it('hull'), flag = it('flag'), pet = it('pet');
    if (sail) o.sail = sail.color;
    if (hull) o.hull = hull.color;
    if (flag) o.flag = flag.emoji;
    if (pet) o.pet = pet.emoji;
    return o;
  }
  // the svg/img markup of one ship (art when available, else the fallback boat); cosmetics only go on the flagship
  function shipMarkup(shipId, profile, eq, isFlag) {
    var art = artHTML('ship', shipId, isFlag ? shipOpts(eq) : {});
    return art || boatSVG(profile, isFlag ? eq : {}, !isFlag);
  }
  var SCENE_SLOTS = [ // [left, scale, waterline offset as a fraction of the scene height]
    { x: '60%', sc: 0.86, wy: 0.115 }, { x: '30%', sc: 0.56, wy: 0.15 }, { x: '13%', sc: 0.44, wy: 0.185 }
  ];
  /* A self-contained harbor scene: its own sky, sun, clouds and sea band. Ships are positioned with bottom: inside the scene,
     from the art's waterline, so the hull always overlaps the water at every viewport size (no fixed-viewport horizon). */
  function sceneEl(o) {
    o = o || {};
    var p = o.profile || RG.profile(), eq = RG.shop.equipped(p.id);
    var fleet = RG.ships.fleet(p.id), flagId = RG.ships.flagship(p.id).id;
    var ships = [flagId];
    if (o.fleet !== false) {
      fleet.filter(function (s) { return s.id !== flagId; }).sort(function (a, b) { return b.rank - a.rank || b.price - a.price; }).slice(0, 2)
        .forEach(function (s) { ships.push(s.id); });
    }
    var sceneArt = artFn('scene');
    var sky = h('div', { class: 'scene-sky', 'aria-hidden': 'true' },
      sceneArt ? h('div', { class: 'scene-art', html: sceneArt }) : [h('div', { class: 'sun', text: '☀️' }), h('div', { class: 'cloud c1', text: '☁️' }), h('div', { class: 'cloud c2', text: '☁️' })]);
    var sea = h('div', { class: 'scene-sea', 'aria-hidden': 'true' }, h('div', { class: 'sw sw1' }), h('div', { class: 'sw sw2' }));
    var scene = h('div', { class: 'map-scene' + (o.cls ? ' ' + o.cls : ''), role: 'img', 'aria-label': 'Your ship at sea' }, sky, sea);
    ships.forEach(function (id, i) {
      var sl = SCENE_SLOTS[i];
      scene.appendChild(h('div', { class: 'ship-slot' + (i === 0 ? ' flagship' : ' fleetship'), dataset: { ship: id },
        style: '--x:' + sl.x + ';--sc:' + sl.sc + ';--wy:' + sl.wy + ';--wl:' + (artHas('ship', id) ? waterline(id) : 0.78) },
        h('div', { class: 'ship-bob', html: shipMarkup(id, p, eq, i === 0) }), h('div', { class: 'ship-wave', 'aria-hidden': 'true' })));
    });
    scene.appendChild(h('div', { class: 'scene-front', 'aria-hidden': 'true' }));
    if (o.captain && artHas('ship', flagId)) { // art ships carry no avatar/hat, so show the captain in a bubble
      var hat = eq.hat ? RG.shop.get(eq.hat) : null;
      scene.appendChild(h('div', { class: 'scene-captain', 'aria-hidden': 'true' }, hat ? h('span', { class: 'hat', text: hat.emoji }) : null, h('span', { class: 'av', text: p.avatar })));
    }
    return scene;
  }
  function boatEl() { return sceneEl({ captain: true }); }

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
      h('div', { style: 'position:absolute;top:10px;right:10px;z-index:3' }, gearButton()),
      sceneEl({ cls: 'hero-scene', fleet: false }),
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

  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }
  function anRank(name) { return (/^[AEIOU]/i.test(name) ? 'an ' : 'a ') + name; }
  // rank badge + progress to the next rank; compares the child only with themselves
  function rankCard(rk) {
    var badge = artHTML('badge', rk.index);
    var pct = Math.round(rk.progress * 100);
    return h('div', { class: 'pill rank-badge rank-card', dataset: { rank: rk.index } },
      badge ? h('div', { class: 'rk-badge', html: badge, 'aria-hidden': 'true' }) : h('div', { class: 'rk-badge emoji', text: rk.emoji, 'aria-hidden': 'true' }),
      h('div', { class: 'rk-info' },
        h('div', { class: 'rk-name', text: rk.name }),
        h('div', { class: 'rk-bar', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': pct, 'aria-label': 'Progress to the next rank' },
          h('div', { class: 'rk-fill', style: 'width:' + pct + '%' })),
        h('small', { class: 'rk-more', text: rk.next ? plural(rk.coinsToNext, 'more coin', 'more coins') + ' to ' + rk.next + '!' : 'You are a Legend of the Seas!' })));
  }
  function tbBtn(icon, label, fn, cls) {
    return press(h('button', { class: 'btn tb' + (cls ? ' ' + cls : ''), type: 'button' }, h('span', { class: 'ti', 'aria-hidden': 'true', text: icon }), h('span', { class: 'tl', text: label })), fn);
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
      var islandArt = artHTML('island', g.id);
      var b = h('button', { class: 'island' + (isQ ? ' challenge' : '') + (locked ? ' locked' : '') + (pending ? ' pending' : ''), 'aria-label': g.title, 'aria-disabled': locked ? 'true' : false, dataset: { id: g.id } },
        islandArt ? h('div', { class: 'land has-art' }, h('div', { class: 'land-art', html: islandArt, 'aria-hidden': 'true' })) : h('div', { class: 'land', text: g.emoji }),
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
      h('div', { class: 'grp grp-left' },
        press(h('button', { class: 'iconbtn', 'aria-label': 'Switch captain', text: p.avatar }), pickScreen),
        rankCard(rk)),
      h('div', { class: 'grp' },
        h('div', { class: 'pill coin-pill', 'aria-label': 'Gold coins' }, '🪙', h('span', { class: 'coin-count', text: RG.coins.balance() })),
        h('div', { class: 'pill', 'aria-label': 'Stars' }, '⭐', h('span', { text: RG.progress.stars() })),
        gearButton()));

    var tools = h('div', { class: 'toolbar' },
      tbBtn('🏪', 'Shop', function () { openShop(); }),
      tbBtn('🏝️', 'Harbor', harborScreen, 'harbor-btn'),
      tbBtn('📒', 'Stickers', openStickers),
      tbBtn('📜', 'Why Read?', openWhyRead),
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

  /* ---------- in-page purchase confirmation (never confirm()): a 4-year-old must not buy by accident ---------- */
  function confirmBox(msg, artHtml, onYes, emoji) {
    var m = h('div', { class: 'modal confirm-modal', role: 'dialog', 'aria-label': msg });
    function close() { if (m.parentNode) m.remove(); document.removeEventListener('keydown', onKey); }
    function onKey(e) { if (e.key === 'Escape') close(); }
    var yes = press(h('button', { class: 'btn green big cf-yes', type: 'button', text: '✅ Yes' }), function () { close(); onYes(); });
    var no = press(h('button', { class: 'btn big cf-no', type: 'button', text: '❌ No' }), function () { close(); RG.speak('No problem!', { mood: 'gentle' }); });
    var sheet = h('div', { class: 'sheet confirm-sheet' },
      artHtml ? h('div', { class: 'cf-art', html: artHtml, 'aria-hidden': 'true' }) : (emoji ? h('div', { class: 'cf-art cf-emoji', text: emoji, 'aria-hidden': 'true' }) : null),
      h('div', { class: 'cf-msg', text: msg }),
      h('div', { class: 'cf-btns' }, yes, no));
    m.addEventListener('click', function (e) { if (e.target === m) close(); });
    m.appendChild(sheet);
    document.body.appendChild(m);
    document.addEventListener('keydown', onKey);
    RG.speak(msg, { mood: 'question' });
    return { close: close };
  }
  function needMore(price) { return Math.max(1, price - RG.coins.balance()); }
  function sayNeed(btn, price) {
    var n = needMore(price);
    if (btn) RG.wobble(btn);
    var msg = 'You need ' + plural(n, 'more coin', 'more coins') + '. Play the islands to collect them!';
    RG.speak(msg, { mood: 'gentle' }); toast(msg, 3000);
  }
  function sayLocked(name, rankIdx) {
    var msg = 'The ' + name + ' unlocks when you are ' + anRank(RG.rankName(rankIdx)) + '!';
    RG.speak(msg, { mood: 'gentle' }); toast(msg, 3000);
  }

  /* ---------- shop ---------- */
  var shopTab = 'ships';
  function badgeHTML(idx) { return artHTML('badge', idx) || ''; }
  function lockOverlay(rankIdx) {
    var b = badgeHTML(rankIdx);
    return h('div', { class: 'lock-ov' },
      b ? h('div', { class: 'lk-badge', html: b, 'aria-hidden': 'true' }) : h('div', { class: 'lk-badge emoji', text: RG.RANKS[rankIdx].emoji, 'aria-hidden': 'true' }),
      h('div', { class: 'lk-text', text: 'Unlocks at ' + RG.RANKS[rankIdx].name }));
  }
  // one shop card. o: {id, cls, pv(node), name, sub, btn:{label, cls, fn}, lock(rankIdx), onTap}
  function shopCard(o) {
    var kids = [h('div', { class: 'pv' }, o.pv), h('div', { class: 'nm', text: o.name })];
    if (o.sub) kids.push(h('div', { class: 'sub', text: o.sub }));
    if (o.lock != null) kids.push(lockOverlay(o.lock));
    else if (o.btn) kids.push(press(h('button', { class: 'btn small ' + (o.btn.cls || ''), type: 'button', text: o.btn.label }), o.btn.fn));
    var card = h('div', { class: 'shop-card ' + (o.cls || ''), dataset: { id: o.id } }, kids);
    if (o.lock != null) { card.setAttribute('role', 'button'); card.tabIndex = 0; press(card, o.onTap || function () {}); }
    return card;
  }
  function artNode(html, fallbackEmoji) { return html ? h('div', { class: 'art', html: html, 'aria-hidden': 'true' }) : h('div', { class: 'art emoji', text: fallbackEmoji || '❓', 'aria-hidden': 'true' }); }

  function openShop(startTab) {
    if (startTab) shopTab = startTab;
    modal(function (sheet, close) {
      sheet.classList.add('shop-sheet');
      var body = h('div');
      sheet.appendChild(h('h2', { text: '🏪 Harbor Shop' }));
      sheet.appendChild(body);
      var TABS = [['ships', '⛵ Ships'], ['harbor', '🏠 Harbor'], ['crew', '🦜 Crew & Decor']];
      var cats = [['hull', 'Boat colors'], ['sail', 'Sails'], ['flag', 'Flags'], ['pet', 'Crew'], ['hat', 'Hats']];
      function bought(msg, btn) { RG.celebrate(btn); RG.sfx.win(); RG.speak(msg, { mood: 'excited' }); render(); }

      function shipsTab(panel) {
        var p = RG.profile(), eq = RG.shop.equipped(), flagId = RG.ships.flagship().id, grid = h('div', { class: 'shop-grid' });
        RG.ships.list.forEach(function (s) {
          var owned = RG.ships.owned(s.id), isFlag = owned && flagId === s.id, can = RG.ships.canBuy(s.id);
          var pv = h('div', { class: 'art ship-art', html: shipMarkup(s.id, p, eq, isFlag), 'aria-hidden': 'true' });
          var o = { id: s.id, pv: pv, name: s.name, cls: (owned ? 'owned' : '') + (isFlag ? ' equipped' : '') };
          if (owned) {
            o.btn = isFlag ? { label: '⭐ Flagship', cls: 'green', fn: function () { RG.speak('The ' + s.name + ' is your flagship!'); } }
              : { label: 'Set sail!', cls: '', fn: function () { RG.ships.setFlagship(s.id); RG.sfx.win(); RG.speak('The ' + s.name + ' is your flagship!', { mood: 'happy' }); render(); } };
          } else if (can.reason === 'rank') {
            o.cls = 'locked'; o.lock = s.rank; o.sub = '🪙 ' + s.price;
            o.onTap = function () { sayLocked(s.name, s.rank); };
          } else {
            o.cls = can.ok ? 'buyable' : 'cant';
            o.btn = { label: '🪙 ' + s.price, cls: can.ok ? 'primary' : '', fn: function () {
              var btnEl = grid.querySelector('[data-id="' + s.id + '"] .btn');
              if (!RG.ships.canBuy(s.id).ok) { sayNeed(btnEl, s.price); return; }
              confirmBox('Buy the ' + s.name + ' for ' + s.price + ' 🪙?', shipMarkup(s.id, p, {}, false), function () {
                var r = RG.ships.buy(s.id);
                if (r.ok) bought('You got the ' + s.name + '! It is your flagship now!', btnEl); else if (r.reason === 'coins') sayNeed(btnEl, s.price); else if (r.reason === 'rank') sayLocked(s.name, s.rank);
              });
            } };
          }
          grid.appendChild(shopCard(o));
        });
        panel.appendChild(grid);
      }

      function harborTab(panel) {
        var grid = h('div', { class: 'shop-grid' });
        RG.buildings.list.forEach(function (b) {
          var owned = RG.buildings.owned(b.id), can = RG.buildings.canBuy(b.id), svg = artHTML('building', b.id);
          var o = { id: b.id, pv: artNode(svg, BUILDING_EMOJI[b.id]), name: b.name, cls: owned ? 'owned' : '' };
          if (owned) o.btn = { label: '🏝️ Visit', cls: 'green', fn: function () { close(); harborScreen(); } };
          else if (can.reason === 'rank') { o.cls = 'locked'; o.lock = b.rank; o.sub = '🪙 ' + b.price; o.onTap = function () { sayLocked(b.name, b.rank); }; }
          else {
            o.cls = can.ok ? 'buyable' : 'cant';
            o.btn = { label: '🪙 ' + b.price, cls: can.ok ? 'primary' : '', fn: function () {
              var btnEl = grid.querySelector('[data-id="' + b.id + '"] .btn');
              if (!RG.buildings.canBuy(b.id).ok) { sayNeed(btnEl, b.price); return; }
              confirmBox('Buy the ' + b.name + ' for ' + b.price + ' 🪙?', svg, function () {
                var r = RG.buildings.buy(b.id);
                if (r.ok) bought('You built the ' + b.name + '! Visit your harbor to see it!', btnEl); else if (r.reason === 'coins') sayNeed(btnEl, b.price); else if (r.reason === 'rank') sayLocked(b.name, b.rank);
              }, BUILDING_EMOJI[b.id]);
            } };
          }
          grid.appendChild(shopCard(o));
        });
        panel.appendChild(grid);
      }

      function crewTab(panel) {
        var eq = RG.shop.equipped();
        cats.forEach(function (c) {
          panel.appendChild(h('h3', { text: c[1] }));
          var grid = h('div', { class: 'shop-grid' });
          RG.shop.items.filter(function (i) { return i.cat === c[0]; }).forEach(function (item) {
            var owned = RG.shop.owned(item.id), on = eq[item.cat] === item.id, locked = RG.shop.locked(item.id), can = RG.coins.balance() >= item.price;
            var pv = item.emoji ? h('div', { class: 'art emoji', text: item.emoji, 'aria-hidden': 'true' })
              : h('div', { class: 'art' }, h('div', { class: 'sw', style: 'background:' + (item.color === 'rainbow' ? 'linear-gradient(90deg,#ff5e7e,#ffc93c,#34c759,#4cc3ff,#a77bff)' : item.color) }));
            var o = { id: item.id, pv: pv, name: item.name, cls: (owned ? 'owned' : '') + (on ? ' equipped' : '') };
            if (owned) o.btn = { label: on ? 'On!' : 'Wear', cls: on ? 'green' : '', fn: function () { RG.shop.toggle(item.id); render(); } };
            else if (locked) { o.cls = 'locked'; o.lock = item.rank; o.sub = '🪙 ' + item.price; o.onTap = function () { sayLocked(item.name, item.rank); }; }
            else {
              o.cls = can ? 'buyable' : 'cant';
              o.btn = { label: '🪙 ' + item.price, cls: can ? 'primary' : '', fn: function () {
                var btnEl = grid.querySelector('[data-id="' + item.id + '"] .btn');
                if (RG.coins.balance() < item.price) { sayNeed(btnEl, item.price); return; }
                confirmBox('Buy the ' + item.name + ' for ' + item.price + ' 🪙?', '', function () {
                  if (RG.shop.buy(item.id)) bought('You got the ' + item.name + '!', btnEl); else sayNeed(btnEl, item.price);
                }, item.emoji || '🎁');
              } };
            }
            grid.appendChild(shopCard(o));
          });
          panel.appendChild(grid);
        });
      }

      function render() {
        var top = body.querySelector('.shop-panel') ? body.querySelector('.shop-panel').scrollTop : 0; void top;
        var keep = sheet.scrollTop;
        body.innerHTML = '';
        body.appendChild(h('div', { class: 'shop-preview' }, sceneEl({ cls: 'shop-scene', captain: true })));
        body.appendChild(h('div', { class: 'pill coin-pill', style: 'margin-bottom:8px' }, '🪙', h('span', { class: 'coin-count', text: RG.coins.balance() }), ' to spend'));
        body.appendChild(h('div', { class: 'shop-tabs', role: 'tablist' }, TABS.map(function (t) {
          return press(h('button', { class: 'shop-tab' + (shopTab === t[0] ? ' sel' : ''), type: 'button', role: 'tab', 'aria-selected': shopTab === t[0] ? 'true' : 'false', dataset: { tab: t[0] }, text: t[1] }), function () { shopTab = t[0]; render(); sheet.scrollTop = 0; });
        })));
        var panel = h('div', { class: 'shop-panel', dataset: { tab: shopTab } });
        body.appendChild(panel);
        if (shopTab === 'ships') shipsTab(panel); else if (shopTab === 'harbor') harborTab(panel); else crewTab(panel);
        sheet.scrollTop = keep;
      }
      render();
      sheet._onclose = function () { // show newly bought/worn items on the map scene
        var old = document.querySelector('.map-body .map-scene');
        if (old) old.replaceWith(boatEl());
        try { RG.coins.refresh(); } catch (e) { /* ignore */ }
      };
    });
  }

  /* ---------- Home Harbor ("Captain's Cove") ---------- */
  var BUILDING_EMOJI = { dock: '⚓', lighthouse: '🗼', 'fish-market': '🐟', library: '📚', shipyard: '🏗️', 'treasure-vault': '💰', 'map-room': '🗺️', 'sea-fort': '🏰', 'golden-statue': '🗽' };
  var TAP_FX = { dock: { e: '⚓', cls: 'fx-toot', say: 'Toot toot!' }, lighthouse: { e: '💡', cls: 'fx-beam', say: 'The lighthouse light is shining!' },
    'fish-market': { e: '🐟', cls: 'fx-fish', say: 'Splash! A fish jumped!' }, shipyard: { e: '🔨', cls: 'fx-hammer', say: 'Bang bang! Building ships!' },
    'sea-fort': { e: '🚩', cls: 'fx-flag', say: 'The fort flag is waving!' }, 'golden-statue': { e: '✨', cls: 'fx-spark', say: 'A golden statue of you!' } };

  // finished stories and chapters, read from what Story Cove stores via RG.progress ('story-cove' key: reads, serial.done, listen.done)
  function libraryBooks() {
    var st = null, books = [];
    try { st = RG.progress.get('story-cove'); } catch (e) { st = null; }
    st = st && typeof st === 'object' ? st : {};
    var reads = st.reads || {}, C = RG.content || {};
    (C.stories || []).forEach(function (s) {
      var id = s.id || ((s.level || 1) + ':' + s.title);
      if ((reads[id] || 0) > 0) books.push({ kind: 'story', title: s.title, count: reads[id] });
    });
    var serial = C.serial;
    if (serial && Array.isArray(serial.chapters)) {
      var sdone = (st.serial && st.serial[serial.id] && st.serial[serial.id].done) || [];
      var ldone = (st.listen && st.listen[serial.id] && st.listen[serial.id].done) || [];
      serial.chapters.forEach(function (c, i) {
        var n = reads[(serial.id || 'serial') + ':' + (i + 1)] || (sdone.indexOf(i) >= 0 ? 1 : 0);
        var ln = reads[(serial.id || 'serial') + ':listen:' + (i + 1)] || 0;
        if (n > 0) books.push({ kind: 'chapter', title: c.title || ('Chapter ' + (i + 1)), count: n, chapter: i + 1, series: serial.title });
        else if (ln > 0 || ldone.indexOf(i) >= 0) books.push({ kind: 'listen', title: c.title || ('Chapter ' + (i + 1)), count: ln || 1, chapter: i + 1, series: serial.title });
      });
    }
    return { books: books, stories: books.filter(function (b) { return b.kind === 'story'; }).length, chapters: books.filter(function (b) { return b.kind !== 'story'; }).length };
  }
  var BOOK_COLORS = ['#ff6b6b', '#4cc3ff', '#ffc93c', '#8fe08f', '#b58cff', '#ff9a3c', '#ff8fb1'];
  function openLibrary() {
    var lib = libraryBooks(), prof = RG.profile();
    var cove = RG.games.filter(function (g) { return g.id === 'story-cove' && (!g.tracks || g.tracks.indexOf(prof.track) >= 0); })[0];
    modal(function (sheet, close) {
      sheet.classList.add('library-sheet');
      sheet.appendChild(h('h2', { text: '📚 My Library' }));
      var detail = h('div', { class: 'lib-detail', 'aria-live': 'polite' });
      if (!lib.books.length) {
        sheet.appendChild(h('div', { class: 'empty-note lib-empty', text: 'Your shelves are empty. Read a story in Story Cove and it will live here!' }));
        if (cove) sheet.appendChild(press(h('button', { class: 'btn primary', type: 'button', text: '📖 Go to Story Cove' }), function () { close(); launch(cove); }));
        return;
      }
      var parts = [];
      if (lib.stories) parts.push(plural(lib.stories, 'story', 'stories'));
      if (lib.chapters) parts.push(plural(lib.chapters, 'chapter', 'chapters'));
      sheet.appendChild(h('div', { class: 'note', text: 'You have read ' + parts.join(' and ') + '! Tap a book to hear its name.' }));
      var shelf = h('div', { class: 'lib-shelf' });
      lib.books.forEach(function (b, i) {
        var tile = h('button', { class: 'lib-book', type: 'button', style: '--bc:' + BOOK_COLORS[i % BOOK_COLORS.length], dataset: { kind: b.kind, title: b.title }, 'aria-label': b.title },
          h('span', { class: 'lb-ic', text: b.kind === 'story' ? '📕' : (b.kind === 'chapter' ? '📘' : '🎧') }),
          h('span', { class: 'lb-title', text: b.title }),
          b.chapter ? h('small', { text: 'Chapter ' + b.chapter }) : null);
        press(tile, function () {
          Array.prototype.forEach.call(shelf.querySelectorAll('.lib-book.sel'), function (x) { x.classList.remove('sel'); });
          tile.classList.add('sel');
          RG.speak(b.title, { mood: 'story' });
          detail.innerHTML = '';
          detail.appendChild(h('div', { class: 'lib-title', text: b.title }));
          detail.appendChild(h('div', { class: 'lib-meta', text: (b.series ? b.series + ', chapter ' + b.chapter + '. ' : '') + (b.kind === 'listen' ? 'You listened to it' : 'You read it') + ' ' + (b.count === 1 ? 'once' : b.count + ' times') + '!' }));
          if (cove) detail.appendChild(press(h('button', { class: 'btn primary lib-again', type: 'button', text: '📖 Read it again' }), function () { close(); launch(cove); }));
        });
        shelf.appendChild(tile);
      });
      sheet.appendChild(shelf);
      sheet.appendChild(detail);
    });
  }

  function playPlotFx(plot, id) {
    var fx = TAP_FX[id]; if (!fx) return;
    var node = h('span', { class: 'plot-fx ' + fx.cls, 'aria-hidden': 'true', text: fx.e });
    plot.appendChild(node);
    try { if (id === 'fish-market') RG.sfx.coin(); else if (id === 'sea-fort') RG.sfx.win(); else RG.sfx.pop(); } catch (e) { /* ignore */ }
    if (id === 'golden-statue') { try { RG.celebrate(plot); } catch (e) { /* ignore */ } }
    plot.classList.remove('tapped'); void plot.offsetWidth; plot.classList.add('tapped');
    RG.speak(fx.say, { mood: 'happy' });
    setTimeout(function () { if (node.parentNode) node.remove(); plot.classList.remove('tapped'); }, 1600);
  }

  function harborScreen() {
    var p = RG.profile(), tok = null;
    var ACT = { library: openLibrary, 'treasure-vault': openStickers, 'map-room': openWhyRead };
    var bookCount = 0; try { bookCount = libraryBooks().books.length; } catch (e) { bookCount = 0; }

    function plotEl(b) {
      var owned = RG.buildings.owned(b.id), can = RG.buildings.canBuy(b.id), svg = artHTML('building', b.id, b.id === 'golden-statue' ? { avatar: p.avatar } : {}), el;
      var art = svg ? h('div', { class: 'p-art', html: svg, 'aria-hidden': 'true' }) : h('div', { class: 'p-art emoji', text: BUILDING_EMOJI[b.id], 'aria-hidden': 'true' });
      if (owned) {
        el = h('button', { class: 'plot owned', type: 'button', dataset: { id: b.id }, 'aria-label': b.name }, art,
          !svg && b.id === 'golden-statue' ? h('span', { class: 'statue-av', text: p.avatar, 'aria-hidden': 'true' }) : null,
          b.id === 'library' && bookCount ? h('span', { class: 'plot-badge', text: String(bookCount) }) : null,
          h('div', { class: 'lbl' + (ACT[b.id] ? ' act' : ''), text: b.name }));
        press(el, function () {
          if (ACT[b.id]) { ACT[b.id](); return; }
          playPlotFx(el, b.id);
        });
        return el;
      }
      var lab;
      if (can.reason === 'rank') {
        var bd = badgeHTML(b.rank);
        lab = h('div', { class: 'lbl unlock' }, h('b', { text: b.name }),
          h('span', { class: 'ul' }, bd ? h('span', { class: 'ub', html: bd, 'aria-hidden': 'true' }) : h('span', { class: 'ub emoji', text: RG.RANKS[b.rank].emoji, 'aria-hidden': 'true' }), 'Unlocks at ' + RG.RANKS[b.rank].name));
      } else lab = h('div', { class: 'lbl unlock' }, h('b', { text: b.name }), h('span', { class: 'ul price', text: '🪙 ' + b.price }));
      el = h('button', { class: 'plot empty' + (can.ok ? ' buyable' : ''), type: 'button', dataset: { id: b.id }, 'aria-label': b.name + (can.reason === 'rank' ? '. Unlocks at ' + RG.RANKS[b.rank].name : '. ' + b.price + ' coins') },
        h('div', { class: 'p-outline' }, art), lab);
      press(el, function () {
        var c = RG.buildings.canBuy(b.id);
        if (c.reason === 'rank') { sayLocked(b.name, b.rank); return; }
        if (c.reason === 'coins') { sayNeed(el, b.price); return; }
        if (!c.ok) return;
        confirmBox('Buy the ' + b.name + ' for ' + b.price + ' 🪙?', svg, function () {
          var r = RG.buildings.buy(b.id);
          if (!r.ok) { if (r.reason === 'coins') sayNeed(el, b.price); return; }
          RG.sfx.win(); RG.speak('You built the ' + b.name + '!', { mood: 'excited' });
          var np = plotEl(b); np.classList.add('just-built'); el.replaceWith(np); RG.celebrate(np);
          try { RG.coins.refresh(); } catch (e) { /* ignore */ }
        }, BUILDING_EMOJI[b.id]);
      });
      return el;
    }

    var bay = h('div', { class: 'h-bay' }, h('div', { class: 'h-pier' }, h('i'), h('i'), h('i'), h('i')));
    function renderBay() {
      Array.prototype.forEach.call(bay.querySelectorAll('.moored'), function (x) { x.remove(); });
      var eq = RG.shop.equipped(), flagId = RG.ships.flagship().id, fleet = RG.ships.fleet();
      bay.style.setProperty('--n', Math.max(2, fleet.length));
      fleet.forEach(function (s, i) {
        var isFlag = s.id === flagId;
        var m = h('button', { class: 'moored' + (isFlag ? ' flag' : ''), type: 'button', dataset: { ship: s.id }, 'aria-label': s.name + (isFlag ? ', your flagship' : ''),
          style: '--i:' + i + ';--wl:' + (artHas('ship', s.id) ? waterline(s.id) : 0.78) },
          isFlag ? h('span', { class: 'fstar', text: '⭐', 'aria-hidden': 'true' }) : null,
          h('div', { class: 'ship-bob', html: shipMarkup(s.id, p, eq, isFlag) }), h('div', { class: 'ship-wave', 'aria-hidden': 'true' }),
          h('div', { class: 'lbl', text: s.name }));
        press(m, function () {
          if (RG.ships.flagship().id !== s.id) { RG.ships.setFlagship(s.id); RG.speak('The ' + s.name + ' is your flagship!', { mood: 'happy' }); renderBay(); }
          else RG.speak(s.name, { mood: 'happy' });
        });
        bay.appendChild(m);
      });
    }

    var plots = h('div', { class: 'h-plots' }, RG.buildings.list.map(plotEl));
    var world = h('div', { class: 'harbor-world' },
      h('div', { class: 'h-sky', 'aria-hidden': 'true' }, h('div', { class: 'sun', text: '☀️' }), h('div', { class: 'cloud c1', text: '☁️' }), h('div', { class: 'cloud c2', text: '☁️' }), h('div', { class: 'cloud c3', text: '☁️' })),
      h('div', { class: 'h-sea', 'aria-hidden': 'true' }, h('div', { class: 'sw sw1' }), h('div', { class: 'sw sw2' })),
      bay,
      h('div', { class: 'h-landsec' }, h('div', { class: 'h-land', 'aria-hidden': 'true' }), plots));
    renderBay();
    var scroller = h('div', { class: 'harbor-scroll', tabindex: '-1' }, world);
    var left = press(h('button', { class: 'iconbtn h-arrow left', type: 'button', 'aria-label': 'Scroll left', text: '◀' }), function () { scroller.scrollBy({ left: -Math.max(200, scroller.clientWidth * 0.7), behavior: 'smooth' }); });
    var right = press(h('button', { class: 'iconbtn h-arrow right', type: 'button', 'aria-label': 'Scroll right', text: '▶' }), function () { scroller.scrollBy({ left: Math.max(200, scroller.clientWidth * 0.7), behavior: 'smooth' }); });
    function arrows() {
      var max = scroller.scrollWidth - scroller.clientWidth;
      left.style.display = scroller.scrollLeft > 8 ? '' : 'none';
      right.style.display = max > 8 && scroller.scrollLeft < max - 8 ? '' : 'none';
    }
    scroller.addEventListener('scroll', arrows, { passive: true });
    window.addEventListener('resize', arrows);

    var top = h('div', { class: 'topbar harbor-top' },
      h('div', { class: 'grp' },
        press(h('button', { class: 'iconbtn', 'aria-label': 'Back to map', text: '⬅️' }), function () { mapScreen(false); }),
        h('div', { class: 'pill harbor-title' }, '🏝️ ', h('span', { text: "Captain's Cove" }))),
      h('div', { class: 'grp' },
        h('div', { class: 'pill coin-pill', 'aria-label': 'Gold coins' }, '🪙', h('span', { class: 'coin-count', text: RG.coins.balance() })),
        press(h('button', { class: 'btn small', type: 'button', text: '🏪 Shop' }), function () { openShop('harbor'); })));
    var s = h('div', { class: 'screen harbor' }, top, h('div', { class: 'harbor-wrap' }, scroller, left, right));
    show(s);
    tok = screenToken;
    setTimeout(function () { if (tok === screenToken) arrows(); }, 60);
    setTimeout(function () { if (tok === screenToken) arrows(); }, 600);
    var n = RG.buildings.mine().length;
    RG.speak(n ? "Welcome to Captain's Cove! Tap a building." : "Welcome to Captain's Cove! Buy buildings in the shop to fill it up.", { mood: 'happy' });
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
    var chestClosed = artHas('chest', 'closed') ? artFn('chest', false) : '', chestOpen = chestClosed ? artFn('chest', true) : '';
    var useArt = !!(chestClosed && chestOpen);
    var chest = useArt ? h('div', { class: 'chest-art', html: chestClosed, 'aria-hidden': 'true' }) : h('div', { html: chestSVG() });
    var coinArt = artHas('coin', 'coin') ? artFn('coin') : '';
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
      if (useArt) { chest.innerHTML = chestOpen; chest.classList.add('open'); } else chest.firstChild.classList.add('open');
      RG.celebrate(chest);
      rewards.appendChild(h('div', { class: 'reward', style: 'animation-delay:.2s' }, h('span', { class: 'big', text: '⭐' }), '+' + total + ' stars'));
      rewards.appendChild(h('div', { class: 'reward', style: 'animation-delay:.5s' }, h('span', { class: 'big', text: sticker.e }), 'New sticker!'));
      rewards.appendChild(h('div', { class: 'reward coin-pill', style: 'animation-delay:.8s' }, coinArt ? h('span', { class: 'big coin-art', html: coinArt }) : h('span', { class: 'big', text: '🪙' }), '+' + coinsTotal + ' coins'));
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
          body.appendChild(h('div', { class: 'note rank-note' }, 'Rank ' + (rk.index + 1) + ' of ' + rk.count + ': ' + rk.emoji + ' ' + rk.name + (rk.next ? '. ' + rk.coinsToNext + ' more lifetime coins to ' + rk.next + '.' : '. Top rank reached.')));
          var fl = RG.ships.fleet(p.id), flg = RG.ships.flagship(p.id), bl = RG.buildings.mine(p.id);
          body.appendChild(h('div', { class: 'note fleet-note' }, 'Fleet (' + fl.length + ' of ' + RG.ships.list.length + '): ' + fl.map(function (x) { return x.name; }).join(', ') + '. Flagship: ' + flg.name +
            '. Harbor buildings (' + bl.length + ' of ' + RG.buildings.list.length + '): ' + (bl.length ? bl.map(function (x) { return x.name; }).join(', ') : 'none yet') +
            '. Crew: ' + (d.crew.length ? d.crew.map(function (id) { var it = RG.shop.get(id); return it ? it.name : id; }).join(', ') : 'none') + '.'));
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
    void vce; void blend; void l5;
    var defs = [[cvc, 1], [l2.filter(function (w) { return /^(fr|cr|dr|tr|gr|br|fl|cl|bl|st|sn|sp)[aeiou]/.test(w.word) && w.word.length <= 5; }), 2], [l3, 3], [l4, 4]]; // cat, frog, rain, star
    defs = defs.filter(function (d) { return d[0].length >= 2; });
    return defs.map(function (d, di) {
      var next = deck(d[0]);
      var near = []; defs.slice(Math.max(0, di - 1), di + 1).forEach(function (x) { near = near.concat(x[0]); }); // distractors from this rung and the one below
      return { lvl: d[1], n: 1, need: 1, confirm: di > 0, make: function () { // 1 item; the main ladder re-checks a first miss once
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
      return { lvl: lv, n: 1, need: 1, make: function () {
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
    return [1, 2, 3].map(function (lv) {
      var next = deck(LONG_ITEMS[lv]);
      return { lvl: lv, n: 1, need: 1, make: function () {
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
    return [1, 2, 3].map(function (lv) {
      var list = arr(sw['level' + lv]).filter(function (w) { return w.length >= 3; });
      if (lv === 1) list = list.slice(Math.floor(list.length / 2)); // the primer half of level 1
      if (list.length < 4) list = ['they', 'what', 'want', 'with', 'said'];
      var next = deck(list);
      return { lvl: lv, n: 1, need: 1, make: function () {
        var t = next(), ds = RG.shuffle(list.filter(function (w) { return w !== t; })).slice(0, 2);
        return { speak: 'Find the word ' + t + '.', prompt: 'Find the word ' + t, show: null,
          opts: RG.shuffle([t].concat(ds)).map(function (w) { return { label: w, correct: w === t, say: w, cls: 'wordopt' }; }) };
      } };
    });
  }
  function sentenceRungs() {
    var C = RG.content || {}, all = arr(C.sentences).filter(function (s) { return s.text && s.emoji && arr(s.distractors).length >= 2; });
    return [1, 3].map(function (lv) { // one short sentence, then one two-sentence one
      var list = all.filter(function (s) { return s.level === lv; });
      if (list.length < 2) list = all.filter(function (s) { return Math.abs((s.level || 1) - lv) <= 1; });
      if (!list.length) return null;
      var next = deck(list);
      return { lvl: lv, n: 1, need: 1, make: function () {
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
      return { lvl: lvl, n: 1, need: 1, confirm: lvl > 1, make: function () {
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
      return { lvl: lvl, n: 1, need: 1, make: function () {
        var t = next(), others = RG.shuffle(L.filter(function (x) { return x.letter !== t.letter && x.sound !== t.sound; })).slice(0, 2);
        var q = 'Which letter says ' + t.sound + '?';
        return { speak: q, prompt: q, show: null, opts: RG.shuffle([t].concat(others)).map(function (x) { return { label: x.letter.toUpperCase(), correct: x === t, cls: 'letteropt', letter: x.letter }; }) };
      } };
    }
    function mkPic(pool, lvl) {
      var next = deck(pool);
      return { lvl: lvl, n: 1, need: 1, make: function () {
        var t = next(), others = RG.shuffle(withPic.filter(function (x) { return x.letter !== t.letter && x.sound !== t.sound; })).slice(0, 2);
        var q = t.word + '. What sound does ' + t.word + ' start with?';
        return { speak: q, prompt: 'What sound does it start with?', show: h('div', { class: 'big-emoji', text: t.emoji }),
          opts: RG.shuffle([t].concat(others)).map(function (x) { return { label: x.letter, correct: x === t, cls: 'letteropt', letter: x.letter }; }) };
      } };
    }
    return [mkSound(easy.length >= 3 ? easy : L, 1), mkPic(withPic.length >= 4 ? withPic : L, 3)]; // a letter sound, then a beginning sound
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
    return [mk(easyF.length ? easyF : fams, 3, 1), mk(fams, 4, 3)];
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
  // (rungs may skip levels, so "one lower" is the passed rung's level minus one, never below the first rung)
  function levelFromLadder(rungs, passedIdx) {
    if (!rungs[0]) return 1;
    if (passedIdx <= 0) return rungs[0].lvl;
    return Math.max(rungs[0].lvl, rungs[passedIdx].lvl - 1);
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

    var totalShells = 0;
    plan.forEach(function (l) { totalShells += l.rungs.length; });
    function shellsDone() { // a finished or skipped rung fills a shell, so a ladder that stops early jumps ahead
      var n = 0;
      plan.forEach(function (l, i) { if (i < li) n += l.rungs.length; else if (i === li) n += Math.min(ri, l.rungs.length); });
      return n;
    }
    function shellRow() {
      var d = shellsDone(), out = [];
      for (var i = 0; i < totalShells; i++) out.push(h('span', { class: 'ci-shell' + (i < d ? ' full' : '') + (i === d - 1 ? ' new' : ''), text: '🐚' }));
      return out;
    }
    function frame(inner) {
      var s = h('div', { class: 'screen ci' },
        h('div', { class: 'ci-top' }, h('div', { class: 'pill' }, '🧭 Check-in'),
          press(h('button', { class: 'iconbtn ci-replay', type: 'button', 'aria-label': 'Say it again', text: '🔊' }), function () { if (RG._ciReplay) RG._ciReplay(); }),
          h('div', { class: 'ci-shells', role: 'progressbar', 'aria-valuemax': totalShells, 'aria-valuenow': shellsDone() },
            shellRow())),
        h('div', { class: 'ci-body' }, inner),
        h('div', { class: 'ci-foot' }, skipBtn));
      show(s);
      tok0 = screenToken;
    }

    function intro() {
      frame(h('div', { class: 'ci-card' },
        h('div', { class: 'ci-emoji', text: '🧭' }),
        h('h2', { text: "Captain's Check-in" }),
        h('div', { class: 'ci-text', text: "Just a few quick puzzles to find the best islands for you. Tap what you think. There are no wrong answers!" }),
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
      if (right >= rung.need) { passed[lad.id] = ri; ri++; startRung(); }
      else if (rung.confirm && !lad.confirmed && asked < 2) { lad.confirmed = true; } // the deciding ladder re-checks one first miss with a fresh item
      else { li++; ri = 0; startRung(); }
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
