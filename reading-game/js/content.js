/* Treasure Island Readers - shared content. Loaded first; defines RG.content. */
(function () {
  'use strict';
  window.RG = window.RG || {};

  var letters = [
    { letter: 'a', sound: 'ah',  word: 'apple',    emoji: '🍎' },
    { letter: 'b', sound: 'buh', word: 'ball',     emoji: '⚽' },
    { letter: 'c', sound: 'kuh', word: 'cat',      emoji: '🐱' },
    { letter: 'd', sound: 'duh', word: 'dog',      emoji: '🐶' },
    { letter: 'e', sound: 'eh',  word: 'egg',      emoji: '🥚' },
    { letter: 'f', sound: 'fuh', word: 'fish',     emoji: '🐟' },
    { letter: 'g', sound: 'guh', word: 'goat',     emoji: '🐐' },
    { letter: 'h', sound: 'huh', word: 'horse',    emoji: '🐴' },
    { letter: 'i', sound: 'ih',  word: 'iguana',   emoji: '🦎' },
    { letter: 'j', sound: 'juh', word: 'juice',    emoji: '🧃' },
    { letter: 'k', sound: 'kuh', word: 'kite',     emoji: '🪁' },
    { letter: 'l', sound: 'luh', word: 'lion',     emoji: '🦁' },
    { letter: 'm', sound: 'muh', word: 'moon',     emoji: '🌙' },
    { letter: 'n', sound: 'nuh', word: 'nut',      emoji: '🥜' },
    { letter: 'o', sound: 'aw',  word: 'octopus',  emoji: '🐙' },
    { letter: 'p', sound: 'puh', word: 'pig',      emoji: '🐷' },
    { letter: 'q', sound: 'kwuh', word: 'queen',   emoji: '👑' },
    { letter: 'r', sound: 'ruh', word: 'rabbit',   emoji: '🐰' },
    { letter: 's', sound: 'sss', word: 'sun',      emoji: '☀️' },
    { letter: 't', sound: 'tuh', word: 'tiger',    emoji: '🐯' },
    { letter: 'u', sound: 'uh',  word: 'umbrella', emoji: '☂️' },
    { letter: 'v', sound: 'vuh', word: 'van',      emoji: '🚐' },
    { letter: 'w', sound: 'wuh', word: 'whale',    emoji: '🐳' },
    { letter: 'x', sound: 'ks',  word: 'fox',      emoji: '🦊' },
    { letter: 'y', sound: 'yuh', word: 'yo-yo',    emoji: '🪀' },
    { letter: 'z', sound: 'zuh', word: 'zebra',    emoji: '🦓' }
  ];

  var cvcWords = [
    // short a
    { word: 'cat', emoji: '🐱' }, { word: 'hat', emoji: '🎩' }, { word: 'bat', emoji: '🦇' },
    { word: 'rat', emoji: '🐀' }, { word: 'bag', emoji: '👜' }, { word: 'can', emoji: '🥫' },
    { word: 'cap', emoji: '🧢' }, { word: 'map', emoji: '🗺️' }, { word: 'van', emoji: '🚐' },
    { word: 'tap', emoji: '🚰' }, { word: 'yam', emoji: '🍠' }, { word: 'cab', emoji: '🚕' },
    { word: 'tag', emoji: '🏷️' }, { word: 'man', emoji: '👨' }, { word: 'gas', emoji: '⛽' },
    // short e
    { word: 'bed', emoji: '🛏️' }, { word: 'hen', emoji: '🐔' }, { word: 'jet', emoji: '✈️' },
    { word: 'pen', emoji: '🖊️' }, { word: 'web', emoji: '🕸️' }, { word: 'leg', emoji: '🦵' },
    { word: 'ten', emoji: '🔟' }, { word: 'gem', emoji: '💎' }, { word: 'vet', emoji: '🧑‍⚕️' },
    // short i
    { word: 'pig', emoji: '🐷' }, { word: 'pin', emoji: '📌' }, { word: 'kid', emoji: '🧒' },
    { word: 'six', emoji: '6️⃣' }, { word: 'bin', emoji: '🗑️' }, { word: 'lip', emoji: '👄' },
    // short o
    { word: 'dog', emoji: '🐶' }, { word: 'log', emoji: '🪵' }, { word: 'fox', emoji: '🦊' },
    { word: 'box', emoji: '📦' }, { word: 'pot', emoji: '🍲' }, { word: 'cop', emoji: '👮' },
    { word: 'mom', emoji: '👩' },
    // short u
    { word: 'bug', emoji: '🐛' }, { word: 'bus', emoji: '🚌' }, { word: 'cup', emoji: '🥤' },
    { word: 'sun', emoji: '☀️' }, { word: 'nut', emoji: '🥜' }, { word: 'tub', emoji: '🛁' },
    { word: 'hut', emoji: '🛖' }, { word: 'mug', emoji: '☕' }
  ];

  // Re-sorted for v4: each entry carries the level (1-5) at which its pattern is taught.
  // cheese, thumb, chair, blue and the "star"-type words moved out or to their proper level (see phonicsWords).
  var digraphWords = [
    { word: 'ship',   emoji: '🚢', pattern: 'sh', level: 1 }, { word: 'shell',  emoji: '🐚', pattern: 'sh', level: 1 },
    { word: 'fish',   emoji: '🐟', pattern: 'sh', level: 1 }, { word: 'chick',  emoji: '🐤', pattern: 'ch', level: 1 },
    { word: 'duck',   emoji: '🦆', pattern: 'ck', level: 1 }, { word: 'sock',   emoji: '🧦', pattern: 'ck', level: 1 },
    { word: 'rock',   emoji: '🪨', pattern: 'ck', level: 1 }, { word: 'lock',   emoji: '🔒', pattern: 'ck', level: 1 },
    { word: 'whale',  emoji: '🐳', pattern: 'wh', level: 2 }, { word: 'truck',  emoji: '🚚', pattern: 'ck', level: 2 },
    { word: 'brick',  emoji: '🧱', pattern: 'ck', level: 2 }, { word: 'frog',   emoji: '🐸', pattern: 'fr', level: 2 },
    { word: 'snake',  emoji: '🐍', pattern: 'sn', level: 2 }, { word: 'flag',   emoji: '🚩', pattern: 'fl', level: 2 },
    { word: 'clock',  emoji: '⏰', pattern: 'cl', level: 2 }, { word: 'crab',   emoji: '🦀', pattern: 'cr', level: 2 },
    { word: 'drum',   emoji: '🥁', pattern: 'dr', level: 2 }, { word: 'plant',  emoji: '🪴', pattern: 'pl', level: 2 },
    { word: 'grapes', emoji: '🍇', pattern: 'gr', level: 2 },
    { word: 'sheep',  emoji: '🐑', pattern: 'sh', level: 3 }, { word: 'tree',   emoji: '🌳', pattern: 'tr', level: 3 },
    { word: 'snail',  emoji: '🐌', pattern: 'sn', level: 3 }, { word: 'train',  emoji: '🚂', pattern: 'tr', level: 3 },
    { word: 'wheel',  emoji: '🛞', pattern: 'wh', level: 3 }, { word: 'tooth',  emoji: '🦷', pattern: 'th', level: 3 },
    { word: 'spoon',  emoji: '🥄', pattern: 'sp', level: 3 },
    { word: 'star',   emoji: '⭐', pattern: 'st', level: 4 }, { word: 'shark',  emoji: '🦈', pattern: 'sh', level: 4 },
    { word: 'cloud',  emoji: '☁️', pattern: 'cl', level: 4 }, { word: 'three',  emoji: '3️⃣', pattern: 'th', level: 4 }
  ];

  // Extra words for longer/CVCe words (optional extra field, used by word-builder if it wishes)
  var longWords = [
    { word: 'cake',  emoji: '🎂' }, { word: 'bike',  emoji: '🚲' }, { word: 'rope',  emoji: '🪢' },
    { word: 'kite',  emoji: '🪁' }, { word: 'home',  emoji: '🏠' }, { word: 'nose',  emoji: '👃' },
    { word: 'bone',  emoji: '🦴' }, { word: 'rose',  emoji: '🌹' }, { word: 'boat',  emoji: '⛵' },
    { word: 'moon',  emoji: '🌙' }, { word: 'bee',   emoji: '🐝' }, { word: 'coat',  emoji: '🧥' },
    { word: 'goat',  emoji: '🐐' }, { word: 'chest', emoji: '🧰' }, { word: 'crab',  emoji: '🦀' },
    { word: 'frog',  emoji: '🐸' }, { word: 'ship',  emoji: '🚢' }, { word: 'snail', emoji: '🐌' }
  ];

  var rhymeFamilies = {
    at:  ['cat', 'hat', 'bat', 'rat'],
    og:  ['dog', 'log', 'frog'],
    an:  ['can', 'van', 'man', 'pan'],
    en:  ['hen', 'pen', 'ten'],
    ox:  ['fox', 'box', 'ox'],
    ock: ['sock', 'clock', 'rock', 'lock'],
    oat: ['boat', 'coat', 'goat'],
    air: ['chair', 'bear', 'pear'],
    oon: ['moon', 'spoon', 'balloon'],
    ee:  ['bee', 'tree', 'three']
  };


  // ---- sight words: Dolch lists as compact strings, mapped to levels per the v4 table ----
  function words(str) { return str.split(' '); }
  var dolchPrePrimer = words('a and away big blue can come down find for funny go help here I in is it jump little look make me my not one play red run said see the three to two up we where yellow you');
  var dolchPrimer = words('all am are at ate be black brown but came did do eat four get good have he into like must new no now on our out please pretty ran ride saw say she so soon that there they this too under want was well went what white who will with yes');
  var dolchFirst = words('after again an any as ask by could every fly from give going had has her him his how just know let live may of old once open over put round some stop take thank them then think walk were when');
  var dolchSecond = words('always around because been before best both buy call cold does don\'t fast first five found gave goes green its made many off or pull read right sing sit sleep tell their these those upon us use very wash which why wish work would write your');
  var dolchThird = words('about better bring carry clean cut done draw drink eight fall far full got grow hold hot hurt if keep kind laugh light long much myself never only own pick seven shall show six small start ten today together try warm');
  // level 5: second/third-grade mix plus high-frequency words from the next band (Fry 101-200 style)
  var level5Mix = words('another between change different does even follow food form great kind large learn mean move need number place point small sound spell still such through turn water where world year air animal house letter mother picture study toward answer page');
  var sightWords = {
    level1: dolchPrePrimer.concat(dolchPrimer),   // pre-primer + primer (kept together so level 1 has enough to build real sentences)
    level2: dolchFirst,
    level3: dolchSecond,
    level4: dolchThird,
    level5: level5Mix
  };
  var sightByLevel = {};
  (function () {
    var acc = [];
    [1, 2, 3, 4, 5].forEach(function (n) {
      acc = acc.concat(sightWords['level' + n]);
      var seen = {}, out = [];
      acc.forEach(function (w) { var k = w.toLowerCase(); if (!seen[k]) { seen[k] = 1; out.push(k); } });
      sightByLevel[n] = out;
    });
  })();

  // ---- phonicsWords by level (tiles: one string per grapheme; digraphs, vowel teams, r-controlled and
  //      diphthongs are ONE tile; blends are separate letters; level 5 tiles are syllable / affix chunks) ----
  function pw(spec) {
    return spec.split(' ').map(function (item) {
      var p = item.split('|'); // word|emoji|tile.tile.tile
      return { word: p[0], emoji: p[1], tiles: p[2].split('.') };
    });
  }
  var phonicsWords = {
    1: pw('ship|🚢|sh.i.p shell|🐚|sh.e.ll fish|🐟|f.i.sh duck|🦆|d.u.ck sock|🧦|s.o.ck rock|🪨|r.o.ck lock|🔒|l.o.ck chick|🐤|ch.i.ck bell|🔔|b.e.ll bus|🚌|b.u.s bug|🐛|b.u.g fox|🦊|f.o.x bat|🦇|b.a.t web|🕸️|w.e.b jet|✈️|j.e.t dish|🍽️|d.i.sh pill|💊|p.i.ll log|🪵|l.o.g'),
    2: pw('frog|🐸|f.r.o.g crab|🦀|c.r.a.b drum|🥁|d.r.u.m flag|🚩|f.l.a.g clock|⏰|c.l.o.ck brick|🧱|b.r.i.ck truck|🚚|t.r.u.ck snake|🐍|s.n.a.k.e cake|🎂|c.a.k.e kite|🪁|k.i.t.e bike|🚲|b.i.k.e rope|🪢|r.o.p.e bone|🦴|b.o.n.e nose|👃|n.o.s.e tent|⛺|t.e.n.t nest|🪺|n.e.s.t ring|💍|r.i.ng sled|🛷|s.l.e.d hand|✋|h.a.n.d whale|🐳|wh.a.l.e grapes|🍇|g.r.a.p.e.s plant|🪴|p.l.a.n.t skunk|🦨|s.k.u.n.k ice|🧊|i.c.e'),
    3: pw('rain|🌧️|r.ai.n snail|🐌|s.n.ai.l train|🚂|t.r.ai.n tree|🌳|t.r.ee bee|🐝|b.ee leaf|🍃|l.ea.f boat|⛵|b.oa.t goat|🐐|g.oa.t coat|🧥|c.oa.t road|🛣️|r.oa.d snow|❄️|s.n.ow moon|🌙|m.oo.n spoon|🥄|s.p.oo.n tooth|🦷|t.oo.th sheep|🐑|sh.ee.p wheel|🛞|wh.ee.l bowl|🥣|b.ow.l gem|💎|g.e.m peach|🍑|p.ea.ch broom|🧹|b.r.oo.m seal|🦭|s.ea.l soap|🧼|s.oa.p'),
    4: pw('star|⭐|st.ar shark|🦈|sh.ar.k fork|🍴|f.or.k bird|🐦|b.ir.d corn|🌽|c.or.n horse|🐴|h.or.se coin|🪙|c.oi.n boy|👦|b.oy house|🏠|h.ou.se mouse|🐭|m.ou.se cow|🐮|c.ow cloud|☁️|c.l.ou.d owl|🦉|ow.l crown|👑|c.r.ow.n clown|🤡|c.l.ow.n storm|⛈️|st.or.m sword|🗡️|s.w.or.d shirt|👕|sh.ir.t bridge|🌉|b.r.i.dge fire|🔥|f.i.re night|🌃|n.igh.t'),
    5: pw('sunset|🌅|sun.set rainbow|🌈|rain.bow cupcake|🧁|cup.cake sailboat|⛵|sail.boat popcorn|🍿|pop.corn seashell|🐚|sea.shell pancake|🥞|pan.cake hotdog|🌭|hot.dog backpack|🎒|back.pack rabbit|🐰|rab.bit magnet|🧲|mag.net pumpkin|🎃|pump.kin basket|🧺|bas.ket robot|🤖|ro.bot tiger|🐯|ti.ger pirate|🏴‍☠️|pi.rate dragon|🐉|drag.on planet|🪐|plan.et octopus|🐙|oc.to.pus lobster|🦞|lob.ster rocket|🚀|rock.et goldfish|🐠|gold.fish sunflower|🌻|sun.flow.er bathtub|🛁|bath.tub snowman|⛄|snow.man raincoat|🧥|rain.coat')
  };
  // the grapheme / pattern inventory, for the checker and for games' own checks
  var patternsByLevel = {
    1: ['single consonants', 'short vowels a e i o u', 'digraphs sh ch th wh ck', 'doubles ll ss ff zz', 'ending -s'],
    2: ['initial blends bl cl fl gl pl sl br cr dr fr gr pr tr sc sk sm sn sp st sw tw', 'final blends nd nt mp st sk ft lk lt lp ng nk', 'silent e (a_e i_e o_e u_e)', 'soft c in -ce', 'endings -es'],
    3: ['vowel teams ai ay ee ea oa ow(snow) oo', 'long vowel before ld nd lt st (old, kind)', 'soft c and g before e i y (gem)', 'final nch nth', 'endings -ed -ing and contractions n\'t \'ll'],
    4: ['r-controlled ar or er ir ur (and are ore ire)', 'diphthongs oi oy ou ow(cow) aw au ew', 'igh', 'tch dge', '3-letter clusters str spl spr scr squ thr shr', 'prefixes un- re-', 'suffixes -ly -ful -er -est -ness'],
    5: ['two and three syllable words read as chunks: compounds, closed (rab|bit), open (ro|bot), consonant-le (tur|tle), final y', 'all patterns of levels 1-4']
  };

  // ---- emoji lookup: every picturable word used anywhere (each emoji must clearly show its word) ----
  var emoji = {
    // animals
    ox: '🐂', bear: '🐻', bee: '🐝', bird: '🐦', dolphin: '🐬', turtle: '🐢', octopus: '🐙', shark: '🦈',
    whale: '🐳', crab: '🦀', fish: '🐟', snail: '🐌', snake: '🐍', frog: '🐸', duck: '🦆', chick: '🐤',
    hen: '🐔', sheep: '🐑', pig: '🐷', dog: '🐶', cat: '🐱', rabbit: '🐰', bunny: '🐰', horse: '🐴', cow: '🐮',
    lion: '🦁', tiger: '🐯', zebra: '🦓', monkey: '🐵', elephant: '🐘', mouse: '🐭', fox: '🦊', goat: '🐐',
    iguana: '🦎', lizard: '🦎', seal: '🦭', penguin: '🐧', parrot: '🦜', owl: '🦉', ant: '🐜', bug: '🐛',
    butterfly: '🦋', ladybug: '🐞', shrimp: '🦐', squid: '🦑', lobster: '🦞', bat: '🦇', rat: '🐀', skunk: '🦨',
    dragon: '🐉', goldfish: '🐠', crocodile: '🐊', gorilla: '🦍', spider: '🕷️', camel: '🐫', giraffe: '🦒',
    // food
    apple: '🍎', banana: '🍌', pear: '🍐', grapes: '🍇', cheese: '🧀', cake: '🎂', egg: '🥚', nut: '🥜',
    juice: '🧃', spoon: '🥄', cup: '🥤', mug: '☕', pot: '🍲', can: '🥫', pan: '🍳', yam: '🍠', bread: '🍞',
    peach: '🍑', corn: '🌽', fork: '🍴', dish: '🍽️', bowl: '🥣', pancake: '🥞', pancakes: '🥞', hotdog: '🌭', popcorn: '🍿',
    cupcake: '🧁', pumpkin: '🎃', pizza: '🍕', stew: '🍲', burger: '🍔', fries: '🍟', lemon: '🍋', carrot: '🥕',
    // nature / sea
    sea: '🌊', wave: '🌊', waves: '🌊', water: '💧', island: '🏝️', beach: '🏖️', sand: '🏖️', sun: '☀️',
    moon: '🌙', star: '⭐', sky: '🌤️', cloud: '☁️', tree: '🌳', flower: '🌸', rose: '🌹', plant: '🪴',
    rock: '🪨', shell: '🐚', shells: '🐚', seashell: '🐚', log: '🪵', snow: '❄️', rain: '🌧️', fire: '🔥', gem: '💎', gems: '💎',
    leaf: '🍃', storm: '⛈️', rainbow: '🌈', sunset: '🌅', night: '🌃', ice: '🧊', volcano: '🌋', cactus: '🌵', sunflower: '🌻',
    // things
    boat: '⛵', sailboat: '⛵', ship: '🚢', anchor: '⚓', map: '🗺️', chest: '🧰', treasure: '💰', flag: '🚩', kite: '🪁',
    ball: '⚽', balloon: '🎈', drum: '🥁', horn: '📯', hat: '🎩', cap: '🧢', coat: '🧥', raincoat: '🧥', sock: '🧦', socks: '🧦',
    bag: '👜', box: '📦', bed: '🛏️', chair: '🪑', clock: '⏰', lock: '🔒', pen: '🖊️', pin: '📌', tag: '🏷️',
    web: '🕸️', bin: '🗑️', tub: '🛁', bath: '🛁', bathtub: '🛁', hut: '🛖', home: '🏠', house: '🏠', wheel: '🛞', brick: '🧱',
    rope: '🪢', bone: '🦴', umbrella: '☂️', 'yo-yo': '🪀', book: '📖', bell: '🔔', key: '🔑', crown: '👑',
    tent: '⛺', nest: '🪺', ring: '💍', sled: '🛷', pill: '💊', soap: '🧼', broom: '🧹', sword: '🗡️', shirt: '👕',
    coin: '🪙', coins: '🪙', backpack: '🎒', magnet: '🧲', basket: '🧺', robot: '🤖', pirate: '🏴‍☠️', planet: '🪐',
    rocket: '🚀', snowman: '⛄', clown: '🤡', road: '🛣️', lamp: '🪔', candle: '🕯️', telescope: '🔭', bomb: '💣',
    // vehicles
    bus: '🚌', van: '🚐', cab: '🚕', car: '🚗', truck: '🚚', train: '🚂', jet: '✈️', plane: '✈️', bike: '🚲',
    gas: '⛽', bridge: '🌉', ambulance: '🚑',
    // people & body
    man: '👨', mom: '👩', kid: '🧒', boy: '👦', girl: '👧', queen: '👑', cop: '👮', vet: '🧑‍⚕️',
    leg: '🦵', lip: '👄', nose: '👃', tooth: '🦷', thumb: '👍', hand: '✋', eye: '👁️',
    // numbers
    one: '1️⃣', two: '2️⃣', three: '3️⃣', four: '4️⃣', five: '5️⃣', six: '6️⃣', ten: '🔟',
    // colors
    red: '🔴', blue: '🔵', green: '🟢', yellow: '🟡', black: '⚫', white: '⚪', brown: '🟤',
    // other nouns seen in stories
    pond: '🏞️', friend: '🤝', friends: '🤝', captain: '🧑‍✈️'
  };
  function merge(list) { list.forEach(function (w) { if (w.word && w.emoji && !emoji[w.word]) emoji[w.word] = w.emoji; }); }
  merge(cvcWords); merge(digraphWords); merge(longWords);
  Object.keys(phonicsWords).forEach(function (k) { merge(phonicsWords[k]); });
  letters.forEach(function (l) { if (!emoji[l.word]) emoji[l.word] = l.emoji; });

  RG.content = {
    letters: letters,
    cvcWords: cvcWords,
    digraphWords: digraphWords,
    longWords: longWords,
    rhymeFamilies: rhymeFamilies,
    sightWords: sightWords,
    phonicsWords: phonicsWords,
    sentences: [],
    stories: [],
    serial: null,
    emoji: emoji,
    decodable: { patternsByLevel: patternsByLevel, sightByLevel: sightByLevel }
  };
})();

// ---- sentences, levels 1-3 (hi-lo: ships, sharks-to-come, crabs, storms; strictly decodable per level) ----
(function () {
  'use strict';
  var out = window.RG.content.sentences;
  function S(level, text, emoji, d1, d2, names) {
    var o = { text: text, emoji: emoji, distractors: [d1, d2], level: level };
    if (names) o.names = names;
    out.push(o);
  }
  // level 1: CVC + digraphs + primer sight words
  S(1, 'the ship hit a rock.', '🚢', '🚌', '✈️');
  S(1, 'a bat sat in a box.', '🦇', '🐀', '🐛');
  S(1, 'the jet can zip up!', '✈️', '🚌', '🚢');
  S(1, 'I can get a big fish!', '🐟', '🦆', '🐛');
  S(1, 'the bus hit a log.', '🚌', '🚢', '✈️');
  S(1, 'a red bug is on the rock.', '🐛', '🦇', '🐟');
  S(1, 'the fox will run and run!', '🦊', '🐶', '🐱');
  S(1, 'a duck got in the mud.', '🦆', '🐟', '🐸');
  S(1, 'the chick ran to the ship.', '🐤', '🦆', '🐟');
  S(1, 'a bug is in the web!', '🕸️', '🛏️', '🔒');
  S(1, 'I will lock the box.', '🔒', '📦', '🛏️');
  S(1, 'a big bell is on the ship!', '🔔', '🥁', '🪁');
  // level 2: blends, silent e, first-grade sight words
  S(2, 'the crab can grab you!', '🦀', '🐢', '🐌');
  S(2, 'a snake slid up the rope!', '🐍', '🐸', '🦎');
  S(2, 'the ship hit a rock. it can sink!', '🚢', '🚂', '✈️');
  S(2, 'the truck can not stop. it will crash!', '🚚', '🚌', '🚲');
  S(2, 'a frog jumps on a log.', '🐸', '🦆', '🐟');
  S(2, 'the whale can jump up and flip!', '🐳', '🐟', '🐙');
  S(2, 'I bang the drum!', '🥁', '🔔', '🪁');
  S(2, 'the kite went up and up!', '🪁', '🎈', '✈️');
  S(2, 'the tent is on the sand.', '⛺', '🏠', '🛖');
  S(2, 'a clock went tick, tick, tick!', '⏰', '🔔', '🥁');
  S(2, 'I got a big red flag.', '🚩', '🪁', '🎈');
  // level 3: vowel teams, second-grade sight words, two sentences
  S(3, 'the boat rocks in the rain. the sea is wild!', '⛵', '🚂', '🚌');
  S(3, 'the seal can leap in the sea. it can clap!', '🦭', '🐧', '🐢');
  S(3, 'a goat got on the boat! it will eat my coat!', '🐐', '🐑', '🐮');
  S(3, 'the train goes fast. it will not stop!', '🚂', '🚌', '🚗');
  S(3, 'the snail is on a leaf. it is so slow!', '🐌', '🐛', '🐢');
  S(3, 'the moon is up. the sea is deep.', '🌙', '☀️', '⭐');
  S(3, 'the sheep sleep on the hay.', '🐑', '🐮', '🐴');
  S(3, 'a gem is in the sand. I will keep it!', '💎', '🪙', '🔑');
  S(3, 'a bee sat on a peach. it went buzz!', '🐝', '🦋', '🐜');
  S(3, 'the tree is old. it has a nest in it.', '🌳', '🌵', '🏠');
})();

// ---- sentences, levels 4-5 (level 5 pictures need inference) ----
(function () {
  'use strict';
  var out = window.RG.content.sentences;
  function S(level, text, emoji, d1, d2, names) {
    var o = { text: text, emoji: emoji, distractors: [d1, d2], level: level };
    if (names) o.names = names;
    out.push(o);
  }
  // level 4: r-controlled, diphthongs, third-grade sight words
  S(4, 'a shark swims past the boat. its fin is sharp!', '🦈', '🐬', '🐟');
  S(4, 'the storm is here! the wind is loud and the waves crash.', '⛈️', '☀️', '❄️');
  S(4, 'a cook burnt the corn. it is black!', '🌽', '🍎', '🍐');
  S(4, 'the crew sails the ship. a storm is far off.', '🚢', '🚂', '🚌');
  S(4, 'the clown has a big red nose. the crowd claps!', '🤡', '🤖', '👑');
  S(4, 'the owl sits in the tree. it hoots at night.', '🦉', '🐦', '🦇');
  S(4, 'the cow is in the barn. it will chew corn.', '🐮', '🐷', '🐑');
  S(4, 'a boy has a sword. he is brave!', '🗡️', '👑', '🔑');
  S(4, 'I found a coin in the mud. it was gold!', '🪙', '💎', '🔑');
  S(4, 'the star is far away. it shines at night.', '⭐', '🌙', '☀️');
  // level 5: short paragraphs, the picture must be inferred
  S(5, 'mia zipped her coat. flakes fell all night.', '❄️', '☀️', '🌧️', ['mia']);
  S(5, 'the clouds went black. a loud boom shook the ship, and the crew held on.', '⛈️', '🌈', '☀️');
  S(5, 'ben put on boots and a hat. he went up the hill with a pack.', '⛰️', '🏖️', '🛁', ['ben']);
  S(5, 'a fin cut the sea. the swimmers rushed back to the sand.', '🦈', '🐬', '🐢');
  S(5, 'dan mixed eggs and milk in a bowl. soon the kitchen smelled sweet.', '🎂', '🔥', '🐟', ['dan']);
  S(5, 'the robot blinked red and slowed down. it can not get up.', '🔋', '☀️', '🔥');
  S(5, 'the crew dug in the sand all day. at last the spade hit a lock.', '🧰', '🪨', '🐚');
  S(5, 'the hen sat on her eggs for days. then one went crack.', '🐤', '🥚', '🐔');
  S(5, 'jen took a bath and put on her robe. she yawned and got in bed.', '🛏️', '🏖️', '🍳', ['jen']);
  S(5, 'the tent shook in the wind. cold rain hit the roof all night.', '⛺', '☀️', '🏖️');
})();

// ---- stories, levels 1-3 ----
(function () {
  'use strict';
  var out = window.RG.content.stories;
  function P(text, emoji) { return { text: text, emoji: emoji }; }
  function Q(type, q, options, answer) { return { q: q, options: options, answer: answer, type: type }; }
  // level 1 (25-40 words, CVC + digraphs + primer sight words)
  out.push({ id: 'fox-ham', title: 'The Fox and the Ham', level: 1,
    pages: [P('a fox had a big ham.', '🦊'), P('a cat ran up. it got the ham!', '🐱'),
      P('the fox ran and ran. he did not get the cat.', '🏃'), P('the cat sat on a rock and ate the ham.', '😋'),
      P('the fox said, "bad cat!"', '😠')],
    questions: [Q('literal', 'who got the ham?', ['the cat', 'the fox', 'a pig'], 'the cat'),
      Q('literal', 'what did the fox have?', ['a ham', 'a bug', 'a bus'], 'a ham')] });
  out.push({ id: 'jet-jim', title: 'Jet Jim', level: 1,
    pages: [P('jim has a red jet.', '✈️'), P('he can zip up, up, up!', '☁️'), P('a big bug hit the jet!', '🐛'),
      P('the jet did a big jig!', '💃'), P('jim got the bug in a cup. the bug is a pal!', '🥤')],
    questions: [Q('literal', 'who has a red jet?', ['jim', 'the bug', 'a fox'], 'jim'),
      Q('literal', 'what hit the jet?', ['a bug', 'a bus', 'a bat'], 'a bug')] });
  // level 2 (40-60 words, blends, silent e, first-grade sight words)
  out.push({ id: 'crab-sock', title: 'The Crab and the Sock', level: 2,
    pages: [P('a big crab hid in the sand.', '🦀'), P('a kid ran past. snap! the crab got his sock!', '🧦'),
      P('the kid said, "help! help!" he did a jig on the sand.', '😱'), P('the crab dug a hole and hid the sock in it.', '🕳️'),
      P('the kid has one sock. the crab has a sock, too!', '🦀')],
    questions: [Q('literal', 'who got the sock?', ['the crab', 'the kid', 'a frog'], 'the crab'),
      Q('literal', 'where did the crab hide the sock?', ['in a hole', 'on a rock', 'in a bag'], 'in a hole'),
      Q('literal', 'where did the kid do a jig?', ['on the sand', 'in a van', 'on a ship'], 'on the sand')] });
  out.push({ id: 'snake-tent', title: 'The Snake in the Tent', level: 2,
    pages: [P('jake and his dad set up a tent.', '⛺'), P('then, a snake slid in the tent!', '🐍'),
      P('jake felt it on his leg. it was slick!', '😬'), P('dad got a stick. the snake slid out.', '🥢'),
      P('so jake and dad slept in the van!', '🚐')],
    questions: [Q('literal', 'who slid in the tent?', ['a snake', 'a frog', 'a crab'], 'a snake'),
      Q('literal', 'what did dad get?', ['a stick', 'a drum', 'a flag'], 'a stick'),
      Q('literal', 'where did jake and dad rest at the end?', ['in the van', 'in the tent', 'on a log'], 'in the van')] });
  // level 3 (60-100 words, vowel teams, second-grade sight words; why / sequence / vocab)
  out.push({ id: 'goat-boat', title: 'The Goat on the Boat', level: 3,
    pages: [P('a goat got on a boat. no one saw it.', '🐐'),
      P('the boat sailed out to sea. the goat sat on a heap of hay.', '🌊'),
      P('the hay ran out. the goat ate a rope. then it ate a sail. then it ate a coat!', '🧥'),
      P('the men were mad. the boat could not float with no sail!', '😠'),
      P('the men gave the goat a bath. it ate the soap!', '🛁')],
    questions: [Q('literal', 'who got on the boat?', ['a goat', 'a seal', 'a bee'], 'a goat'),
      Q('sequence', 'what did the goat eat first?', ['a rope', 'a sail', 'a coat'], 'a rope'),
      Q('why', 'why were the men mad?', ['the goat ate the sail', 'the goat had hay', 'the goat took a bath'], 'the goat ate the sail')] });
  out.push({ id: 'seal-race', title: 'The Seal Race', level: 3,
    pages: [P('a seal swam by a big boat. the boat went fast.', '🦭'),
      P('"I can beat you!" said the seal.', '💬'),
      P('the seal went deep in the sea. it swam under the boat.', '🌊'),
      P('the men on the boat looked up. they did not see the seal.', '👀'),
      P('weeds got in the boat. it had to stop.', '🌿'),
      P('the seal was first to the beach! it can clap, clap, clap!', '🏖️')],
    questions: [Q('literal', 'who was first to the beach?', ['the seal', 'the boat', 'a goat'], 'the seal'),
      Q('why', 'why did the boat stop?', ['weeds got in it', 'the seal hit it', 'it ran out of hay'], 'weeds got in it'),
      Q('vocab', 'what does deep mean?', ['way down low', 'up on a hill', 'not wet'], 'way down low')] });
})();

// ---- stories, level 4 (100-150 words: r-controlled, diphthongs, third-grade sight words) ----
(function () {
  'use strict';
  var out = window.RG.content.stories;
  function P(text, emoji) { return { text: text, emoji: emoji }; }
  function Q(type, q, options, answer) { return { q: q, options: options, answer: answer, type: type }; }
  out.push({ id: 'dawn-fin', title: 'Dawn and the Big Fin', level: 4, names: ['dawn'],
    pages: [P('dark clouds rolled over the bay. the waves got big and loud.', '⛈️'),
      P('a small boat was out in the storm. a girl named dawn held the wheel.', '⛵'),
      P('then a big fin came up by the boat!', '🦈'),
      P('dawn felt a chill. the shark came close to the boat.', '😨'),
      P('the shark was huge. its mouth was wide.', '😮'),
      P('dawn had a fish in her bag. it was her lunch.', '🎒'),
      P('dawn did not scream. she tossed the fish to the shark.', '🐟'),
      P('the shark ate the fish and swam off.', '🦈'),
      P('the storm ended soon. the sun came out and the sea was smooth.', '🌤️'),
      P('dawn sailed to the dock.', '⚓'),
      P('she told her mom, "that shark was not mad. it just wanted lunch!"', '😄')],
    questions: [Q('why', 'why did dawn toss a fish to the shark?', ['to feed it', 'to fix the boat', 'to get a coin'], 'to feed it'),
      Q('sequence', 'which came first?', ['dark clouds', 'the fish', 'the dock'], 'dark clouds'),
      Q('vocab', 'what does huge mean?', ['very big', 'very small', 'very hot'], 'very big'),
      Q('inference', 'was the shark mad at dawn?', ['no, it was not mad', 'yes, it was mad', 'it was in bed'], 'no, it was not mad')] });
  out.push({ id: 'cook-max', title: 'Cook Max and the Big Pot', level: 4,
    pages: [P('cook max had a big pot on the stove.', '🍲'),
      P('he put in corn, a fish, and a boot. he did not look!', '🥾'),
      P('he gave it a stir with a big spoon.', '🥄'),
      P('a hound sat by the stove. it sniffed the pot, and ran far, far away!', '🐕'),
      P('the pot got hot. it started to boil. blub, blub, blub!', '♨️'),
      P('then the pot went boom! corn flew up to the roof.', '💥'),
      P('max had corn on his shirt and a fish on his arm.', '🌽'),
      P('the smell was bad. it was as bad as old socks!', '🤢'),
      P('the crowd laughed. max took a bow and said, "next time, no boot!"', '🙇')],
    questions: [Q('literal', 'what did max put in the pot?', ['corn, a fish, and a boot', 'a cow and a bird', 'a coin and a sword'], 'corn, a fish, and a boot'),
      Q('why', 'why did the pot go boom?', ['it got too hot', 'it had no lid', 'max sat on it'], 'it got too hot'),
      Q('sequence', 'what came after the pot got hot?', ['it went boom', 'max took a bow', 'the crowd left'], 'it went boom'),
      Q('vocab', 'what does boil mean?', ['to get very hot', 'to get cold', 'to go to sleep'], 'to get very hot')] });
})();

// ---- stories, level 5 (150-220 words: inference, "what might happen next"; two-syllable words read as chunks) ----
(function () {
  'use strict';
  var out = window.RG.content.stories;
  function P(text, emoji) { return { text: text, emoji: emoji }; }
  function Q(type, q, options, answer) { return { q: q, options: options, answer: answer, type: type }; }
  out.push({ id: 'bolt-robot', title: 'Bolt the Robot Sailor', level: 5, names: ['bolt', 'captain'],
    pages: [P('a robot named bolt lived at the end of the dock. his legs were rusty, and one light blinked red.', '🤖'),
      P('every day, he looked at the ships sail past. he wished he could sail, too.', '🚢'),
      P('one night, a pirate crew rushed up to the dock. they were chased by a huge storm.', '🏴‍☠️'),
      P('the captain shouted, "we need a strong sailor! can anybody help?"', '📣'),
      P('the captain looked at bolt\'s rusty legs. "can you hold a wheel?" he asked.', '🤔'),
      P('bolt stepped up. "I am not a sailor, but I am strong, and I never get seasick!"', '💪'),
      P('the pirates grinned. bolt grabbed the wheel with his rusty hands and turned the ship through the waves.', '⚓'),
      P('waves splashed up and the wind howled. but bolt held on.', '🌊'),
      P('the ship rocked and spun, but bolt did not let go. at dawn, the sea was smooth.', '🌅'),
      P('the crew gave a big shout. "welcome to the crew, bolt!" said the captain. "every ship needs a sailor made of steel!"', '🎉')],
    questions: [Q('inference', 'how did bolt feel at the start?', ['lonely', 'proud', 'sleepy'], 'lonely'),
      Q('why', 'why did the pirates need help?', ['a storm was after them', 'they lost their map', 'they ran out of food'], 'a storm was after them'),
      Q('sequence', 'what happened right after the pirates rushed up to the dock?', ['the captain asked for help', 'bolt turned the wheel', 'the sea went smooth'], 'the captain asked for help'),
      Q('vocab', 'what does strong mean?', ['can lift a lot', 'is very tiny', 'is very slow'], 'can lift a lot'),
      Q('inference', 'what might happen next?', ['bolt will sail with the crew', 'bolt will go back to bed', 'the ship will sink'], 'bolt will sail with the crew')] });
  out.push({ id: 'cook-pat', title: 'Cook Pat and the Sea Monster', level: 5, names: ['pat'],
    pages: [P('cook pat was a very bad cook. his stew was like old socks, and his pancakes were as hard as rocks.', '🍲'),
      P('the crew did not say a thing. they just held their noses and ate.', '😷'),
      P('one day, a sea monster rose from the waves. it opened its huge mouth and gave a loud howl!', '🐙'),
      P('the monster sniffed the ship and licked its lips. the crew did not dare move.', '😱'),
      P('the crew hid under the deck. their legs shook.', '😨'),
      P('cook pat stood up. he did not run. he lifted his big pot and tossed the stew into the monster\'s mouth.', '🥣'),
      P('the monster gulped. its face turned green. then it let out a huge burp and swam back down.', '🤢'),
      P('the crew came out. "cook pat saved us with his awful stew!" they said.', '🙌'),
      P('from that day on, the sea monsters kept far away from the ship. cook pat just smiled and gave his pot a pat.', '😄')],
    questions: [Q('inference', 'was cook pat a good cook?', ['no, his food was awful', 'yes, it was the best', 'he did not cook'], 'no, his food was awful'),
      Q('why', 'why did the monster swim away?', ['the stew made it sick', 'it was full of fish', 'the crew was too loud'], 'the stew made it sick'),
      Q('sequence', 'what did cook pat do first when the monster came?', ['he stood up', 'he hid under the deck', 'he tossed the stew'], 'he stood up'),
      Q('vocab', 'what does gulped mean?', ['ate it fast', 'jumped up', 'ran away'], 'ate it fast'),
      Q('inference', 'what might the crew do the next time they meet a monster?', ['give it stew', 'hide in bed', 'sail the other way'], 'give it stew')] });
})();

// ---- serial: "The Secret of Gull Island" (5 chapters, levels 4-5, each ends on a cliffhanger) ----
(function () {
  'use strict';
  function P(text, emoji) { return { text: text, emoji: emoji }; }
  function Q(type, q, options, answer) { return { q: q, options: options, answer: answer, type: type }; }
  var NAMES = ['captain', 'penny', 'finn', 'tuck', 'grim', 'gull', 'island'];
  window.RG.content.serial = { id: 'gull-island', title: 'The Secret of Gull Island', names: NAMES, chapters: [
    { title: 'The Box in the Sea', level: 4, names: NAMES,
      pages: [P('captain penny stood on the deck of her small ship, the sea star. the sun was warm and the sea was smooth.', '⛵'),
        P('her crew was finn, a small boy, and tuck, a big hound. they were not sailing far. they just wanted to have fun.', '🐕'),
        P('just then, a box floated by the ship. penny pulled it out with a hook.', '📦'),
        P('in the box was a map! it was old and torn. a red mark was on it.', '🗺️'),
        P('the map said, "dig by the gull rock on gull island. tell no one."', '❌'),
        P('penny and finn smiled. a map to gold! tuck gave a bark.', '😃'),
        P('then tuck\'s fur stood up. a dark ship with black sails came fast. a deep voice shouted, "give us that map!"', '🏴‍☠️'),
        P('a big hook flew over the deck and hit the mast!', '🪝')],
      questions: [Q('literal', 'what did penny pull out of the sea?', ['a box', 'a shark', 'a coin'], 'a box'),
        Q('why', 'why did penny and finn smile?', ['they had a map to gold', 'they saw a shark', 'they were lost'], 'they had a map to gold'),
        Q('sequence', 'what came right after tuck gave a bark?', ['a dark ship came fast', 'penny found the map', 'the sun went down'], 'a dark ship came fast'),
        Q('inference', 'what might the dark ship want?', ['the map', 'the hound', 'a fish'], 'the map')] },
    { title: 'The Chase', level: 4, names: NAMES,
      pages: [P('"hold on!" said penny. she turned the wheel hard, and the sea star raced away.', '💨'),
        P('the dark ship came after them. it was big and fast. its captain, grim, had a long, black coat.', '🧥'),
        P('clouds rolled in. the wind blew hard and the waves grew tall.', '🌊'),
        P('"we can not get away!" shouted finn. "we can hide in the storm," said penny.', '⛈️'),
        P('she turned the ship into the dark storm. a loud boom shook the ship. rain hit the deck.', '🌧️'),
        P('then a thick fog came down. penny could not see her own hand.', '🌫️'),
        P('when the fog went, the dark ship was not there! in front was an island with a tall, gray cliff.', '🏝️'),
        P('gulls flew over the sand. "we made it!" said finn. but tuck gave a low growl. on the sand were huge, fresh prints. who was here first?', '👣')],
      questions: [Q('why', 'why did penny sail into the storm?', ['to hide from the dark ship', 'to find a fish', 'to wash the deck'], 'to hide from the dark ship'),
        Q('sequence', 'what came after the loud boom?', ['a thick fog', 'the sea star raced away', 'tuck gave a bark'], 'a thick fog'),
        Q('vocab', 'what does fresh mean?', ['new', 'old', 'torn'], 'new'),
        Q('inference', 'what do the huge prints tell us?', ['a man was here before them', 'a bird sat there', 'no one was there'], 'a man was here before them')] },
    { title: 'The Cave of the Gulls', level: 5, names: NAMES,
      pages: [P('penny, finn, and tuck climbed the cliff. lots of gulls circled over them, screaming.', '🕊️'),
        P('behind a rock, they found a cave. a stone gate stood at the back. a riddle was cut into it.', '🚪'),
        P('"I have hands, but I can not clap. I have a face, but I can not smile. what am I?"', '❓'),
        P('the cave was cold and wet. drops of water fell from the roof and went plink.', '💧'),
        P('finn rubbed his chin. penny looked at the old stone wall.', '🤔'),
        P('"a clock!" said penny. "it has hands and a face!"', '⏰'),
        P('on the wall was a stone clock with no hands. penny set two sticks in its face. click! the gate slid open.', '🔓'),
        P('they crept in. a dim tunnel went down, down, down. at the end was a glow of gold.', '✨'),
        P('then a laugh rang out. "welcome, penny," said a deep voice. "I have been waiting for you." it was captain grim!', '😈')],
      questions: [Q('literal', 'what was the answer to the riddle?', ['a clock', 'a gull', 'a gate'], 'a clock'),
        Q('sequence', 'what did penny do right before the gate slid open?', ['she set two sticks in the clock', 'she hid in the cave', 'she asked finn to sing'], 'she set two sticks in the clock'),
        Q('vocab', 'what does dim mean?', ['not bright', 'very loud', 'very hot'], 'not bright'),
        Q('inference', 'how did grim know where the cave was?', ['he went there first', 'a gull told him', 'he has the map'], 'he went there first')] },
    { title: 'Grim\'s Trap', level: 5, names: NAMES,
      pages: [P('captain grim stood by a huge chest of gold. he held a lamp in his hand and a sharp sword at his side.', '💰'),
        P('"you led me here with your map," he said. "thank you!" he gave a nasty grin.', '😏'),
        P('"the gold is mine!" he stamped on the ground. click! the sand under penny\'s feet began to sink.', '⏳'),
        P('"help!" yelled finn. the sand was pulling them down.', '😰'),
        P('tuck grabbed the end of a rope in his teeth. he pulled and pulled.', '🪢'),
        P('penny held on. she tossed the rope around a rock. then she and finn climbed out.', '🧗'),
        P('captain grim laughed and grabbed the chest. but he could not lift it. he pulled and pulled. then the lid popped open.', '📦'),
        P('there was no gold in the chest! there was just a small brass ring and a note. penny read the first line. "the real secret is not gold."', '🗝️'),
        P('just then, the cave began to shake!', '💥')],
      questions: [Q('why', 'why did grim say thank you?', ['penny led him to the gold', 'penny gave him a gift', 'penny sang a song'], 'penny led him to the gold'),
        Q('sequence', 'who helped penny and finn get out?', ['tuck, with the rope', 'a gull', 'captain grim'], 'tuck, with the rope'),
        Q('vocab', 'what does nasty mean?', ['mean', 'kind', 'sleepy'], 'mean'),
        Q('inference', 'what might the note say next?', ['what the real secret is', 'where to buy a hat', 'how to bake a cake'], 'what the real secret is')] },
    { title: 'The Real Secret', level: 5, names: NAMES,
      pages: [P('rocks fell from the roof. "run!" shouted penny. she grabbed the ring and the note and ran.', '🪨'),
        P('the tunnel was filling with sand. captain grim stood still, too scared to move. "help me!" he said.', '😨'),
        P('penny stopped. finn stared at her. "he was mean to us!" "I know," said penny. "but we help all sailors."', '🫶'),
        P('penny tossed the rope. finn and tuck pulled with all their might. grim grabbed it and scrambled out.', '🪢'),
        P('they ran out as the cave sank behind them.', '🏃'),
        P('on the beach, penny read the rest of the note. "the real secret of gull island is the gulls. they keep a lighthouse full of maps, and each map leads to a new quest."', '🗼'),
        P('grim looked down at the sand. "I will never chase a map again," he mumbled.', '😔'),
        P('just then, finn pointed at the sea. "penny, look!" a ship with silver sails was sailing right at them. and on its flag was a picture of penny\'s own face!', '🚩')],
      questions: [Q('why', 'why did penny help captain grim?', ['she helps all sailors', 'she wanted his map', 'she was scared of him'], 'she helps all sailors'),
        Q('literal', 'what is the real secret of gull island?', ['a lighthouse full of maps', 'a chest of gold', 'a sleeping shark'], 'a lighthouse full of maps'),
        Q('vocab', 'what does scrambled mean?', ['climbed fast', 'sat still', 'went to bed'], 'climbed fast'),
        Q('inference', 'what might happen next?', ['a new ship will meet them', 'they will go to sleep', 'the sea will go away'], 'a new ship will meet them')] }
  ] };
})();

// ---- extra emoji for picturable words in the stories (each shows exactly that thing) ----
(function () {
  'use strict';
  var E = window.RG.content.emoji, add = {
    arm: '💪', boot: '🥾', boots: '🥾', clouds: '☁️', drop: '💧', drops: '💧', eggs: '🥚', feet: '🦶', flakes: '❄️',
    hole: '🕳️', hook: '🪝', hound: '🐕', legs: '🦵', lips: '👄', maps: '🗺️', milk: '🥛', mouth: '👄', noses: '👃',
    note: '📝', pack: '🎒', pirates: '🏴‍☠️', ships: '🚢', stone: '🪨', teeth: '🦷', wall: '🧱', wind: '💨', ham: '🍖',
    weeds: '🌿', hands: '✋', cook: '🧑‍🍳', rocks: '🪨', swimmers: '🏊', sails: '⛵'
  };
  Object.keys(add).forEach(function (k) { if (!E[k]) E[k] = add[k]; });
})();
