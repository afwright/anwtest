/* Story Cove - BIG track. Read a short storybook with karaoke highlighting, then answer questions. */
(function () {
  'use strict';
  var RG = window.RG;
  if (!RG || !RG.registerGame) { return; }

  var STYLE_ID = 'sc-styles';
  var NEXT_WAIT_MS = 3000;
  var BASE_RATE = 0.85;
  var CSS = [
    '.sc-stage{display:flex;flex-direction:column;align-items:center;gap:12px;justify-content:flex-start;padding:8px 10px 16px;width:100%;box-sizing:border-box;}',
    '.sc-title{font-size:1.3rem;font-weight:700;color:#1d2b4f;text-align:center;background:rgba(255,255,255,.88);padding:2px 16px;border-radius:18px;}',
    '.sc-pg{font-size:1rem;color:#2b3a63;background:rgba(255,255,255,.88);padding:1px 14px;border-radius:14px;}',
    '.sc-page{display:flex;flex-direction:column;align-items:center;gap:10px;width:100%;max-width:640px;animation:sc-in .45s ease;}',
    '@keyframes sc-in{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:none}}',
    '.sc-art{font-size:5.5rem;line-height:1;}',
    '.sc-card{background:#fff;border:4px solid #4aa3ff;border-radius:24px;padding:14px;width:100%;box-sizing:border-box;',
    ' display:flex;flex-wrap:wrap;justify-content:center;gap:4px 10px;}',
    '.sc-w{font:inherit;font-size:1.9rem;font-weight:700;letter-spacing:.05em;color:#1d2b4f;background:transparent;border:0;',
    ' border-radius:12px;padding:4px 6px;min-height:50px;min-width:40px;cursor:pointer;transition:background .12s,transform .12s;',
    ' touch-action:manipulation;-webkit-tap-highlight-color:transparent;}',
    '.sc-w.sc-hl{background:#ffe97a;transform:scale(1.12);box-shadow:0 2px 0 #f4a62a;}',
    '.sc-w.sc-said{color:#2b6cc4;}',
    '.sc-row{display:flex;gap:14px;flex-wrap:wrap;justify-content:center;}',
    '.sc-next{position:relative;overflow:hidden;min-width:170px;}',
    '.sc-next[disabled]{opacity:1;background:#e6edf7;color:#6b7a99;cursor:default;}',
    '.sc-fill{position:absolute;left:0;top:0;bottom:0;width:0;background:rgba(47,180,87,.4);pointer-events:none;}',
    '.sc-next.sc-wait .sc-fill{animation:sc-fill ' + (NEXT_WAIT_MS / 1000) + 's linear forwards;}',
    '@keyframes sc-fill{from{width:0}to{width:100%}}',
    '.sc-lbl{position:relative;}',
    '.sc-next.sc-ready{animation:sc-pulse .8s ease 2;}',
    '@keyframes sc-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}',
    '.sc-q{font-size:1.9rem;font-weight:700;text-align:center;color:#1d2b4f;max-width:640px;}',
    '.sc-opt{font-family:inherit;font-size:1.9rem;min-width:110px;padding:10px 18px;}'
  ].join('\n');

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) { return; }
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  var LOCAL = [
    { title: 'Sam and the Boat', level: 1, pages: [
      { text: 'sam has a red boat.', emoji: '⛵' },
      { text: 'the boat is on the sea.', emoji: '🌊' },
      { text: 'a big fish can swim.', emoji: '🐟' },
      { text: 'sam and the fish had fun.', emoji: '😊' }],
      questions: [{ q: 'what color is the boat?', options: ['red', 'blue', 'green'], answer: 'red' },
        { q: 'who can swim?', options: ['a fish', 'a cat', 'a bus'], answer: 'a fish' }] },
    { title: 'The Crab and the Ship', level: 2, pages: [
      { text: 'a little crab lived on the sand.', emoji: '🦀' },
      { text: 'one day a ship came in.', emoji: '🚢' },
      { text: 'the crab said, "can i ride with you?"', emoji: '💬' },
      { text: 'the ship said yes, and they sailed away.', emoji: '⚓' }],
      questions: [{ q: 'where did the crab live?', options: ['on the sand', 'in a tree', 'on a bus'], answer: 'on the sand' },
        { q: 'what came in?', options: ['a plane', 'a ship', 'a train'], answer: 'a ship' }] },
    { title: 'The Whale Who Sang', level: 3, pages: [
      { text: 'a whale lived deep in the blue sea.', emoji: '🐳' },
      { text: 'every night she sang a song to the stars.', emoji: '⭐' },
      { text: 'the little fish came to listen.', emoji: '🐠' },
      { text: 'when the song was over, they clapped their fins.', emoji: '👏' },
      { text: 'the whale was happy and sang again.', emoji: '🎶' }],
      questions: [{ q: 'who sang the song?', options: ['the whale', 'the crab', 'the ship'], answer: 'the whale' },
        { q: 'who came to listen?', options: ['little fish', 'a dog', 'a bird'], answer: 'little fish' },
        { q: 'how did the whale feel at the end?', options: ['sad', 'happy', 'mad'], answer: 'happy' }] }
  ];

  function validStory(s) {
    return s && Array.isArray(s.pages) && s.pages.length > 0 && s.pages.every(function (p) { return p && typeof p.text === 'string' && p.text; });
  }
  function validQ(q) {
    return q && q.q && Array.isArray(q.options) && q.options.length >= 2 && q.options.indexOf(q.answer) >= 0;
  }
  function pickStory(level) {
    var all = ((RG.content && RG.content.stories) || []).filter(validStory);
    var pool = all.filter(function (s) { return (s.level || 1) === level; });
    if (!pool.length) { pool = LOCAL.filter(function (s) { return s.level === level; }); }
    if (!pool.length) { pool = all.length ? all : LOCAL; }
    return RG.sample(pool);
  }
  function clean(w) { return String(w).replace(/[^A-Za-z0-9']/g, ''); }

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
      var level = ctx.level || 1;
      var rounds = ctx.rounds || 5;
      var story = pickStory(level);
      var pages = story.pages;
      var P = pages.length;
      var qs = RG.shuffle((story.questions || []).filter(validQ)).slice(0, Math.max(0, Math.min(3, rounds - 1)));
      var qn = qs.length;
      var pagesRounds = rounds - qn;
      var done = 0;                // roundDone calls so far
      var pageIdx = 0, qIdx = 0;
      var locked = false, misses = 0;
      var readToken = 0, hlIdx = -1, spans = [], fbTimer = null, safetyTimer = null, curUtter = null;
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

      container.innerHTML = '';
      var stage = RG.el('div', { class: 'sc-stage' });
      container.appendChild(stage);

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
        curUtter = null;
        if (hasSS) { try { window.speechSynthesis.cancel(); } catch (e) { /* ignore */ } }
        try { RG.stopSpeaking(); } catch (e2) { /* ignore */ }
        clearHl();
      }

      function estimateDurations(words) {
        var k = BASE_RATE / BASE_RATE;
        return words.map(function (w) { return (230 + 80 * clean(w).length) * k; });
      }

      // returns a promise resolved when reading finishes or is cancelled
      function readWords(words, onDone) {
        stopReading();
        var my = readToken;
        spans.forEach(function (s) { s.classList.remove('sc-said'); });
        var starts = [], pos = 0;
        words.forEach(function (w, i) { starts.push(pos); pos += w.length + 1; });
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
        curUtter = u;
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
        u.onerror = function () { if (my === readToken) { if (!gotBoundary) { /* allow fallback to finish */ } finish(); } };
        // safety net if end never fires
        safetyTimer = setTimeout(function () { finish(); }, total * 1.8 + 3000);
        try {
          window.speechSynthesis.speak(u);
          // some browsers need a nudge after cancel
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
        var art = RG.el('div', { class: 'sc-art float', text: pg.emoji || RG.emojiFor && RG.emojiFor('book') || '📖' });
        var readBtn = RG.el('button', { class: 'btn', type: 'button', text: '🔊 Read page' });
        var lastPage = pageIdx === P - 1;
        var nextLabel = lastPage ? (qn > 0 ? 'Questions ➡' : 'Finish ⭐') : 'Next page ➡';
        var lbl = RG.el('span', { class: 'sc-lbl', text: nextLabel });
        var nextBtn = RG.el('button', { class: 'btn primary sc-next sc-wait', type: 'button', disabled: 'disabled' },
          RG.el('span', { class: 'sc-fill' }), lbl);
        var enabled = false;
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
        readBtn.addEventListener('click', function () {
          if (dead) { return; }
          readWords(words, enableNext);
        });
        nextBtn.addEventListener('click', function () {
          if (!enabled || locked || dead) { return; }
          locked = true;
          stopReading();
          var n = dotsForPage(pageIdx);
          for (var k = 0; k < n && done < rounds; k++) { bump(); }
          RG.sfx && RG.sfx.pop && RG.sfx.pop();
          if (!lastPage) { pageIdx++; showPage(); }
          else if (qn > 0) { qIdx = 0; showQuestion(); }
          else { finishAll(); }
        });
        var row = RG.el('div', { class: 'sc-row' }, readBtn, nextBtn);
        var wrap = RG.el('div', { class: 'sc-page' },
          RG.el('div', { class: 'sc-title', text: story.title || 'Story' }),
          RG.el('div', { class: 'sc-pg', text: 'page ' + (pageIdx + 1) + ' of ' + P }),
          art, card, row);
        stage.appendChild(wrap);

        ctx.onReplay = function () { readWords(words, enableNext); };
        if (pageIdx === 0) {
          quick(story.title + '. Read the page, or tap the speaker to hear it.', { mood: 'story' });
        } else {
          quick('Read the page.', { mood: 'story' });
        }
      }

      /* ---------- questions ---------- */
      function showQuestion() {
        if (dead) { return; }
        stopReading();
        locked = false;
        misses = 0;
        var q = qs[qIdx];
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
        stage.appendChild(RG.el('div', { class: 'big-emoji', text: '🤔' }));
        stage.appendChild(RG.el('div', { class: 'sc-q', text: q.q }));
        stage.appendChild(choices);
        ctx.onReplay = function () { quick(q.q); };
        quick(q.q);
      }

      function onOption(b, o, q, btns) {
        if (locked || dead) { return; }
        if (o === q.answer) {
          locked = true;
          ctx.answer(true);
          btns.forEach(function (x) { x.classList.remove('hint'); });
          b.classList.add('correct');
          RG.celebrate(b);
          say(RG.praise())
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
          quick('Try again!');
          if (misses >= 2) {
            btns.forEach(function (x) { if (x.textContent === String(q.answer)) { x.classList.add('hint'); } });
          }
        }
      }

      function finishAll() {
        locked = true;
        while (done < rounds) { bump(); }
        ctx.finish();
      }

      showPage();

      return function cleanup() {
        dead = true;
        timers.forEach(clearTimeout);
        timers = [];
        if (fbTimer) { clearTimeout(fbTimer); fbTimer = null; }
        if (safetyTimer) { clearTimeout(safetyTimer); safetyTimer = null; }
        readToken++;
        curUtter = null;
        if (hasSS) { try { window.speechSynthesis.cancel(); } catch (e) { /* ignore */ } }
        try { RG.stopSpeaking(); } catch (e2) { /* ignore */ }
        ctx.onReplay = null;
        try { container.innerHTML = ''; } catch (e3) { /* ignore */ }
      };
    }
  });
})();
