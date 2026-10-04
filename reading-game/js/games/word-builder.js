/* Word Builder - BIG track. Drag (or tap) tiles into slots to spell the pictured word.
   Levels 1-5 come from RG.content.phonicsWords[level] ({word, emoji, tiles}).
   Tile colors: digraph = solid gold, vowel team / r-controlled / diphthong = solid sky blue,
   syllable chunk = solid lilac, single letters = white. Adjacent consonant letters in the answer
   get a shared two-tone underline (a blend is two sounds, a digraph is one). */
(function () {
  'use strict';
  var RG = window.RG;
  if (!RG || !RG.registerGame) { return; }

  var STYLE_ID = 'wb-styles';
  var CA = '#ff5c8a', CB = '#17b3a3';   // two-tone blend underline
  var CSS = [
    '.wb-stage{display:flex;flex-direction:column;align-items:center;gap:10px;justify-content:flex-start;padding:6px 8px 16px;overflow:visible;width:100%;box-sizing:border-box;}',
    '.wb-pic{cursor:pointer;line-height:1;user-select:none;-webkit-user-select:none;}',
    '.wb-slots{display:flex;flex-wrap:wrap;justify-content:center;align-items:flex-start;gap:10px;margin:4px 0 6px;}',
    '.wb-blend{display:flex;gap:4px;position:relative;padding-bottom:12px;}',
    '.wb-blend::after{content:"";position:absolute;left:4px;right:4px;bottom:0;height:8px;border-radius:5px;background:var(--wbu,linear-gradient(90deg,' + CA + ' 50%,' + CB + ' 50%));}',
    '.wb-slot{width:76px;height:88px;min-width:76px;display:flex;align-items:center;justify-content:center;',
    ' padding:0;box-sizing:border-box;position:relative;}',
    '.wb-slot.wb-filled{border-style:solid;border-color:#4aa3ff;background:#eef6ff;}',
    '.wb-slot.wb-ok{border-color:#2fb457;background:#e6f9ec;box-shadow:0 0 18px rgba(47,180,87,.6);}',
    '.wb-slot.wb-say{border-color:#ff9f1c;box-shadow:0 0 16px rgba(255,159,28,.85);}',
    '.wb-tray{display:flex;flex-wrap:wrap;justify-content:center;gap:12px;max-width:560px;}',
    '.wb-cell{min-width:76px;height:88px;border-radius:18px;background:rgba(255,255,255,.35);',
    ' display:flex;align-items:center;justify-content:center;}',
    '.wb-tile{width:76px;height:88px;min-width:0;padding:0;margin:0;font-size:2.4rem;line-height:1;',
    ' font-weight:700;touch-action:none;user-select:none;-webkit-user-select:none;cursor:grab;',
    ' position:relative;box-sizing:border-box;display:flex;align-items:center;justify-content:center;}',
    '.wb-slot .wb-tile{box-shadow:none;width:100%;height:100%;}',
    '.wb-slot .wb-tile.wb-t-letter{border-color:transparent;background:transparent;}',
    '.wb-tile.wb-t-digraph{background:#ffd37a;border-color:#e08e0b;color:#4a2b00;width:auto;min-width:76px;padding:0 10px;font-size:2.1rem;}',
    '.wb-tile.wb-t-vowel{background:#9fd8ff;border-color:#2b86d6;color:#06284a;width:auto;min-width:76px;padding:0 10px;font-size:2.1rem;}',
    '.wb-slot .wb-tile.wb-t-digraph,.wb-slot .wb-tile.wb-t-vowel{width:100%;}',
    '.wb-tile.wb-t-blend{background:linear-gradient(90deg,' + CA + ' 50%,' + CB + ' 50%) 50% 88%/72% 8px no-repeat,#fff;}',
    '.wb-tile.wb-t-plain{padding:0 8px;}',
    '.wb-slot .wb-tile.wb-t-blend{background:linear-gradient(90deg,' + CA + ' 50%,' + CB + ' 50%) 50% 88%/72% 8px no-repeat;}',
    '.wb-slot .wb-tile.wb-t-plain{background:transparent;border-color:transparent;}',
    '.wb-tile.wb-t-chunk{background:#dccbff;border-color:#8359d6;color:#2a0f5c;width:auto;padding:0 14px;font-size:1.9rem;}',
    '.wb-tile.hint{z-index:2;}',
    '.wb-tile.wb-say{animation:wb-say .6s ease-in-out infinite;z-index:3;}',
    '@keyframes wb-say{0%,100%{transform:scale(1)}50%{transform:scale(1.18)}}',
    '.wb-row{display:flex;gap:12px;flex-wrap:wrap;justify-content:center;}',
    '.wb-sound{font-size:1.25rem;}',
    '.wb-word-out{font-size:2.2rem;min-height:2.6rem;letter-spacing:.12em;font-weight:700;}'
  ].join('\n');

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) { return; }
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  /* ---------- tile knowledge ---------- */
  var DIGRAPHS = ['sh', 'ch', 'th', 'wh', 'ck', 'ng', 'nk', 'ph', 'kn', 'wr', 'tch', 'dge', 'll', 'ss', 'ff', 'zz', 'qu'];
  var VOWEL_TILES = ['ai', 'ay', 'ee', 'ea', 'oa', 'ow', 'oo', 'ar', 'or', 'er', 'ir', 'ur', 'oi', 'oy', 'ou', 'aw', 'au', 'ew', 'ue', 'ie', 'igh', 'oe'];
  var CONFUSE = { ai: ['ay'], ay: ['ai'], ee: ['ea'], ea: ['ee'], oa: ['ow'], ow: ['oa', 'ou'], oo: ['ou', 'ow'], ar: ['or'], or: ['ar'],
    er: ['ir', 'ur'], ir: ['er', 'ur'], ur: ['er', 'ir'], oi: ['oy'], oy: ['oi'], ou: ['ow', 'oo'] };
  var VOWEL_LETTERS = 'aeiou';
  var ALPHABET = 'abcdefghijklmnopqrstuvwxyz'.split('');
  var CHUNK_POOL = ['un', 're', 'ing', 'ed', 'er', 'pop', 'sun', 'set', 'sea', 'rain', 'bow', 'star', 'fish', 'cup', 'cake', 'boat', 'sail', 'jump', 'up', 'day', 'corn', 'shell'];
  var DIGRAPH_SOUND = { sh: 'shh', ch: 'chuh', th: 'thh', wh: 'wuh', ck: 'kuh', ng: 'nng', nk: 'nk', ph: 'fff', kn: 'nnn', wr: 'rrr', tch: 'chuh', dge: 'juh', ll: 'lll', ss: 'sss', ff: 'fff', zz: 'zzz', qu: 'kwuh' };
  var TILE_SOUND = { st: 'sst', se: 'sss', re: 'rrr', le: 'lll', ro: 'roh', ti: 'tie', pi: 'pie', to: 'toe', oc: 'ock', ing: 'ing', er: 'er' };
  var TEAM_SOUND = { ai: 'ay', ay: 'ay', ee: 'ee', ea: 'ee', oa: 'oh', ow: 'oh', oo: 'oo', ar: 'ar', or: 'or', er: 'er', ir: 'er', ur: 'er',
    oi: 'oy', oy: 'oy', ou: 'ow', aw: 'aw', au: 'aw', ew: 'oo', ue: 'oo', ie: 'ee', igh: 'eye', oe: 'oh' };
  var LONG_OW = /^(snow|blow|grow|show|slow|low|flow|yellow|window|pillow|row|bow|throw|crow|glow|rainbow|snowman|elbow)/;
  var SHORT_OO = /^(book|foot|cook|hook|look|wood|good|wool|stood)/;
  var LONG_NAME = { a: 'ay', e: 'ee', i: 'eye', o: 'oh', u: 'you' };

  function isVowelLetter(t) { return t.length === 1 && VOWEL_LETTERS.indexOf(t) >= 0; }
  function isConsLetter(t) { return t.length === 1 && /[a-z]/.test(t) && VOWEL_LETTERS.indexOf(t) < 0 && t !== 'y'; }

  function tileType(text, level) {
    if (text.length === 1) { return 'letter'; }
    if (DIGRAPHS.indexOf(text) >= 0) { return 'digraph'; }
    if (level >= 5) { return 'chunk'; }
    if (VOWEL_TILES.indexOf(text) >= 0) { return 'vowel'; }
    if (/^[^aeiou]e$/.test(text)) { return 'plain'; }          // se, re, le: consonant + silent e
    if (!/[aeiou]/.test(text)) { return 'blend'; }              // a blend given as one tile (st, sk ...)
    return 'chunk';
  }

  function tokenize(word) {
    var out = [], i = 0;
    var two = DIGRAPHS.filter(function (d) { return d.length === 2; });
    while (i < word.length) {
      var p = word.substr(i, 2);
      if (two.indexOf(p) >= 0) { out.push(p); i += 2; } else { out.push(word.charAt(i)); i += 1; }
    }
    return out;
  }

  function letterSound(l) {
    var L = RG.content && RG.content.letters;
    if (L) {
      for (var i = 0; i < L.length; i++) { if (L[i].letter === l && L[i].sound) { return L[i].sound; } }
    }
    return l;
  }

  /* The sound to say for tile idx of a word. Returns '' for a silent e. */
  function soundFor(tilesArr, idx, word) {
    var t = tilesArr[idx], n = tilesArr.length;
    var end = (tilesArr[n - 1] === 's' && tilesArr[n - 2] === 'e') ? n - 1 : n;   // grapes: the e is still silent before a plural s
    var ei = end - 1;
    if (DIGRAPH_SOUND[t]) { return DIGRAPH_SOUND[t]; }
    if (TILE_SOUND[t] && !(t === 'er' && n === 2 && idx === 0)) { return TILE_SOUND[t]; }
    if (t.length === 1) {
      // silent e: ...V C e
      if (t === 'e' && idx === ei && ei >= 2 && isConsLetter(tilesArr[ei - 1]) && isVowelLetter(tilesArr[ei - 2])) { return ''; }
      if (isVowelLetter(t) && tilesArr[ei] === 'e' && ei >= 2 && idx === ei - 2 && isConsLetter(tilesArr[ei - 1])) { return LONG_NAME[t]; }
      var nx = tilesArr[idx + 1] || '';
      if (t === 'c' && /^[eiy]/.test(nx)) { return 'sss'; }
      if (t === 'g' && /^[eiy]/.test(nx) && nx !== 'e' + 'r') { return 'juh'; }
      return letterSound(t);
    }
    if (t === 'st') { return 'sst'; }
    if (t === 'ow') { return LONG_OW.test(word) ? 'oh' : 'ow'; }
    if (t === 'oo') { return SHORT_OO.test(word) ? 'uh' : 'oo'; }
    if (TEAM_SOUND[t] && tileType(t, 4) === 'vowel') { return TEAM_SOUND[t]; }
    // chunks (syllables / affixes)
    if (t === 'ed') {
      var prev = idx > 0 ? tilesArr[idx - 1] : '';
      var last = prev.charAt(prev.length - 1);
      if (last === 't' || last === 'd') { return 'id'; }
      return /[pkfsxh]/.test(last) ? 't' : 'd';
    }
    return t;
  }

  /* ---------- word data ---------- */
  var E = {
    sunset: '🌅', rainbow: '🌈', starfish: '⭐', cupcake: '🧁', jumping: '🤸', sailboat: '⛵', popcorn: '🍿', seashell: '🐚'
  };
  var LOCAL = {
    1: [['ship', '🚢'], ['chin', '🙂'], ['duck', '🦆'], ['fish', '🐟'], ['cat', '🐱'], ['dog', '🐶'], ['sun', '☀️'], ['bus', '🚌'], ['pig', '🐷'], ['bed', '🛏️'], ['chip', '🍟'], ['shell', '🐚']],
    2: [['frog', '🐸'], ['crab', '🦀'], ['cake', '🎂'], ['kite', '🪁'], ['rope', '🪢'], ['flag', '🚩'], ['drum', '🥁'], ['bone', '🦴'], ['bike', '🚲'], ['snake', '🐍']],
    3: [['rain', '🌧️'], ['tray', '🍽️'], ['seed', '🌱'], ['leaf', '🍃'], ['boat', '⛵'], ['snow', '❄️'], ['moon', '🌙'], ['goat', '🐐'], ['bee', '🐝'], ['coat', '🧥']],
    4: [['star', '⭐'], ['fork', '🍴'], ['bird', '🐦'], ['coin', '🪙'], ['boy', '👦'], ['house', '🏠'], ['cow', '🐮'], ['horn', '📯'], ['corn', '🌽'], ['barn', '🏚️']],
    5: [['sunset', '🌅'], ['rainbow', '🌈'], ['starfish', '⭐'], ['cupcake', '🧁'], ['jumping', '🤸'], ['sailboat', '⛵'], ['popcorn', '🍿'], ['seashell', '🐚']]
  };
  var LOCAL_TILES = {
    rain: ['r', 'ai', 'n'], tray: ['t', 'r', 'ay'], seed: ['s', 'ee', 'd'], leaf: ['l', 'ea', 'f'], boat: ['b', 'oa', 't'], snow: ['s', 'n', 'ow'],
    moon: ['m', 'oo', 'n'], goat: ['g', 'oa', 't'], bee: ['b', 'ee'], coat: ['c', 'oa', 't'], star: ['s', 't', 'ar'], fork: ['f', 'or', 'k'],
    bird: ['b', 'ir', 'd'], coin: ['c', 'oi', 'n'], boy: ['b', 'oy'], house: ['h', 'ou', 's', 'e'], cow: ['c', 'ow'], horn: ['h', 'or', 'n'],
    corn: ['c', 'or', 'n'], barn: ['b', 'ar', 'n'], sunset: ['sun', 'set'], rainbow: ['rain', 'bow'], starfish: ['star', 'fish'],
    cupcake: ['cup', 'cake'], jumping: ['jump', 'ing'], sailboat: ['sail', 'boat'], popcorn: ['pop', 'corn'], seashell: ['sea', 'shell']
  };

  function normalizeItem(it) {
    if (!it || typeof it.word !== 'string' || !/^[a-z]+$/.test(it.word)) { return null; }
    var tiles = Array.isArray(it.tiles) ? it.tiles.map(String) : null;
    if (!tiles || !tiles.length || tiles.join('') !== it.word) { tiles = LOCAL_TILES[it.word] || tokenize(it.word); }
    var emoji = it.emoji || (RG.emojiFor && RG.emojiFor(it.word)) || E[it.word] || '';
    return { word: it.word, emoji: emoji, tiles: tiles };
  }

  function localItems(level) {
    var c = RG.content || {};
    var rows = (LOCAL[level] || LOCAL[5]).map(function (r) { return { word: r[0], emoji: r[1] }; });
    if (level === 1 && c.cvcWords && c.cvcWords.length >= 5) { rows = rows.concat(c.cvcWords); }
    if (level === 2 && c.longWords && c.longWords.length >= 5) { rows = rows.concat(c.longWords.filter(function (w) { return /e$/.test(w.word) && w.word.length <= 5; })); }
    return rows;
  }

  function availableLevels(pw) {
    var out = [];
    if (!pw) { return out; }
    Object.keys(pw).forEach(function (k) {
      var n = parseInt(k, 10);
      if (n >= 1 && pw[k] && pw[k].length) { out.push(n); }
    });
    return out.sort(function (a, b) { return a - b; });
  }
  function resolveLevel(avail, level) {
    if (!avail.length) { return 0; }
    if (avail.indexOf(level) >= 0) { return level; }
    var lower = avail.filter(function (n) { return n < level; });
    return lower.length ? lower[lower.length - 1] : avail[0];
  }

  function levelItems(level) {
    var pw = RG.content && RG.content.phonicsWords;
    var lv = resolveLevel(availableLevels(pw), level);
    var raw = lv ? pw[lv] : localItems(Math.min(level, 5));
    var items = raw.map(normalizeItem).filter(function (x) { return x && x.tiles.length >= 2; });
    if (items.length < 3) { items = localItems(Math.min(level, 5)).map(normalizeItem).filter(Boolean); }
    return items;
  }

  function findAnyItem(word) {
    var pw = RG.content && RG.content.phonicsWords, found = null;
    if (pw) {
      Object.keys(pw).forEach(function (k) {
        (pw[k] || []).forEach(function (it) { if (!found && it && it.word === word) { found = normalizeItem(it); } });
      });
    }
    return found;
  }

  function trickyWords() {
    try {
      if (RG.progress && RG.progress.tricky && RG.progress.tricky.list) {
        return (RG.progress.tricky.list('phonics') || []).map(function (x) { return typeof x === 'string' ? x : x && x.word; }).filter(Boolean);
      }
    } catch (e) { /* ignore */ }
    return [];
  }

  function buildPool(level, rounds) {
    var items = RG.shuffle(levelItems(level));
    var pool = items.slice(0, rounds);
    var i = 0;
    while (pool.length < rounds && items.length) { pool.push(items[i % items.length]); i++; }
    // mix in 1-2 tricky words (never as the first round)
    var tw = RG.shuffle(trickyWords()).slice(0, Math.random() < 0.5 ? 1 : 2), slot = 1;
    tw.forEach(function (w) {
      var it = findAnyItem(w);
      if (!it || pool.some(function (p) { return p.word === w; }) || slot >= pool.length) { return; }
      var copy = { word: it.word, emoji: it.emoji, tiles: it.tiles, tricky: true };
      pool[slot] = copy; slot++;
    });
    return pool;
  }

  RG.registerGame({
    id: 'word-builder',
    title: 'Word Builder',
    emoji: '🧱',
    tracks: ['big'],
    skill: 'phonics',
    blurb: 'Build the word from sound tiles!',
    mount: function (container, ctx) {
      injectStyle();
      var dead = false;
      var timers = [];
      var level = Math.max(1, Math.min(5, ctx.level || 1));
      var rounds = ctx.rounds || 5;
      var pool = buildPool(level, rounds);
      var roundNo = 0;
      var locked = true;
      var misses = 0, modeled = false, missLogged = false, busy = false, soundToken = 0;
      var item, target, tiles, slots, slotEls, soundBtn;
      var current = { word: '' };

      function noop() {}
      function later(fn, ms) {
        var id = setTimeout(function () {
          var k = timers.indexOf(id);
          if (k >= 0) { timers.splice(k, 1); }
          if (!dead) { fn(); }
        }, ms);
        timers.push(id);
        return id;
      }
      function sleep(ms) { return new Promise(function (res) { later(res, ms); }); }
      function say(text, opts) {
        var p;
        try { p = Promise.resolve(RG.speak(text, opts)).catch(noop); } catch (e) { p = Promise.resolve(); }
        return Promise.race([p, sleep(Math.max(2500, text.length * 220))]);
      }
      function quick(text, opts) { try { RG.speak(text, opts); } catch (e) { /* ignore */ } }

      container.innerHTML = '';
      var stage = RG.el('div', { class: 'wb-stage' });
      container.appendChild(stage);

      function resetDragStyle(el) {
        var st = el.style;
        st.transform = ''; st.position = ''; st.left = ''; st.top = ''; st.zIndex = '';
        st.transition = ''; st.pointerEvents = ''; st.width = ''; st.height = '';
      }

      function firstEmpty() {
        for (var i = 0; i < slots.length; i++) { if (!slots[i]) { return i; } }
        return -1;
      }

      function detach(tile) {
        if (tile.slot >= 0) {
          slotEls[tile.slot].classList.remove('wb-filled');
          slots[tile.slot] = null;
          tile.slot = -1;
        }
      }
      function placeTile(tile, i) {
        detach(tile);
        slots[i] = tile;
        tile.slot = i;
        slotEls[i].appendChild(tile.el);
        slotEls[i].classList.add('wb-filled');
        resetDragStyle(tile.el);
      }
      function returnTile(tile) {
        detach(tile);
        tile.cell.appendChild(tile.el);
        resetDragStyle(tile.el);
      }

      function updateHint() {
        tiles.forEach(function (t) { t.el.classList.remove('hint'); });
        if (locked || misses < 2) { return; }
        var idx = firstEmpty();
        if (idx < 0) { return; }
        for (var i = 0; i < tiles.length; i++) {
          if (tiles[i].slot < 0 && tiles[i].text === target[idx]) { tiles[i].el.classList.add('hint'); return; }
        }
      }

      function afterPlace() {
        updateHint();
        if (firstEmpty() < 0) { check(); }
      }

      function tileSoundForText(text) {
        // a tile tapped from the tray: use its position in the answer when present
        var k = target.indexOf(text);
        if (k >= 0) { return soundFor(target, k, item.word) || text; }
        return soundFor([text], 0, item.word) || text;
      }

      function onTileTap(tile) {
        if (locked || dead) { return; }
        if (tile.slot >= 0) { returnTile(tile); updateHint(); return; }
        var idx = firstEmpty();
        if (idx < 0) { return; }
        quick(tileSoundForText(tile.text));
        RG.sfx && RG.sfx.pop && RG.sfx.pop();
        placeTile(tile, idx);
        afterPlace();
      }

      function onDropTile(tile, targetEl) {
        if (locked || dead) { resetDragStyle(tile.el); return; }
        var idx = slotEls.indexOf(targetEl);
        if (idx < 0) { resetDragStyle(tile.el); return; }
        if (slots[idx] && slots[idx] !== tile) { resetDragStyle(tile.el); return; }
        if (slots[idx] === tile) { resetDragStyle(tile.el); return; }
        quick(tileSoundForText(tile.text));
        placeTile(tile, idx);
        afterPlace();
      }

      function buildTiles() {
        var extra = [];
        var used = {};
        item.word.split('').forEach(function (ch) { used[ch] = true; });
        var nExtra = level === 1 ? 1 : 2;
        var types = target.map(function (t) { return tileType(t, level); });
        function addExtra(t) { if (t && target.indexOf(t) < 0 && extra.indexOf(t) < 0 && extra.length < nExtra) { extra.push(t); } }
        if (types.indexOf('digraph') >= 0) {
          addExtra(RG.sample(['sh', 'ch', 'th', 'wh', 'ck'].filter(function (d) { return item.word.indexOf(d) < 0; })));
        }
        if (types.indexOf('vowel') >= 0) {
          var tt = target[types.indexOf('vowel')];
          addExtra(RG.sample(CONFUSE[tt] || ['ai', 'ee', 'oa']));
        }
        if (types.indexOf('chunk') >= 0 || level >= 5) {
          var cp = RG.shuffle(CHUNK_POOL.filter(function (c) { return target.indexOf(c) < 0 && item.word.indexOf(c) < 0; }));
          while (extra.length < nExtra && cp.length) { addExtra(cp.shift()); }
        }
        var letterPool = ALPHABET.filter(function (l) { return !used[l]; });
        RG.shuffle(letterPool).forEach(function (l) { addExtra(l); });
        return RG.shuffle(target.concat(extra));
      }

      /* group consecutive consonant letters in the answer for the blend underline */
      function blendGroups() {
        var groups = [], run = [];
        function flush() { if (run.length >= 2 && !run.every(function (x) { return target[x] === target[run[0]]; })) { groups.push(run.slice()); } run = []; }
        for (var i = 0; i < target.length; i++) {
          if (isConsLetter(target[i])) { run.push(i); } else { flush(); }
        }
        flush();
        return groups;
      }

      function makeSlot(i) {
        var tt = tileType(target[i], level);
        var s = RG.el('div', { class: 'slot wb-slot', 'data-i': String(i) });
        if (tt !== 'letter') { s.style.minWidth = Math.max(76, target[i].length * 30 + 34) + 'px'; }
        s.addEventListener('click', function () {
          if (locked || dead) { return; }
          var tl = slots[i];
          if (tl) { returnTile(tl); updateHint(); }
        });
        return s;
      }

      function startRound() {
        if (dead) { return; }
        locked = true;
        misses = 0; modeled = false; missLogged = false; busy = false; soundToken++;
        item = pool[roundNo % pool.length];
        var word = item.word;
        target = item.tiles.slice();
        current.word = word;
        container.dataset.target = word;
        container.dataset.tiles = target.join('|');
        var emoji = item.emoji || '❓';

        stage.innerHTML = '';
        var pic = RG.el('div', { class: 'big-emoji wb-pic bounce', text: emoji, role: 'button', 'aria-label': 'say the word' });
        var prompt = RG.el('div', { class: 'prompt', text: 'Build the word!' });
        var slotsRow = RG.el('div', { class: 'wb-slots' });
        var tray = RG.el('div', { class: 'wb-tray' });
        var out = RG.el('div', { class: 'wb-word-out word', text: '' });
        soundBtn = RG.el('button', { class: 'btn wb-sound', type: 'button', text: '🐢 Sound it out', 'aria-label': 'sound it out' });
        var row = RG.el('div', { class: 'wb-row' }, soundBtn);
        stage.appendChild(pic);
        stage.appendChild(prompt);
        stage.appendChild(slotsRow);
        stage.appendChild(row);
        stage.appendChild(tray);
        stage.appendChild(out);

        slots = []; slotEls = []; tiles = [];
        var groups = blendGroups(), inGroup = {};
        groups.forEach(function (g, gi) { g.forEach(function (x) { inGroup[x] = gi; }); });
        var groupEls = {};
        target.forEach(function (t, i) {
          var s = makeSlot(i);
          slots.push(null);
          slotEls.push(s);
          if (inGroup[i] != null) {
            var gi = inGroup[i];
            if (!groupEls[gi]) {
              var w = RG.el('div', { class: 'wb-blend' });
              var n = groups[gi].length, stops = [];
              for (var k = 0; k < n; k++) { stops.push((k % 2 ? CB : CA) + ' ' + (k * 100 / n) + '% ' + ((k + 1) * 100 / n) + '%'); }
              w.style.setProperty('--wbu', 'linear-gradient(90deg,' + stops.join(',') + ')');
              groupEls[gi] = w;
              slotsRow.appendChild(w);
            }
            groupEls[gi].appendChild(s);
          } else {
            slotsRow.appendChild(s);
          }
        });

        var texts = buildTiles();
        texts.forEach(function (txt) {
          var cell = RG.el('div', { class: 'wb-cell' });
          if (tileType(txt, level) !== 'letter') { cell.style.minWidth = Math.max(76, txt.length * 30 + 34) + 'px'; }
          var el = RG.el('button', { class: 'choice wb-tile wb-t-' + tileType(txt, level), type: 'button', text: txt, 'aria-label': 'tile ' + txt });
          var tile = { el: el, text: txt, cell: cell, slot: -1 };
          var sx = 0, sy = 0, moved = false;
          el.addEventListener('pointerdown', function (e) { sx = e.clientX; sy = e.clientY; moved = false; }, true);
          el.addEventListener('pointermove', function (e) {
            if (Math.abs(e.clientX - sx) > 10 || Math.abs(e.clientY - sy) > 10) { moved = true; }
          }, true);
          el.addEventListener('click', function (e) {
            e.stopPropagation();
            if (moved) { moved = false; return; }
            onTileTap(tile);
          });
          RG.makeDraggable(el, {
            onDrop: function (dragEl, tgt) { onDropTile(tile, tgt); },
            dropTargets: function () { return slotEls; }
          });
          cell.appendChild(el);
          tray.appendChild(cell);
          tiles.push(tile);
        });

        pic.addEventListener('click', function () { if (!dead) { quick(current.word); } });
        soundBtn.addEventListener('click', function () { if (!dead && !busy) { soundItOut(); } });
        var prompt1 = 'Build the word: ' + word + '.';
        ctx.onReplay = function () { quick(prompt1); };
        quick(prompt1);
        // interaction is allowed right away (not gated on speech)
        later(function () { locked = false; }, 300);
      }

      /* ---- highlight helpers ---- */
      function clearSay() {
        slotEls.forEach(function (s) { s.classList.remove('wb-say'); });
        tiles.forEach(function (t) { t.el.classList.remove('wb-say'); });
      }
      function tileFor(idx) {
        if (slots[idx] && slots[idx].text === target[idx]) { return slots[idx]; }
        for (var i = 0; i < tiles.length; i++) {
          if (tiles[i].text === target[idx] && tiles[i].slot < 0) { return tiles[i]; }
        }
        for (var j = 0; j < tiles.length; j++) { if (tiles[j].text === target[idx] && tiles[j] !== slots[idx]) { return tiles[j]; } }
        return null;
      }
      function sayTiles(my, flags) {
        // speak each sound in turn, highlighting the slot and its tile
        var run = Promise.resolve();
        target.forEach(function (t, i) {
          run = run.then(function () {
            if (dead || my !== soundToken) { return; }
            clearSay();
            slotEls[i].classList.add('wb-say');
            var tl = tileFor(i);
            if (tl) { tl.el.classList.add('wb-say'); }
            if (flags && flags.place && tl) { flags.place(tl, i); }
            var snd = soundFor(target, i, item.word);
            return say(snd || 'the e is silent', { rate: 0.6, mood: 'calm' }).then(function () { return sleep(snd ? 220 : 100); });
          });
        });
        return run.then(function () { if (!dead && my === soundToken) { clearSay(); } });
      }

      /* 🐢 Sound it out: highlight each tile in turn while saying its sound, then blend the word */
      function soundItOut() {
        if (locked && !busy) { return; }
        var my = ++soundToken;
        try { RG.stopSpeaking(); } catch (e) { /* ignore */ }
        sayTiles(my)
          .then(function () { if (dead || my !== soundToken) { return; } return say(item.word, { rate: 0.7 }); })
          .then(function () { if (!dead && my === soundToken) { clearSay(); } });
      }

      function check() {
        locked = true;
        var wrong = [];
        for (var i = 0; i < slots.length; i++) {
          if (!slots[i] || slots[i].text !== target[i]) { wrong.push(slots[i]); }
        }
        var row = stage.querySelector('.wb-slots');
        if (wrong.length === 0) {
          ctx.answer(true);
          slotEls.forEach(function (s) { s.classList.add('wb-ok'); });
          tiles.forEach(function (t) { t.el.classList.remove('hint'); });
          RG.celebrate(row);
          var out = stage.querySelector('.wb-word-out');
          if (out) { out.textContent = item.word; }
          if (item.tricky && !missLogged && misses < 2) {
            try { if (RG.progress && RG.progress.tricky && RG.progress.tricky.correct) { RG.progress.tricky.correct(item.word); } } catch (e1) { /* ignore */ }
          }
          success();
        } else {
          ctx.answer(false);
          misses++;
          if (!missLogged) {
            missLogged = true;
            try { if (RG.progress && RG.progress.tricky && RG.progress.tricky.add) { RG.progress.tricky.add(item.word, 'phonics'); } } catch (e2) { /* ignore */ }
          }
          RG.wobble(row);
          if (misses >= 2 && !modeled) {
            modelAnswer();
          } else {
            quick('Try again! You can tap Sound it out.', { mood: 'gentle' });
            later(function () {
              wrong.forEach(function (t) { if (t) { returnTile(t); } });
              locked = false;
              updateHint();
            }, 750);
          }
        }
      }

      /* After 2 misses: say it out loud, animate the right tiles into place, then reset so he builds it. */
      function flip(tile, idx) {
        var first = tile.el.getBoundingClientRect();
        placeTile(tile, idx);
        var last = tile.el.getBoundingClientRect();
        var dx = first.left - last.left, dy = first.top - last.top;
        if (tile.el.animate) {
          try { tile.el.animate([{ transform: 'translate(' + dx + 'px,' + dy + 'px) scale(1.15)' }, { transform: 'none' }], { duration: 520, easing: 'cubic-bezier(.3,1.3,.5,1)' }); } catch (e) { /* ignore */ }
        }
      }
      function modelAnswer() {
        modeled = true; busy = true; locked = true;
        var my = ++soundToken;
        tiles.forEach(function (t) { if (t.slot >= 0) { returnTile(t); } });
        tiles.forEach(function (t) { t.el.classList.remove('hint'); });
        say('This says ' + item.word + '.', { mood: 'gentle' })
          .then(function () { return sayTiles(my, { place: flip }); })
          .then(function () {
            if (dead || my !== soundToken) { return; }
            slotEls.forEach(function (s) { s.classList.add('wb-ok'); });
            return say(item.word + '!', { mood: 'excited' });
          })
          .then(function () { return sleep(900); })
          .then(function () {
            if (dead || my !== soundToken) { return; }
            slotEls.forEach(function (s) { s.classList.remove('wb-ok'); });
            tiles.forEach(function (t) { if (t.slot >= 0) { returnTile(t); } });
            clearSay();
            busy = false; locked = false;
            quick('Now you build it!', { mood: 'happy' });
            updateHint();
          });
      }

      function success() {
        var word = item.word;
        var n = target.length;
        var silentE = soundFor(target, n - 1, word) === '' || (target[n - 1] === 's' && soundFor(target, n - 2, word) === '');
        var run = Promise.resolve();
        busy = true;
        if (!silentE) {
          target.forEach(function (t, i) {
            run = run.then(function () {
              if (dead) { return; }
              var snd = soundFor(target, i, word);
              if (!snd) { return; }
              return say(snd, { rate: 0.6 }).then(function () { return sleep(120); });
            });
          });
        } else {
          run = run.then(function () { return say(word, { rate: 0.45 }); }).then(function () { return sleep(150); });
        }
        run.then(function () { if (dead) { return; } return say(word); })
          .then(function () { if (dead) { return; } return say(RG.praise(), { mood: 'excited' }); })
          .then(function () { return sleep(350); })
          .then(function () {
            if (dead) { return; }
            roundNo++;
            ctx.roundDone();
            if (roundNo >= rounds) { ctx.finish(); }
            else { startRound(); }
          });
      }

      startRound();

      return function cleanup() {
        dead = true;
        timers.forEach(clearTimeout);
        timers = [];
        try { RG.stopSpeaking(); } catch (e) { /* ignore */ }
        ctx.onReplay = null;
        try { container.innerHTML = ''; } catch (e2) { /* ignore */ }
      };
    }
  });
})();
