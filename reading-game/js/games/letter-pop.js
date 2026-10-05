/* Letter Pop - little track. Pop the balloon with the letter you hear. */
(function () {
  'use strict';
  var RG = window.RG;
  if (!RG || !RG.registerGame) return;

  var STYLE_ID = 'lp-style';
  var CSS = [
    '.lp-wrap{width:100%;flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:12px;padding:8px 12px 16px;box-sizing:border-box;overflow:hidden;background:linear-gradient(#bfe9ff,#eaf8ff 70%);border-radius:24px}',
    '.lp-wrap .prompt{margin:8px 0 0;text-align:center}',
    '.lp-field{flex:1;width:100%;max-width:640px;display:flex;flex-wrap:wrap;align-items:center;justify-content:center;align-content:center;gap:10px 14px;padding-bottom:12px}',
    '.lp-float{animation:lp-rise .7s ease-out both,lp-bob 3s ease-in-out .7s infinite;display:flex;flex-direction:column;align-items:center}',
    '@keyframes lp-rise{from{transform:translateY(160px);opacity:0}to{transform:translateY(0);opacity:1}}',
    '@keyframes lp-bob{0%,100%{transform:translateY(0) rotate(-2deg)}50%{transform:translateY(-14px) rotate(2deg)}}',
    '.lp-wrap .choice.lp-balloon{position:relative;width:clamp(96px,26vw,128px);height:clamp(112px,30vw,150px);min-width:88px;min-height:88px;padding:0;border-radius:50% 50% 48% 48%/58% 58% 42% 42%;background:var(--lp-c,#ff6b6b);color:#fff;font-weight:800;font-size:clamp(2.4rem,9vw,3.4rem);line-height:1;border:4px solid rgba(255,255,255,.75);box-shadow:inset -10px -12px 0 rgba(0,0,0,.12),inset 10px 10px 0 rgba(255,255,255,.2);text-shadow:0 2px 0 rgba(0,0,0,.25);touch-action:manipulation;display:flex;align-items:center;justify-content:center;cursor:pointer;-webkit-tap-highlight-color:transparent}',
    '.lp-wrap .choice.lp-balloon::after{content:"";position:absolute;left:50%;bottom:-22px;width:2px;height:22px;background:#6b7a8f;transform:translateX(-50%)}',
    '.lp-wrap .choice.lp-balloon.lp-pop{animation:lp-pop .45s ease-out forwards;pointer-events:none}',
    '@keyframes lp-pop{0%{transform:scale(1)}40%{transform:scale(1.35)}100%{transform:scale(1.7);opacity:0}}',
    '.lp-wrap .choice.lp-balloon.lp-gone{visibility:hidden}'
  ].join('\n');
  var COLORS = ['#ff6b6b', '#4dabf7', '#51cf66', '#fcc419', '#cc5de8', '#ff922b', '#20c997'];
  var STARTER = 'satpinmd'.split('');
  var ALL = 'abcdefghijklmnopqrstuvwxyz'.split('');
  var FALLBACK_SOUND = { a: 'ah', b: 'buh', c: 'kuh', d: 'duh', e: 'eh', f: 'fff', g: 'guh', h: 'huh', i: 'ih', j: 'juh', k: 'kuh', l: 'lll', m: 'mmm', n: 'nnn', o: 'aw', p: 'puh', q: 'kwuh', r: 'rrr', s: 'sss', t: 'tuh', u: 'uh', v: 'vvv', w: 'wuh', x: 'ks', y: 'yuh', z: 'zzz' };

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

  RG.registerGame({
    id: 'letter-pop',
    title: 'Letter Pop',
    emoji: '🎈',
    tracks: ['little'],
    skill: 'letters',
    blurb: 'Pop the balloon with the letter you hear!',
    mount: function (container, ctx) {
      injectStyle();
      var sawPtr = false, alive = true, locked = true, misses = 0, round = 0, sp = 0;
      var last = null, used = [], target = null;
      var timers = [];
      var level = Math.max(1, Math.min(3, ctx.level || 1));
      var rounds = ctx.rounds || 5;
      var sounds = soundMap();

      function later(fn, ms) {
        var t = setTimeout(function () {
          timers = timers.filter(function (x) { return x !== t; });
          if (alive) fn();
        }, ms);
        timers.push(t);
        return t;
      }
      function wait(ms) { return new Promise(function (res) { later(res, ms); }); }
      // run speech steps in order; any newer sequence (or cleanup) cancels older ones
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
      function sayL(l) { return function () { return RG.sayLetter(l); }; }

      var wrap = RG.el('div', { class: 'lp-wrap' });
      var prompt = RG.el('div', { class: 'prompt' });
      var field = RG.el('div', { class: 'lp-field' });
      wrap.appendChild(prompt);
      wrap.appendChild(field);
      container.appendChild(wrap);

      function pool() { return level === 1 ? STARTER : ALL; }
      function soundMode() { return level === 3; }
      function display(l) { return level === 3 ? l.toLowerCase() : l.toUpperCase(); }

      function pickTarget() {
        var p = pool().filter(function (l) { return l !== last && used.indexOf(l) < 0; });
        if (!p.length) p = pool().filter(function (l) { return l !== last; });
        var t = RG.sample(p);
        used.push(t);
        last = t;
        return t;
      }

      function promptSteps() {
        if (soundMode() && sounds[target]) return [say('Find the letter that says ' + sounds[target])];
        return [say('Find the letter'), sayL(target)];
      }
      function speakPrompt() { return seq.apply(null, promptSteps()); }

      function startRound() {
        misses = 0;
        target = pickTarget();
        var n = level === 1 ? 3 : level === 2 ? 4 : 5;
        var others = pool().filter(function (l) {
          if (l === target) return false;
          if (soundMode() && sounds[l] && sounds[l] === sounds[target]) return false;
          return true;
        });
        var letters = RG.shuffle([target].concat(RG.pick(others, n - 1)));
        field.innerHTML = '';
        var colors = RG.shuffle(COLORS);
        letters.forEach(function (l, i) {
          var b = RG.el('button', { class: 'choice lp-balloon', type: 'button', 'aria-label': 'letter ' + l, 'data-letter': l, text: display(l) });
          b.style.setProperty('--lp-c', colors[i % colors.length]);
          var fl = RG.el('div', { class: 'lp-float' }, b);
          fl.style.animationDelay = (i * 0.1) + 's,' + (0.7 + i * 0.35) + 's';
          b.addEventListener('pointerdown', function (e) {
            sawPtr = true;
            if (e.pointerType === 'mouse' && e.button !== 0) return;
            e.preventDefault();
            onTap(b, l);
          });
          // keyboard / assistive click (pointerdown already handled for pointer users)
          b.addEventListener('click', function () { if (sawPtr) { sawPtr = false; return; } onTap(b, l); });
          field.appendChild(fl);
        });
        container.dataset.target = target;
        prompt.textContent = soundMode() && sounds[target] ? 'Find the letter that says ' + sounds[target] + '!' : 'Find the letter ' + target.toUpperCase() + '!';
        ctx.onReplay = function () { speakPrompt(); };
        locked = false;
        speakPrompt();
      }

      function onTap(btn, l) {
        if (!alive || locked) return;
        if (l === target) correct(btn);
        else wrong(btn, l);
      }

      function wrong(btn, l) {
        misses++;
        ctx.answer(false);
        RG.wobble(btn);
        seq(sayL(l), say('Try again!'));
        if (misses >= 2) {
          var btns = field.querySelectorAll('.lp-balloon');
          for (var i = 0; i < btns.length; i++) if (btns[i].getAttribute('data-letter') === target) btns[i].classList.add('hint');
        }
      }

      function correct(btn) {
        locked = true;
        ctx.answer(true);
        try { RG.sfx.pop(); } catch (e) {}
        btn.classList.remove('hint');
        btn.classList.add('correct', 'lp-pop');
        RG.celebrate(btn);
        var sp1 = seq(sayL(target), function () { return RG.speak(RG.praise()); });
        Promise.all([wait(1400), Promise.race([sp1, wait(3200)])]).then(function () {
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
