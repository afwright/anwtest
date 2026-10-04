/* Story Cove - BIG track. Echo reading: on each page he can 🔊 Listen (karaoke), then 🎤 My turn
   (reads aloud, taps "Done!"), then gets a short praise. After the story: comprehension questions
   (each question has a type: literal / why / sequence / vocab / inference).
   Rereading a finished story earns the Smooth Sailor badge (2nd and 3rd read).
   At higher levels a "Chapter book" shelf (RG.content.serial) unlocks one chapter at a time. */
(function () {
  'use strict';
  var RG = window.RG;
  if (!RG || !RG.registerGame) { return; }

  var STYLE_ID = 'sc-styles';
  var NEXT_WAIT_MS = 3000;
  var BASE_RATE = 0.85;
  var STATE_KEY = 'story-cove';
  var CSS = [
    '.sc-stage{display:flex;flex-direction:column;align-items:center;gap:12px;justify-content:flex-start;padding:8px 10px 16px;width:100%;box-sizing:border-box;}',
    '.sc-title{font-size:1.3rem;font-weight:700;color:#1d2b4f;text-align:center;background:rgba(255,255,255,.88);padding:2px 16px;border-radius:18px;}',
    '.sc-pg{font-size:1rem;color:#2b3a63;background:rgba(255,255,255,.88);padding:1px 14px;border-radius:14px;}',
    '.sc-chip{font-size:1rem;font-weight:700;color:#7a4a00;background:#fff3c4;border:2px solid #f4a62a;padding:2px 14px;border-radius:14px;}',
    '.sc-page{display:flex;flex-direction:column;align-items:center;gap:10px;width:100%;max-width:640px;animation:sc-in .45s ease;}',
    '@keyframes sc-in{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:none}}',
    '.sc-art{font-size:5rem;line-height:1;}',
    '.sc-card{background:#fff;border:4px solid #4aa3ff;border-radius:24px;padding:14px;width:100%;box-sizing:border-box;',
    ' display:flex;flex-wrap:wrap;justify-content:center;gap:4px 10px;}',
    '.sc-card.sc-mine{border-color:#2fb457;box-shadow:0 0 0 5px rgba(47,180,87,.25);}',
    '.sc-w{font:inherit;font-size:1.9rem;font-weight:700;letter-spacing:.05em;color:#1d2b4f;background:transparent;border:0;',
    ' border-radius:12px;padding:4px 6px;min-height:50px;min-width:40px;cursor:pointer;transition:background .12s,transform .12s;',
    ' touch-action:manipulation;-webkit-tap-highlight-color:transparent;}',
    '.sc-w.sc-hl{background:#ffe97a;transform:scale(1.12);box-shadow:0 2px 0 #f4a62a;}',
    '.sc-w.sc-said{color:#2b6cc4;}',
    '.sc-row{display:flex;gap:14px;flex-wrap:wrap;justify-content:center;}',
    '.sc-turnbtn.sc-glow{background:linear-gradient(180deg,#55dd7e,#2fbf5b);color:#fff;animation:sc-pulse .9s ease-in-out infinite;}',
    '.sc-banner{font-size:1.35rem;font-weight:800;color:#14532d;background:#d6f5dd;border:3px solid #2fb457;border-radius:18px;padding:8px 16px;text-align:center;}',
    '.sc-praise{font-size:1.4rem;font-weight:800;color:#7a4a00;min-height:1.6rem;text-align:center;}',
    '.sc-next{position:relative;overflow:hidden;min-width:170px;}',
    '.sc-next[disabled]{opacity:1;background:#e6edf7;color:#6b7a99;cursor:default;}',
    '.sc-fill{position:absolute;left:0;top:0;bottom:0;width:0;background:rgba(47,180,87,.4);pointer-events:none;}',
    '.sc-next.sc-wait .sc-fill{animation:sc-fill ' + (NEXT_WAIT_MS / 1000) + 's linear forwards;}',
    '@keyframes sc-fill{from{width:0}to{width:100%}}',
    '.sc-lbl{position:relative;}',
    '.sc-next.sc-ready{animation:sc-pulse .8s ease 2;}',
    '@keyframes sc-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}',
    '.sc-q{font-size:1.9rem;font-weight:700;text-align:center;color:#1d2b4f;max-width:640px;}',
    '.sc-opt{font-family:inherit;font-size:1.9rem;min-width:110px;padding:10px 18px;}',
    '.sc-look{background:#fff8dc;border:3px dashed #f4a62a;border-radius:18px;padding:8px 14px;max-width:640px;width:100%;box-sizing:border-box;text-align:center;font-size:1.3rem;font-weight:700;color:#1d2b4f;}',
    '.sc-shelf{display:flex;flex-direction:column;gap:10px;width:100%;max-width:560px;}',
    '.sc-ch{display:flex;align-items:center;gap:12px;text-align:left;font:inherit;font-size:1.3rem;font-weight:800;color:#1d2b4f;',
    ' background:#fff;border:4px solid #4aa3ff;border-radius:20px;padding:10px 16px;min-height:72px;cursor:pointer;box-sizing:border-box;width:100%;}',
    '.sc-ch .sc-chi{font-size:2rem;flex:none;}',
    '.sc-ch.sc-next-ch{border-color:#2fb457;background:#e6f9ec;animation:sc-pulse 1.2s ease-in-out infinite;}',
    '.sc-ch.sc-done-ch{border-color:#f4a62a;background:#fff8e1;}',
    '.sc-ch.sc-locked{opacity:.6;background:#e6edf7;border-color:#9aa8c4;color:#55627f;}',
    '.sc-end{display:flex;flex-direction:column;align-items:center;gap:12px;width:100%;max-width:560px;text-align:center;animation:sc-in .45s ease;}',
    '.sc-end h2{margin:0;font-size:1.7rem;color:#1d2b4f;}',
    '.sc-gcard{background:#fff;border:4px solid #4aa3ff;border-radius:20px;padding:10px 16px;font-size:1.3rem;font-weight:800;color:#1d2b4f;width:100%;box-sizing:border-box;}',
    '.sc-gcard.sc-badge{border-color:#f4a62a;background:#fff3c4;}',
    '.sc-gcard.sc-beat{border-color:#2fb457;background:#e6f9ec;}',
    '.sc-gcard.sc-tease{border-color:#8a5cf5;background:#f0e9ff;}',
    '@media (max-width:420px){.sc-w{font-size:1.6rem;padding:2px 4px;min-width:34px}.sc-art{font-size:4rem}.sc-q,.sc-opt{font-size:1.6rem}}'
  ].join('\n');

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) { return; }
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  var LOCAL = [
    { id: 'local-sam', title: 'Sam and the Boat', level: 1, pages: [
      { text: 'sam has a red boat.', emoji: '⛵' },
      { text: 'the boat is on the sea.', emoji: '🌊' },
      { text: 'a big fish can swim.', emoji: '🐟' },
      { text: 'sam and the fish had fun.', emoji: '😊' }],
      questions: [{ q: 'what color is the boat?', options: ['red', 'blue', 'green'], answer: 'red', type: 'literal' },
        { q: 'who can swim?', options: ['a fish', 'a cat', 'a bus'], answer: 'a fish', type: 'literal' }] },
    { id: 'local-crab', title: 'The Crab and the Ship', level: 2, pages: [
      { text: 'a little crab lived on the sand.', emoji: '🦀' },
      { text: 'one day a ship came in.', emoji: '🚢' },
      { text: 'the crab said, "can i ride with you?"', emoji: '💬' },
      { text: 'the ship said yes, and they sailed away.', emoji: '⚓' }],
      questions: [{ q: 'where did the crab live?', options: ['on the sand', 'in a tree', 'on a bus'], answer: 'on the sand', type: 'literal' },
        { q: 'what came in?', options: ['a plane', 'a ship', 'a train'], answer: 'a ship', type: 'literal' }] },
    { id: 'local-whale', title: 'The Whale Who Sang', level: 3, pages: [
      { text: 'a whale lived deep in the blue sea.', emoji: '🐳' },
      { text: 'every night she sang a song to the stars.', emoji: '⭐' },
      { text: 'the little fish came to listen.', emoji: '🐠' },
      { text: 'when the song was over, they clapped their fins.', emoji: '👏' },
      { text: 'the whale was happy and sang again.', emoji: '🎶' }],
      questions: [{ q: 'who sang the song?', options: ['the whale', 'the crab', 'the ship'], answer: 'the whale', type: 'literal' },
        { q: 'who came to listen?', options: ['little fish', 'a dog', 'a bird'], answer: 'little fish', type: 'literal' },
        { q: 'how did the whale feel at the end?', options: ['sad', 'happy', 'mad'], answer: 'happy', type: 'inference' }] },
    { id: 'local-shark', title: 'The Shark and the Storm', level: 4, pages: [
      { text: 'a dark storm hit the sea. the waves were huge.', emoji: '🌩️' },
      { text: 'a small boat was lost. the boy on it was scared.', emoji: '⛵' },
      { text: 'a big shark swam up. the boy shut his eyes.', emoji: '🦈' },
      { text: 'but the shark did not bite. it pushed the boat to the shore.', emoji: '🏖️' },
      { text: 'the boy said thanks. the shark swam off, happy.', emoji: '😊' }],
      questions: [{ q: 'why was the boy scared?', options: ['he was lost in a storm', 'he lost his hat', 'he was hungry'], answer: 'he was lost in a storm', type: 'why' },
        { q: 'what did the shark do?', options: ['pushed the boat to shore', 'bit the boat', 'swam away'], answer: 'pushed the boat to shore', type: 'literal' },
        { q: 'what happened first?', options: ['a storm hit', 'the boy said thanks', 'a shark swam up'], answer: 'a storm hit', type: 'sequence' }] },
    { id: 'local-robot', title: 'The Robot Cook', level: 5, pages: [
      { text: 'the robot cook was making a pot of soup for the crew.', emoji: '🤖' },
      { text: 'it dropped in a sock, a shell, and a lot of salt.', emoji: '🧦' },
      { text: 'the crew tasted the soup. "yuck!" they yelled.', emoji: '😝' },
      { text: 'the robot said, "i will fix it." it added corn and fish.', emoji: '🌽' },
      { text: 'now the soup was yummy. the crew had two bowls each.', emoji: '🍲' }],
      questions: [{ q: 'why did the crew yell "yuck"?', options: ['the soup was bad', 'the soup was hot', 'the bowls were small'], answer: 'the soup was bad', type: 'inference' },
        { q: 'what might the crew say next time?', options: ['can the robot cook again?', 'no more soup ever', 'let us sell the pot'], answer: 'can the robot cook again?', type: 'inference' },
        { q: 'what did the robot add to fix it?', options: ['corn and fish', 'a sock', 'a shell'], answer: 'corn and fish', type: 'literal' }] }
  ];

  var Q_ICON = { literal: '📖', why: '🤔', sequence: '🔢', vocab: '🔤', inference: '🔍' };

  function validStory(s) {
    return s && Array.isArray(s.pages) && s.pages.length > 0 && s.pages.every(function (p) { return p && typeof p.text === 'string' && p.text; });
  }
  function validQ(q) {
    return q && q.q && Array.isArray(q.options) && q.options.length >= 2 && q.options.indexOf(q.answer) >= 0;
  }
  function storyId(s) { return s.id || ((s.level || 1) + ':' + s.title); }
  function resolveLevel(avail, level) {
    if (!avail.length) { return 0; }
    if (avail.indexOf(level) >= 0) { return level; }
    var lower = avail.filter(function (n) { return n < level; });
    return lower.length ? lower[lower.length - 1] : avail[0];
  }
  function levelsOf(list) {
    var out = [];
    list.forEach(function (s) { var l = s.level || 1; if (out.indexOf(l) < 0) { out.push(l); } });
    return out.sort(function (a, b) { return a - b; });
  }
  function clean(w) { return String(w).replace(/[^A-Za-z0-9']/g, ''); }
  function fmtTime(ms) {
    var s = Math.max(1, Math.round(ms / 1000)), m = Math.floor(s / 60), r = s % 60;
    return m + ':' + (r < 10 ? '0' : '') + r;
  }

  /* per-profile state via RG.progress.get/set (localStorage only when core lacks them) */
  function profId() { try { return RG.profile().id; } catch (e) { return 'x'; } }
  function loadState() {
    var v = null, hasCore = false;
    try { if (RG.progress && typeof RG.progress.get === 'function') { hasCore = true; v = RG.progress.get(STATE_KEY); } } catch (e) { v = null; }
    if (v == null && !hasCore) { try { v = JSON.parse(localStorage.getItem('rg_sc_' + profId()) || 'null'); } catch (e2) { v = null; } }
    if (!v || typeof v !== 'object') { v = {}; }
    v.reads = v.reads || {}; v.best = v.best || {}; v.serial = v.serial || {};
    v.total = v.total || 0; v.chapters = v.chapters || 0;
    return v;
  }
  function saveState(v) {
    var done = false;
    try { if (RG.progress && typeof RG.progress.set === 'function') { RG.progress.set(STATE_KEY, v); done = true; } } catch (e) { /* ignore */ }
    if (!done) { try { localStorage.setItem('rg_sc_' + profId(), JSON.stringify(v)); } catch (e2) { /* ignore */ } }
  }

  RG.registerGame({
    id: 'story-cove',
    title: 'Story Cove',
    emoji: '📖',
    tracks: ['big'],
    skill: 'fluency',
    blurb: 'Read a short story, then answer questions!',
    mount: function (container, ctx) {
      injectStyle();
      var dead = false;
      var timers = [];
      var level = Math.max(1, Math.min(5, ctx.level || 1));
      var rounds = ctx.rounds || 5;
      var state = loadState();
      var serial = RG.content && RG.content.serial;
      var hasSerial = !!(serial && Array.isArray(serial.chapters) && serial.chapters.length && serial.chapters.every(validStory));
      var offerSerial = hasSerial && level >= 4;

      var book, pages, P, qs, qn, pagesRounds;
      var done = 0;                // roundDone calls so far
      var pageIdx = 0, qIdx = 0, readStart = 0, readMs = 0, prevBest = 0;
      var locked = false, misses = 0, modeled = false;
      var readToken = 0, hlIdx = -1, spans = [], fbTimer = null, safetyTimer = null;
      var hasSS = !!(window.speechSynthesis && window.SpeechSynthesisUtterance);

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
      function bump() { done++; ctx.roundDone(); }
      function beatOn() { return !!(RG.settings && RG.settings.beatTime === true); }

      container.innerHTML = '';
      var stage = RG.el('div', { class: 'sc-stage' });
      container.appendChild(stage);

      /* ---------- choosing and starting a book ---------- */
      function pickStory() {
        var all = ((RG.content && RG.content.stories) || []).filter(validStory);
        var pool = all.filter(function (s) { return (s.level || 1) === resolveLevel(levelsOf(all), level); });
        if (!pool.length) {
          pool = LOCAL.filter(function (s) { return s.level === resolveLevel(levelsOf(LOCAL), level); });
        }
        if (!pool.length) { pool = all.length ? all : LOCAL; }
        // prefer the story he has read least, so rereading happens only after the new ones
        var min = 1e9;
        pool.forEach(function (s) { min = Math.min(min, state.reads[storyId(s)] || 0); });
        return RG.sample(pool.filter(function (s) { return (state.reads[storyId(s)] || 0) === min; }));
      }

      function pickQuestions(list, n) {
        var good = RG.shuffle((list || []).filter(validQ)), out = [], types = {};
        good.forEach(function (q) { var t = q.type || 'literal'; if (out.length < n && !types[t]) { types[t] = 1; out.push(q); } });
        good.forEach(function (q) { if (out.length < n && out.indexOf(q) < 0) { out.push(q); } });
        return out;
      }

      function makeBook(s, kind, idx) {
        var id = kind === 'chapter' ? (serial.id || 'serial') + ':' + (idx + 1) : storyId(s);
        return { id: id, kind: kind, idx: idx, title: s.title || (kind === 'chapter' ? 'Chapter ' + (idx + 1) : 'Story'),
          pages: s.pages, questions: s.questions || [], level: s.level || level };
      }

      function begin(b) {
        stopReading();
        book = b; pages = b.pages; P = pages.length;
        qs = pickQuestions(b.questions, Math.max(0, Math.min(3, rounds - 1)));
        qn = qs.length; pagesRounds = rounds - qn;
        done = 0; pageIdx = 0; qIdx = 0; readMs = 0;
        prevBest = state.best[b.id] || 0;
        readStart = Date.now();
        container.dataset.book = b.id;
        showPage();
      }

      /* ---------- karaoke reading ---------- */
      function clearHl() {
        spans.forEach(function (s) { s.classList.remove('sc-hl'); });
        hlIdx = -1;
      }
      function highlight(i) {
        if (i === hlIdx || i < 0 || i >= spans.length) { return; }
        if (hlIdx >= 0 && spans[hlIdx]) { spans[hlIdx].classList.remove('sc-hl'); spans[hlIdx].classList.add('sc-said'); }
        hlIdx = i;
        spans[i].classList.add('sc-hl');
      }
      function stopReading() {
        readToken++;
        if (fbTimer) { clearTimeout(fbTimer); fbTimer = null; }
        if (safetyTimer) { clearTimeout(safetyTimer); safetyTimer = null; }
        if (hasSS) { try { window.speechSynthesis.cancel(); } catch (e) { /* ignore */ } }
        try { RG.stopSpeaking(); } catch (e2) { /* ignore */ }
        clearHl();
      }

      function estimateDurations(words) {
        return words.map(function (w) { return 230 + 80 * clean(w).length; });
      }

      function readWords(words, onDone) {
        stopReading();
        var my = readToken;
        spans.forEach(function (s) { s.classList.remove('sc-said'); });
        var starts = [], pos = 0;
        words.forEach(function (w) { starts.push(pos); pos += w.length + 1; });
        var text = words.join(' ');
        var finished = false, gotBoundary = false;
        var durs = estimateDurations(words);
        var total = durs.reduce(function (a, b) { return a + b; }, 0);

        function finish() {
          if (finished || my !== readToken) { return; }
          finished = true;
          if (fbTimer) { clearTimeout(fbTimer); fbTimer = null; }
          if (safetyTimer) { clearTimeout(safetyTimer); safetyTimer = null; }
          clearHl();
          spans.forEach(function (s) { s.classList.remove('sc-said'); });
          if (onDone) { onDone(); }
        }
        function runFallback(fromIdx) {
          var i = fromIdx;
          (function step() {
            if (dead || my !== readToken || gotBoundary || finished) { return; }
            if (i >= words.length) { fbTimer = null; if (!hasSS) { finish(); } return; }
            highlight(i);
            var d = durs[i];
            i++;
            fbTimer = setTimeout(step, d);
          })();
        }

        if (!hasSS) {
          runFallback(0);
          safetyTimer = setTimeout(finish, total + 400);
          return;
        }
        var u;
        try {
          u = new window.SpeechSynthesisUtterance(text);
        } catch (e) { hasSS = false; runFallback(0); safetyTimer = setTimeout(finish, total + 400); return; }
        u.rate = BASE_RATE * ((RG.settings && RG.settings.speechRate) || 1);
        u.pitch = 1.1;
        u.lang = 'en-US';
        try {
          var vs = window.speechSynthesis.getVoices() || [];
          var v = (RG.bestVoice && RG.bestVoice()) || vs.filter(function (x) { return /^en[-_]US/i.test(x.lang); })[0] || vs.filter(function (x) { return /^en/i.test(x.lang); })[0];
          if (v) { u.voice = v; }
        } catch (e3) { /* ignore */ }
        u.onstart = function () {
          if (my !== readToken) { return; }
          // watchdog: if no boundary events arrive soon, estimate timings instead
          fbTimer = setTimeout(function () {
            fbTimer = null;
            if (!gotBoundary && my === readToken && !finished) { runFallback(0); }
          }, 700);
        };
        u.onboundary = function (e) {
          if (my !== readToken || finished) { return; }
          if (e.name && e.name !== 'word') { return; }
          gotBoundary = true;
          if (fbTimer) { clearTimeout(fbTimer); fbTimer = null; }
          var ci = typeof e.charIndex === 'number' ? e.charIndex : 0;
          var idx = 0;
          for (var i = 0; i < starts.length; i++) { if (starts[i] <= ci) { idx = i; } else { break; } }
          highlight(idx);
        };
        u.onend = finish;
        u.onerror = function () { if (my === readToken) { finish(); } };
        // safety net if end never fires
        safetyTimer = setTimeout(function () { finish(); }, total * 1.8 + 3000);
        try {
          window.speechSynthesis.speak(u);
          if (window.speechSynthesis.paused) { window.speechSynthesis.resume(); }
        } catch (e4) { hasSS = false; runFallback(0); }
      }

      /* ---------- pages ---------- */
      function dotsForPage(i) {
        return Math.floor((i + 1) * pagesRounds / P) - Math.floor(i * pagesRounds / P);
      }

      function showPage() {
        if (dead) { return; }
        stopReading();
        locked = false;
        container.dataset.mode = 'page';
        var pg = pages[pageIdx];
        stage.innerHTML = '';
        var words = pg.text.split(/\s+/).filter(function (w) { return w; });
        spans = [];
        var card = RG.el('div', { class: 'sc-card' });
        words.forEach(function (w) {
          var sp = RG.el('button', { class: 'sc-w word', type: 'button', text: w });
          sp.addEventListener('click', function () {
            if (dead) { return; }
            stopReading();
            sp.classList.add('sc-hl');
            later(function () { sp.classList.remove('sc-hl'); }, 700);
            quick(clean(w) || w);
          });
          spans.push(sp);
          card.appendChild(sp);
        });
        var art = RG.el('div', { class: 'sc-art float', text: pg.emoji || (RG.emojiFor && RG.emojiFor('book')) || '📖' });
        var lastPage = pageIdx === P - 1;
        var nextLabel = lastPage ? (qn > 0 ? 'Questions ➡' : 'Finish ⭐') : 'Next page ➡';
        var rereading = (state.reads[book.id] || 0) > 0;

        var listenBtn = RG.el('button', { class: 'btn sc-listen', type: 'button', text: '🔊 Listen' });
        var turnBtn = RG.el('button', { class: 'btn sc-turnbtn', type: 'button', text: '🎤 My turn' });
        var banner = RG.el('div', { class: 'sc-banner', text: '🎤 Your turn! Read the page out loud.', style: 'display:none' });
        var doneBtn = RG.el('button', { class: 'btn primary sc-donebtn', type: 'button', text: '✅ Done!', style: 'display:none' });
        var praiseEl = RG.el('div', { class: 'sc-praise', text: '' });
        var lbl = RG.el('span', { class: 'sc-lbl', text: nextLabel });
        var nextBtn = RG.el('button', { class: 'btn primary sc-next sc-wait', type: 'button', disabled: 'disabled' },
          RG.el('span', { class: 'sc-fill' }), lbl);
        var enabled = false, turnDone = false, turning = false;
        function enableNext() {
          if (enabled || dead) { return; }
          enabled = true;
          nextBtn.removeAttribute('disabled');
          nextBtn.disabled = false;
          nextBtn.classList.remove('sc-wait');
          nextBtn.classList.add('sc-ready');
          var f = nextBtn.querySelector('.sc-fill');
          if (f) { f.style.width = '100%'; }
        }
        later(enableNext, NEXT_WAIT_MS);

        function afterListen() {
          enableNext();
          if (!turnDone && !turning) {
            // make My turn the obvious next step (but never force it)
            turnBtn.classList.add('sc-glow');
            quick('Now it is your turn! Tap My turn.', { mood: 'story' });
          }
        }
        function listen() { if (!dead) { readWords(words, afterListen); } }
        listenBtn.addEventListener('click', listen);
        turnBtn.addEventListener('click', function () {
          if (dead) { return; }
          stopReading();
          turning = true;
          turnBtn.classList.remove('sc-glow');
          card.classList.add('sc-mine');
          banner.style.display = '';
          doneBtn.style.display = '';
          turnBtn.style.display = 'none';
          praiseEl.textContent = '';
          quick('Your turn! Read the page out loud. Tap Done when you finish.', { mood: 'happy' });
        });
        doneBtn.addEventListener('click', function () {
          if (dead || !turning) { return; }
          turning = false; turnDone = true;
          card.classList.remove('sc-mine');
          banner.style.display = 'none';
          doneBtn.style.display = 'none';
          turnBtn.style.display = '';
          turnBtn.textContent = '🎤 Read it again';
          var line = rereading ? 'Smooth reading!' : RG.praise();
          praiseEl.textContent = '🌟 ' + line;
          RG.sfx && RG.sfx.pop && RG.sfx.pop();
          say(line, { mood: 'excited' });
          enableNext();
          nextBtn.classList.remove('sc-ready'); void nextBtn.offsetWidth; nextBtn.classList.add('sc-ready');
        });
        nextBtn.addEventListener('click', function () {
          if (!enabled || locked || dead) { return; }
          locked = true;
          stopReading();
          var n = dotsForPage(pageIdx);
          for (var k = 0; k < n && done < rounds; k++) { bump(); }
          RG.sfx && RG.sfx.pop && RG.sfx.pop();
          if (!lastPage) { pageIdx++; showPage(); }
          else {
            readMs = Date.now() - readStart;
            if (qn > 0) { qIdx = 0; showQuestion(); } else { finishAll(); }
          }
        });

        var head = [];
        head.push(RG.el('div', { class: 'sc-title', text: book.title }));
        head.push(RG.el('div', { class: 'sc-pg', text: 'page ' + (pageIdx + 1) + ' of ' + P }));
        if (beatOn() && prevBest && pageIdx === 0) {
          head.push(RG.el('div', { class: 'sc-chip', text: '⏱ Your time to beat: ' + fmtTime(prevBest) }));
        }
        var rowA = RG.el('div', { class: 'sc-row' }, listenBtn, turnBtn);
        var rowB = RG.el('div', { class: 'sc-row' }, doneBtn, nextBtn);
        var parts = head.concat([art, card, banner, rowA, praiseEl, rowB]);
        if (offerSerial && book.kind === 'story' && pageIdx === 0 && done === 0) {
          parts.push(RG.el('button', { class: 'btn sc-chapterbtn', type: 'button', text: '📚 Chapter book',
            on: { click: function () { if (!dead) { showShelf(); } } } }));
        }
        var wrap = RG.el('div', { class: 'sc-page' }, parts);
        stage.appendChild(wrap);

        ctx.onReplay = listen;
        if (pageIdx === 0) {
          var intro = book.title + '. ' + (rereading ? 'Let us read it again. Try to make it smooth!' : 'Tap Listen to hear it, or tap My turn to read it yourself.');
          if (offerSerial && book.kind === 'story') { intro += ' Or pick the Chapter book.'; }
          quick(intro, { mood: 'story' });
        } else {
          quick('Read the page.', { mood: 'story' });
        }
      }

      /* ---------- chapter book shelf ---------- */
      function serialDone() {
        var s = state.serial[serial.id];
        return (s && Array.isArray(s.done)) ? s.done : [];
      }
      function chapterUnlocked(i) { return i === 0 || serialDone().indexOf(i - 1) >= 0; }

      function showShelf() {
        if (dead) { return; }
        stopReading();
        container.dataset.mode = 'shelf';
        stage.innerHTML = '';
        var dn = serialDone(), nextIdx = -1;
        for (var i = 0; i < serial.chapters.length; i++) { if (dn.indexOf(i) < 0) { nextIdx = i; break; } }
        var list = RG.el('div', { class: 'sc-shelf' });
        serial.chapters.forEach(function (ch, i) {
          var isDone = dn.indexOf(i) >= 0, open = chapterUnlocked(i);
          var cls = 'sc-ch' + (isDone ? ' sc-done-ch' : '') + (!open ? ' sc-locked' : '') + (i === nextIdx ? ' sc-next-ch' : '');
          var b = RG.el('button', { class: cls, type: 'button', 'aria-disabled': open ? 'false' : 'true', 'data-ch': String(i + 1) },
            RG.el('span', { class: 'sc-chi', text: isDone ? '✅' : (open ? '📖' : '🔒') }),
            RG.el('span', { text: 'Chapter ' + (i + 1) + ': ' + (ch.title || '') }));
          b.addEventListener('click', function () {
            if (dead) { return; }
            if (!open) {
              RG.wobble(b);
              quick('Finish chapter ' + i + ' first!', { mood: 'gentle' });
              return;
            }
            begin(makeBook(ch, 'chapter', i));
          });
          list.appendChild(b);
        });
        var back = RG.el('button', { class: 'btn', type: 'button', text: '⬅ Back to my story', on: { click: function () { if (!dead) { showPage(); } } } });
        stage.appendChild(RG.el('div', { class: 'big-emoji', text: '📚' }));
        stage.appendChild(RG.el('div', { class: 'sc-title', text: serial.title || 'Chapter book' }));
        stage.appendChild(list);
        stage.appendChild(back);
        var msg = nextIdx < 0 ? 'You finished the whole book! Tap a chapter to read it again.' : 'Pick a chapter. Read them in order!';
        ctx.onReplay = function () { quick((serial.title || 'Chapter book') + '. ' + msg, { mood: 'story' }); };
        quick((serial.title || 'Chapter book') + '. ' + msg, { mood: 'story' });
      }

      /* ---------- questions ---------- */
      function showQuestion() {
        if (dead) { return; }
        stopReading();
        locked = false;
        misses = 0; modeled = false;
        container.dataset.mode = 'question';
        var q = qs[qIdx];
        container.dataset.answer = String(q.answer);
        stage.innerHTML = '';
        spans = [];
        var opts = RG.shuffle(q.options.slice());
        var btns = [];
        var choices = RG.el('div', { class: 'choices' });
        opts.forEach(function (o) {
          var b = RG.el('button', { class: 'choice sc-opt word', type: 'button', text: String(o) });
          b.addEventListener('click', function () { onOption(b, o, q, btns); });
          btns.push(b);
          choices.appendChild(b);
        });
        stage.appendChild(RG.el('div', { class: 'sc-pg', text: 'question ' + (qIdx + 1) + ' of ' + qn }));
        stage.appendChild(RG.el('div', { class: 'big-emoji', text: Q_ICON[q.type] || '🤔' }));
        stage.appendChild(RG.el('div', { class: 'sc-q', text: q.q }));
        stage.appendChild(choices);
        ctx.onReplay = function () { quick(q.q); };
        quick(q.q);
      }

      /* After 2 misses: go back into the story, show the line that answers it, say the answer. */
      function modelQuestion(q, btns) {
        modeled = true; locked = true;
        var ans = String(q.answer).toLowerCase(), best = -1, bestScore = 0, i;
        var aw = ans.split(/\s+/).filter(function (w) { return clean(w).length > 2; });
        for (i = 0; i < pages.length; i++) {
          var t = pages[i].text.toLowerCase(), sc = t.indexOf(ans) >= 0 ? 100 : 0;
          aw.forEach(function (w) { if (t.indexOf(clean(w)) >= 0) { sc++; } });
          if (sc > bestScore) { bestScore = sc; best = i; }
        }
        var line;
        if (best >= 0) {
          stage.appendChild(RG.el('div', { class: 'sc-look' }, 'Look back at page ' + (best + 1) + ': ' + pages[best].text));
          line = 'Let us look back at the story. Page ' + (best + 1) + ' says: ' + pages[best].text + ' So the answer is ' + q.answer + '.';
        } else {
          stage.appendChild(RG.el('div', { class: 'sc-look' }, 'Think about the story. The answer is: ' + q.answer));
          line = 'Let us think about the story. The answer is ' + q.answer + '.';
        }
        btns.forEach(function (x) { if (x.textContent !== String(q.answer)) { x.classList.add('sm-dim'); x.style.opacity = '.35'; } });
        say(line, { mood: 'gentle' }).then(function () {
          if (dead) { return; }
          btns.forEach(function (x) { x.style.opacity = ''; x.classList.remove('sm-dim'); if (x.textContent === String(q.answer)) { x.classList.add('hint'); } });
          locked = false;
        });
      }

      function onOption(b, o, q, btns) {
        if (locked || dead) { return; }
        if (o === q.answer) {
          locked = true;
          ctx.answer(true);
          btns.forEach(function (x) { x.classList.remove('hint'); });
          b.classList.add('correct');
          RG.celebrate(b);
          say(RG.praise(), { mood: 'excited' })
            .then(function () { return sleep(350); })
            .then(function () {
              if (dead) { return; }
              if (done < rounds) { bump(); }
              qIdx++;
              if (qIdx < qn) { showQuestion(); } else { finishAll(); }
            });
        } else {
          ctx.answer(false);
          misses++;
          RG.wobble(b);
          if (misses >= 2 && !modeled) {
            modelQuestion(q, btns);
          } else {
            quick('Try again! Think about the story.', { mood: 'gentle' });
            if (misses >= 2) {
              btns.forEach(function (x) { if (x.textContent === String(q.answer)) { x.classList.add('hint'); } });
            }
          }
        }
      }

      /* ---------- finishing: reread badge, best time, chapter unlock, cliffhanger ---------- */
      function teaserFor(ch, idx) {
        if (idx >= serial.chapters.length - 1) { return 'The end! You finished the whole book. What a great adventure!'; }
        var t = ch && (ch.teaser || ch.cliffhanger);
        if (!t) {
          // the cliffhanger is the last sentence of the chapter, followed by "what happens next?"
          var last = ((ch.pages[ch.pages.length - 1] || {}).text || '').replace(/["\u201c\u201d]/g, '');
          var sents = (last.match(/[^.!?]+[.!?]*/g) || []).map(function (x) { return x.trim(); }).filter(Boolean);
          var ls = sents.length ? sents[sents.length - 1] : '';
          t = !ls ? 'What happens next?' : (/\?$/.test(ls) ? ls : ls + ' What happens next?');
        }
        return t + ' Read Chapter ' + (idx + 2) + ' to find out!';
      }

      function finishAll() {
        locked = true;
        while (done < rounds) { bump(); }
        if (!readMs) { readMs = Date.now() - readStart; }
        var id = book.id;
        var prev = state.reads[id] || 0, n = prev + 1;
        var info = { n: n, badge: false, beat: null, teaser: null, bookDone: false };
        state.reads[id] = n;
        if (book.kind === 'chapter') { state.chapters++; } else { state.total++; }
        // Smooth Sailor: repeated reading builds fluency, so reward the 2nd and 3rd read
        if (n === 2 || n === 3) {
          info.badge = true;
          try { if (RG.progress && typeof RG.progress.badge === 'function') { RG.progress.badge('smooth-sailor', 'Smooth Sailor', '⛵'); } } catch (e) { /* ignore */ }
        }
        // beat your own time (only ever shown when switched on in the grown-ups panel)
        if (beatOn() && prevBest && readMs < prevBest) { info.beat = { prev: prevBest, now: readMs }; }
        if (!state.best[id] || readMs < state.best[id]) { state.best[id] = readMs; }
        if (book.kind === 'chapter') {
          var s = state.serial[serial.id] || (state.serial[serial.id] = { done: [] });
          if (!Array.isArray(s.done)) { s.done = []; }
          if (s.done.indexOf(book.idx) < 0) { s.done.push(book.idx); }
          info.teaser = teaserFor(serial.chapters[book.idx], book.idx);
          if (book.idx >= serial.chapters.length - 1) {
            info.bookDone = true;
            try { if (RG.progress && typeof RG.progress.badge === 'function') { RG.progress.badge('gull-island', 'Gull Island Reader', '🏝️'); } } catch (e2) { /* ignore */ }
          }
        }
        saveState(state);
        showEnd(info);
      }

      function showEnd(info) {
        if (dead) { return; }
        stopReading();
        container.dataset.mode = 'end';
        stage.innerHTML = '';
        var lines = [];
        var growth = book.kind === 'chapter'
          ? 'You finished chapter ' + (book.idx + 1) + '!'
          : (state.total <= 1 ? 'You read your first story!' : 'You have read ' + state.total + ' stories!');
        var box = RG.el('div', { class: 'sc-end' });
        box.appendChild(RG.el('div', { class: 'big-emoji', text: '🎉' }));
        box.appendChild(RG.el('h2', { text: 'You read "' + book.title + '"!' }));
        box.appendChild(RG.el('div', { class: 'sc-gcard', text: '📚 ' + growth }));
        lines.push(growth);
        if (info.badge) {
          var bm = 'Smooth Sailor! You read it again, and it got smoother!';
          box.appendChild(RG.el('div', { class: 'sc-gcard sc-badge', text: '⛵ ' + bm }));
          lines.push(bm);
        }
        if (info.beat) {
          var tm = 'You beat your time! ' + fmtTime(info.beat.prev) + ' to ' + fmtTime(info.beat.now) + '.';
          box.appendChild(RG.el('div', { class: 'sc-gcard sc-beat', text: '⏱ ' + tm }));
          lines.push(tm);
        }
        if (info.teaser) {
          box.appendChild(RG.el('div', { class: 'sc-gcard sc-tease', text: '📖 ' + info.teaser }));
        }
        var fin = RG.el('button', { class: 'btn primary', type: 'button', text: 'Finish ⭐' });
        var finished = false;
        fin.addEventListener('click', function () {
          if (finished || dead) { return; }
          finished = true; fin.disabled = true;
          stopReading();
          ctx.finish();
        });
        box.appendChild(fin);
        stage.appendChild(box);
        if (info.badge || info.beat || info.bookDone) { try { RG.sfx && RG.sfx.win && RG.sfx.win(); RG.celebrate(box.querySelector('.big-emoji')); } catch (e) { /* ignore */ } }
        var spoken = lines.join(' ');
        ctx.onReplay = function () { quick(spoken + (info.teaser ? ' ' + info.teaser : ''), { mood: 'story' }); };
        say(RG.praise(), { mood: 'excited' })
          .then(function () { if (!dead) { return say(spoken, { mood: 'happy' }); } })
          .then(function () { if (!dead && info.teaser) { return say(info.teaser, { mood: 'story' }); } });
      }

      begin(makeBook(pickStory(), 'story', 0));

      return function cleanup() {
        dead = true;
        timers.forEach(clearTimeout);
        timers = [];
        if (fbTimer) { clearTimeout(fbTimer); fbTimer = null; }
        if (safetyTimer) { clearTimeout(safetyTimer); safetyTimer = null; }
        readToken++;
        if (hasSS) { try { window.speechSynthesis.cancel(); } catch (e) { /* ignore */ } }
        try { RG.stopSpeaking(); } catch (e2) { /* ignore */ }
        ctx.onReplay = null;
        try { container.innerHTML = ''; } catch (e3) { /* ignore */ }
      };
    }
  });
})();
