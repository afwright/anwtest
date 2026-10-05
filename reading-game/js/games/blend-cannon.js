/* Blend Cannon - BIG track. Drills consonant blends (frog, not "fog"; stop, not "top").
   Mode A "Hear it": count the sounds, tap an Elkonin sound box for each one.
   Mode B "Read it" (main): picture + 3 minimal-pair words, fire the cannon at the right one.
   Mode C "Build it": a rime (-op) and cannonballs with blends, fire the one that makes the picture word.
   Blend tiles are two-tone (two sounds), digraph tiles are one solid colour (one sound). */
(function () {
  'use strict';
  var RG = window.RG;
  if (!RG || !RG.registerGame) { return; }

  var SKILL = 'blends';
  var STYLE_ID = 'bc-styles';
  var CSS = [
    '.bc-stage{display:flex;flex-direction:column;align-items:center;gap:10px;width:100%;max-width:720px;min-height:100%;margin:0 auto;box-sizing:border-box;position:relative;}',
    '.bc-stage .prompt{font-size:clamp(1.15rem,4.6vw,1.6rem);padding:8px 16px;margin:0;}',
    '.bc-top{display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap;width:100%;}',
    '.bc-pic{font-size:clamp(3.4rem,15vw,4.8rem);line-height:1;cursor:pointer;background:rgba(255,255,255,.6);border-radius:28px;padding:4px 18px;border:4px solid #fff;box-shadow:0 6px 0 rgba(10,60,110,.22);min-width:84px;min-height:84px;display:inline-flex;align-items:center;justify-content:center;touch-action:manipulation;}',
    '.bc-scene{position:relative;width:100%;flex:1 1 auto;display:flex;flex-direction:column;align-items:center;gap:10px;}',
    '.bc-targets{display:flex;justify-content:center;gap:10px;width:100%;}',
    '.bc-target{position:relative;flex:1 1 0;max-width:210px;min-width:92px;min-height:92px;border-radius:22px;border:6px solid #b9803f;background:linear-gradient(180deg,#fff8e3,#ffe6ad);font-family:inherit;font-weight:800;color:var(--ink,#12395e);font-size:clamp(1.55rem,7.2vw,2.5rem);letter-spacing:.02em;box-shadow:0 7px 0 rgba(90,50,10,.35);padding:4px 6px;white-space:nowrap;overflow:hidden;transition:transform .12s,opacity .3s,background .25s;touch-action:manipulation;}',
    '.bc-target:active{transform:translateY(4px);}',
    '.bc-target.bc-hit{border-color:#1f9544;background:#e5ffe9;box-shadow:0 0 0 6px rgba(47,191,91,.35),0 0 26px 8px rgba(47,191,91,.55);animation:bc-pop .5s ease;}',
    '.bc-target.bc-off{opacity:.42;pointer-events:none;filter:grayscale(.5);}',
    '.bc-target.bc-hint,.bc-cball.bc-hint{animation:bc-hintp 1s ease-in-out infinite;border-color:#ffc93c;}',
    '.bc-boom{position:absolute;left:50%;top:50%;font-size:2.6rem;pointer-events:none;transform:translate(-50%,-50%);animation:bc-boom .7s ease-out forwards;z-index:3;}',
    '.bc-ball{position:absolute;width:26px;height:26px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#8a93a8,#2b3040 55%,#12141a);box-shadow:0 3px 0 rgba(0,0,0,.25);pointer-events:none;z-index:6;}',
    '.bc-deck{position:relative;width:100%;height:118px;margin-top:auto;flex:none;}',
    '.bc-deck::before{content:"";position:absolute;left:-6px;right:-6px;bottom:0;height:40px;border-radius:16px 16px 0 0;background:repeating-linear-gradient(90deg,#a9642b 0 54px,#7c4417 54px 56px);border-top:5px solid #c98a47;box-shadow:0 -3px 0 rgba(0,0,0,.12);}',
    '.bc-cannon{position:absolute;left:50%;bottom:14px;width:130px;height:100px;margin-left:-65px;}',
    '.bc-barrel{position:absolute;left:50%;bottom:26px;width:42px;height:80px;margin-left:-21px;border-radius:14px 14px 8px 8px;background:linear-gradient(90deg,#23262f,#5a6277 45%,#23262f);border-top:9px solid #11131a;transform-origin:50% 78%;transition:transform .25s ease-out;z-index:1;}',
    '.bc-barrel.bc-kick{animation:bc-kick .3s ease-out;}',
    '.bc-wheel{position:absolute;left:50%;bottom:2px;width:64px;height:64px;margin-left:-32px;border-radius:50%;background:radial-gradient(circle,#4a2608 0 14%,#8d4f1f 15% 58%,#5a2f0e 59%);border:5px solid #3a1d05;z-index:2;}',
    '.bc-model{display:flex;align-items:center;justify-content:center;min-height:2.2em;width:100%;}',
    '.bc-word{display:flex;justify-content:center;align-items:center;flex-wrap:nowrap;gap:.16em;font-size:var(--bc-fs,2.4rem);transition:gap .5s ease;}',
    '.bc-word.bc-joined{gap:.03em;}',
    '.bc-tile{position:relative;display:inline-flex;align-items:stretch;justify-content:center;font-size:inherit;font-weight:800;line-height:1;border-radius:.32em;overflow:hidden;box-shadow:0 .09em 0 rgba(0,0,0,.28);border:.06em solid #fff;transition:transform .2s,box-shadow .2s;font-family:inherit;}',
    '.bc-tile>i{font-style:normal;padding:.2em .15em;min-width:.66em;text-align:center;display:block;}',
    '.bc-one{background:#fff;color:#12395e;padding:.2em .26em;min-width:.86em;}',
    '.bc-dig{background:linear-gradient(180deg,#a47dff,#7a49e8);color:#fff;padding:.2em .26em;min-width:.86em;text-shadow:0 .05em 0 rgba(0,0,0,.25);}',
    '.bc-blend>i.bc-h0{background:#2a86d8;color:#fff;text-shadow:0 .05em 0 rgba(0,0,0,.25);}',
    '.bc-blend>i.bc-h1{background:#e8741a;color:#fff;text-shadow:0 .05em 0 rgba(0,0,0,.25);}',
    '.bc-blend::after{content:"";position:absolute;left:.1em;right:.1em;bottom:.06em;height:.07em;border-radius:.1em;background:rgba(255,255,255,.95);}',
    '.bc-tile.bc-on{transform:translateY(-.12em) scale(1.14);box-shadow:0 0 0 .08em #ffc93c,0 0 .5em .14em rgba(255,201,60,.85);z-index:2;}',
    '.bc-gap{display:inline-flex;align-items:center;justify-content:center;min-width:1.7em;min-height:1.36em;border-radius:.32em;border:.08em dashed rgba(18,57,94,.55);background:rgba(255,255,255,.7);color:#12395e;font-weight:800;}',
    '.bc-gap.bc-over{border-color:#1f9544;background:#e5ffe9;}',
    '.bc-rime-dash{opacity:.0;}',
    '.bc-balls{display:flex;justify-content:center;gap:12px;flex-wrap:wrap;width:100%;}',
    '.bc-cball{width:clamp(88px,26vw,112px);height:clamp(88px,26vw,112px);border-radius:50%;border:5px solid #fff;background:radial-gradient(circle at 35% 28%,#566079,#2b3040 58%,#14161d);box-shadow:0 7px 0 rgba(0,0,0,.28);display:inline-flex;align-items:center;justify-content:center;font-size:clamp(1.35rem,6vw,1.9rem);padding:0;transition:transform .12s,opacity .3s;touch-action:manipulation;font-family:inherit;}',
    '.bc-cball:active{transform:translateY(4px) scale(.96);}',
    '.bc-cball.bc-off{opacity:.35;pointer-events:none;}',
    '.bc-cball .bc-tile{font-size:inherit;}',
    '.bc-boxes{display:flex;justify-content:center;align-items:flex-end;gap:10px;flex-wrap:wrap;width:100%;}',
    '.bc-ug{position:relative;display:flex;gap:5px;padding-bottom:12px;}',
    '.bc-ubar{position:absolute;left:0;bottom:2px;height:6px;display:flex;gap:5px;}',
    '.bc-ubar i{display:block;width:var(--bw,62px);border-radius:4px;background:#2a86d8;}',
    '.bc-ubar i:nth-child(even){background:#e8741a;}',
    '.bc-box{width:var(--bw,62px);height:var(--bw,62px);border-radius:16px;border:4px dashed rgba(18,57,94,.5);background:rgba(255,255,255,.75);padding:0;display:flex;align-items:center;justify-content:center;font-size:1.6rem;font-weight:800;color:#fff;touch-action:manipulation;font-family:inherit;transition:transform .15s;}',
    '.bc-box.bc-next{border-color:#ffc93c;animation:bc-hintp 1s ease-in-out infinite;}',
    '.bc-box.bc-filled{border-style:solid;border-color:#fff;box-shadow:0 5px 0 rgba(0,0,0,.25);}',
    '.bc-box.bc-f1{background:#2b3040;}',
    '.bc-box.bc-fd{background:#7a49e8;}',
    '.bc-box.bc-fb0{background:#2a86d8;}',
    '.bc-box.bc-fb1{background:#e8741a;}',
    '.bc-box.bc-bad{animation:bc-wob .4s ease;}',
    '.bc-note{font-size:clamp(1rem,3.8vw,1.25rem);font-weight:800;color:#12395e;background:rgba(255,255,255,.85);border-radius:18px;padding:6px 14px;max-width:100%;text-align:center;box-shadow:0 4px 0 rgba(10,60,110,.18);}',
    '.bc-counts{display:flex;justify-content:center;gap:14px;}',
    '.bc-count{min-width:84px;min-height:84px;font-size:2.4rem;}',
    '.bc-count.bc-off{opacity:.4;pointer-events:none;}',
    '.bc-count.bc-hint{animation:bc-hintp 1s ease-in-out infinite;border-color:#ffc93c;}',
    '@keyframes bc-pop{40%{transform:scale(1.14);}}',
    '@keyframes bc-hintp{50%{transform:scale(1.08);box-shadow:0 0 0 8px rgba(255,201,60,.5),0 0 26px 10px rgba(255,201,60,.8);}}',
    '@keyframes bc-boom{0%{transform:translate(-50%,-50%) scale(.2);opacity:1;}70%{transform:translate(-50%,-50%) scale(1.5);opacity:1;}100%{transform:translate(-50%,-50%) scale(1.8);opacity:0;}}',
    '@keyframes bc-kick{0%{margin-bottom:0;}40%{margin-bottom:-10px;}100%{margin-bottom:0;}}',
    '@keyframes bc-wob{0%,100%{transform:translateX(0);}25%{transform:translateX(-8px);}75%{transform:translateX(8px);}}',
    '@media (prefers-reduced-motion:reduce){.bc-word{transition:none;}}'
  ].join('\n');

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) { return; }
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  /* ------------------------------------------------------------------ data */
  /* "units" are separated by dots. Blend units (two or three sounds) are drawn two-tone,
     any other unit longer than one letter (sh, ck, ng, ee, ou ...) is ONE sound, drawn solid.
     Format: units | emoji | distractor words (real words, minimal pairs where possible). */
  var BLENDS = { fl: 1, sl: 1, pl: 1, cl: 1, bl: 1, gl: 1, sk: 1, sm: 1, sn: 1, sp: 1, st: 1, sw: 1, sc: 1,
    fr: 1, tr: 1, dr: 1, cr: 1, gr: 1, br: 1, pr: 1, tw: 1,
    nd: 1, nt: 1, mp: 1, ft: 1, lk: 1, nk: 1, str: 1, spl: 1, spr: 1, scr: 1, squ: 1, thr: 1, shr: 1 };
  var PIECES = { thr: ['th', 'r'], shr: ['sh', 'r'], squ: ['s', 'qu'], nk: ['n', 'k'] };
  var SOUNDS_OF = { thr: ['th', 'r'], shr: ['sh', 'r'], squ: ['s', 'k', 'w'], nk: ['ng', 'k'], scr: ['s', 'k', 'r'], sc: ['s', 'k'] };
  var SOUND = { b: 'buh', c: 'kuh', d: 'duh', f: 'fff', g: 'guh', h: 'huh', j: 'juh', k: 'kuh', l: 'lll', m: 'mmm',
    n: 'nnn', p: 'puh', q: 'kwuh', r: 'rrr', s: 'sss', t: 'tuh', v: 'vvv', w: 'wuh', x: 'ks', y: 'yuh', z: 'zzz',
    a: 'ah', e: 'eh', i: 'ih', o: 'aw', u: 'uh',
    sh: 'shh', ch: 'chuh', th: 'thh', ck: 'kuh', ng: 'ng', tch: 'chuh', ss: 'sss', ll: 'lll', ff: 'fff', zz: 'zzz',
    ee: 'ee', ea: 'ee', ai: 'ay', ay: 'ay', oa: 'oh', ow: 'ow', ou: 'ow', oi: 'oy', oy: 'oy', oo: 'oo',
    ar: 'are', or: 'or', er: 'er', ir: 'er', ur: 'er' };
  /* blends that can be said as one smooth sound (initial blends only) */
  var TOGETHER = { fl: 'fluh', sl: 'sluh', pl: 'pluh', cl: 'cluh', bl: 'bluh', gl: 'gluh', sk: 'skuh', sm: 'smuh',
    sn: 'snuh', sp: 'spuh', st: 'stuh', sw: 'swuh', fr: 'fruh', tr: 'truh', dr: 'druh', cr: 'cruh', gr: 'gruh',
    br: 'bruh', pr: 'pruh', str: 'struh', spl: 'spluh', spr: 'spruh', scr: 'scruh', squ: 'skwuh', thr: 'thruh', shr: 'shruh' };

  var RAW = {
    1: [
      'fl.a.g|🚩|lag,flap', 'sl.e.d|🛷|led,shed', 'pl.u.g|🔌|pug,slug', 'cl.a.p|👏|cap,clip',
      'bl.a.ck|⬛|back,block', 'st.o.p|🛑|top,tip', 'sw.i.m|🏊|slim,skim', 'sk.u.ll|💀|dull,skill',
      'cl.o.ck|🕐|lock,click', 'cl.i.p|📎|lip,clap', 'pl.u.s|➕|plug,pass', 'cl.a.m|🦪|cam,slam'
    ],
    2: [
      'fr.o.g|🐸|fog,fig', 'cr.a.b|🦀|cab,crib', 'dr.u.m|🥁|drip,trim', 'tr.u.ck|🚚|tuck,track',
      'br.i.ck|🧱|trick,click', 'gr.i.n|😁|grim,trim', 'tr.a.p|🪤|tap,trip', 'dr.o.p|💧|crop,prop',
      'dr.e.ss|👗|press,mess', 'tr.a.sh|🗑️|crash,trap', 'tr.a.ck|🛤️|rack,truck', 'tr.a.m|🚋|ram,trim'
    ],
    3: [
      'h.a.nd|✋|had,hat', 't.e.nt|⛺|ten,test', 'a.nt|🐜|at,and', 'n.e.st|🪺|net,west', 'v.e.st|🦺|vet,best',
      'g.i.ft|🎁|lift,sift', 'm.i.lk|🥛|mild,mink', 'd.i.sk|💿|dish,desk', 'c.a.mp|🏕️|cap,lamp',
      'sh.i.p|🚢|sip,chip', 'd.u.ck|🦆|dock,dug', 'ch.i.ck|🐥|chip,thick', 'sh.e.ll|🐚|sell,shed',
      'b.a.th|🛁|bat,math', 's.o.ck|🧦|sack,rock', 'r.i.ng|💍|rig,rink', 'p.i.nk|🩷|pin,pick',
      'sk.u.nk|🦨|sunk,skull', 'l.o.ck|🔒|rock,luck', 'sh.o.p|🏪|ship,chop'
    ],
    4: [
      'squ.i.d|🦑|skid,squad', 'shr.i.mp|🦐|limp,chimp', 'spl.a.sh|💦|spat,smash', 'str.i.ng|🧵|sting,sing',
      'str.o.ng|💪|song,strung', 'scr.ea.m|😱|cream,stream', 'thr.ee|3️⃣|tree,free', 'cr.u.tch|🩼|crush,clutch',
      'w.i.tch|🧙‍♀️|with,which', 'h.a.tch|🐣|hat,match', 'spr.ou.t|🌱|spout,scout', 'spr.ay|🧴|pray,stray',
      'scr.u.b|🧽|shrub,scrap'
    ],
    5: [
      'pl.a.nt|🪴|plan,pant', 'st.a.nd|🧍|sand,stamp', 'dr.i.nk|🥤|rink,drank', 'spr.i.nt|🏃|print,spring',
      'tr.u.st|🤝|rust,crust', 'fr.o.st|❄️|fort,frog', 'sp.e.nd|💸|send,spent', 'th.i.nk|🤔|thin,thick',
      'st.or.m|⛈️|stork,form', 'sc.ar.f|🧣|scar,scare', 'cr.ow.n|👑|crow,clown', 'br.ai.n|🧠|bran,train'
    ]
  };

  function emojiOf(w) {
    var e = '';
    try { e = (RG.emojiFor && RG.emojiFor(w.w)) || ''; } catch (x) { e = ''; }
    return e || w.e;
  }
  function kindOf(u) { return BLENDS[u] ? 'blend' : (u.length > 1 ? 'dig' : 'one'); }
  function piecesOf(u) { return PIECES[u] || u.split(''); }
  function soundsOf(u) { return SOUNDS_OF[u] || (BLENDS[u] ? u.split('') : [u]); }

  var WORDS = {}, ALL = {}, REAL = {};
  Object.keys(RAW).forEach(function (lv) {
    WORDS[lv] = RAW[lv].map(function (s) {
      var p = s.split('|'), units = p[0].split('.');
      var w = { w: units.join(''), units: units, e: p[1], d: p[2] ? p[2].split(',') : [], level: +lv };
      w.nsounds = units.reduce(function (n, u) { return n + soundsOf(u).length; }, 0);
      ALL[w.w] = w; REAL[w.w] = 1;
      w.d.forEach(function (d) { REAL[d] = 1; });
      return w;
    });
  });
  function hasBlend(w) { return w.units.some(function (u) { return kindOf(u) === 'blend'; }); }

  /* Is `cand` the word with one letter of a blend deleted (frog -> fog, stop -> top)? */
  function isDropped(w, cand) {
    var pos = 0, i, idx = [];
    w.units.forEach(function (u) {
      if (kindOf(u) === 'blend') { for (i = 0; i < u.length; i++) { idx.push(pos + i); } }
      pos += u.length;
    });
    for (i = 0; i < idx.length; i++) {
      if (w.w.slice(0, idx[i]) + w.w.slice(idx[i] + 1) === cand) { return true; }
    }
    return false;
  }

  /* Onsets for Mode C: first unit when it is a blend or digraph. */
  var ONSETS = {
    1: ['fl', 'sl', 'pl', 'cl', 'bl', 'gl', 'st', 'sp', 'sn', 'sw', 'sk', 'sm'],
    2: ['fr', 'tr', 'dr', 'cr', 'gr', 'br', 'pr'],
    3: ['sh', 'ch', 'th', 'sk', 'st', 'sp'],
    4: ['spl', 'spr', 'str', 'scr', 'squ', 'thr', 'shr'],
    5: ['pl', 'st', 'dr', 'spr', 'tr', 'fr', 'sp', 'th', 'cr', 'br', 'sc']
  };
  function cEligible(w) { var k = kindOf(w.units[0]); return k === 'blend' || (k === 'dig' && w.units.length > 2); }

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
    id: 'blend-cannon',
    title: 'Blend Cannon',
    emoji: '💣',
    tracks: ['big'],
    skill: SKILL,
    blurb: 'Load the cannon and blast the right word! Blends keep both sounds.',
    mount: function (container, ctx) {
      injectStyle();
      var dead = false, timers = [], anims = [], gen = 0, locked = true;
      function setLock(v) { locked = v; try { container.dataset.locked = v ? '1' : '0'; } catch (e) { /* ignore */ } }
      var level = clamp(Math.round(ctx.level || 1), 1, 5);
      var rounds = ctx.rounds || 5;
      var roundNo = 0;
      var cur = null;                      /* per-round state */
      var W = Math.max(300, container.clientWidth || 360);

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

      /* pointer-first tap helper (keyboard clicks still work) */
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
        el.addEventListener('click', function (e) {
          if (e.detail === 0 && !dead) { fn(e); }   /* keyboard / assistive tech only */
        });
        return el;
      }

      container.innerHTML = '';
      var stage = RG.el('div', { class: 'bc-stage' });
      container.appendChild(stage);

      /* ---------- plan: which word and mode for each round ---------- */
      function makePlan() {
        var pool = WORDS[level].slice(), used = {}, plan = [], i;
        var template = ['B', 'A', 'B', 'C', 'B'];
        var trick = [];
        trickyList().forEach(function (t) {
          var w = t && ALL[t.word];
          if (w && w.level <= level && trick.indexOf(w) < 0) { trick.push(w); }
        });
        trick = RG.shuffle(trick).slice(0, 2);
        var trickAt = {};
        RG.shuffle(range(1, rounds - 1)).slice(0, trick.length).forEach(function (ix, k) { trickAt[ix] = trick[k]; });
        var easier = level > 1 ? RG.shuffle(WORDS[level - 1]) : [];
        for (i = 0; i < rounds; i++) {
          var mode = template[i % template.length], item = null, isTricky = false;
          if (trickAt[i]) { item = trickAt[i]; isTricky = true; }
          if (!item && i === 0 && easier.length) { item = easier[0]; }      /* gentle warm-up */
          if (!item) {
            var cand = RG.shuffle(pool).filter(function (w) { return !used[w.w] && (mode !== 'C' || cEligible(w)); });
            if (!cand.length) { cand = RG.shuffle(pool).filter(function (w) { return !used[w.w]; }); mode = mode === 'C' ? 'B' : mode; }
            item = cand[0] || RG.sample(pool);
          }
          if (mode === 'C' && !cEligible(item)) { mode = 'B'; }
          used[item.w] = 1;
          plan.push({ mode: mode, item: item, tricky: isTricky });
        }
        return plan;
      }
      function range(a, b) { var o = []; for (var i = a; i <= b; i++) { o.push(i); } return o; }
      var plan = makePlan();

      /* ---------- tiles ---------- */
      function fsFor(len) { return clamp((W - 44) / (len * 1.12 * 16), 1.5, 2.6) + 'rem'; }
      function tileEl(u) {
        var k = kindOf(u), t = RG.el('span', { class: 'bc-tile bc-' + k, 'data-u': u });
        if (k === 'blend') {
          piecesOf(u).forEach(function (ch, i) { t.appendChild(RG.el('i', { class: 'bc-h' + (i % 2), text: ch })); });
        } else { t.textContent = u; }
        return t;
      }
      function wordRow(units) {
        var row = RG.el('div', { class: 'bc-word', style: '--bc-fs:' + fsFor(units.join('').length) });
        var tiles = units.map(function (u) { var t = tileEl(u); row.appendChild(t); return t; });
        row.tiles = tiles;
        return row;
      }
      /* say one unit's sounds separately, then a blend smoothly together */
      async function sayUnit(g, u, tileNode) {
        if (tileNode) { tileNode.classList.add('bc-on'); }
        var ss = soundsOf(u), i;
        for (i = 0; i < ss.length; i++) {
          await say(SOUND[ss[i]] || ss[i], { rate: 0.62, mood: 'calm' });
          if (!alive(g)) { return; }
          await sleep(60);
        }
        if (kindOf(u) === 'blend' && TOGETHER[u]) {
          await say(TOGETHER[u], { rate: 0.75, mood: 'happy' });
        }
        if (tileNode) { tileNode.classList.remove('bc-on'); }
      }
      /* say every sound (blends split, then joined), slide the tiles together, say the word */
      async function sayWord(g, w, row) {
        var i;
        for (i = 0; i < w.units.length; i++) {
          await sayUnit(g, w.units[i], row ? row.tiles[i] : null);
          if (!alive(g)) { return; }
        }
        if (row) { row.classList.add('bc-joined'); }
        await sleep(280);
        if (!alive(g)) { return; }
        await say(w.w, { rate: 0.8, mood: 'excited' });
      }

      /* ---------- cannon ---------- */
      function buildCannon(scene) {
        var deck = RG.el('div', { class: 'bc-deck' });
        var cannon = RG.el('div', { class: 'bc-cannon', 'aria-hidden': 'true' });
        var barrel = RG.el('div', { class: 'bc-barrel' });
        var wheel = RG.el('div', { class: 'bc-wheel' });
        cannon.appendChild(barrel); cannon.appendChild(wheel); deck.appendChild(cannon);
        function fire(targetEl) {
          return new Promise(function (resolve) {
            var sr = scene.getBoundingClientRect(), wr = wheel.getBoundingClientRect(), tr = targetEl.getBoundingClientRect();
            var px = wr.left + wr.width / 2, py = wr.top + wr.height / 2 - 6;
            var tx = tr.left + tr.width / 2, ty = tr.top + tr.height / 2;
            var ang = Math.atan2(tx - px, py - ty), deg = clamp(ang * 180 / Math.PI, -75, 75), rad = deg * Math.PI / 180;
            barrel.style.transform = 'rotate(' + deg + 'deg)';
            later(function () {
              var mx = px + Math.sin(rad) * 62, my = py - Math.cos(rad) * 62;
              var ball = RG.el('div', { class: 'bc-ball', style: 'left:' + (mx - sr.left - 13) + 'px;top:' + (my - sr.top - 13) + 'px' });
              scene.appendChild(ball);
              barrel.classList.remove('bc-kick'); void barrel.offsetWidth; barrel.classList.add('bc-kick');
              sfx('pop');
              var dx = tx - mx, dy = ty - my, done = false;
              function end() {
                if (done) { return; }
                done = true;
                if (ball.parentNode) { ball.parentNode.removeChild(ball); }
                resolve();
              }
              if (ball.animate) {
                var a = ball.animate([
                  { transform: 'translate(0,0) scale(.8)' },
                  { transform: 'translate(' + dx / 2 + 'px,' + (dy / 2 - 70) + 'px) scale(1.05)', offset: 0.5 },
                  { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(.9)' }
                ], { duration: 560, easing: 'ease-in-out', fill: 'forwards' });
                anims.push(a);
                a.onfinish = end;
                later(end, 800);
              } else { later(end, 300); }
            }, 270);
          });
        }
        return { deck: deck, fire: fire };
      }
      function boom(targetEl, glyph) {
        var b = RG.el('span', { class: 'bc-boom', text: glyph || '💥', 'aria-hidden': 'true' });
        targetEl.appendChild(b);
        later(function () { if (b.parentNode) { b.parentNode.removeChild(b); } }, 800);
      }

      /* ---------- round scaffolding ---------- */
      function newRound() {
        gen++;
        var p = plan[roundNo];
        cur = { g: gen, mode: p.mode, item: p.item, tricky: p.tricky, misses: 0, missedAny: false, over: false };
        setLock(true);
        stage.innerHTML = '';
        container.dataset.target = cur.item.w;
        container.dataset.mode = cur.mode;
        return cur;
      }
      function noteMiss(r) {
        r.misses++;
        if (!r.missedAny) { r.missedAny = true; trickyAdd(r.item.w); }
      }
      function praiseText() { try { return RG.praise(); } catch (e) { return 'Great job!'; } }
      async function finishRound(r, extra) {
        var g = r.g;
        if (r.tricky && !r.missedAny) { trickyCorrect(r.item.w); }
        if (extra) { await extra(); if (!alive(g)) { return; } }
        await say(praiseText(), { mood: 'excited' });
        if (!alive(g)) { return; }
        await sleep(300);
        if (!alive(g)) { return; }
        roundNo++;
        ctx.roundDone();
        if (roundNo >= rounds) { ctx.finish(); } else { startRound(); }
      }
      function picEl(r) {
        var w = r.item;
        var pic = RG.el('div', { class: 'bc-pic bounce', role: 'button', tabindex: '0', 'aria-label': 'say the word', text: emojiOf(w) });
        tap(pic, function () { quick(w.w); });
        return pic;
      }
      function startRound() {
        if (dead) { return; }
        var r = newRound();
        if (r.mode === 'A') { roundA(r); } else if (r.mode === 'C') { roundC(r); } else { roundB(r); }
      }

      /* ---------- MODE B: read it ---------- */
      function roundB(r) {
        var g = r.g, w = r.item, word = w.w, i;
        var dropped = w.d.filter(function (d) { return isDropped(w, d); });
        var others = w.d.filter(function (d) { return dropped.indexOf(d) < 0; });
        var picks = dropped.slice(0, 1).concat(others).concat(dropped.slice(1)).slice(0, 2);
        var choices = RG.shuffle([word].concat(picks));
        var top = RG.el('div', { class: 'bc-top' }, picEl(r));
        var prompt = RG.el('div', { class: 'prompt', text: 'Fire at the word for the picture!' });
        var scene = RG.el('div', { class: 'bc-scene' });
        var targets = RG.el('div', { class: 'bc-targets' });
        var model = RG.el('div', { class: 'bc-model' });
        var cards = [];
        choices.forEach(function (c) {
          var cw = (Math.min(W, 720) - 32 - 20) / 3;
          var b = RG.el('button', { class: 'bc-target', type: 'button', text: c, 'data-w': c, 'aria-label': c,
            style: 'font-size:' + clamp((cw - 30) / (c.length * 0.62), 16, 40) + 'px' });
          tap(b, function () { pick(b, c); });
          targets.appendChild(b); cards.push(b);
        });
        var cannon = buildCannon(scene);
        scene.appendChild(targets); scene.appendChild(model); scene.appendChild(cannon.deck);
        stage.appendChild(top); stage.appendChild(prompt); stage.appendChild(scene);

        ctx.onReplay = function () { quick('Fire at the word for the picture. It says ' + word + '.'); };
        quick('Fire the cannon at the word for the picture!');
        later(function () { if (alive(g)) { setLock(false); } }, 350);

        function rightCard() { for (var k = 0; k < cards.length; k++) { if (cards[k].dataset.w === word) { return cards[k]; } } return null; }

        async function pick(btn, c) {
          if (locked || !alive(g) || r.over) { return; }
          setLock(true);
          var ok = c === word;
          await cannon.fire(btn);
          if (!alive(g)) { return; }
          boom(btn, ok ? '💥' : '💦');
          ctx.answer(ok);
          if (ok) {
            r.over = true;
            btn.classList.add('bc-hit');
            cards.forEach(function (x) { x.classList.remove('bc-hint'); });
            try { RG.celebrate(btn); } catch (e) { /* ignore */ }
            var row = wordRow(w.units);
            model.innerHTML = ''; model.appendChild(row);
            await sleep(350);
            if (!alive(g)) { return; }
            finishRound(r, async function () { await sayWord(g, w, row); });
            return;
          }
          /* wrong */
          noteMiss(r);
          btn.classList.add('bc-off');
          RG.wobble(btn);
          var drop = isDropped(w, c);
          if (drop) { recErr('dropped-consonant', word); }
          var bl = firstBlend(w);
          var msg;
          if (drop && bl) {
            msg = 'Careful! That one says ' + c + '. ' + word + ' has both sounds: ' + piecesOf(bl).join(' and ') + '.';
          } else {
            msg = 'Not quite. That one says ' + c + '. Try again!';
          }
          await say(msg, { mood: 'gentle' });
          if (!alive(g)) { return; }
          if (r.misses >= 2) {
            await modelIt();
            if (!alive(g)) { return; }
          }
          setLock(false);
        }

        async function modelIt() {
          var row = wordRow(w.units);
          model.innerHTML = ''; model.appendChild(row);
          await say('Let me show you. This word says ' + word + '.', { mood: 'gentle' });
          if (!alive(g)) { return; }
          await sayWord(g, w, row);
          if (!alive(g)) { return; }
          await say('Now you fire at ' + word + '!', { mood: 'happy' });
          var rc = rightCard();
          if (rc) { rc.classList.add('bc-hint'); }
        }
      }
      function firstBlend(w) {
        for (var i = 0; i < w.units.length; i++) { if (kindOf(w.units[i]) === 'blend') { return w.units[i]; } }
        return null;
      }

      /* ---------- MODE A: hear it (count, then Elkonin boxes) ---------- */
      function roundA(r) {
        var g = r.g, w = r.item, word = w.w, n = w.nsounds;
        var top = RG.el('div', { class: 'bc-top' }, picEl(r));
        var prompt = RG.el('div', { class: 'prompt', text: 'How many sounds do you hear?' });
        var counts = RG.el('div', { class: 'bc-counts' });
        var stageBody = RG.el('div', { class: 'bc-scene' });
        var boxHost = RG.el('div', { class: 'bc-model', style: 'flex-direction:column;gap:10px;' });
        var opts = [n - 1, n, n + 1].filter(function (x) { return x >= 2; });
        if (opts.length < 3) { opts.push(n + 2); }
        var btns = {};
        opts.forEach(function (v) {
          var b = RG.el('button', { class: 'choice bc-count', type: 'button', text: String(v), 'aria-label': v + ' sounds' });
          tap(b, function () { choose(b, v); });
          counts.appendChild(b); btns[v] = b;
        });
        stageBody.appendChild(counts); stageBody.appendChild(boxHost);
        stage.appendChild(top); stage.appendChild(prompt); stage.appendChild(stageBody);

        ctx.onReplay = function () { quick('Listen. ' + word + '. How many sounds do you hear?'); };
        say('Listen. ' + word + '. How many sounds do you hear?', { mood: 'question' });
        later(function () { if (alive(g)) { setLock(false); } }, 400);

        async function choose(btn, v) {
          if (locked || !alive(g) || r.over) { return; }
          setLock(true);
          var ok = v === n;
          ctx.answer(ok);
          if (ok) {
            r.over = true;
            btn.classList.add('correct'); btn.classList.remove('bc-hint');
            Object.keys(btns).forEach(function (k) { if (+k !== n) { btns[k].classList.add('bc-off'); } });
            try { RG.celebrate(btn); } catch (e) { /* ignore */ }
            prompt.textContent = 'Tap a box for each sound!';
            await say(n + ' sounds! Now tap a box for each sound, and say it with me.', { mood: 'happy' });
            if (!alive(g)) { return; }
            await boxes(false);
            return;
          }
          noteMiss(r);
          btn.classList.add('bc-off');
          RG.wobble(btn);
          if (v === n - 1 && hasBlend(w)) { recErr('dropped-consonant', word); }
          if (r.misses >= 2) {
            await say('Let me show you. ' + word + ' has ' + n + ' sounds.', { mood: 'gentle' });
            if (!alive(g)) { return; }
            await boxes(true);
            if (!alive(g)) { return; }
            if (btns[n]) { btns[n].classList.add('bc-hint'); }
            setLock(false);
            return;
          }
          var tipTxt = hasBlend(w) ? 'In a blend you hear both sounds.' : 'Say it slowly and tap a finger for each sound.';
          await say('Not quite. ' + tipTxt + ' Try again!', { mood: 'gentle' });
          if (!alive(g)) { return; }
          setLock(false);
        }

        /* Elkonin boxes. auto=true: the game taps them (modeling); else the player taps in order. */
        async function boxes(auto) {
          boxHost.innerHTML = '';
          var row = RG.el('div', { class: 'bc-boxes' });
          var bw = clamp(Math.floor((W - 56 - n * 6) / n), 44, 70);
          row.style.setProperty('--bw', bw + 'px');
          var list = [];
          w.units.forEach(function (u) {
            var ss = soundsOf(u), k = kindOf(u);
            var grp = RG.el('div', { class: 'bc-ug' + (k === 'blend' ? ' bc-ugb' : '') });
            ss.forEach(function (s, si) {
              var bx = RG.el('button', { class: 'bc-box', type: 'button', 'aria-label': 'sound ' + (list.length + 1) });
              bx.fillCls = k === 'blend' ? 'bc-fb' + (si % 2) : (k === 'dig' ? 'bc-fd' : 'bc-f1');
              bx.snd = s; bx.unit = u; bx.si = si;
              grp.appendChild(bx); list.push(bx);
            });
            if (k === 'blend') {
              var ub = RG.el('div', { class: 'bc-ubar' });
              ss.forEach(function () { ub.appendChild(RG.el('i')); });
              grp.appendChild(ub);
            }
            row.appendChild(grp);
          });
          boxHost.appendChild(row);
          var idx = 0;
          function markNext() { list.forEach(function (b, i) { b.classList.toggle('bc-next', i === idx && !auto); }); }
          function fill(b) { b.classList.add('bc-filled', b.fillCls); }
          if (auto) {
            for (var i = 0; i < list.length; i++) {
              fill(list[i]);
              await say(SOUND[list[i].snd] || list[i].snd, { rate: 0.62, mood: 'calm' });
              if (!alive(g)) { return; }
              await sleep(120);
            }
            await sleep(200);
            if (!alive(g)) { return; }
            await say(word + ' has ' + n + ' sounds.', { mood: 'happy' });
            return;
          }
          markNext();
          setLock(false);
          await new Promise(function (resolve) {
            list.forEach(function (b, i) {
              tap(b, function () {
                if (locked || !alive(g) || b.classList.contains('bc-filled')) { return; }
                if (i !== idx) {
                  list[idx].classList.remove('bc-bad'); void list[idx].offsetWidth; list[idx].classList.add('bc-bad');
                  return;
                }
                fill(b); idx++;
                markNext();
                quick(SOUND[b.snd] || b.snd, { rate: 0.62, mood: 'calm' });
                if (idx >= list.length) { setLock(true); later(resolve, 650); }
              });
            });
          });
          if (!alive(g)) { return; }
          /* all boxes tapped: blend them, then show how the letters spell it */
          var wr = wordRow(w.units);
          boxHost.appendChild(wr);
          var tail = hasBlend(w) ? 'A blend keeps both sounds, like ' + piecesOf(firstBlend(w)).join(' and ') + '.' : '';
          finishRound(r, async function () {
            await sayWord(g, w, wr);
            if (!alive(g)) { return; }
            if (tail) {
              var note = RG.el('div', { class: 'bc-note', text: 'Blend = two sounds, both stay!' });
              boxHost.appendChild(note);
              await say(tail, { mood: 'happy' });
            }
          });
        }
      }

      /* ---------- MODE C: build it ---------- */
      function roundC(r) {
        var g = r.g, w = r.item, word = w.w;
        var onset = w.units[0], rimeUnits = w.units.slice(1), rime = rimeUnits.join('');
        /* cannonballs: the right blend, a dropped-consonant ball when it makes a real word, and others */
        var balls = [onset], k;
        var dropLetters = [onset.slice(1), onset.slice(0, -1)];
        for (k = 0; k < dropLetters.length; k++) {
          var dl = dropLetters[k];
          if (dl && dl !== onset && REAL[dl + rime] && balls.indexOf(dl) < 0 && balls.length < 2) { balls.push(dl); }
        }
        var want = level >= 3 ? 4 : 3;
        RG.shuffle(ONSETS[level] || ONSETS[1]).forEach(function (o) {
          if (balls.length < want && balls.indexOf(o) < 0 && o !== onset && !(REAL[o + rime] && ALL[o + rime] && ALL[o + rime].e === w.e)) { balls.push(o); }
        });
        balls = RG.shuffle(balls);

        var top = RG.el('div', { class: 'bc-top' }, picEl(r));
        var prompt = RG.el('div', { class: 'prompt', text: 'Which blend finishes the word?' });
        var scene = RG.el('div', { class: 'bc-scene' });
        var fs = fsFor(word.length);
        var wordRowEl = RG.el('div', { class: 'bc-word', style: '--bc-fs:' + fs });
        var gap = RG.el('span', { class: 'bc-gap', text: '?', 'aria-label': 'missing blend' });
        wordRowEl.appendChild(gap);
        var rimeTiles = rimeUnits.map(function (u) { var t = tileEl(u); wordRowEl.appendChild(t); return t; });
        var ballsEl = RG.el('div', { class: 'bc-balls' });
        var ballBtns = [];
        balls.forEach(function (o) {
          var b = RG.el('button', { class: 'bc-cball', type: 'button', 'aria-label': o, 'data-o': o });
          b.appendChild(tileEl(o));
          tap(b, function () { shoot(b, o); });
          ballsEl.appendChild(b); ballBtns.push(b);
        });
        var model = RG.el('div', { class: 'bc-model' });
        var cannon = buildCannon(scene);
        scene.appendChild(wordRowEl); scene.appendChild(ballsEl); scene.appendChild(model); scene.appendChild(cannon.deck);
        stage.appendChild(top); stage.appendChild(prompt); stage.appendChild(scene);

        ctx.onReplay = function () { quick('Fire the blend that makes ' + word + '.'); };
        say('Fire the blend that makes ' + word + '!', { mood: 'happy' });
        later(function () { if (alive(g)) { setLock(false); } }, 400);

        async function shoot(btn, o) {
          if (locked || !alive(g) || r.over) { return; }
          setLock(true);
          var ok = o === onset;
          await cannon.fire(gap);
          if (!alive(g)) { return; }
          ctx.answer(ok);
          if (ok) {
            r.over = true;
            boom(gap, '💥');
            gap.replaceWith(tileEl(onset));
            ballBtns.forEach(function (b) { b.classList.remove('bc-hint'); if (b !== btn) { b.classList.add('bc-off'); } });
            try { RG.celebrate(wordRowEl); } catch (e) { /* ignore */ }
            var row = wordRow(w.units);
            wordRowEl.replaceWith(row);
            await sleep(300);
            if (!alive(g)) { return; }
            finishRound(r, async function () { await sayWord(g, w, row); });
            return;
          }
          noteMiss(r);
          boom(gap, '💦');
          btn.classList.add('bc-off');
          RG.wobble(gap);
          if (isDropped(w, o + rime)) { recErr('dropped-consonant', word); }
          var made = o + rime;
          var msg = REAL[made] ? 'That makes ' + made + '. We need ' + word + '. Try again!' : 'Hmm, that does not match the picture. Try again!';
          if (isDropped(w, made)) { msg = 'That makes ' + made + ', but ' + word + ' has both sounds: ' + piecesOf(onset).join(' and ') + '.'; }
          await say(msg, { mood: 'gentle' });
          if (!alive(g)) { return; }
          if (r.misses >= 2) {
            await say('Let me show you. ' + word + '.', { mood: 'gentle' });
            if (!alive(g)) { return; }
            var mrow = wordRow(w.units);
            model.innerHTML = ''; model.appendChild(mrow);
            await sayWord(g, w, mrow);
            if (!alive(g)) { return; }
            ballBtns.forEach(function (b) { if (b.dataset.o === onset) { b.classList.add('bc-hint'); } });
            await say('Now you fire ' + piecesOf(onset).join(' ') + '!', { mood: 'happy' });
          }
          if (!alive(g)) { return; }
          setLock(false);
        }
        void rimeTiles;
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
