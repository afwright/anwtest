/* Word Builder - BIG track. Drag (or tap) letter tiles into slots to spell the pictured word. */
(function () {
  'use strict';
  var RG = window.RG;
  if (!RG || !RG.registerGame) { return; }

  var STYLE_ID = 'wb-styles';
  var CSS = [
    '.wb-stage{gap:12px;justify-content:flex-start;padding:8px 8px 16px;overflow:visible;}',
    '.wb-pic{cursor:pointer;line-height:1;user-select:none;-webkit-user-select:none;}',
    '.wb-slots{display:flex;flex-wrap:wrap;justify-content:center;gap:10px;margin:6px 0 10px;}',
    '.wb-slot{width:76px;height:88px;min-width:0;display:flex;align-items:center;justify-content:center;',
    ' padding:0;box-sizing:border-box;position:relative;}',
    '.wb-slot.wb-filled{border-style:solid;border-color:#4aa3ff;background:#eef6ff;}',
    '.wb-slot.wb-ok{border-color:#2fb457;background:#e6f9ec;box-shadow:0 0 18px rgba(47,180,87,.6);}',
    '.wb-tray{display:flex;flex-wrap:wrap;justify-content:center;gap:12px;max-width:560px;}',
    '.wb-cell{width:76px;height:88px;border-radius:18px;background:rgba(255,255,255,.35);',
    ' display:flex;align-items:center;justify-content:center;}',
    '.wb-tile{width:76px;height:88px;min-width:0;padding:0;margin:0;font-size:2.4rem;line-height:1;',
    ' font-weight:700;touch-action:none;user-select:none;-webkit-user-select:none;cursor:grab;',
    ' position:relative;box-sizing:border-box;display:flex;align-items:center;justify-content:center;}',
    '.wb-slot .wb-tile{border-color:transparent;box-shadow:none;background:transparent;width:100%;height:100%;}',
    '.wb-tile.hint{z-index:2;}',
    '.wb-word-out{font-size:2.2rem;min-height:2.6rem;letter-spacing:.12em;font-weight:700;}'
  ].join('\n');

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) { return; }
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  var DIGRAPHS = ['sh', 'ch', 'th', 'wh', 'ck'];
  var DIGRAPH_SOUND = { sh: 'shh', ch: 'chuh', th: 'thh', wh: 'wuh', ck: 'kuh' };
  var ALPHABET = 'abcdefghijklmnopqrstuvwxyz'.split('');

  var LOCAL_L1 = [
    { word: 'cat', emoji: '🐱' }, { word: 'dog', emoji: '🐶' },
    { word: 'sun', emoji: '☀️' }, { word: 'hat', emoji: '🎩' },
    { word: 'bus', emoji: '🚌' }, { word: 'pig', emoji: '🐷' },
    { word: 'bed', emoji: '🛏️' }, { word: 'cup', emoji: '☕' }
  ];
  var LOCAL_L2 = [
    { word: 'ship', emoji: '🚢', pattern: 'sh' }, { word: 'fish', emoji: '🐟', pattern: 'sh' },
    { word: 'chin', emoji: '🙂', pattern: 'ch' }, { word: 'duck', emoji: '🦆', pattern: 'ck' },
    { word: 'frog', emoji: '🐸', pattern: 'fr' }, { word: 'crab', emoji: '🦀', pattern: 'cr' },
    { word: 'flag', emoji: '🚩', pattern: 'fl' }, { word: 'drum', emoji: '🥁', pattern: 'dr' }
  ];
  var LOCAL_L3 = [
    { word: 'cake', emoji: '🎂' }, { word: 'bike', emoji: '🚲' },
    { word: 'kite', emoji: '🪁' }, { word: 'bone', emoji: '🦴' },
    { word: 'frog', emoji: '🐸' }, { word: 'crab', emoji: '🦀' },
    { word: 'flag', emoji: '🚩' }, { word: 'drum', emoji: '🥁' },
    { word: 'star', emoji: '⭐' }, { word: 'snail', emoji: '🐌' },
    { word: 'plane', emoji: '✈️' }, { word: 'rose', emoji: '🌹' },
    { word: 'nose', emoji: '👃' }, { word: 'tree', emoji: '🌳' },
    { word: 'ship', emoji: '🚢' }, { word: 'train', emoji: '🚂' }
  ];

  function tokenize(word) {
    var out = [], i = 0;
    while (i < word.length) {
      var two = word.substr(i, 2);
      if (DIGRAPHS.indexOf(two) >= 0) { out.push(two); i += 2; }
      else { out.push(word.charAt(i)); i += 1; }
    }
    return out;
  }

  function soundFor(text) {
    if (DIGRAPH_SOUND[text]) { return DIGRAPH_SOUND[text]; }
    var L = RG.content && RG.content.letters;
    if (L) {
      for (var i = 0; i < L.length; i++) { if (L[i].letter === text && L[i].sound) { return L[i].sound; } }
    }
    return text;
  }

  function wordPool(level) {
    var c = RG.content || {};
    var pool;
    if (level === 1) { pool = (c.cvcWords && c.cvcWords.length >= 5) ? c.cvcWords : LOCAL_L1; }
    else if (level === 2) { pool = (c.digraphWords && c.digraphWords.length >= 5) ? c.digraphWords : LOCAL_L2; }
    else { pool = LOCAL_L3; }
    return RG.shuffle(pool.filter(function (w) { return w && w.word && /^[a-z]+$/.test(w.word); }));
  }

  RG.registerGame({
    id: 'word-builder',
    title: 'Word Builder',
    emoji: '🧱',
    tracks: ['big'],
    skill: 'phonics',
    blurb: 'Build the word from letter tiles!',
    mount: function (container, ctx) {
      injectStyle();
      var dead = false;
      var timers = [];
      var level = ctx.level || 1;
      var rounds = ctx.rounds || 5;
      var pool = wordPool(level);
      var roundNo = 0;
      var locked = true;
      var misses = 0;
      var item, target, tiles, slots, slotEls, tileCells;
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

      function onTileTap(tile) {
        if (locked || dead) { return; }
        if (tile.slot >= 0) { returnTile(tile); updateHint(); return; }
        var idx = firstEmpty();
        if (idx < 0) { return; }
        quick(soundFor(tile.text));
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
        quick(soundFor(tile.text));
        placeTile(tile, idx);
        afterPlace();
      }

      function buildTiles() {
        var words = target.slice();
        var extra = [];
        var usedLetters = {};
        item.word.split('').forEach(function (ch) { usedLetters[ch] = true; });
        var nExtra = level === 1 ? 1 : 2;
        if (level === 2) {
          var hasDig = target.some(function (t) { return t.length === 2; });
          if (hasDig) {
            var otherDigs = DIGRAPHS.filter(function (d) { return target.indexOf(d) < 0 && !(item.word.indexOf(d) >= 0); });
            if (otherDigs.length) { extra.push(RG.sample(otherDigs)); }
          }
        }
        var letterPool = ALPHABET.filter(function (l) { return !usedLetters[l]; });
        var need = nExtra - extra.length;
        RG.pick(letterPool, Math.max(0, need)).forEach(function (l) { extra.push(l); });
        var all = RG.shuffle(words.concat(extra));
        return all;
      }

      function startRound() {
        if (dead) { return; }
        locked = true;
        misses = 0;
        item = pool[roundNo % pool.length];
        var word = item.word;
        target = tokenize(word);
        current.word = word;
        var emoji = item.emoji || (RG.emojiFor && RG.emojiFor(word)) || '❓';

        stage.innerHTML = '';
        var pic = RG.el('div', { class: 'big-emoji wb-pic bounce', text: emoji, role: 'button', 'aria-label': 'say the word' });
        var prompt = RG.el('div', { class: 'prompt', text: 'Build the word!' });
        var slotsRow = RG.el('div', { class: 'wb-slots' });
        var tray = RG.el('div', { class: 'wb-tray' });
        var out = RG.el('div', { class: 'wb-word-out word', text: '' });
        stage.appendChild(pic);
        stage.appendChild(prompt);
        stage.appendChild(slotsRow);
        stage.appendChild(tray);
        stage.appendChild(out);

        slots = []; slotEls = []; tiles = [];
        target.forEach(function (t, i) {
          var s = RG.el('div', { class: 'slot wb-slot', 'data-i': String(i) });
          s.addEventListener('click', function () {
            if (locked || dead) { return; }
            var tl = slots[i];
            if (tl) { returnTile(tl); updateHint(); }
          });
          slots.push(null);
          slotEls.push(s);
          slotsRow.appendChild(s);
        });

        var texts = buildTiles();
        texts.forEach(function (txt) {
          var cell = RG.el('div', { class: 'wb-cell' });
          var el = RG.el('button', { class: 'choice wb-tile', type: 'button', text: txt, 'aria-label': 'letter ' + txt });
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
        var prompt1 = 'Build the word: ' + word + '.';
        ctx.onReplay = function () { quick(prompt1); };
        quick(prompt1);
        // interaction is allowed right away (not gated on speech)
        later(function () { locked = false; }, 300);
      }

      function check() {
        locked = true;
        var wrong = [];
        for (var i = 0; i < slots.length; i++) {
          if (!slots[i] || slots[i].text !== target[i]) { wrong.push(slots[i]); }
        }
        var tray = stage.querySelector('.wb-slots');
        if (wrong.length === 0) {
          ctx.answer(true);
          slotEls.forEach(function (s) { s.classList.add('wb-ok'); });
          tiles.forEach(function (t) { t.el.classList.remove('hint'); });
          RG.celebrate(tray);
          var out = stage.querySelector('.wb-word-out');
          if (out) { out.textContent = item.word; }
          success();
        } else {
          ctx.answer(false);
          misses++;
          RG.wobble(tray);
          quick('Try again!');
          later(function () {
            wrong.forEach(function (t) { if (t) { returnTile(t); } });
            locked = false;
            updateHint();
          }, 750);
        }
      }

      function success() {
        var word = item.word;
        var slow = level === 3 || /e$/.test(word);
        var run = Promise.resolve();
        if (!slow) {
          target.forEach(function (t) {
            run = run.then(function () { if (dead) { return; } return say(soundFor(t), { rate: 0.6 }).then(function () { return sleep(120); }); });
          });
        } else {
          run = run.then(function () { return say(word, { rate: 0.45 }); }).then(function () { return sleep(150); });
        }
        run.then(function () { if (dead) { return; } return say(word); })
          .then(function () { if (dead) { return; } return say(RG.praise()); })
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
