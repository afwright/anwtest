/* Syllable Saw - BIG track. One repeatable long-word strategy:
   find the vowels -> saw between the syllables -> read each chunk -> blend the chunks -> match the picture. */
(function () {
  'use strict';
  var RG = window.RG;
  if (!RG || !RG.registerGame) { return; }

  var SKILL = 'long-words';
  var STYLE_ID = 'ss-styles';
  var CSS = [
    '.ss-stage{display:flex;flex-direction:column;align-items:center;gap:12px;width:100%;max-width:720px;margin:0 auto;box-sizing:border-box;position:relative;}',
    '.ss-stage .prompt{font-size:clamp(1.15rem,4.6vw,1.6rem);padding:8px 16px;margin:0;}',
    '.ss-bar{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;width:100%;}',
    '.ss-btn{min-height:64px;padding:0 20px;font-size:clamp(1.05rem,4.4vw,1.35rem);}',
    '.ss-btn.ss-pulse{animation:ss-hintp 1s ease-in-out infinite;}',
    '.ss-btn.ss-dim{opacity:.55;}',
    '.ss-benchwrap{position:relative;width:100%;display:flex;justify-content:center;padding:26px 0 8px;}',
    '.ss-bench{position:relative;display:flex;justify-content:center;width:100%;min-height:104px;touch-action:manipulation;}',
    '.ss-log{position:relative;display:inline-flex;align-items:center;gap:0;padding:10px 22px;border-radius:20px;background:linear-gradient(180deg,#c98a47,#a9642b 55%,#8d4f1f);border:4px solid #6b3a14;box-shadow:0 8px 0 rgba(60,30,5,.35);}',
    '.ss-log::before,.ss-log::after{content:"";position:absolute;top:6px;bottom:6px;width:14px;border-radius:50%;background:radial-gradient(circle,#e2b073 0 18%,#c98a47 19% 40%,#e2b073 41% 55%,#c98a47 56%);border:2px solid #6b3a14;}',
    '.ss-log::before{left:-9px;}.ss-log::after{right:-9px;}',
    '.ss-l{font-size:var(--ss-fs,2.4rem);font-weight:800;line-height:1.1;color:#fff8e6;text-shadow:0 .06em 0 rgba(60,30,5,.7);padding:0 .02em;transition:transform .2s,color .2s,text-shadow .2s;}',
    '.ss-l.ss-v{color:#ffe14d;text-shadow:0 0 .35em #ffb300,0 .06em 0 rgba(60,30,5,.7);animation:ss-glow 1.1s ease-in-out infinite;}',
    '.ss-g{display:inline-block;position:relative;width:var(--ss-gw,7px);align-self:stretch;margin:2px 0;}',
    '.ss-g::before{content:"";position:absolute;left:50%;top:6%;bottom:6%;width:0;border-left:3px dashed rgba(255,248,230,.55);transform:translateX(-50%);}',
    '.ss-bench.ss-armed .ss-g::before{border-left-color:rgba(255,248,230,.85);}',
    '.ss-g.ss-cut{width:calc(var(--ss-gw,7px) + 6px);}',
    '.ss-g.ss-cut::before{border-left:none;width:100%;left:0;transform:none;background:#2a1405;border-radius:2px;top:0;bottom:0;}',
    '.ss-g.ss-hint::before{border-left:4px solid #ffc93c;animation:ss-hintp 1s ease-in-out infinite;}',
    '.ss-g.ss-wrong::before{background:#ff6b6b;}',
    '.ss-pieces{display:flex;justify-content:center;align-items:center;flex-wrap:wrap;gap:5px;transition:gap .5s ease;}',
    '.ss-pieces.ss-open{gap:clamp(10px,3.5vw,22px);}',
    '.ss-pieces.ss-join{gap:0;}',
    '.ss-piece{position:relative;display:inline-flex;align-items:center;padding:10px 12px;border-radius:18px;background:linear-gradient(180deg,#c98a47,#a9642b 55%,#8d4f1f);border:4px solid #6b3a14;box-shadow:0 8px 0 rgba(60,30,5,.35);font-family:inherit;min-height:84px;min-width:64px;cursor:pointer;touch-action:manipulation;transition:transform .15s,box-shadow .2s,background .2s;}',
    '.ss-piece:active{transform:translateY(4px);}',
    '.ss-piece.ss-on{transform:translateY(-6px) scale(1.07);box-shadow:0 0 0 5px #ffc93c,0 0 24px 8px rgba(255,201,60,.75);}',
    '.ss-piece.ss-read{background:linear-gradient(180deg,#d9a35e,#b9763a 55%,#9b5a27);}',
    '.ss-piece.ss-read::after{content:"\\2713";position:absolute;right:-6px;top:-10px;width:28px;height:28px;border-radius:50%;background:#2fbf5b;color:#fff;font-size:1rem;line-height:28px;text-align:center;border:2px solid #fff;font-weight:800;}',
    '.ss-piece.ss-nudge{animation:ss-hintp .8s ease-in-out 2;}',
    '.ss-saw{position:absolute;left:0;top:0;font-size:2.6rem;line-height:1;pointer-events:none;z-index:6;transform-origin:50% 90%;}',
    '.ss-dust{position:absolute;width:7px;height:7px;border-radius:50%;background:#e8c48a;pointer-events:none;z-index:5;}',
    '.ss-choices{display:flex;flex-wrap:wrap;gap:14px;justify-content:center;width:100%;}',
    '.ss-choice{min-width:96px;min-height:96px;font-size:clamp(2.6rem,12vw,3.6rem);padding:6px 14px;}',
    '.ss-choice.ss-off{opacity:.4;pointer-events:none;}',
    '.ss-choice.ss-mean{font-size:clamp(1.05rem,4.2vw,1.35rem);min-height:76px;width:100%;max-width:440px;justify-content:flex-start;text-align:left;gap:12px;line-height:1.2;}',
    '.ss-choice.ss-mean .ss-me{font-size:2rem;}',
    '.ss-choice.hint{animation:ss-hintp 1s ease-in-out infinite;border-color:#ffc93c;}',
    '.ss-note{font-size:clamp(1rem,3.8vw,1.2rem);font-weight:800;color:#12395e;background:rgba(255,255,255,.88);border-radius:18px;padding:6px 14px;max-width:100%;text-align:center;box-shadow:0 4px 0 rgba(10,60,110,.18);}',
    '.ss-tips{position:absolute;left:0;right:0;top:0;min-height:100%;z-index:30;display:flex;align-items:flex-start;justify-content:center;padding:10px;box-sizing:border-box;background:rgba(10,40,70,.55);}',
    '.ss-card{width:100%;max-width:520px;background:#fff8e6;border:6px solid #b9803f;border-radius:26px;padding:14px 18px 18px;box-shadow:0 10px 0 rgba(60,30,5,.3);text-align:left;color:#12395e;margin:auto;}',
    '.ss-card h2{margin:0 0 6px;font-size:1.7rem;text-align:center;}',
    '.ss-card ol,.ss-card ul{margin:6px 0 10px;padding-left:1.3em;font-size:clamp(1rem,4vw,1.2rem);line-height:1.35;font-weight:700;}',
    '.ss-card li{margin:3px 0;}',
    '.ss-card li.ss-today{background:#fff0b3;border-radius:10px;padding:2px 6px;margin-left:-6px;}',
    '.ss-card b.ss-eg{color:#a9642b;letter-spacing:.04em;}',
    '.ss-card .btn{width:100%;}',
    '@keyframes ss-glow{50%{transform:translateY(-.08em) scale(1.12);}}',
    '@keyframes ss-hintp{50%{transform:scale(1.07);box-shadow:0 0 0 8px rgba(255,201,60,.5),0 0 26px 10px rgba(255,201,60,.8);}}',
    '@keyframes ss-shake{0%,100%{transform:translateX(0);}25%{transform:translateX(-9px);}75%{transform:translateX(9px);}}',
    '.ss-shake{animation:ss-shake .45s ease;}',
    '@media (prefers-reduced-motion:reduce){.ss-pieces{transition:none;}.ss-l.ss-v{animation:none;}}'
  ].join('\n');

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) { return; }
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  /* ------------------------------------------------------------------ data */
  /* [split, emoji, spoken chunks (respelled so speech sounds right), type, other valid splits, meaning] */
  var RAW = {
    1: [
      ['sun|set', '🌅'], ['cup|cake', '🧁'], ['hot|dog', '🌭'], ['back|pack', '🎒'], ['sail|boat', '⛵'],
      ['rain|bow', '🌈'], ['snow|man', '⛄'], ['pop|corn', '🍿'], ['sea|shell', '🐚'], ['foot|ball', '🏈'],
      ['mail|box', '📮'], ['gold|fish', '🐠'], ['pan|cake', '🥞'], ['bath|tub', '🛁'], ['air|plane', '✈️']
    ],
    2: [
      ['rab|bit', '🐰'], ['mag|net', '🧲'], ['bas|ket', '🧺'], ['in|sect', '🐛'], ['ten|nis', '🎾'],
      ['cac|tus', '🌵'], ['pen|cil', '✏️', 'pen|sil'], ['rock|et', '🚀', '', '', ['roc|ket']], ['hel|met', '⛑️'],
      ['chip|munk', '🐿️'], ['pump|kin', '🎃'], ['but|ton', '🔘', 'but|tun'], ['rib|bon', '🎀', 'rib|bun'],
      ['trum|pet', '🎺']
    ],
    3: [
      ['tur|tle', '🐢', 'tur|tul', 'cle'], ['can|dle', '🕯️', 'can|dul', 'cle'], ['ap|ple', '🍎', 'ap|ul', 'cle'],
      ['puz|zle', '🧩', 'puz|ul', 'cle'], ['bub|ble', '🫧', 'bub|ul', 'cle'], ['cas|tle', '🏰', 'cas|ul', 'cle'],
      ['nee|dle', '🪡', 'nee|dul', 'cle'], ['ea|gle', '🦅', 'ee|gul', 'cle'], ['bee|tle', '🪲', 'bee|tul', 'cle'],
      ['ma|ple', '🍁', 'may|pul', 'cle'],
      ['ro|bot', '🤖', 'ro|bot', 'open'], ['ti|ger', '🐯', 'tie|ger', 'open'], ['pa|per', '📄', 'pay|per', 'open'],
      ['mu|sic', '🎵', 'myoo|zik', 'open'], ['ze|ro', '0️⃣', 'zee|roh', 'open'], ['spi|der', '🕷️', 'spy|der', 'open'],
      ['ba|by', '👶', 'bay|bee', 'open'], ['ho|tel', '🏨', 'hoh|tell', 'open'], ['pi|lot', '🧑‍✈️', 'pie|lut', 'open'],
      ['tu|lip', '🌷', 'too|lip', 'open'], ['ba|con', '🥓', 'bay|kun', 'open'], ['he|ro', '🦸', 'hee|roh', 'open'],
      ['si|ren', '🚨', 'sigh|run', 'open'], ['pi|rate', '🏴‍☠️', 'pie|rate', 'open']
    ],
    4: [
      ['jump|ing', '🤸'], ['help|ful', '🤝', 'help|full', '', null, 'giving a hand to someone'],
      ['un|lock', '🔓', 'un|lock', '', null, 'to open with a key'],
      ['re|wind', '⏪', 'ree|wind', '', null, 'to wind it back again'],
      ['sad|ness', '😢', 'sad|ness', '', null, 'the feeling of being sad'],
      ['quick|ly', '⚡', 'quick|lee', '', null, 'in a fast way'],
      ['kind|ness', '💖', 'kind|ness', '', null, 'being nice to someone'],
      ['fish|ing', '🎣'], ['camp|ing', '🏕️'], ['sail|ing', '⛵'], ['sleep|ing', '😴'],
      ['re|play', '🔁', 'ree|play'], ['pain|ful', '🤕', 'pain|full'],
      ['slow|ly', '🐌', 'slow|lee', '', null, 'in a slow way'],
      ['loud|ly', '📢', 'loud|lee', '', null, 'in a loud way'],
      ['un|wrap', '🎁', 'un|rap']
    ],
    5: [
      ['fan|tas|tic', '🤩', 'fan|tass|tick'], ['oc|to|pus', '🐙', 'ock|toh|pus'], ['as|tro|naut', '🧑‍🚀', 'ass|troh|nawt'],
      ['bas|ket|ball', '🏀'], ['but|ter|fly', '🦋'], ['ham|bur|ger', '🍔'], ['com|pu|ter', '💻', 'com|pyoo|ter'],
      ['di|no|saur', '🦖', 'dye|noh|sore'], ['ba|na|na', '🍌', 'buh|nan|uh'], ['to|ma|to', '🍅', 'tuh|may|toe'],
      ['um|brel|la', '☂️', 'um|brell|uh'], ['el|e|phant', '🐘', 'el|uh|funt'], ['vol|ca|no', '🌋', 'vol|kay|noh'],
      ['kan|ga|roo', '🦘', 'kang|guh|roo'], ['pine|ap|ple', '🍍', 'pine|ap|ul'], ['la|dy|bug', '🐞', 'lay|dee|bug'],
      ['lol|li|pop', '🍭', 'lol|ee|pop'], ['tor|na|do', '🌪️', 'tor|nay|doh'], ['spa|ghet|ti', '🍝', 'spuh|get|ee'],
      ['tel|e|phone', '📞', 'tell|uh|phone'], ['bi|cy|cle', '🚲', 'bye|sih|kul'], ['am|bu|lance', '🚑', 'am|byoo|lunce']
    ]
  };
  var DEFAULT_TYPE = { 1: 'comp', 2: 'closed', 3: 'open', 4: 'affix', 5: 'multi' };

  /* kid-language rules, one per word type */
  var TIPS = {
    comp: 'Look for two little words you know. Cut between them!',
    closed: 'Two consonants in the middle? Cut between them!',
    cle: 'The l e at the end grabs the letter before it. Cut before that letter!',
    open: 'One consonant in the middle? Try cutting before it.',
    affix: 'Beginnings and endings are their own chunk. Cut them off!',
    multi: 'Every chunk needs a vowel. Cut between the vowels, one chunk at a time!'
  };
  var VOWEL_TIP = 'Every chunk needs a vowel. Look at the glowing letters!';

  var WORDS = {}, ALL = {};
  Object.keys(RAW).forEach(function (lv) {
    WORDS[lv] = RAW[lv].map(function (a) {
      var parts = a[0].split('|'), word = parts.join('');
      var say = a[2] ? a[2].split('|') : parts.slice();
      var w = { w: word, parts: parts, e: a[1], say: say, type: a[3] || DEFAULT_TYPE[lv], level: +lv, m: a[5] || '', sets: [] };
      w.sets.push(cutsOf(parts));
      (a[4] || []).forEach(function (alt) { w.sets.push(cutsOf(alt.split('|'))); });
      ALL[word] = w;
      return w;
    });
  });
  function cutsOf(parts) {
    var out = [], pos = 0;
    for (var i = 0; i < parts.length - 1; i++) { pos += parts[i].length; out.push(pos); }
    return out;
  }
  function emojiOf(w) {
    var e = '';
    try { e = (RG.emojiFor && RG.emojiFor(w.w)) || ''; } catch (x) { e = ''; }
    return e || w.e;
  }
  function isVowelAt(word, i) {
    var c = word.charAt(i);
    if ('aeiou'.indexOf(c) >= 0) { return true; }
    return c === 'y' && i > 0;
  }
  function splitBy(word, cuts) {
    var pts = cuts.slice().sort(function (a, b) { return a - b; }), out = [], prev = 0;
    pts.forEach(function (p) { out.push(word.slice(prev, p)); prev = p; });
    out.push(word.slice(prev));
    return out;
  }
  function hasVowel(chunk, startIdx, word) {
    for (var i = 0; i < chunk.length; i++) { if (isVowelAt(word, startIdx + i)) { return true; } }
    return false;
  }
  function chunksAllHaveVowel(word, cuts) {
    var pts = cuts.slice().sort(function (a, b) { return a - b; }), prev = 0, ok = true;
    pts.concat([word.length]).forEach(function (p) { if (!hasVowel(word.slice(prev, p), prev, word)) { ok = false; } prev = p; });
    return ok;
  }
  function sameSet(a, b) {
    if (a.length !== b.length) { return false; }
    var x = a.slice().sort(function (p, q) { return p - q; }), y = b.slice().sort(function (p, q) { return p - q; });
    for (var i = 0; i < x.length; i++) { if (x[i] !== y[i]) { return false; } }
    return true;
  }
  function isSubset(sub, big) { return sub.every(function (c) { return big.indexOf(c) >= 0; }); }

  /* ----------------------------------------------------------- RG guards */
  function trickyList() {
    try {
      if (RG.progress && RG.progress.tricky && typeof RG.progress.tricky.list === 'function') {
        return RG.progress.tricky.list(SKILL) || [];
      }
    } catch (e) { /* ignore */ }
    return [];
  }
  function trickyAdd(word) {
    try { if (RG.progress && RG.progress.tricky && RG.progress.tricky.add) { RG.progress.tricky.add(word, SKILL); } } catch (e) { /* ignore */ }
  }
  function trickyCorrect(word) {
    try { if (RG.progress && RG.progress.tricky && RG.progress.tricky.correct) { RG.progress.tricky.correct(word); } } catch (e) { /* ignore */ }
  }
  function recErr(type, word) {
    try { if (RG.progress && typeof RG.progress.recordError === 'function') { RG.progress.recordError(SKILL, type, word); } } catch (e) { /* ignore */ }
  }
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

  /* ------------------------------------------------------------- the game */
  RG.registerGame({
    id: 'syllable-saw',
    title: 'Syllable Saw',
    emoji: '🪚',
    tracks: ['big'],
    skill: SKILL,
    blurb: 'Saw long words into chunks, then read them!',
    mount: function (container, ctx) {
      injectStyle();
      var dead = false, timers = [], anims = [], gen = 0, locked = true;
      function setLock(v) { locked = v; try { container.dataset.locked = v ? '1' : '0'; } catch (e) { /* ignore */ } }
      var level = clamp(Math.round(ctx.level || 1), 1, 5);
      var rounds = ctx.rounds || 5;
      var roundNo = 0;
      var W = Math.max(300, container.clientWidth || 360);
      var tipsOpen = false, r = null;

      function noop() { /* nothing */ }
      function alive(g) { return !dead && g === gen; }
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
        return Promise.race([p, sleep(Math.max(1800, text.length * 230))]);
      }
      function quick(text, opts) { try { RG.speak(text, opts); } catch (e) { /* ignore */ } }
      function sfx(n) { try { if (RG.sfx && RG.sfx[n]) { RG.sfx[n](); } } catch (e) { /* ignore */ } }
      function tap(el, fn) {
        var down = false;
        el.addEventListener('pointerdown', function (e) { if (e.button > 0) { return; } down = true; });
        el.addEventListener('pointerleave', function () { down = false; });
        el.addEventListener('pointercancel', function () { down = false; });
        el.addEventListener('pointerup', function (e) {
          if (!down) { return; }
          down = false;
          if (dead) { return; }
          e.preventDefault();
          fn(e);
        });
        el.addEventListener('click', function (e) { if (e.detail === 0 && !dead) { fn(e); } });
        return el;
      }

      container.innerHTML = '';
      var stage = RG.el('div', { class: 'ss-stage' });
      container.appendChild(stage);

      /* ---------- plan ---------- */
      function plan() {
        var used = {}, out = [], i, trick = [], trickAt = {};
        trickyList().forEach(function (t) {
          var w = t && ALL[t.word];
          if (w && w.level <= level && trick.indexOf(w) < 0) { trick.push(w); }
        });
        trick = RG.shuffle(trick).slice(0, 2);
        var idxs = [];
        for (i = 1; i < rounds; i++) { idxs.push(i); }
        RG.shuffle(idxs).slice(0, trick.length).forEach(function (ix, k) { trickAt[ix] = trick[k]; });
        var easier = level > 1 ? RG.shuffle(WORDS[level - 1]) : [];
        for (i = 0; i < rounds; i++) {
          var item = trickAt[i] || null, isTricky = !!item;
          if (!item && i === 0 && easier.length) { item = easier[0]; }
          if (!item) {
            var cand = RG.shuffle(WORDS[level]).filter(function (w) { return !used[w.w]; });
            item = cand[0] || RG.sample(WORDS[level]);
          }
          used[item.w] = 1;
          out.push({ item: item, tricky: isTricky });
        }
        return out;
      }
      var rplan = plan();

      /* ---------- Saw Tips card ---------- */
      function showTips(g, thenFn) {
        if (tipsOpen) { return; }
        var prevLocked = locked; tipsOpen = true; setLock(true);
        var rules = [
          ['comp', 'Two little words inside? Cut between the words!', 'sun|set'],
          ['closed', 'Two consonants in the middle? Cut between them!', 'rab|bit'],
          ['cle', 'The l e at the end grabs the letter before it!', 'tur|tle'],
          ['open', 'One consonant in the middle? Try cutting before it.', 'ro|bot'],
          ['affix', 'Beginnings and endings are their own chunk!', 'un|lock'],
          ['multi', 'Every chunk needs a vowel!', 'fan|tas|tic']
        ];
        var typeNow = r && r.item ? r.item.type : DEFAULT_TYPE[level];
        var rulesUl = RG.el('ul', {});
        rules.forEach(function (x) {
          rulesUl.appendChild(RG.el('li', { class: x[0] === typeNow ? 'ss-today' : '' },
            x[1] + ' ', RG.el('b', { class: 'ss-eg', text: '(' + x[2].replace(/\|/g, ' | ') + ')' })));
        });
        var card = RG.el('div', { class: 'ss-card', role: 'dialog', 'aria-label': 'Saw Tips' },
          RG.el('h2', { text: '🪚 Saw Tips' }),
          RG.el('ol', {},
            RG.el('li', { text: '🔍 Find the vowels. Every chunk needs one.' }),
            RG.el('li', { text: '🪚 Saw between the syllables.' }),
            RG.el('li', { text: '👆 Read each chunk.' }),
            RG.el('li', { text: '🔗 Blend the chunks together!' })),
          RG.el('div', { class: 'ss-note', text: 'Saw rules' }),
          rulesUl);
        var overlay = RG.el('div', { class: 'ss-tips' }, card);
        var done = RG.el('button', { class: 'btn primary', type: 'button', text: 'Got it!' });
        card.appendChild(done);
        container.appendChild(overlay);
        quick('Here is how to saw a long word. Find the vowels. Saw between the syllables. Read each chunk. Then blend them together!', { mood: 'happy' });
        tap(done, function () {
          if (overlay.parentNode) { overlay.parentNode.removeChild(overlay); }
          tipsOpen = false;
          try { RG.stopSpeaking(); } catch (e) { /* ignore */ }
          if (thenFn) { thenFn(); } else { setLock(prevLocked); }
        });
        container.dataset.tips = '1';
      }

      /* ---------- round scaffolding ---------- */
      function startRound() {
        if (dead) { return; }
        gen++;
        var p = rplan[roundNo], g = gen;
        r = { g: g, item: p.item, tricky: p.tricky, cuts: [], vowels: false, split: false, sawMisses: 0,
          picMisses: 0, missedAny: false, hintCuts: false, read: [], over: false };
        setLock(true);
        stage.innerHTML = '';
        container.dataset.target = r.item.w;
        container.dataset.step = 'saw';
        buildBoard(r);
        if (roundNo === 0) {
          showTips(g, function () { if (alive(g)) { speakIntro(r); setLock(false); } });
        } else {
          speakIntro(r);
          later(function () { if (alive(g)) { setLock(false); } }, 350);
        }
      }
      function speakIntro(rr) {
        var txt = 'Find the vowels, then saw this long word into chunks.';
        ctx.onReplay = function () { quick(txt); };
        quick(txt, { mood: 'happy' });
        void rr;
      }
      function noteMiss(rr) {
        if (!rr.missedAny) { rr.missedAny = true; trickyAdd(rr.item.w); }
      }
      function praiseText() { try { return RG.praise(); } catch (e) { return 'Great job!'; } }
      function chunkSay(rr, i) {
        var canon = rr.item.parts;
        if (rr.parts && rr.parts.length === canon.length && rr.parts.join('|') === canon.join('|')) { return rr.item.say[i]; }
        return rr.parts[i];
      }

      /* ---------- the board ---------- */
      var boardEls = {};
      function buildBoard(rr) {
        var w = rr.item, len = w.w.length;
        var fsPx = clamp(((W - 84) / len - 9) / 0.62, 22, 46);
        var bar = RG.el('div', { class: 'ss-bar' });
        var tipsBtn = RG.el('button', { class: 'btn small ss-btn', type: 'button', text: '🪚 Saw Tips' });
        var vowelBtn = RG.el('button', { class: 'btn primary small ss-btn ss-pulse', type: 'button', text: '🔍 Find the vowels' });
        tap(tipsBtn, function () { if (!tipsOpen) { showTips(rr.g); } });
        tap(vowelBtn, function () { findVowels(rr); });
        bar.appendChild(vowelBtn); bar.appendChild(tipsBtn);
        var prompt = RG.el('div', { class: 'prompt', text: 'Saw the word into chunks!' });
        var benchWrap = RG.el('div', { class: 'ss-benchwrap' });
        var bench = RG.el('div', { class: 'ss-bench', style: '--ss-fs:' + fsPx + 'px;--ss-gw:' + clamp(Math.round(fsPx * 0.2), 6, 11) + 'px' });
        benchWrap.appendChild(bench);
        var below = RG.el('div', { class: 'ss-choices', style: 'min-height:8px' });
        stage.appendChild(prompt); stage.appendChild(bar); stage.appendChild(benchWrap); stage.appendChild(below);
        boardEls = { prompt: prompt, bar: bar, vowelBtn: vowelBtn, tipsBtn: tipsBtn, bench: bench, benchWrap: benchWrap, below: below, gapEls: [], letterEls: [] };
        renderLog(rr);
        /* one pointer handler on the whole log: the NEAREST gap gets the cut (very forgiving for fingers) */
        var downAt = null;
        bench.addEventListener('pointerdown', function (e) { if (e.button > 0) { return; } downAt = { x: e.clientX, y: e.clientY }; });
        bench.addEventListener('pointerup', function (e) {
          if (!downAt || dead || rr.split) { downAt = null; return; }
          downAt = null;
          onBenchTap(rr, e.clientX);
        });
        bench.addEventListener('pointercancel', function () { downAt = null; });
      }

      /* shrink the letters until the log (or the sawn pieces) fits the play area, never overflowing sideways */
      function fitFont(el, minPx) {
        var bench = boardEls.bench, fs = parseFloat(bench.style.getPropertyValue('--ss-fs')) || 36;
        var avail = Math.max(240, (boardEls.benchWrap.clientWidth || W) - 8), guard = 0;
        var tr = el.style.transition; el.style.transition = 'none';
        while (el.scrollWidth > avail && fs > minPx && guard++ < 40) {
          fs -= 1.5; bench.style.setProperty('--ss-fs', fs + 'px');
          bench.style.setProperty('--ss-gw', clamp(Math.round(fs * 0.2), 5, 11) + 'px');
        }
        el.style.transition = tr;
      }

      function renderLog(rr) {
        var w = rr.item.w, bench = boardEls.bench;
        bench.innerHTML = '';
        bench.classList.toggle('ss-armed', rr.vowels);
        var log = RG.el('div', { class: 'ss-log' });
        boardEls.gapEls = []; boardEls.letterEls = [];
        var hintSet = rr.hintCuts ? rr.item.sets[0] : [];
        for (var i = 0; i < w.length; i++) {
          if (i > 0) {
            var gp = RG.el('span', { class: 'ss-g' + (rr.cuts.indexOf(i) >= 0 ? ' ss-cut' : '') + (hintSet.indexOf(i) >= 0 && rr.cuts.indexOf(i) < 0 ? ' ss-hint' : ''),
              role: 'button', tabindex: '0', 'data-g': String(i), 'aria-label': 'saw between ' + w.charAt(i - 1) + ' and ' + w.charAt(i) });
            (function (idx, el) {
              el.addEventListener('keydown', function (ev) {
                if ((ev.key === 'Enter' || ev.key === ' ') && !rr.split) { ev.preventDefault(); applyCut(rr, idx); }
              });
            })(i, gp);
            log.appendChild(gp); boardEls.gapEls[i] = gp;
          }
          var l = RG.el('span', { class: 'ss-l' + (rr.vowels && isVowelAt(w, i) ? ' ss-v' : ''), text: w.charAt(i), 'data-i': String(i) });
          log.appendChild(l); boardEls.letterEls[i] = l;
        }
        bench.appendChild(log);
        fitFont(log, 16);
        return log;
      }

      function findVowels(rr) {
        if (locked || rr.over || rr.split) { return; }
        rr.vowels = true;
        boardEls.vowelBtn.classList.remove('ss-pulse');
        boardEls.vowelBtn.classList.add('ss-dim');
        renderLog(rr);
        sfx('pop');
        quick('The vowels are glowing. Every chunk needs one!', { mood: 'happy' });
        boardEls.prompt.textContent = 'Now tap between letters to saw!';
      }

      function onBenchTap(rr, x) {
        if (locked || rr.over || rr.split || !alive(rr.g)) { return; }
        if (!rr.vowels) {
          RG.wobble(boardEls.vowelBtn);
          boardEls.vowelBtn.classList.add('ss-pulse');
          quick('First, tap find the vowels!', { mood: 'gentle' });
          return;
        }
        var best = -1, bd = 1e9;
        boardEls.gapEls.forEach(function (el, i) {
          if (!el) { return; }
          var b = el.getBoundingClientRect(), d = Math.abs(x - (b.left + b.width / 2));
          if (d < bd) { bd = d; best = i; }
        });
        if (best > 0) { applyCut(rr, best); }
      }

      function sawFx(rr, gapIdx) {
        var gp = boardEls.gapEls[gapIdx];
        if (!gp) { return; }
        var wr = boardEls.benchWrap.getBoundingClientRect(), gr = gp.getBoundingClientRect();
        var cx = gr.left + gr.width / 2 - wr.left, top = gr.top - wr.top;
        var saw = RG.el('div', { class: 'ss-saw', text: '🪚', style: 'left:' + (cx - 22) + 'px;top:' + (top - 34) + 'px' });
        boardEls.benchWrap.appendChild(saw);
        var rm = function (n) { return function () { if (n.parentNode) { n.parentNode.removeChild(n); } }; };
        if (saw.animate) {
          var a = saw.animate([
            { transform: 'translateY(-6px) rotate(-14deg)' }, { transform: 'translateY(12px) rotate(10deg)' },
            { transform: 'translateY(-2px) rotate(-10deg)' }, { transform: 'translateY(14px) rotate(8deg)' },
            { transform: 'translateY(0) rotate(0deg)', opacity: 0.0 }
          ], { duration: 520, easing: 'ease-in-out', fill: 'forwards' });
          anims.push(a); a.onfinish = rm(saw);
        }
        later(rm(saw), 700);
        for (var k = 0; k < 7; k++) {
          var d = RG.el('div', { class: 'ss-dust', style: 'left:' + (cx - 3) + 'px;top:' + (top + 30) + 'px' });
          boardEls.benchWrap.appendChild(d);
          if (d.animate) {
            var da = d.animate([{ transform: 'translate(0,0)', opacity: 1 },
              { transform: 'translate(' + ((Math.random() - 0.5) * 70) + 'px,' + (40 + Math.random() * 40) + 'px)', opacity: 0 }],
              { duration: 600 + Math.random() * 300, easing: 'ease-out', fill: 'forwards', delay: k * 25 });
            anims.push(da);
          }
          later(rm(d), 1100);
        }
      }

      async function applyCut(rr, gapIdx) {
        if (locked || rr.over || rr.split || !alive(rr.g)) { return; }
        var g = rr.g, w = rr.item, pos = rr.cuts.indexOf(gapIdx);
        if (pos >= 0) {                      /* tapping a cut again glues it back */
          rr.cuts.splice(pos, 1); renderLog(rr); return;
        }
        var next = rr.cuts.concat([gapIdx]);
        var valid = w.sets.some(function (s) { return isSubset(next, s); });
        setLock(true);
        rr.cuts = next;
        renderLog(rr);
        sawFx(rr, gapIdx);
        sfx('pop');
        if (valid) {
          var full = w.sets.some(function (s) { return sameSet(next, s); });
          if (!full) { await sleep(450); if (alive(g)) { setLock(false); } return; }
          await sleep(500);
          if (!alive(g)) { return; }
          ctx.answer(true);
          afterSaw(rr);
          return;
        }
        /* wrong cut: undo gently, tell the rule */
        await sleep(520);
        if (!alive(g)) { return; }
        ctx.answer(false);
        recErr('wrong-split', w.w);
        noteMiss(rr);
        rr.sawMisses++;
        var gp = boardEls.gapEls[gapIdx];
        if (gp) { gp.classList.add('ss-wrong'); }
        var log = boardEls.bench.querySelector('.ss-log');
        if (log) { log.classList.add('ss-shake'); }
        await sleep(450);
        if (!alive(g)) { return; }
        rr.cuts = rr.cuts.filter(function (c) { return c !== gapIdx; });
        renderLog(rr);
        var tipTxt = chunksAllHaveVowel(w.w, next) ? TIPS[w.type] : VOWEL_TIP;
        await say('Oops, let us undo that cut. ' + tipTxt, { mood: 'gentle' });
        if (!alive(g)) { return; }
        if (rr.sawMisses >= 2) { await modelSaw(rr); if (!alive(g)) { return; } }
        setLock(false);
      }

      async function modelSaw(rr) {
        var g = rr.g, w = rr.item;
        rr.cuts = []; rr.vowels = true; renderLog(rr);
        await say('Let me show you. ' + TIPS[w.type], { mood: 'gentle' });
        if (!alive(g)) { return; }
        var set = w.sets[0], i;
        for (i = 0; i < set.length; i++) {
          rr.cuts.push(set[i]); renderLog(rr); sawFx(rr, set[i]); sfx('pop');
          await sleep(650);
          if (!alive(g)) { return; }
        }
        var chunks = splitBy(w.w, set);
        for (i = 0; i < chunks.length; i++) {
          await say(w.say[i], { rate: 0.6, mood: 'calm' });
          if (!alive(g)) { return; }
          await sleep(100);
        }
        rr.cuts = []; rr.hintCuts = true; renderLog(rr);
        await say('Now you saw it!', { mood: 'happy' });
      }

      /* ---------- after the saw: split, read chunks, blend ---------- */
      function afterSaw(rr) {
        var g = rr.g, w = rr.item;
        rr.split = true; rr.hintCuts = false;
        container.dataset.step = 'read';
        rr.parts = splitBy(w.w, rr.cuts);
        rr.read = rr.parts.map(function () { return false; });
        boardEls.vowelBtn.style.display = 'none';
        boardEls.prompt.textContent = 'Tap each chunk to read it!';
        var bench = boardEls.bench;
        bench.innerHTML = '';
        var pieces = RG.el('div', { class: 'ss-pieces' });
        var pcs = [];
        rr.parts.forEach(function (ch, i) {
          var pc = RG.el('button', { class: 'ss-piece', type: 'button', 'data-i': String(i), 'aria-label': 'chunk ' + ch });
          for (var k = 0; k < ch.length; k++) { pc.appendChild(RG.el('span', { class: 'ss-l' + (isVowelAt(w.w, offsetOf(rr, i) + k) ? ' ss-v' : ''), text: ch.charAt(k) })); }
          tap(pc, function () { readChunk(rr, i); });
          pieces.appendChild(pc); pcs.push(pc);
        });
        bench.appendChild(pieces);
        boardEls.pieces = pieces; boardEls.pcs = pcs;
        pieces.classList.add('ss-open'); fitFont(pieces, 16); pieces.classList.remove('ss-open');
        later(function () { pieces.classList.add('ss-open'); }, 60);
        sfx('win');
        var blendBtn = RG.el('button', { class: 'btn green ss-btn', type: 'button', text: '🔗 Blend the chunks!' });
        tap(blendBtn, function () { blendNow(rr); });
        boardEls.below.innerHTML = '';
        boardEls.below.appendChild(blendBtn);
        boardEls.blendBtn = blendBtn;
        var txt = 'Tap each chunk to hear it. Then blend them together!';
        ctx.onReplay = function () { quick(txt); };
        say('The log is in chunks! ' + txt, { mood: 'happy' });
        later(function () { if (alive(g)) { setLock(false); } }, 400);
      }
      function offsetOf(rr, i) { var o = 0; for (var k = 0; k < i; k++) { o += rr.parts[k].length; } return o; }

      async function readChunk(rr, i) {
        if (locked || rr.over || !alive(rr.g) || rr.step === 'pic') { return; }
        var pc = boardEls.pcs[i];
        pc.classList.add('ss-on'); pc.classList.add('ss-read'); pc.classList.remove('ss-nudge');
        rr.read[i] = true;
        if (rr.read.every(Boolean)) { boardEls.blendBtn.classList.add('ss-pulse'); }
        await say(chunkSay(rr, i), { rate: 0.6, mood: 'calm' });
        pc.classList.remove('ss-on');
      }

      async function blendNow(rr) {
        if (locked || rr.over || !alive(rr.g)) { return; }
        var g = rr.g, w = rr.item, i;
        if (!rr.read.every(Boolean)) {
          recErr('skipped-chunk', w.w);
          rr.parts.forEach(function (_, k) { if (!rr.read[k]) { boardEls.pcs[k].classList.add('ss-nudge'); } });
          quick('Read each chunk first. Tap the glowing ones!', { mood: 'gentle' });
          return;
        }
        setLock(true);
        boardEls.blendBtn.classList.remove('ss-pulse');
        await blendSequence(rr, false);
        if (!alive(g)) { return; }
        showPicChoices(rr);
      }

      /* speak chunks one by one while highlighting, slide the logs together, say the word */
      async function blendSequence(rr, withModelIntro) {
        var g = rr.g, w = rr.item, i;
        if (withModelIntro) { await say('Let me show you. ' + w.say.join(' ... '), { mood: 'gentle' }); if (!alive(g)) { return; } }
        for (i = 0; i < rr.parts.length; i++) {
          var pc = boardEls.pcs[i];
          pc.classList.add('ss-on');
          await say(chunkSay(rr, i), { rate: 0.6, mood: 'calm' });
          if (!alive(g)) { return; }
          pc.classList.remove('ss-on');
          await sleep(80);
        }
        boardEls.pieces.classList.remove('ss-open'); boardEls.pieces.classList.add('ss-join');
        await sleep(650);
        if (!alive(g)) { return; }
        await say(w.w, { rate: 0.8, mood: 'excited' });
      }

      /* ---------- picture / meaning choice ---------- */
      function showPicChoices(rr) {
        var g = rr.g, w = rr.item, pool = [], i;
        container.dataset.step = 'pic';
        rr.step = 'pic';
        var useMean = !!w.m && level === 4 && Math.random() < 0.5;
        var below = boardEls.below;
        below.innerHTML = '';
        var choices = [];
        if (useMean) {
          var others = RG.shuffle(WORDS[4].filter(function (x) { return x.m && x !== w; })).slice(0, 2);
          choices = RG.shuffle([w].concat(others));
        } else {
          pool = RG.shuffle(WORDS[level].concat(level > 1 ? WORDS[level - 1] : []).filter(function (x) { return x !== w && emojiOf(x) !== emojiOf(w); }));
          var seen = {}; seen[emojiOf(w)] = 1;
          var picks = [];
          pool.forEach(function (x) { if (picks.length < 2 && !seen[emojiOf(x)]) { seen[emojiOf(x)] = 1; picks.push(x); } });
          choices = RG.shuffle([w].concat(picks));
        }
        boardEls.prompt.textContent = useMean ? 'What does it mean?' : 'Which one is it?';
        var btns = [];
        choices.forEach(function (c) {
          var b;
          if (useMean) {
            b = RG.el('button', { class: 'choice ss-choice ss-mean', type: 'button', 'data-w': c.w },
              RG.el('span', { class: 'ss-me', text: emojiOf(c) }), RG.el('span', { text: c.m }));
          } else {
            b = RG.el('button', { class: 'choice ss-choice', type: 'button', 'data-w': c.w, text: emojiOf(c), 'aria-label': c.w });
          }
          tap(b, function () { pickChoice(rr, b, c); });
          below.appendChild(b); btns.push(b);
        });
        rr.btns = btns;
        var txt = useMean ? 'What does ' + w.w + ' mean?' : 'Which picture is ' + w.w + '?';
        ctx.onReplay = function () { quick(txt); };
        say(w.w + '! ' + txt, { mood: 'question' });
        later(function () { if (alive(g)) { setLock(false); } }, 300);
      }

      async function pickChoice(rr, btn, c) {
        if (locked || rr.over || !alive(rr.g)) { return; }
        var g = rr.g, w = rr.item, ok = c === w;
        setLock(true);
        ctx.answer(ok);
        if (ok) {
          rr.over = true;
          btn.classList.add('correct');
          rr.btns.forEach(function (b) { b.classList.remove('hint'); if (b !== btn) { b.classList.add('ss-off'); } });
          try { RG.celebrate(btn); } catch (e) { /* ignore */ }
          if (rr.tricky && !rr.missedAny) { trickyCorrect(w.w); }
          await say(w.w + '!', { rate: 0.8, mood: 'excited' });
          if (!alive(g)) { return; }
          await say(praiseText(), { mood: 'excited' });
          if (!alive(g)) { return; }
          await sleep(300);
          if (!alive(g)) { return; }
          roundNo++;
          ctx.roundDone();
          if (roundNo >= rounds) { ctx.finish(); } else { startRound(); }
          return;
        }
        noteMiss(rr);
        rr.picMisses++;
        btn.classList.add('ss-off');
        RG.wobble(btn);
        await say('Not quite. Read the chunks again: ' + w.say.join(', ') + '.', { mood: 'gentle' });
        if (!alive(g)) { return; }
        if (rr.picMisses >= 2) {
          await blendSequence(rr, true);
          if (!alive(g)) { return; }
          rr.btns.forEach(function (b) { if (b.dataset.w === w.w) { b.classList.add('hint'); } });
          await say('Now you pick ' + w.w + '!', { mood: 'happy' });
          if (!alive(g)) { return; }
        }
        setLock(false);
      }

      startRound();

      return function cleanup() {
        dead = true;
        gen++;
        timers.forEach(clearTimeout);
        timers = [];
        anims.forEach(function (a) { try { a.cancel(); } catch (e) { /* ignore */ } });
        anims = [];
        try { RG.stopSpeaking(); } catch (e) { /* ignore */ }
        ctx.onReplay = null;
        try { container.innerHTML = ''; } catch (e2) { /* ignore */ }
      };
    }
  });
})();
