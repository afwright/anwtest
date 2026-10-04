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

  var digraphWords = [
    { word: 'ship',   emoji: '🚢', pattern: 'sh' }, { word: 'shell',  emoji: '🐚', pattern: 'sh' },
    { word: 'fish',   emoji: '🐟', pattern: 'sh' }, { word: 'shark',  emoji: '🦈', pattern: 'sh' },
    { word: 'sheep',  emoji: '🐑', pattern: 'sh' },
    { word: 'chick',  emoji: '🐤', pattern: 'ch' }, { word: 'cheese', emoji: '🧀', pattern: 'ch' },
    { word: 'chair',  emoji: '🪑', pattern: 'ch' },
    { word: 'thumb',  emoji: '👍', pattern: 'th' }, { word: 'three',  emoji: '3️⃣', pattern: 'th' },
    { word: 'tooth',  emoji: '🦷', pattern: 'th' },
    { word: 'whale',  emoji: '🐳', pattern: 'wh' }, { word: 'wheel',  emoji: '🛞', pattern: 'wh' },
    { word: 'duck',   emoji: '🦆', pattern: 'ck' }, { word: 'sock',   emoji: '🧦', pattern: 'ck' },
    { word: 'rock',   emoji: '🪨', pattern: 'ck' }, { word: 'lock',   emoji: '🔒', pattern: 'ck' },
    { word: 'truck',  emoji: '🚚', pattern: 'ck' }, { word: 'brick',  emoji: '🧱', pattern: 'ck' },
    { word: 'frog',   emoji: '🐸', pattern: 'fr' }, { word: 'star',   emoji: '⭐', pattern: 'st' },
    { word: 'snail',  emoji: '🐌', pattern: 'sn' }, { word: 'snake',  emoji: '🐍', pattern: 'sn' },
    { word: 'tree',   emoji: '🌳', pattern: 'tr' }, { word: 'train',  emoji: '🚂', pattern: 'tr' },
    { word: 'flag',   emoji: '🚩', pattern: 'fl' }, { word: 'flower', emoji: '🌸', pattern: 'fl' },
    { word: 'cloud',  emoji: '☁️', pattern: 'cl' }, { word: 'clock',  emoji: '⏰', pattern: 'cl' },
    { word: 'grapes', emoji: '🍇', pattern: 'gr' }, { word: 'blue',   emoji: '🔵', pattern: 'bl' },
    { word: 'crab',   emoji: '🦀', pattern: 'cr' }, { word: 'drum',   emoji: '🥁', pattern: 'dr' },
    { word: 'spoon',  emoji: '🥄', pattern: 'sp' }, { word: 'plant',  emoji: '🪴', pattern: 'pl' }
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

  var sightWords = {
    // Dolch pre-primer (40)
    level1: ['a', 'and', 'away', 'big', 'blue', 'can', 'come', 'down', 'find', 'for', 'funny', 'go', 'help', 'here',
             'I', 'in', 'is', 'it', 'jump', 'little', 'look', 'make', 'me', 'my', 'not', 'one', 'play', 'red', 'run',
             'said', 'see', 'the', 'three', 'to', 'two', 'up', 'we', 'where', 'yellow', 'you'],
    // Dolch primer (52)
    level2: ['all', 'am', 'are', 'at', 'ate', 'be', 'black', 'brown', 'but', 'came', 'did', 'do', 'eat', 'four', 'get',
             'good', 'have', 'he', 'into', 'like', 'must', 'new', 'no', 'now', 'on', 'our', 'out', 'please', 'pretty',
             'ran', 'ride', 'saw', 'say', 'she', 'so', 'soon', 'that', 'there', 'they', 'this', 'too', 'under', 'want',
             'was', 'well', 'went', 'what', 'white', 'who', 'will', 'with', 'yes'],
    // Dolch first grade (41)
    level3: ['after', 'again', 'an', 'any', 'as', 'ask', 'by', 'could', 'every', 'fly', 'from', 'give', 'going', 'had',
             'has', 'her', 'him', 'his', 'how', 'just', 'know', 'let', 'live', 'may', 'of', 'old', 'once', 'open',
             'over', 'put', 'round', 'some', 'stop', 'take', 'thank', 'them', 'then', 'think', 'walk', 'were', 'when']
  };

  var sentences = [
    // ---- level 1: CVC + sight words ----
    { text: 'the cat is on a bed.',      emoji: '🐱', distractors: ['🐶', '🐷'], level: 1 },
    { text: 'a dog can run.',            emoji: '🐶', distractors: ['🐱', '🐷'], level: 1 },
    { text: 'the pig is big.',           emoji: '🐷', distractors: ['🐶', '🐔'], level: 1 },
    { text: 'I see a bug.',              emoji: '🐛', distractors: ['🐸', '🐱'], level: 1 },
    { text: 'the sun is up.',            emoji: '☀️', distractors: ['🌙', '☁️'], level: 1 },
    { text: 'we can see a bus.',         emoji: '🚌', distractors: ['🚲', '✈️'], level: 1 },
    { text: 'a hen sat on a box.',       emoji: '🐔', distractors: ['🐶', '🦊'], level: 1 },
    { text: 'the fox can jump.',         emoji: '🦊', distractors: ['🐸', '🐱'], level: 1 },
    { text: 'I can see a red hat.',      emoji: '🎩', distractors: ['🧢', '🧦'], level: 1 },
    { text: 'the rat is in a bag.',      emoji: '🐀', distractors: ['🐱', '🦇'], level: 1 },
    { text: 'the nut is in a bag.',      emoji: '🥜', distractors: ['🍎', '🐛'], level: 1 },
    { text: 'look, a bat!',              emoji: '🦇', distractors: ['🐀', '🐛'], level: 1 },
    // ---- level 2: digraphs, blends, Dolch primer ----
    { text: 'the frog jumps in the pond.', emoji: '🐸', distractors: ['🦆', '🐟'], level: 2 },
    { text: 'a fish swims in the sea.',    emoji: '🐟', distractors: ['🐢', '🦀'], level: 2 },
    { text: 'the ship is on the water.',   emoji: '🚢', distractors: ['🚂', '✈️'], level: 2 },
    { text: 'the duck has a hat.',         emoji: '🦆', distractors: ['🐔', '🐸'], level: 2 },
    { text: 'the crab is on a rock.',      emoji: '🦀', distractors: ['🐌', '🐢'], level: 2 },
    { text: 'we see a big whale.',         emoji: '🐳', distractors: ['🐟', '🦈'], level: 2 },
    { text: 'the snail is slow.',          emoji: '🐌', distractors: ['🐇', '🐸'], level: 2 },
    { text: 'the star is in the sky.',     emoji: '⭐', distractors: ['🌙', '☀️'], level: 2 },
    { text: 'the train went fast.',        emoji: '🚂', distractors: ['🚌', '🚲'], level: 2 },
    { text: 'the shark can swim.',         emoji: '🦈', distractors: ['🐑', '🐘'], level: 2 },
    { text: 'she has three shells.',       emoji: '🐚', distractors: ['⭐', '🦀'], level: 2 },
    { text: 'the chick sat on the chair.', emoji: '🐤', distractors: ['🐶', '🐍'], level: 2 },
    // ---- level 3: two short sentences ----
    { text: 'I have a boat. it is red and blue.',           emoji: '⛵', distractors: ['🚗', '✈️'], level: 3 },
    { text: 'the whale is big. it lives in the sea.',       emoji: '🐳', distractors: ['🐘', '🐟'], level: 3 },
    { text: 'the crab sat on the sand. it had a shell.',    emoji: '🦀', distractors: ['🐢', '🐚'], level: 3 },
    { text: 'a bird can fly. it sat on the ship.',          emoji: '🐦', distractors: ['🐶', '🐟'], level: 3 },
    { text: 'the snake went under a rock. then it slept.',  emoji: '🐍', distractors: ['🐸', '🦎'], level: 3 },
    { text: 'we ride the train. it goes over the bridge.',  emoji: '🚂', distractors: ['🚌', '🚢'], level: 3 },
    { text: 'the dolphin can jump. it likes to swim.',      emoji: '🐬', distractors: ['🐟', '🦈'], level: 3 },
    { text: 'the sun was hot. we sat under a tree.',        emoji: '🌳', distractors: ['☃️', '🌊'], level: 3 },
    { text: 'the turtle is old. it walks to the sea.',      emoji: '🐢', distractors: ['🐇', '🐸'], level: 3 },
    { text: 'I found a gem. it was in a chest.',            emoji: '💎', distractors: ['🍎', '🐟'], level: 3 }
  ];

  var stories = [
    // ---- level 1 ----
    { title: 'Sam and the Big Fish', level: 1,
      pages: [
        { text: 'sam has a red boat.',              emoji: '⛵' },
        { text: 'sam sat in the boat.',             emoji: '👦' },
        { text: 'a big fish can jump!',             emoji: '🐟' },
        { text: 'the fish said, "hi sam!"',         emoji: '💬' },
        { text: 'sam and the fish are pals.',       emoji: '🤝' }
      ],
      questions: [
        { q: 'what color is the boat?', options: ['red', 'blue', 'green'], answer: 'red' },
        { q: 'who can jump?',           options: ['fish', 'hen', 'pig'],   answer: 'fish' }
      ] },
    { title: 'Pip the Pig', level: 1,
      pages: [
        { text: 'pip is a pig.',                    emoji: '🐷' },
        { text: 'pip has a tub.',                   emoji: '🛁' },
        { text: 'pip got in the tub.',              emoji: '🐷' },
        { text: 'the tub is a boat!',               emoji: '⛵' },
        { text: 'pip can sit and sail.',            emoji: '🌊' }
      ],
      questions: [
        { q: 'who is pip?',                  options: ['a pig', 'a cat', 'a hen'], answer: 'a pig' },
        { q: 'what is the tub?',             options: ['a hat', 'a boat', 'a bus'], answer: 'a boat' }
      ] },
    // ---- level 2 ----
    { title: 'Crab on the Rock', level: 2,
      pages: [
        { text: 'ted the crab lives on a rock.',          emoji: '🦀' },
        { text: 'the sea is big and blue.',               emoji: '🌊' },
        { text: 'a ship sails past the rock.',            emoji: '🚢' },
        { text: 'ted waves a claw at the ship.',          emoji: '👋' },
        { text: 'the ship blows a horn. toot toot!',      emoji: '📯' },
        { text: 'ted is glad. he has a new friend.',      emoji: '😊' }
      ],
      questions: [
        { q: 'where does ted live?',        options: ['on a rock', 'in a tree', 'in a bus'], answer: 'on a rock' },
        { q: 'what did the ship blow?',     options: ['a horn', 'a drum', 'a flag'],         answer: 'a horn' },
        { q: 'how does ted feel at the end?', options: ['glad', 'sad', 'mad'],               answer: 'glad' }
      ] },
    { title: 'The Little Whale', level: 2,
      pages: [
        { text: 'a little whale swims in the sea.',       emoji: '🐳' },
        { text: 'she sees a big ship.',                   emoji: '🚢' },
        { text: 'the whale is small. the ship is big.',   emoji: '🔍' },
        { text: 'splash! she jumps up high.',             emoji: '💦' },
        { text: 'a man on the ship waves hello.',         emoji: '👋' },
        { text: 'the whale smiles and swims on.',         emoji: '😊' }
      ],
      questions: [
        { q: 'what does the whale see?',   options: ['a big ship', 'a red bus', 'a frog'], answer: 'a big ship' },
        { q: 'what does the man do?',      options: ['waves hello', 'sleeps', 'runs'],      answer: 'waves hello' }
      ] },
    // ---- level 3 ----
    { title: 'The Lost Starfish', level: 3,
      pages: [
        { text: 'a little starfish sat alone on the beach.',                   emoji: '⭐' },
        { text: 'the waves had carried her far from her home.',                emoji: '🌊' },
        { text: 'a kind turtle came walking over the sand.',                   emoji: '🐢' },
        { text: '"do not worry," said the turtle. "I will take you home."',    emoji: '💬' },
        { text: 'the starfish climbed on his back, and they swam away.',       emoji: '🏊' },
        { text: 'soon she was home again. she thanked her new friend.',        emoji: '🏠' }
      ],
      questions: [
        { q: 'who helped the starfish?',            options: ['a turtle', 'a shark', 'a bird'],      answer: 'a turtle' },
        { q: 'where did the starfish sit at first?', options: ['on the beach', 'on a ship', 'in a tree'], answer: 'on the beach' },
        { q: 'what did the starfish do at the end?', options: ['thanked her friend', 'ran away', 'went to sleep'], answer: 'thanked her friend' }
      ] },
    { title: "Captain Penny's Treasure", level: 3,
      pages: [
        { text: 'captain penny had an old map.',                               emoji: '🗺️' },
        { text: 'it showed an island with a big green tree.',                  emoji: '🏝️' },
        { text: 'she sailed her boat across the sea for three days.',          emoji: '⛵' },
        { text: 'at last she found the tree and began to dig.',                emoji: '🌳' },
        { text: 'under the sand was a chest full of shiny gems!',              emoji: '💎' },
        { text: 'penny shared the gems with all of her friends.',              emoji: '🤝' }
      ],
      questions: [
        { q: 'what did penny have?',        options: ['an old map', 'a new hat', 'a red kite'],       answer: 'an old map' },
        { q: 'what was in the chest?',      options: ['shiny gems', 'big fish', 'green socks'],       answer: 'shiny gems' },
        { q: 'what did penny do with the gems?', options: ['shared them', 'hid them', 'sold them'],   answer: 'shared them' }
      ] }
  ];

  // ---- emoji lookup: every picturable word used in the data above ----
  var emoji = {
    // animals
    ox: '🐂', bear: '🐻', bee: '🐝', bird: '🐦', dolphin: '🐬', turtle: '🐢', octopus: '🐙', shark: '🦈',
    whale: '🐳', crab: '🦀', fish: '🐟', snail: '🐌', snake: '🐍', frog: '🐸', duck: '🦆', chick: '🐤',
    hen: '🐔', sheep: '🐑', pig: '🐷', dog: '🐶', cat: '🐱', rabbit: '🐰', bunny: '🐰', horse: '🐴', cow: '🐮',
    lion: '🦁', tiger: '🐯', zebra: '🦓', monkey: '🐵', elephant: '🐘', mouse: '🐭', fox: '🦊', goat: '🐐',
    iguana: '🦎', lizard: '🦎', seal: '🦭', penguin: '🐧', parrot: '🦜', owl: '🦉', ant: '🐜', bug: '🐛',
    butterfly: '🦋', ladybug: '🐞', starfish: '⭐', shrimp: '🦐', squid: '🦑', lobster: '🦞',
    // food
    apple: '🍎', banana: '🍌', pear: '🍐', grapes: '🍇', cheese: '🧀', cake: '🎂', egg: '🥚', nut: '🥜',
    juice: '🧃', spoon: '🥄', cup: '🥤', mug: '☕', pot: '🍲', can: '🥫', pan: '🍳', yam: '🍠', bread: '🍞',
    // nature / sea
    sea: '🌊', wave: '🌊', waves: '🌊', water: '💧', island: '🏝️', beach: '🏖️', sand: '🏖️', sun: '☀️',
    moon: '🌙', star: '⭐', sky: '🌤️', cloud: '☁️', tree: '🌳', flower: '🌸', rose: '🌹', plant: '🪴',
    rock: '🪨', shell: '🐚', shells: '🐚', log: '🪵', snow: '❄️', rain: '🌧️', fire: '🔥', gem: '💎', gems: '💎',
    // things
    boat: '⛵', ship: '🚢', anchor: '⚓', map: '🗺️', chest: '🧰', treasure: '💰', flag: '🚩', kite: '🪁',
    ball: '⚽', balloon: '🎈', drum: '🥁', horn: '📯', hat: '🎩', cap: '🧢', coat: '🧥', sock: '🧦', socks: '🧦',
    bag: '👜', box: '📦', bed: '🛏️', chair: '🪑', clock: '⏰', lock: '🔒', pen: '🖊️', pin: '📌', tag: '🏷️',
    web: '🕸️', bin: '🗑️', tub: '🛁', bath: '🛁', hut: '🛖', home: '🏠', house: '🏠', wheel: '🛞', brick: '🧱',
    rope: '🪢', bone: '🦴', umbrella: '☂️', 'yo-yo': '🪀', book: '📖', bell: '🔔', key: '🔑', crown: '👑',
    // vehicles
    bus: '🚌', van: '🚐', cab: '🚕', car: '🚗', truck: '🚚', train: '🚂', jet: '✈️', plane: '✈️', bike: '🚲',
    gas: '⛽', bridge: '🌉',
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
  // Merge picturable data from lists so every word is covered
  function merge(list) { list.forEach(function (w) { if (w.word && w.emoji && !emoji[w.word]) emoji[w.word] = w.emoji; }); }
  merge(cvcWords); merge(digraphWords); merge(longWords);
  letters.forEach(function (l) { if (!emoji[l.word]) emoji[l.word] = l.emoji; });

  RG.content = {
    letters: letters,
    cvcWords: cvcWords,
    digraphWords: digraphWords,
    longWords: longWords,
    rhymeFamilies: rhymeFamilies,
    sightWords: sightWords,
    sentences: sentences,
    stories: stories,
    emoji: emoji
  };
})();
