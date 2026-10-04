/* Sound Hunt - little track. What sound does the picture start with? */
(function () {
  'use strict';
  var RG = window.RG;
  if (!RG || !RG.registerGame) return;

  var STYLE_ID = 'sh-style';
  var CSS = [
    '.sh-wrap{width:100%;flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:8px 12px 16px;box-sizing:border-box;overflow:hidden}',
    '.sh-pic{width:clamp(150px,44vw,220px);height:clamp(150px,44vw,220px);border-radius:50%;background:#fff;border:6px solid #ffd43b;box-shadow:0 8px 0 rgba(0,0,0,.1);display:flex;align-items:center;justify-content:center;animation:sh-in .5s ease-out both}',
    '.sh-pic .big-emoji{font-size:clamp(5rem,26vw,8rem);line-height:1}',
    '@keyframes sh-in{from{transform:scale(.3) rotate(-20deg);opacity:0}to{transform:scale(1) rotate(0);opacity:1}}',
    '.sh-wrap .prompt{margin:0;text-align:center}',
    '.sh-wrap .choices{display:flex;flex-wrap:wrap;justify-content:center;gap:16px}',
    '.sh-wrap .choice.sh-card{min-width:96px;min-height:96px;font-size:2.6rem;font-weight:800;touch-action:manipulation;-webkit-tap-highlight-color:transparent}',
    '.sh-wrap .choice.sh-card small{font-size:.6em;opacity:.7}'
  ].join('\n');
  var EASY = 'sampitnbfmhdl'.split('');
  var ALL = 'abcdefghijklmnopqrstuvwyz'.split('');
  var GROUPS = ['bdp', 'mn', 'fv', 'tdk', 'szc', 'gj', 'wr', 'hy'];
  var FALLBACK_SOUND = { a: 'ah', b: 'buh', c: 'kuh', d: 'duh', e: 'eh', f: 'fff', g: 'guh', h: 'huh', i: 'ih', j: 'juh', k: 'kuh', l: 'lll', m: 'mmm', n: 'nnn', o: 'aw', p: 'puh', q: 'kwuh', r: 'rrr', s: 'sss', t: 'tuh', u: 'uh', v: 'vvv', w: 'wuh', x: 'ks', y: 'yuh', z: 'zzz' };
  var FALLBACK_WORDS = [
    ['s', 'sun', '☀️'], ['a', 'apple', '🍎'], ['m', 'moon', '🌙'], ['p', 'pig', '🐷'],
    ['t', 'tree', '🌳'], ['b', 'ball', '⚽'], ['f', 'fish', '🐟'], ['d', 'dog', '🐶'],
    ['c', 'cat', '🐱'], ['h', 'hat', '🎩'], ['n', 'nest', '🪺'], ['l', 'lion', '🦁']
  ];

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function soundMap() {
    var m = {};
    try {
      var L = RG.content && RG.content.letters;
      if (L && L.length) L.forEach(function (o) { if (o && o.letter && o.sound) m[String(o.letter).toLowerCase()] = o.sound; });
    } catch (e) {}
    Object.keys(FALLBACK_SOUND).forEach(function (k) { if (!m[k]) m[k] = FALLBACK_SOUND[k]; });
    return m;
  }

  // entries: {letter, word, emoji}; only where word starts with the letter's own sound
  function buildEntries() {
    var out = [], seen = {};
    function add(word, emoji, letter) {
      word = String(word || '').toLowerCase();
      if (!word || !emoji) return;
      letter = (letter || word[0]).toLowerCase();
      if (word[0] !== letter || letter === 'x') return;
      var k = letter + ':' + word;
      if (seen[k]) return;
      seen[k] = 1;
      out.push({ letter: letter, word: word, emoji: emoji });
    }
    try {
      var C = RG.content || {};
      (C.letters || []).forEach(function (o) { if (o) add(o.word, o.emoji, o.letter); });
      (C.cvcWords || []).forEach(function (o) { if (o) add(o.word, o.emoji || (RG.emojiFor && RG.emojiFor(o.word))); });
    } catch (e) {}
    FALLBACK_WORDS.forEach(function (f) { add(f[1], f[2], f[0]); });
    return out;
  }

  RG.registerGame({
    id: 'sound-hunt',
    title: 'Sound Hunt',
    emoji: '🔍',
    tracks: ['little'],
    skill: 'beginning-sounds',
    blurb: 'What sound does the picture start with?',
    mount: function (container, ctx) {
      injectStyle();
      var alive = true, locked = true, misses = 0, round = 0, sp = 0;
      var lastLetter = null, usedLetters = [], target = null;
      var timers = [];
      var level = Math.max(1, Math.min(3, ctx.level || 1));
      var rounds = ctx.rounds || 5;
      var sounds = soundMap();
      var entries = buildEntries();

      function later(fn, ms) {
        var t = setTimeout(function () {
          timers = timers.filter(function (x) { return x !== t; });
          if (alive) fn();
        }, ms);
        timers.push(t);
        return t;
      }
      function wait(ms) { return new Promise(function (res) { later(res, ms); }); }
      function seq() {
        var steps = Array.prototype.slice.call(arguments);
        var s = ++sp;
        var p = Promise.resolve();
        steps.forEach(function (st) {
          p = p.then(function () { if (!alive || s !== sp) return; return st(); }).catch(function () {});
        });
        return p;
      }
      function say(t) { return function () { return RG.speak(t); }; }

      var wrap = RG.el('div', { class: 'sh-wrap' });
      var pic = RG.el('div', { class: 'sh-pic' });
      var prompt = RG.el('div', { class: 'prompt', text: 'What sound does it start with?' });
      var choices = RG.el('div', { class: 'choices' });
      wrap.appendChild(pic);
      wrap.appendChild(prompt);
      wrap.appendChild(choices);
      container.appendChild(wrap);

      function letterPool() { return level === 1 ? EASY : ALL; }

      function pickTarget() {
        var pl = letterPool();
        var cands = entries.filter(function (e) { return pl.indexOf(e.letter) >= 0 && e.letter !== lastLetter && usedLetters.indexOf(e.letter) < 0; });
        if (!cands.length) cands = entries.filter(function (e) { return e.letter !== lastLetter; });
        if (!cands.length) cands = entries;
        var e = RG.sample(cands);
        usedLetters.push(e.letter);
        lastLetter = e.letter;
        return e;
      }

      function pickDistractors(letter, n) {
        var pl = letterPool();
        var ok = function (l) {
          if (l === letter) return false;
          if (sounds[l] && sounds[l] === sounds[letter]) return false; // c/k
          return true;
        };
        var chosen = [];
        if (level === 3) {
          var g = GROUPS.filter(function (x) { return x.indexOf(letter) >= 0; });
          var sim = [];
          g.forEach(function (x) { x.split('').forEach(function (l) { if (ok(l) && sim.indexOf(l) < 0) sim.push(l); }); });
          chosen = RG.pick(sim, Math.min(n, sim.length));
        }
        var rest = pl.filter(function (l) { return ok(l) && chosen.indexOf(l) < 0; });
        if (rest.length < n - chosen.length) rest = ALL.filter(function (l) { return ok(l) && chosen.indexOf(l) < 0; });
        return chosen.concat(RG.pick(rest, n - chosen.length));
      }

      function speakPrompt() {
        return seq(say(target.word), say('What sound does ' + target.word + ' start with?'));
      }

      function startRound() {
        misses = 0;
        target = pickTarget();
        var n = level === 1 ? 2 : level === 2 ? 3 : 4;
        var letters = RG.shuffle([target.letter].concat(pickDistractors(target.letter, n - 1)));
        pic.innerHTML = '';
        pic.appendChild(RG.el('div', { class: 'big-emoji', text: target.emoji, 'aria-label': target.word }));
        pic.style.animation = 'none';
        void pic.offsetWidth;
        pic.style.animation = '';
        choices.innerHTML = '';
        letters.forEach(function (l) {
          var b = RG.el('button', { class: 'choice sh-card', type: 'button', 'data-letter': l, 'aria-label': 'letter ' + l });
          b.appendChild(document.createTextNode(l.toUpperCase() + l));
          b.addEventListener('pointerdown', function (e) {
            if (e.pointerType === 'mouse' && e.button !== 0) return;
            e.preventDefault();
            onTap(b, l);
          });
          b.addEventListener('click', function (e) { if (e.detail === 0) onTap(b, l); });
          choices.appendChild(b);
        });
        container.dataset.target = target.letter;
        ctx.onReplay = function () { speakPrompt(); };
        locked = false;
        speakPrompt();
      }

      function onTap(btn, l) {
        if (!alive || locked) return;
        if (l === target.letter) correct(btn, l);
        else wrong(btn, l);
      }

      function wrong(btn, l) {
        misses++;
        ctx.answer(false);
        RG.wobble(btn);
        seq(say(sounds[l] || l), say('Try again!'));
        if (misses >= 2) {
          var bs = choices.querySelectorAll('.sh-card');
          for (var i = 0; i < bs.length; i++) if (bs[i].getAttribute('data-letter') === target.letter) bs[i].classList.add('hint');
        }
      }

      function correct(btn, l) {
        locked = true;
        ctx.answer(true);
        btn.classList.remove('hint');
        btn.classList.add('correct');
        RG.celebrate(btn);
        var s = seq(say(sounds[l] || l), say(target.word + ' starts with ' + (sounds[l] || l) + '!'), function () { return RG.speak(RG.praise()); });
        Promise.all([wait(1500), Promise.race([s, wait(4500)])]).then(function () {
          if (!alive) return;
          round++;
          ctx.roundDone();
          if (round >= rounds) ctx.finish();
          else startRound();
        });
      }

      startRound();

      return function cleanup() {
        alive = false;
        locked = true;
        sp++;
        timers.forEach(clearTimeout);
        timers = [];
        if (ctx.onReplay) ctx.onReplay = null;
        try { RG.stopSpeaking(); } catch (e) {}
        if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
      };
    }
  });
})();
