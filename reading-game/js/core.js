/* Treasure Island Readers - core API (window.RG). Loaded after content.js, before games. */
(function () {
  'use strict';
  var RG = window.RG = window.RG || {};
  RG.games = [];
  RG.registerGame = function (def) {
    if (!def || !def.id) return;
    for (var i = 0; i < RG.games.length; i++) if (RG.games[i].id === def.id) { RG.games[i] = def; return; }
    RG.games.push(def);
  };

  /* ---------------- helpers ---------------- */
  RG.el = function (tag, attrs) {
    var e = document.createElement(tag), from = 1;
    if (attrs && typeof attrs === 'object' && !(attrs instanceof Node) && !Array.isArray(attrs)) {
      from = 2;
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v === false || v == null) return;
        if (k === 'class') e.className = v;
        else if (k === 'text') e.textContent = v;
        else if (k === 'html') e.innerHTML = v;
        else if (k === 'style') { if (typeof v === 'string') e.style.cssText = v; else Object.keys(v).forEach(function (s) { e.style[s] = v[s]; }); }
        else if (k === 'on') Object.keys(v).forEach(function (ev) { e.addEventListener(ev, v[ev]); });
        else if (k === 'dataset') Object.keys(v).forEach(function (d) { e.dataset[d] = v[d]; });
        else if (k.slice(0, 2) === 'on' && typeof v === 'function') e.addEventListener(k.slice(2), v);
        else e.setAttribute(k, v === true ? '' : v);
      });
    }
    (function add(list) {
      for (var i = 0; i < list.length; i++) {
        var c = list[i];
        if (c == null || c === false) continue;
        if (Array.isArray(c)) add(c);
        else if (c instanceof Node) e.appendChild(c);
        else e.appendChild(document.createTextNode(String(c)));
      }
    })(Array.prototype.slice.call(arguments, from));
    return e;
  };
  RG.shuffle = function (arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  };
  RG.pick = function (arr, n) { return RG.shuffle(arr).slice(0, n); };
  RG.sample = function (arr) { return arr[Math.floor(Math.random() * arr.length)]; };
  RG.wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  RG.emojiFor = function (word) {
    if (!word || !RG.content || !RG.content.emoji) return '';
    var w = String(word).toLowerCase().trim().replace(/[.,!?"]/g, '');
    return RG.content.emoji[w] || '';
  };

  /* ---------------- storage ---------------- */
  var KEY = 'rg_v2';
  var mem = null;
  function defaultState() {
    return {
      activeId: null,
      profiles: [
        { id: 'little', name: 'Little Captain', track: 'little', avatar: '🐣' },
        { id: 'big', name: 'Big Captain', track: 'big', avatar: '🦊' }
      ],
      data: {},
      settings: { speechRate: 1, voiceURI: '', autoFullscreen: true, expressive: true }
    };
  }
  function load() {
    var s = null;
    try { var raw = localStorage.getItem(KEY); if (raw) s = JSON.parse(raw); } catch (e) { s = null; }
    if (!s || typeof s !== 'object' || !Array.isArray(s.profiles)) s = defaultState();
    s.data = s.data || {}; s.settings = s.settings || { speechRate: 1, voiceURI: '' };
    if (typeof s.settings.autoFullscreen !== 'boolean') s.settings.autoFullscreen = true;
    if (typeof s.settings.expressive !== 'boolean') s.settings.expressive = true;
    return s;
  }
  var state = load();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ } }
  RG._save = save;
  RG.settings = state.settings;
  if (typeof RG.settings.speechRate !== 'number') RG.settings.speechRate = 1;
  RG.saveSettings = save;

  function pdata(id) {
    var d = state.data[id];
    if (!d) d = state.data[id] = {};
    d.skills = d.skills || {}; d.stars = d.stars || 0; d.stickers = d.stickers || [];
    d.coins = d.coins || 0; d.lifetime = d.lifetime || 0; d.owned = d.owned || []; d.equipped = d.equipped || {};
    d.quiz = d.quiz || []; d.powers = d.powers || [];
    // v3 fields (older saves lack them)
    if (!d.completed || typeof d.completed !== 'object' || Array.isArray(d.completed)) d.completed = {};
    if (!Array.isArray(d.recommended)) d.recommended = [];
    d.unlocked = !!d.unlocked; d.unlockOverride = !!d.unlockOverride;
    return d;
  }
  function cur() { return pdata(RG.profile().id); }

  RG.profiles = function () { return state.profiles.slice(); };
  RG.profile = function () {
    for (var i = 0; i < state.profiles.length; i++) if (state.profiles[i].id === state.activeId) return state.profiles[i];
    return state.profiles[0];
  };
  RG.setActiveProfile = function (id) { state.activeId = id; save(); };
  RG.updateProfile = function (id, patch) {
    state.profiles.forEach(function (p) { if (p.id === id) Object.keys(patch).forEach(function (k) { p[k] = patch[k]; }); });
    save();
  };
  RG.profileData = pdata;
  RG.CHALLENGE_ID = 'captains-quiz';

  /* ---------------- progress ---------------- */
  RG.progress = {
    record: function (skillId, correct) {
      var d = cur(), s = d.skills[skillId] || (d.skills[skillId] = { hist: [], level: 1, total: 0, right: 0 });
      s.hist.push(correct ? 1 : 0); if (s.hist.length > 10) s.hist.shift();
      s.total++; if (correct) s.right++;
      var h = s.hist;
      if (h.length >= 8) {
        var last8 = h.slice(-8), r8 = last8.reduce(function (a, b) { return a + b; }, 0) / 8;
        if (r8 >= 0.85 && s.level < 3) { s.level++; s.hist = []; }
      }
      if (s.hist.length >= 6) {
        var acc = s.hist.reduce(function (a, b) { return a + b; }, 0) / s.hist.length;
        if (acc < 0.5 && s.level > 1) { s.level--; s.hist = []; }
      }
      save();
    },
    level: function (skillId) { var s = cur().skills[skillId]; return s ? s.level : 1; },
    accuracy: function (skillId) {
      var s = cur().skills[skillId]; if (!s || !s.hist.length) return null;
      return Math.round(100 * s.hist.reduce(function (a, b) { return a + b; }, 0) / s.hist.length);
    },
    skills: function (profileId) { return pdata(profileId || RG.profile().id).skills; },
    stars: function () { return cur().stars; },
    addStars: function (n) { cur().stars += n; save(); },
    stickers: function () { return cur().stickers.slice(); },
    addSticker: function (s) { cur().stickers.push(s); save(); },
    /* finished voyages per island; completing an island clears its "Practice me!" flag */
    markComplete: function (gameId) {
      var d = cur(); if (!gameId) return;
      d.completed[gameId] = (d.completed[gameId] || 0) + 1;
      var i = d.recommended.indexOf(gameId); if (i >= 0) d.recommended.splice(i, 1);
      save();
    },
    completed: function (gameId, profileId) { return pdata(profileId || RG.profile().id).completed[gameId] || 0; },
    setRecommended: function (ids) {
      var out = [];
      (ids || []).forEach(function (id) { if (typeof id === 'string' && out.indexOf(id) < 0) out.push(id); });
      cur().recommended = out; save();
    },
    recommended: function () { return cur().recommended.slice(); },
    /* Challenge Island gate: locked until every other island on the track has one finished voyage */
    challenge: function (profileId) {
      var p = RG.profile(), d = cur(), missing = [], total = 0;
      if (profileId) state.profiles.forEach(function (x) { if (x.id === profileId) p = x; });
      d = pdata(p.id);
      RG.games.forEach(function (g) {
        if (g.id === RG.CHALLENGE_ID || (g.tracks && g.tracks.indexOf(p.track) < 0)) return;
        total++; if (!(d.completed[g.id] > 0)) missing.push(g.id);
      });
      var allDone = missing.length === 0;
      return { locked: !(allDone || d.unlocked || d.unlockOverride), allDone: allDone, unlocked: d.unlocked, override: d.unlockOverride,
        total: total, done: total - missing.length, missing: missing };
    },
    setUnlocked: function (v) { cur().unlocked = !!v; save(); },
    setUnlockOverride: function (v, profileId) { pdata(profileId || RG.profile().id).unlockOverride = !!v; save(); },
    resetAll: function (profileId) {
      var keep = pdata(profileId); void keep;
      state.data[profileId] = {}; pdata(profileId); save();
    }
  };

  /* ---------------- coins & rank ---------------- */
  var RANKS = [
    { min: 0, name: 'Deckhand', emoji: '🧽' }, { min: 50, name: 'Sailor', emoji: '⚓' },
    { min: 150, name: 'First Mate', emoji: '🧭' }, { min: 350, name: 'Captain', emoji: '🏴‍☠️' },
    { min: 700, name: 'Admiral', emoji: '👑' }
  ];
  function rankIndex(life) { var r = 0; for (var i = 0; i < RANKS.length; i++) if (life >= RANKS[i].min) r = i; return r; }
  RG.rank = function (profileId) {
    var d = pdata(profileId || RG.profile().id), i = rankIndex(d.lifetime), r = RANKS[i], n = RANKS[i + 1];
    return { name: r.name, emoji: r.emoji, next: n ? n.name : null, coinsToNext: n ? n.min - d.lifetime : 0 };
  };
  function updateCounters() {
    var b = RG.coins.balance();
    Array.prototype.forEach.call(document.querySelectorAll('.coin-count'), function (e) {
      e.textContent = b; e.classList.remove('tick'); void e.offsetWidth; e.classList.add('tick');
    });
  }
  function coinBurst(n) {
    var target = document.querySelector('.coin-pill');
    var layer = RG.el('div', { class: 'fx-layer' });
    document.body.appendChild(layer);
    var tr = target ? target.getBoundingClientRect() : { left: window.innerWidth - 80, top: 20, width: 40, height: 40 };
    var ex = tr.left + tr.width / 2, ey = tr.top + tr.height / 2;
    var sx = window.innerWidth / 2, sy = window.innerHeight * 0.55;
    var count = Math.max(3, Math.min(n * 2, 10));
    for (var i = 0; i < count; i++) {
      var c = RG.el('div', { class: 'fx-piece', text: '🪙', style: 'left:' + sx + 'px;top:' + sy + 'px;font-size:2rem' });
      layer.appendChild(c);
      var ox = (Math.random() - 0.5) * 160, oy = (Math.random() - 0.5) * 100;
      if (c.animate) {
        c.animate([
          { transform: 'translate(-50%,-50%) scale(.3)', opacity: 0 },
          { transform: 'translate(calc(-50% + ' + ox + 'px),calc(-50% + ' + oy + 'px)) scale(1.2)', opacity: 1, offset: 0.3 },
          { transform: 'translate(' + (ex - sx) + 'px,' + (ey - sy) + 'px) scale(.5)', opacity: 0.9 }
        ], { duration: 900 + i * 40, delay: i * 40, easing: 'ease-in', fill: 'both' });
      }
    }
    setTimeout(function () { if (layer.parentNode) layer.parentNode.removeChild(layer); updateCounters(); }, 1300 + count * 40);
  }
  RG.coins = {
    balance: function () { return cur().coins; },
    lifetime: function () { return cur().lifetime; },
    add: function (n, reason) {
      n = Math.round(n); if (!(n > 0)) return;
      var d = cur(), before = rankIndex(d.lifetime);
      d.coins += n; d.lifetime += n; save();
      try { RG.sfx.coin(); } catch (e) { /* ignore */ }
      coinBurst(n);
      // tick counter after fly-in
      setTimeout(updateCounters, 700);
      var after = rankIndex(d.lifetime);
      // never interrupt a game in progress: hold the celebration until the stage is gone
      if (after > before) {
        if (document.querySelector('.game-stage')) RG._pendingRank = after;
        else setTimeout(function () { RG.rankUp(after); }, 1400);
      }
      void reason;
    },
    spend: function (n) {
      var d = cur(); if (n > d.coins) return false;
      d.coins -= n; save(); updateCounters(); return true;
    },
    refresh: updateCounters
  };
  RG.flushRankUp = function (delay) {
    var idx = RG._pendingRank; if (idx == null) return;
    RG._pendingRank = null;
    setTimeout(function () { RG.rankUp(idx); }, delay || 1400);
  };
  RG.rankUp = function (idx) {
    var r = RANKS[idx];
    var overlay = RG.el('div', { class: 'rankup', role: 'dialog' },
      RG.el('div', { class: 'rankup-card' },
        RG.el('div', { class: 'rankup-emoji', text: r.emoji }),
        RG.el('div', { class: 'rankup-title', text: 'Rank up!' }),
        RG.el('div', { class: 'rankup-text', text: "You're now a " + r.name + '!' }),
        RG.el('button', { class: 'btn primary', text: 'Hooray!', on: { click: function () { overlay.remove(); } } })));
    document.body.appendChild(overlay);
    RG.sfx.win(); RG.celebrate(overlay.querySelector('.rankup-emoji'));
    RG.speak("Hooray! You're now a " + r.name + '!');
    setTimeout(function () { if (overlay.parentNode) overlay.remove(); }, 6000);
  };

  /* ---------------- quiz log & superpowers ---------------- */
  RG.quizLog = {
    add: function (entry) {
      var d = cur(); entry = entry || {};
      if (!entry.date) entry.date = new Date().toISOString();
      d.quiz.unshift(entry); if (d.quiz.length > 50) d.quiz.length = 50; save();
    },
    list: function (profileId) { return pdata(profileId || RG.profile().id).quiz.slice(); }
  };
  RG.superpowers = {
    add: function (id, label, emoji) {
      var d = cur();
      for (var i = 0; i < d.powers.length; i++) if (d.powers[i].id === id) return false;
      d.powers.push({ id: id, label: label, emoji: emoji }); save(); return true;
    },
    list: function (profileId) { return pdata(profileId || RG.profile().id).powers.slice(); }
  };

  /* ---------------- stickers ---------------- */
  RG.stickerPool = [
    { e: '🐠', n: 'Clownfish' }, { e: '🐡', n: 'Pufferfish' }, { e: '🐙', n: 'Octopus' }, { e: '🦀', n: 'Crab' },
    { e: '🐢', n: 'Turtle' }, { e: '🐬', n: 'Dolphin' }, { e: '🐳', n: 'Whale' }, { e: '🦈', n: 'Shark' },
    { e: '🦭', n: 'Seal' }, { e: '🐚', n: 'Seashell' }, { e: '🦞', n: 'Lobster' }, { e: '🦑', n: 'Squid' },
    { e: '🐟', n: 'Fish' }, { e: '🦐', n: 'Shrimp' }, { e: '⭐', n: 'Starfish' }, { e: '⚓', n: 'Anchor' },
    { e: '🦜', n: 'Parrot' }, { e: '🐧', n: 'Penguin' }, { e: '🦆', n: 'Duck' }, { e: '🐸', n: 'Frog' },
    { e: '🐌', n: 'Snail' }, { e: '🦋', n: 'Butterfly' }, { e: '🌴', n: 'Palm tree' }, { e: '💎', n: 'Gem' }
  ];

  /* ---------------- shop ---------------- */
  RG.shop = {
    items: [
      { id: 'hull-red',    cat: 'hull', name: 'Red Hull',      price: 20,  color: '#e5484d' },
      { id: 'hull-green',  cat: 'hull', name: 'Green Hull',    price: 20,  color: '#2fb457' },
      { id: 'hull-purple', cat: 'hull', name: 'Purple Hull',   price: 30,  color: '#8a5cf5' },
      { id: 'sail-rainbow', cat: 'sail', name: 'Rainbow Sail', price: 60,  color: 'rainbow' },
      { id: 'sail-pirate', cat: 'sail', name: 'Pirate Sail',   price: 80,  color: '#2a2a35', mark: '💀' },
      { id: 'sail-star',   cat: 'sail', name: 'Starry Sail',   price: 100, color: '#2b3a8f', mark: '⭐' },
      { id: 'flag-heart',  cat: 'flag', name: 'Heart Flag',    price: 25,  emoji: '❤️' },
      { id: 'flag-pirate', cat: 'flag', name: 'Pirate Flag',   price: 40,  emoji: '🏴‍☠️' },
      { id: 'pet-parrot',  cat: 'pet',  name: 'Parrot',        price: 120, emoji: '🦜' },
      { id: 'pet-cat',     cat: 'pet',  name: 'Ship Cat',      price: 100, emoji: '🐱' },
      { id: 'pet-dolphin', cat: 'pet',  name: 'Dolphin Friend', price: 200, emoji: '🐬' },
      { id: 'hat-cap',     cat: 'hat',  name: 'Sailor Cap',    price: 30,  emoji: '🧢' },
      { id: 'hat-top',     cat: 'hat',  name: 'Top Hat',       price: 60,  emoji: '🎩' },
      { id: 'hat-crown',   cat: 'hat',  name: 'Golden Crown',  price: 200, emoji: '👑' }
    ],
    get: function (id) { for (var i = 0; i < this.items.length; i++) if (this.items[i].id === id) return this.items[i]; return null; },
    owned: function (id) { return cur().owned.indexOf(id) >= 0; },
    equipped: function (profileId) { return pdata(profileId || RG.profile().id).equipped; },
    buy: function (id) {
      var it = this.get(id), d = cur(); if (!it) return false;
      if (d.owned.indexOf(id) >= 0) return true;
      if (!RG.coins.spend(it.price)) return false;
      d.owned.push(id); d.equipped[it.cat] = id; save(); return true;
    },
    toggle: function (id) {
      var it = this.get(id), d = cur(); if (!it || d.owned.indexOf(id) < 0) return;
      if (d.equipped[it.cat] === id) delete d.equipped[it.cat]; else d.equipped[it.cat] = id;
      save();
    }
  };

  /* ---------------- speech ---------------- */
  var synth = null;
  try { synth = window.speechSynthesis || null; } catch (e) { synth = null; }
  var voices = [];
  function refreshVoices() { try { voices = synth ? synth.getVoices() || [] : []; } catch (e) { voices = []; } }
  refreshVoices();
  if (synth) {
    try { synth.addEventListener('voiceschanged', refreshVoices); } catch (e) { synth.onvoiceschanged = refreshVoices; }
  }
  var BAD = /fred|albert|bad news|bahh|bells|boing|bubbles|cellos|deranged|good news|hysterical|junior|kathy|pipe organ|princess|ralph|trinoids|whisper|zarvox|wobble|organ|superstar|jester/i;
  var GOOD_NAMES = ['samantha', 'ava', 'zoe', 'evan', 'aria', 'jenny', 'guy', 'google us english', 'allison', 'susan', 'karen', 'zira', 'moira', 'tessa'];
  function voiceScore(v) {
    var n = String(v.name || '').toLowerCase(), sc = 0, i;
    if (/natural|neural|premium|enhanced|online/.test(n)) sc += 60;
    if (/google/.test(n)) sc += 35;
    for (i = 0; i < GOOD_NAMES.length; i++) if (n.indexOf(GOOD_NAMES[i]) >= 0) { sc += 30 - i; break; }
    if (/en[-_]US/i.test(v.lang)) sc += 12; else if (/^en/i.test(v.lang)) sc += 4;
    return sc;
  }
  /* English voices only, best first */
  RG.voices = function () {
    refreshVoices();
    var list = voices.filter(function (v) { return /^en/i.test(v.lang) && !BAD.test(v.name); })
      .map(function (v, i) { return { v: v, s: voiceScore(v), i: i }; });
    list.sort(function (a, b) { return b.s - a.s || a.i - b.i; });
    return list.map(function (x) { return x.v; });
  };
  function chooseVoice(uri) {
    refreshVoices();
    uri = uri || RG.settings.voiceURI;
    var i;
    if (uri) for (i = 0; i < voices.length; i++) if (voices[i].voiceURI === uri) return voices[i];
    return RG.voices()[0] || null;
  }

  RG.bestVoice = function () { return chooseVoice(); };

  /* Moods: the Web Speech API has no emotion control, so we vary pitch, rate, volume and phrasing. */
  var MOODS = {
    excited:  { pitch: 1.32, rate: 1.10, vol: 1 },
    happy:    { pitch: 1.18, rate: 1.02, vol: 1 },
    gentle:   { pitch: 1.00, rate: 0.88, vol: 0.85 },
    question: { pitch: 1.14, rate: 0.98, vol: 1 },
    story:    { pitch: 1.10, rate: 0.94, vol: 1 },
    calm:     { pitch: 1.05, rate: 0.95, vol: 0.95 }
  };
  RG.moods = Object.keys(MOODS);
  function autoMood(text) {
    if (/^\s*(try again|oops|good try|not quite|almost)/i.test(text)) return 'gentle';
    if (/!/.test(text)) return 'excited';
    if (/\?\s*$/.test(text)) return 'question';
    return 'happy';
  }
  function jitter(n) { return (Math.random() * 2 - 1) * n; }
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  /* Split into short chunks (sentences / clauses) - short chunks also dodge Chrome's ~15 s cut-off bug. */
  var MAXCHUNK = 90;
  function splitChunks(text) {
    var out = [], parts = text.match(/[^.!?,;:]+[.!?,;:]*/g) || [text], i;
    for (i = 0; i < parts.length; i++) {
      var t = parts[i].trim();
      if (!/[A-Za-z0-9]/.test(t)) { if (out.length && t) out[out.length - 1].t += t; continue; }
      var m = t.match(/[.!?,;:]+$/), end = m ? m[0] : '';
      while (t.length > MAXCHUNK) { // very long clause: break at a space
        var cut = t.lastIndexOf(' ', MAXCHUNK); if (cut < 20) cut = t.indexOf(' ', MAXCHUNK);
        if (cut < 0) break;
        out.push({ t: t.slice(0, cut), end: '' }); t = t.slice(cut + 1);
      }
      out.push({ t: t, end: end });
    }
    return out.length ? out : [{ t: text, end: '' }];
  }
  function gapAfter(end) { return /[.!?]/.test(end) ? 250 : (end ? 120 : 60); }

  var pending = [], token = 0;
  function flushPending() { var p = pending; pending = []; p.forEach(function (f) { f(); }); }
  RG.stopSpeaking = function () {
    token++; // any queued chunk of the old speech is now stale
    try { if (synth) synth.cancel(); } catch (e) { /* ignore */ }
    flushPending();
  };
  RG.speak = function (text, opts) {
    opts = opts || {};
    text = String(text == null ? '' : text).replace(/\s+/g, ' ').trim();
    return new Promise(function (resolve) {
      if (!text) { resolve(); return; }
      var my = ++token; // generation counter: cancel() can fire onend for old utterances
      try { if (synth) synth.cancel(); } catch (e) { /* ignore */ }
      flushPending();
      var expressive = RG.settings.expressive !== false;
      var single = !expressive || !!opts.onboundary; // karaoke needs one utterance so word offsets stay valid
      var mood = MOODS[opts.mood] ? opts.mood : autoMood(text), M = MOODS[mood];
      var userRate = RG.settings.speechRate || 1;
      var baseRate = (opts.rate || 0.85) * (expressive ? M.rate : 1) * userRate;
      var chunks = single ? [{ t: text, end: '' }] : splitChunks(text);
      var est = Math.max(700, text.length * 80 / Math.max(0.4, baseRate) + 400 + chunks.length * 260);
      var done = false, timer = null, ct = null, pt = null, ci = 0, voice = null;
      function fin() {
        if (done) return; done = true; clearTimeout(timer); clearTimeout(ct); clearTimeout(pt);
        var ix = pending.indexOf(fin); if (ix >= 0) pending.splice(ix, 1);
        resolve();
      }
      pending.push(fin);
      function live() { return !done && my === token; }
      function playNext() {
        if (!live()) return;
        if (ci >= chunks.length) { fin(); return; }
        var idx = ci++, c = chunks[idx], last = ci >= chunks.length, adv = false;
        var u = new SpeechSynthesisUtterance(c.t);
        if (voice) { u.voice = voice; u.lang = voice.lang; } else u.lang = 'en-US';
        var pitch, rate;
        if (single) {
          pitch = opts.pitch || (expressive ? M.pitch : 1.1); rate = baseRate;
        } else {
          pitch = (opts.pitch || M.pitch) + jitter(0.05);
          rate = baseRate + jitter(0.04);
          if (/\?/.test(c.end)) pitch += 0.12;                                  // questions rise
          else if (/!/.test(c.end) && (mood === 'excited' || mood === 'happy' || mood === 'story')) pitch += 0.08;
          if (mood === 'story') rate *= 1 + 0.04 * Math.sin(idx * 1.7);        // varied cadence
        }
        u.rate = clamp(rate, 0.3, 1.6); u.pitch = clamp(pitch, 0.5, 2); u.volume = expressive ? M.vol : 1;
        function next() {
          if (adv) return; adv = true; clearTimeout(ct);
          if (!live()) return; // stale (cancelled or superseded): never continue the old queue
          if (last) { fin(); return; }
          pt = setTimeout(playNext, gapAfter(c.end));
        }
        u.onend = next; u.onerror = next;
        if (opts.onboundary) u.onboundary = opts.onboundary;
        ct = setTimeout(next, Math.max(1500, c.t.length * 90 / Math.max(0.4, u.rate) * 1.6 + 2000)); // onend never fired (Chrome bug)
        RG._utt = u;
        try { synth.speak(u); } catch (e) { clearTimeout(ct); if (idx === 0) throw e; fin(); }
      }
      var ok = false;
      if (synth && typeof SpeechSynthesisUtterance !== 'undefined') {
        try { voice = chooseVoice(opts.voiceURI); playNext(); ok = true; } catch (e) { ok = false; }
      }
      timer = setTimeout(fin, ok ? est * 1.6 + 3000 : est);
    });
  };
  var LETTER_NAMES = { a: 'ay', b: 'bee', c: 'see', d: 'dee', e: 'ee', f: 'eff', g: 'jee', h: 'aitch', i: 'eye', j: 'jay',
    k: 'kay', l: 'el', m: 'em', n: 'en', o: 'oh', p: 'pee', q: 'cue', r: 'ar', s: 'ess', t: 'tee', u: 'you', v: 'vee',
    w: 'double you', x: 'ex', y: 'why', z: 'zee' };
  function letterInfo(l) {
    l = String(l).toLowerCase();
    var L = RG.content.letters;
    for (var i = 0; i < L.length; i++) if (L[i].letter === l) return L[i];
    return null;
  }
  RG.sayLetter = function (letter) { return RG.speak(LETTER_NAMES[String(letter).toLowerCase()] || String(letter), { rate: 0.8 }); };
  RG.sayLetterSound = function (letter) {
    var info = letterInfo(letter), l = String(letter).toLowerCase();
    if (!info) return RG.sayLetter(letter);
    return RG.speak((LETTER_NAMES[l] || l) + ' says ' + info.sound + ', like ' + info.word, { rate: 0.8 });
  };

  /* ---------------- sound effects ---------------- */
  var actx = null;
  function audio() {
    if (actx) return actx;
    try { var AC = window.AudioContext || window.webkitAudioContext; if (AC) actx = new AC(); } catch (e) { actx = null; }
    return actx;
  }
  RG.unlockAudio = function () {
    var c = audio(); if (!c) return;
    try {
      if (c.state === 'suspended') c.resume();
      var o = c.createOscillator(), g = c.createGain(); g.gain.value = 0.0001; o.connect(g); g.connect(c.destination);
      o.start(0); o.stop(c.currentTime + 0.02);
    } catch (e) { /* ignore */ }
  };
  function tone(freq, start, dur, type, vol) {
    var c = audio(); if (!c) return;
    try {
      var t0 = c.currentTime + start, o = c.createOscillator(), g = c.createGain();
      o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t0);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol || 0.18, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g); g.connect(c.destination); o.start(t0); o.stop(t0 + dur + 0.05);
    } catch (e) { /* ignore */ }
  }
  RG.sfx = {
    correct: function () { tone(660, 0, 0.14, 'triangle'); tone(880, 0.1, 0.2, 'triangle'); },
    wrong: function () { tone(300, 0, 0.18, 'sine', 0.12); tone(250, 0.12, 0.22, 'sine', 0.1); },
    pop: function () { tone(520, 0, 0.08, 'square', 0.08); tone(900, 0.04, 0.1, 'sine', 0.12); },
    coin: function () { tone(1180, 0, 0.09, 'square', 0.05); tone(1560, 0.07, 0.18, 'square', 0.05); },
    win: function () { [523, 659, 784, 1047].forEach(function (f, i) { tone(f, i * 0.12, 0.3, 'triangle', 0.18); }); }
  };

  /* ---------------- feedback ---------------- */
  RG.wobble = function (el) {
    if (!el) return;
    el.classList.remove('wobble'); void el.offsetWidth; el.classList.add('wobble');
    setTimeout(function () { el.classList.remove('wobble'); }, 600);
  };
  var PRAISE = ['Great job!', 'You did it!', 'Awesome reading!', 'Super!', 'Fantastic!', 'Wonderful!', 'Hooray!', 'Well done, captain!', 'Brilliant!',
    'Woohoo!', 'Yes! Nailed it!', "Shiver me timbers, that's right!", 'High five, Captain!', 'Ahoy, you got it!', 'Look at you go!',
    'Spot on, sailor!', 'Amazing! You are a reading star!', 'Yo ho ho, that is correct!', 'Super duper!', 'You make it look easy!',
    'Treasure-tastic!', 'That was perfect!', 'Wow, great thinking!', 'Hip hip hooray!', "You're a star, matey!"];
  RG.praise = function () { return RG.sample(PRAISE); };
  RG.praiseCount = PRAISE.length;
  RG.celebrate = function (targetEl) {
    var layer = RG.el('div', { class: 'fx-layer' });
    document.body.appendChild(layer);
    var ox = window.innerWidth / 2, oy = window.innerHeight * 0.4;
    if (targetEl && targetEl.getBoundingClientRect) {
      var r = targetEl.getBoundingClientRect(); ox = r.left + r.width / 2; oy = r.top + r.height / 2;
    }
    var bits = ['🎉', '⭐', '✨', '🎊', '💛', '🌟', '🪙'], colors = ['#ff5e7e', '#ffc93c', '#34c759', '#4cc3ff', '#a77bff', '#ff9a3c'];
    for (var i = 0; i < 34; i++) {
      var emo = i % 3 === 0;
      var p = RG.el('div', { class: 'fx-piece', style: 'left:' + ox + 'px;top:' + oy + 'px' });
      if (emo) { p.textContent = RG.sample(bits); p.style.fontSize = (1.2 + Math.random()) + 'rem'; }
      else { p.className += ' fx-conf'; p.style.background = RG.sample(colors); }
      layer.appendChild(p);
      var ang = Math.random() * Math.PI * 2, dist = 80 + Math.random() * 220;
      var dx = Math.cos(ang) * dist, dy = Math.sin(ang) * dist - 60, fall = dy + 160 + Math.random() * 160;
      if (p.animate) p.animate([
        { transform: 'translate(-50%,-50%) scale(.2) rotate(0deg)', opacity: 1 },
        { transform: 'translate(calc(-50% + ' + dx + 'px),calc(-50% + ' + dy + 'px)) scale(1) rotate(' + (Math.random() * 360) + 'deg)', opacity: 1, offset: 0.45 },
        { transform: 'translate(calc(-50% + ' + dx * 1.1 + 'px),calc(-50% + ' + fall + 'px)) scale(.9) rotate(' + (Math.random() * 720) + 'deg)', opacity: 0 }
      ], { duration: 1200 + Math.random() * 600, easing: 'cubic-bezier(.2,.7,.4,1)', fill: 'both' });
    }
    setTimeout(function () { if (layer.parentNode) layer.parentNode.removeChild(layer); }, 2000);
  };

  /* ---------------- drag ---------------- */
  RG.makeDraggable = function (el, opts) {
    opts = opts || {};
    var st = null, moved = false;
    el.style.touchAction = 'none';
    el.classList.add('draggable');
    function rectHit(r, x, y, pad) { return x >= r.left - pad && x <= r.right + pad && y >= r.top - pad && y <= r.bottom + pad; }
    function down(ev) {
      if (st || (ev.button != null && ev.button > 0)) return;
      st = { id: ev.pointerId, x: ev.clientX, y: ev.clientY, dx: 0, dy: 0 };
      moved = false;
      try { el.setPointerCapture(ev.pointerId); } catch (e) { /* ignore */ }
      el.style.transition = 'none';
    }
    function move(ev) {
      if (!st || ev.pointerId !== st.id) return;
      st.dx = ev.clientX - st.x; st.dy = ev.clientY - st.y;
      if (!moved && Math.abs(st.dx) + Math.abs(st.dy) > 8) {
        moved = true; el.classList.add('dragging'); el.style.zIndex = 1000; el.style.position = el.style.position || '';
        if (opts.onStart) try { opts.onStart(el); } catch (e) { /* ignore */ }
      }
      if (moved) { el.style.transform = 'translate(' + st.dx + 'px,' + st.dy + 'px) scale(1.1)'; ev.preventDefault(); }
    }
    function snapBack() {
      el.style.transition = 'transform .28s cubic-bezier(.3,1.4,.5,1)';
      el.style.transform = 'translate(0,0) scale(1)';
      setTimeout(function () { el.style.transition = ''; el.style.transform = ''; el.style.zIndex = ''; el.classList.remove('dragging'); }, 300);
    }
    function up(ev) {
      if (!st || ev.pointerId !== st.id) return;
      var wasMoved = moved, x = ev.clientX, y = ev.clientY;
      try { el.releasePointerCapture(ev.pointerId); } catch (e) { /* ignore */ }
      st = null;
      if (!wasMoved) { el.style.transition = ''; return; }
      var swallow = function (e) { e.stopPropagation(); e.preventDefault(); };
      el.addEventListener('click', swallow, { capture: true, once: true });
      setTimeout(function () { el.removeEventListener('click', swallow, true); }, 50);
      var er = el.getBoundingClientRect(), cx = er.left + er.width / 2, cy = er.top + er.height / 2;
      var targets = [];
      try { targets = (opts.dropTargets ? opts.dropTargets() : []) || []; } catch (e) { targets = []; }
      var hit = null, best = 1e9;
      targets.forEach(function (t) {
        var r = t.getBoundingClientRect();
        if (rectHit(r, x, y, 8) || rectHit(r, cx, cy, 0)) {
          var d = Math.hypot(cx - (r.left + r.width / 2), cy - (r.top + r.height / 2));
          if (d < best) { best = d; hit = t; }
        }
      });
      if (hit && opts.onDrop) {
        var res;
        try { res = opts.onDrop(el, hit); } catch (e) { res = false; }
        if (res === false) { snapBack(); return; }
        el.style.transition = ''; el.style.transform = ''; el.style.zIndex = ''; el.classList.remove('dragging');
      } else snapBack();
    }
    function cancel(ev) { if (!st || ev.pointerId !== st.id) return; st = null; snapBack(); }
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', cancel);
    return { destroy: function () {
      el.removeEventListener('pointerdown', down); el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', cancel);
    } };
  };


  /* ---------------- full screen ---------------- */
  /* Every call is wrapped: sandboxed iframes and iPhone Safari refuse or lack the API, and we degrade silently. */
  function fsEl() { var d = document; return d.fullscreenElement || d.webkitFullscreenElement || null; }
  RG.fullscreen = {
    supported: function () {
      try {
        var d = document, de = d.documentElement;
        var req = de && (de.requestFullscreen || de.webkitRequestFullscreen);
        var en = d.fullscreenEnabled !== undefined ? d.fullscreenEnabled : d.webkitFullscreenEnabled;
        return !!req && en !== false;
      } catch (e) { return false; }
    },
    active: function () { try { return !!fsEl(); } catch (e) { return false; } },
    isIOS: function () {
      try { return /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); } catch (e) { return false; }
    },
    /* resolves true if full screen is now on, false if unsupported or refused (never rejects) */
    enter: function () {
      return new Promise(function (resolve) {
        try {
          if (!RG.fullscreen.supported()) { resolve(false); return; }
          if (fsEl()) { resolve(true); return; }
          var de = document.documentElement, r = de.requestFullscreen ? de.requestFullscreen() : de.webkitRequestFullscreen();
          if (r && typeof r.then === 'function') r.then(function () { resolve(true); }, function () { resolve(false); });
          else resolve(true);
        } catch (e) { resolve(false); }
      });
    },
    exit: function () {
      return new Promise(function (resolve) {
        try {
          var d = document, r = d.exitFullscreen ? d.exitFullscreen() : (d.webkitExitFullscreen ? d.webkitExitFullscreen() : null);
          if (r && typeof r.then === 'function') r.then(function () { resolve(true); }, function () { resolve(false); });
          else resolve(true);
        } catch (e) { resolve(false); }
      });
    },
    toggle: function () { return RG.fullscreen.active() ? RG.fullscreen.exit().then(function () { return true; }) : RG.fullscreen.enter(); },
    onchange: function (fn) {
      ['fullscreenchange', 'webkitfullscreenchange'].forEach(function (ev) { try { document.addEventListener(ev, fn); } catch (e) { /* ignore */ } });
    }
  };

  document.addEventListener('visibilitychange', function () { if (document.hidden) RG.stopSpeaking(); });
})();
