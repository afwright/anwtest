/* Sight Fishing - BIG track. Catch the fish carrying the sight word you hear. */
(function () {
  'use strict';
  var RG = window.RG;
  if (!RG || !RG.registerGame) { return; }

  var STYLE_ID = 'sf-styles';
  var FISH_W = 150, FISH_H = 66, LANE = 72;
  var CSS = [
    '.sf-stage{display:flex;flex-direction:column;align-items:center;gap:8px;justify-content:flex-start;padding:6px 8px 12px;width:100%;box-sizing:border-box;}',
    '.sf-bar{display:flex;align-items:center;justify-content:center;gap:14px;flex-wrap:wrap;}',
    '.sf-bucket{display:flex;align-items:center;gap:8px;font-size:2.2rem;background:#fff;border:4px solid #f4a62a;',
    ' border-radius:20px;padding:4px 16px;min-height:60px;box-sizing:border-box;}',
    '.sf-caught{font-size:1.8rem;font-weight:700;min-width:3.2ch;text-align:center;letter-spacing:.06em;}',
    '.sf-bucket.sf-pop{animation:sf-pop .5s ease;}',
    '@keyframes sf-pop{0%{transform:scale(1)}40%{transform:scale(1.25) rotate(-6deg)}100%{transform:scale(1)}}',
    '.sf-sea{position:relative;width:100%;max-width:760px;overflow:hidden;border-radius:24px;',
    ' background:linear-gradient(#7fd3ff 0%,#2f9be0 55%,#1b6fb8 100%);border:4px solid #1b6fb8;box-sizing:border-box;}',
    '.sf-sea::after{content:"";position:absolute;left:0;right:0;top:0;height:14px;',
    ' background:repeating-radial-gradient(circle at 12px 0,rgba(255,255,255,.55) 0 8px,transparent 9px 24px);pointer-events:none;}',
    '.sf-fish{position:absolute;left:-' + FISH_W + 'px;width:' + FISH_W + 'px;height:' + FISH_H + 'px;padding:0;margin:0;',
    ' border:0;background:transparent;cursor:pointer;touch-action manipulation;-webkit-tap-highlight-color:transparent;',
    ' animation-timing-function:linear;animation-iteration-count:infinite;will-change:left;}',
    '.sf-fish svg{position:absolute;left:0;top:0;width:100%;height:100%;overflow:visible;filter:drop-shadow(0 3px 2px rgba(0,0,0,.25));}',
    '.sf-fish.sf-right svg{transform:scaleX(-1);}',
    '.sf-word{position:absolute;top:0;height:100%;display:flex;align-items:center;justify-content:center;',
    ' font-family:inherit;font-size:1.55rem;font-weight:700;color:#12385c;letter-spacing:.04em;pointer-events:none;}',
    '.sf-fish.sf-left .sf-word{left:14%;width:56%;}',
    '.sf-fish.sf-right .sf-word{right:14%;width:56%;}',
    '.sf-fish.hint svg{animation:sf-glow 0.9s ease-in-out infinite;}',
    '@keyframes sf-glow{0%,100%{filter:drop-shadow(0 0 4px #fff3);}50%{filter:drop-shadow(0 0 14px #ffe14a) drop-shadow(0 0 22px #ffe14a);}}',
    '.sf-fish.sf-gone{animation:none !important;transition:left .9s ease-in,opacity .9s ease-in;opacity:.2;pointer-events:none;}',
    '.sf-fish.sf-nope svg{filter:grayscale(.4);}',
    '@keyframes sf-l{from{left:100%}to{left:-' + FISH_W + 'px}}',
    '@keyframes sf-r{from{left:-' + FISH_W + 'px}to{left:100%}}',
    '.sf-fly{position:fixed;z-index:999;margin:0;pointer-events:none;transition:transform .7s cubic-bezier(.3,-0.4,.6,1),opacity .7s;}',
    '.sf-hearbtn{font-size:1.4rem;}'
  ].join('\n').replace('touch-action manipulation', 'touch-action:manipulation');

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) { return; }
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  var LOCAL = {
    1: ['the', 'a', 'and', 'to', 'is', 'it', 'in', 'you', 'can', 'see', 'go', 'up', 'we', 'my', 'look', 'big', 'run', 'play'],
    2: ['was', 'that', 'said', 'with', 'she', 'he', 'they', 'have', 'good', 'but', 'what', 'all', 'are', 'came', 'into', 'now'],
    3: ['because', 'around', 'after', 'again', 'every', 'could', 'from', 'give', 'just', 'know', 'open', 'over', 'put', 'thank', 'were', 'when']
  };
  var FISH_COLORS = ['#ffd24a', '#ff9f68', '#ff8fb8', '#9be37a', '#c7a6ff', '#8ee8e0', '#ffc2d6'];

  function fishSvg(color) {
    return '<svg viewBox="0 0 150 66" aria-hidden="true">' +
      '<polygon points="112,33 148,6 148,60" fill="' + color + '" stroke="#12385c" stroke-width="3" stroke-linejoin="round"/>' +
      '<ellipse cx="64" cy="33" rx="62" ry="30" fill="' + color + '" stroke="#12385c" stroke-width="3"/>' +
      '<ellipse cx="64" cy="33" rx="52" ry="22" fill="#fff" opacity=".78"/>' +
      '<circle cx="18" cy="26" r="5" fill="#12385c"/><circle cx="16.5" cy="24.5" r="1.8" fill="#fff"/>' +
      '</svg>';
  }

  function clean(w) { return String(w).toLowerCase().replace(/[^a-z']/g, ''); }

  function levelList(level) {
    var c = RG.content && RG.content.sightWords;
    var l = c && c['level' + level];
    if (l && l.length >= 6) { return l.map(String).filter(function (w) { return w; }); }
    return LOCAL[level] || LOCAL[1];
  }

  RG.registerGame({
    id: 'sight-fishing',
    title: 'Sight Fishing',
    emoji: '🎣',
    tracks: ['big'],
    skill: 'sight-words',
    blurb: 'Catch the fish with the word you hear!',
    mount: function (container, ctx) {
      injectStyle();
      var dead = false;
      var timers = [];
      var level = ctx.level || 1;
      var rounds = ctx.rounds || 5;
      var nFish = level === 1 ? 4 : 5;
      var list = levelList(level);
      var allWords = list.slice();
      [1, 2, 3].forEach(function (l) { if (l !== level) { levelList(l).forEach(function (w) { if (allWords.indexOf(w) < 0) { allWords.push(w); } }); } });
      var targets = RG.shuffle(list).slice(0, rounds);
      while (targets.length < rounds) { targets.push(RG.sample(list)); }
      var roundNo = 0, locked = true, misses = 0, target = '', caught = [];
      var fishes = [];            // {el, lane, word, isTarget}
      var seaH = nFish * LANE + 16;
      var raf = null;

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
      var stage = RG.el('div', { class: 'sf-stage' });
      var prompt = RG.el('div', { class: 'prompt', text: 'Catch the word you hear!' });
      var caughtEl = RG.el('span', { class: 'sf-caught word', text: '' });
      var bucket = RG.el('div', { class: 'sf-bucket' }, RG.el('span', { text: '🪣' }), caughtEl);
      var hear = RG.el('button', { class: 'btn sf-hearbtn', type: 'button', text: '🔊 Hear it' });
      var bar = RG.el('div', { class: 'sf-bar' }, bucket, hear);
      var sea = RG.el('div', { class: 'sf-sea', style: 'height:' + seaH + 'px' });
      stage.appendChild(prompt);
      stage.appendChild(bar);
      stage.appendChild(sea);
      container.appendChild(stage);

      function promptText() { return 'Catch the word, ' + target + '!'; }
      hear.addEventListener('click', function () { if (!dead) { quick(promptText()); } });

      function pickDistractor() {
        var used = {};
        fishes.forEach(function (f) { used[f.word] = true; });
        var cands = list.filter(function (w) { return w !== target && !used[w]; });
        if (!cands.length) { cands = allWords.filter(function (w) { return w !== target && !used[w]; }); }
        if (!cands.length) { cands = allWords.filter(function (w) { return w !== target; }); }
        return RG.sample(cands);
      }

      function spawn(lane, word, isTarget, stagger) {
        var dir = Math.random() < 0.5 ? 'l' : 'r';
        var dur = 15 + Math.random() * 11;   // 15-26s to cross: slow
        var color = FISH_COLORS[Math.floor(Math.random() * FISH_COLORS.length)];
        var top = lane * LANE + 8 + Math.round(Math.random() * 6);
        var el = RG.el('button', { class: 'sf-fish ' + (dir === 'l' ? 'sf-left' : 'sf-right'), type: 'button', 'aria-label': 'fish', style: 'top:' + top + 'px' });
        el.innerHTML = fishSvg(color) + '<span class="sf-word"></span>';
        el.querySelector('.sf-word').textContent = word;
        el.style.animationName = dir === 'l' ? 'sf-l' : 'sf-r';
        el.style.animationDuration = dur.toFixed(1) + 's';
        el.style.animationDelay = stagger ? ('-' + (Math.random() * dur * 0.9).toFixed(1) + 's') : '0s';
        var f = { el: el, lane: lane, word: word, isTarget: isTarget, dir: dir, done: false };
        el.addEventListener('click', function () { onFish(f); });
        sea.appendChild(el);
        fishes.push(f);
        if (isTarget && misses >= 2) { el.classList.add('hint'); }
        return f;
      }

      function startRound() {
        if (dead) { return; }
        locked = true;
        misses = 0;
        target = targets[roundNo];
        container.dataset.target = target;
        sea.innerHTML = '';
        fishes = [];
        var nT = Math.random() < 0.4 ? 2 : 1;
        var lanes = RG.shuffle(Array.apply(null, { length: nFish }).map(function (_, i) { return i; }));
        for (var i = 0; i < nFish; i++) {
          if (i < nT) { spawn(lanes[i], target, true, true); }
          else { spawn(lanes[i], pickDistractor(), false, true); }
        }
        prompt.textContent = 'Catch the word you hear!';
        ctx.onReplay = function () { quick(promptText()); };
        quick(promptText());
        later(function () { locked = false; }, 400);
      }

      function frozenLeft(f) {
        var sr = sea.getBoundingClientRect();
        var fr = f.el.getBoundingClientRect();
        return fr.left - sr.left - 4; // minus sea border
      }

      function swimAway(f) {
        f.done = true;
        var left = frozenLeft(f);
        var el = f.el;
        el.style.animation = 'none';
        el.style.left = left + 'px';
        void el.offsetWidth;
        el.classList.add('sf-gone');
        var seaW = sea.clientWidth;
        el.style.left = (f.dir === 'l' ? -FISH_W - 20 : seaW + 20) + 'px';
        later(function () {
          if (el.parentNode) { el.parentNode.removeChild(el); }
          var k = fishes.indexOf(f);
          if (k >= 0) { fishes.splice(k, 1); }
          spawn(f.lane, pickDistractor(), false, false);
        }, 1000);
      }

      function onFish(f) {
        if (locked || dead || f.done) { return; }
        if (f.isTarget) { onCatch(f); } else { onWrong(f); }
      }

      function onWrong(f) {
        ctx.answer(false);
        misses++;
        RG.wobble(f.el);
        quick('That says ' + f.word + '. Try again! Find ' + target + '.');
        swimAway(f);
        if (misses >= 2) {
          fishes.forEach(function (x) { if (x.isTarget && !x.done) { x.el.classList.add('hint'); } });
        }
      }

      function onCatch(f) {
        locked = true;
        f.done = true;
        ctx.answer(true);
        fishes.forEach(function (x) { x.el.classList.remove('hint'); });
        // freeze and clone fish so it can leap into the bucket
        var rect = f.el.getBoundingClientRect();
        var clone = f.el.cloneNode(true);
        clone.classList.remove('hint');
        clone.className += ' sf-fly';
        clone.style.cssText = 'position:fixed;animation:none;left:' + rect.left + 'px;top:' + rect.top + 'px;width:' + rect.width + 'px;height:' + rect.height + 'px;';
        document.body.appendChild(clone);
        if (f.el.parentNode) { f.el.parentNode.removeChild(f.el); }
        var br = bucket.getBoundingClientRect();
        var dx = (br.left + br.width / 2) - (rect.left + rect.width / 2);
        var dy = (br.top + br.height / 2) - (rect.top + rect.height / 2);
        later(function () {
          clone.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(.3) rotate(-25deg)';
          clone.style.opacity = '.9';
        }, 30);
        later(function () {
          if (clone.parentNode) { clone.parentNode.removeChild(clone); }
          bucket.classList.add('sf-pop');
          caughtEl.textContent = target;
          caught.push(target);
          RG.sfx && RG.sfx.pop && RG.sfx.pop();
          RG.celebrate(bucket);
        }, 760);
        flyClones.push(clone);
        later(function () {
          say('You caught ' + target + '!')
            .then(function () { if (!dead) { return say(RG.praise()); } })
            .then(function () { return sleep(300); })
            .then(function () {
              if (dead) { return; }
              bucket.classList.remove('sf-pop');
              roundNo++;
              ctx.roundDone();
              if (roundNo >= rounds) { ctx.finish(); } else { startRound(); }
            });
        }, 800);
      }
      var flyClones = [];

      startRound();

      return function cleanup() {
        dead = true;
        timers.forEach(clearTimeout);
        timers = [];
        if (raf) { cancelAnimationFrame(raf); raf = null; }
        flyClones.forEach(function (c) { if (c.parentNode) { c.parentNode.removeChild(c); } });
        flyClones = [];
        try { RG.stopSpeaking(); } catch (e) { /* ignore */ }
        ctx.onReplay = null;
        try { container.innerHTML = ''; } catch (e2) { /* ignore */ }
      };
    }
  });
})();
