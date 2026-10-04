/* Reading Quest - "Why Read?" missions. Reading is NECESSARY and FUN.
   Each scene: narrator setup, a real-world text drawn with CSS, a choice or a sequence,
   a silly (never scary) consequence for a misread, a payoff line, then a Reading Superpower card. */
(function () {
  'use strict';
  var RG = window.RG;
  if (!RG || !RG.registerGame) { return; }

  var STYLE_ID = 'rq-style';
  var CSS = `
.rq-wrap{position:relative;width:100%;max-width:640px;margin:0 auto;padding:6px 10px 22px;box-sizing:border-box;display:flex;flex-direction:column;gap:12px;color:#4a3320;--rq-teal:#2a9d8f}
.rq-narr{display:flex;gap:10px;align-items:flex-start}
.rq-parrot{font-size:2.6rem;line-height:1;flex:none;animation:rq-bob 2.4s ease-in-out infinite}
.rq-bubble{flex:1;background:#fff;border:3px solid var(--rq-teal);border-radius:18px;padding:10px 14px;font-size:1.1rem;line-height:1.35;font-weight:600}
.rq-tip{display:block;margin-top:6px;font-size:.95rem;font-weight:800;color:#1f7a6f}
.rq-art{display:flex;flex-direction:column;align-items:center;gap:12px;width:100%}
.rq-ow{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;gap:6px;filter:drop-shadow(0 3px 2px rgba(0,0,0,.35))}
.rq-ow.sel{filter:drop-shadow(0 0 9px #ffd60a)}
.rq-ow.rq-hint{animation:rq-pulse 1s ease-in-out infinite;filter:drop-shadow(0 0 12px #ffd60a)}
.rq-ow.rq-correct{filter:drop-shadow(0 0 14px #2ecc40);animation:rq-pop .5s}
.rq-opt,.rq-tok,.rq-hear,.rq-go{font:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation}
.rq-go{display:none;min-height:56px;min-width:110px;border:3px solid #fff;border-radius:28px;background:#2fbf5b;color:#fff;font-size:1.3rem;font-weight:800;padding:0 18px;box-shadow:0 4px 0 rgba(0,0,0,.25)}
.rq-ow.sel .rq-go{display:block}
/* signpost */
.rq-signpost{position:relative;width:100%;padding:16px 0 30px;display:flex;flex-direction:column;gap:14px;align-items:center;background:linear-gradient(#bfe9ff 70%,#7ccf6b 70%);border-radius:18px;overflow:hidden}
.rq-signpost::before{content:'';position:absolute;left:50%;top:0;bottom:0;width:22px;margin-left:-11px;background:linear-gradient(90deg,#7a4d22,#b97a3e,#7a4d22);border-radius:6px}
.rq-signpost .rq-ow{width:86%}
.rq-plank{width:100%;min-height:78px;border:0;color:#3b2412;font-size:1.6rem;font-weight:800;padding:10px 14px;display:flex;align-items:center;justify-content:center;gap:10px;background:repeating-linear-gradient(0deg,rgba(0,0,0,.07) 0 2px,transparent 2px 9px),linear-gradient(#e0a76b,#bd7f43)}
.rq-plank.r{clip-path:polygon(0 0,91% 0,100% 50%,91% 100%,0 100%);padding-right:12%}
.rq-plank.l{clip-path:polygon(9% 0,100% 0,100% 100%,9% 100%,0 50%);padding-left:12%}
.rq-plank .rq-pe{font-size:2.2rem}
.rq-plank .rq-pt{line-height:1.1}
/* bottles */
.rq-shelf{width:100%;display:flex;justify-content:center;align-items:flex-end;gap:clamp(14px,6vw,40px);padding:18px 10px 0;box-sizing:border-box;border-bottom:16px solid #8a5a2b;background:linear-gradient(#cfe8ef,#eaf7fa);border-radius:16px 16px 0 0}
.rq-bottle{border:0;background:none;padding:0;display:flex;flex-direction:column;align-items:center}
.rq-cork{width:30px;height:18px;background:#b07a45;border-radius:4px 4px 0 0}
.rq-neck{width:38px;height:28px;background:rgba(255,255,255,.55);border:3px solid #7aa7b3;border-bottom:0}
.rq-body{width:clamp(110px,30vw,150px);min-height:150px;border:3px solid #7aa7b3;border-radius:26px 26px 18px 18px;background:var(--liq,#ff9f1c);display:flex;align-items:center;justify-content:center;padding:8px;box-sizing:border-box}
.rq-blabel{background:#fffdf2;border:2px solid #6b4a2b;border-radius:8px;padding:6px 8px;font-weight:800;font-size:1.05rem;text-align:center;line-height:1.15;width:100%;box-sizing:border-box;color:#3b2412}
.rq-blabel .rq-be{display:block;font-size:1.7rem}
/* plates (door and pot signs) */
.rq-plates{display:flex;flex-wrap:wrap;gap:16px;justify-content:center;width:100%}
.rq-plate{min-width:140px;min-height:104px;border:6px solid #fff;border-radius:16px;background:var(--pc,#d62828);color:#fff;font-size:1.5rem;font-weight:800;padding:10px 14px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;box-shadow:0 0 0 4px var(--pc,#d62828),0 5px 0 4px rgba(0,0,0,.25)}
.rq-plate .rq-pe{font-size:2.4rem;line-height:1}
.rq-plate.dark{color:#3b2412}
/* cards (note, parcel tag, recipe, list, map) */
.rq-card{position:relative;width:100%;box-sizing:border-box;background:#fff3d1;border:3px solid #c9a35a;border-radius:6px 16px 10px 18px;padding:12px 78px 14px 16px;box-shadow:0 4px 0 rgba(0,0,0,.18),inset 0 0 20px rgba(201,163,90,.55);font-size:1.5rem;line-height:1.45;text-align:left;color:#4a3320}
.rq-ctitle{font-size:.95rem;font-weight:800;opacity:.7;margin-bottom:4px}
.rq-line{font-weight:800;letter-spacing:.04em}
.rq-card-recipe{background:repeating-linear-gradient(#fffdf6 0 31px,#cfe6ff 31px 32px);border-color:#e07a5f;border-left:14px solid #e07a5f}
.rq-card-market{background:#fff;border:3px dashed #4ab3d8;box-shadow:0 4px 0 rgba(0,0,0,.15)}
.rq-card-parcel{background:#d9a56a;border:4px solid #8a5a2b;text-align:center}
.rq-card-parcel .rq-line{display:inline-block;background:#fff;border-radius:6px;padding:4px 12px;border:2px solid #8a5a2b;margin:2px 0}
.rq-card-parcel::before{content:'';position:absolute;left:14px;right:78px;top:50%;height:10px;margin-top:-5px;background:rgba(214,40,40,.55);z-index:0}
.rq-card-parcel>*{position:relative;z-index:1}
.rq-hear{position:absolute;right:8px;top:8px;width:64px;height:64px;border-radius:50%;border:3px solid var(--rq-teal);background:#fff;font-size:1.6rem;box-shadow:0 3px 0 rgba(0,0,0,.2)}
.rq-hear.rq-hide{display:none}
.rq-hear.rq-hint{animation:rq-pulse 1s infinite}
/* map spots and houses */
.rq-isle{width:100%;box-sizing:border-box;display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:14px;border-radius:20px;background:radial-gradient(circle at 30% 30%,#9be09f,#5fb36a);border:5px solid #4ab3d8}
.rq-isle .rq-ow{width:100%}
.rq-spot{width:100%;min-height:96px;border:4px solid #fff;border-radius:18px;background:rgba(255,255,255,.6);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:6px}
.rq-spe{font-size:3rem;line-height:1.05}
.rq-spl{font-weight:800;font-size:1.15rem;color:#3b2412}
/* sequences (recipe, market, map) */
.rq-slots{display:flex;gap:8px;justify-content:center;align-items:center;flex-wrap:wrap}
.rq-slotpre{font-size:2.4rem}
.rq-st{width:64px;height:64px;border:4px dashed #b08a4a;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:2rem;background:rgba(255,255,255,.7);box-sizing:border-box}
.rq-st.full{border-style:solid;border-color:#2a9d3f;background:#e5f9e7;animation:rq-pop .35s}
.rq-toks{display:flex;flex-wrap:wrap;gap:12px;justify-content:center;width:100%;box-sizing:border-box;padding:14px 10px;border-radius:18px}
.rq-toks-recipe{background:#fde7c8;border:3px solid #f2c48d}
.rq-toks-market{background:repeating-linear-gradient(90deg,#fff 0 22px,#ff6b6b 22px 44px);padding-top:30px;border:3px solid #ff6b6b}
.rq-toks-map{background:radial-gradient(circle at 70% 30%,#9be09f,#5fb36a);border:5px solid #4ab3d8}
.rq-toks .rq-ow{width:auto}
.rq-tok{min-width:92px;min-height:92px;border:4px solid #fff;border-radius:18px;background:rgba(255,255,255,.85);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:6px 8px;box-shadow:0 4px 0 rgba(0,0,0,.2)}
.rq-te{font-size:2.6rem;line-height:1.05}
.rq-tl{font-size:1.15rem;font-weight:800;color:#3b2412}
.rq-tok.used{opacity:.35;pointer-events:none}
/* consequence overlay */
.rq-oops{position:absolute;left:0;right:0;top:0;bottom:0;z-index:10;background:rgba(255,255,255,.92);border-radius:18px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:20px;text-align:center;overflow:hidden;animation:rq-fade .2s}
.rq-oemoji{font-size:5rem;line-height:1.1;animation:rq-wig .5s ease-in-out 3}
.rq-otext{font-size:1.3rem;font-weight:800;max-width:420px}
.rq-fx span{position:absolute;bottom:-10%;font-size:2rem;opacity:.85;animation:rq-rise 2.2s ease-in infinite}
/* payoff and superpower */
.rq-after{display:flex;flex-direction:column;align-items:center;gap:16px;text-align:center;padding-top:6px}
.rq-payoff{background:#e8fff1;border:3px solid #2a9d3f;border-radius:18px;padding:12px 16px;font-size:1.25rem;font-weight:800;line-height:1.35}
.rq-power{background:linear-gradient(135deg,#ffe066,#ffb703);border:4px solid #fff;outline:3px solid #f08c00;border-radius:22px;padding:14px 22px;display:flex;align-items:center;gap:12px;font-size:1.4rem;font-weight:800;animation:rq-pop .6s;box-shadow:0 6px 0 rgba(0,0,0,.2);color:#5a2a00}
.rq-pe2{font-size:3rem;line-height:1}
.rq-pcap{font-size:.9rem;font-weight:800;color:#8a5a2b}
.rq-next{min-height:72px}
.rq-final{display:flex;flex-direction:column;align-items:center;gap:14px;text-align:center}
.rq-final h2{margin:0;font-size:1.7rem}
.rq-powers{display:flex;flex-wrap:wrap;gap:12px;justify-content:center}
.rq-powers .rq-power{font-size:1.1rem;padding:10px 14px}
.rq-powers .rq-pe2{font-size:2.2rem}
.rq-new{font-size:.75rem;background:#e63946;color:#fff;border-radius:10px;padding:2px 8px;margin-left:4px}
@keyframes rq-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
@keyframes rq-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}
@keyframes rq-pop{0%{transform:scale(.6)}70%{transform:scale(1.1)}100%{transform:scale(1)}}
@keyframes rq-fade{from{opacity:0}to{opacity:1}}
@keyframes rq-wig{0%,100%{transform:rotate(0)}25%{transform:rotate(-12deg)}75%{transform:rotate(12deg)}}
@keyframes rq-rise{0%{transform:translateY(0)}100%{transform:translateY(-420px)}}
@media (prefers-reduced-motion:reduce){.rq-wrap *{animation-duration:.01s!important;animation-iteration-count:1!important}}
@media (max-width:420px){.rq-card{font-size:1.3rem;padding-right:74px}.rq-plank{font-size:1.4rem}}
`;

  /* ---------------- scene data ---------------- */
  var POW = {
    finder: ['finder', 'Readers find treasure!', '💎'],
    safe: ['safe', 'Readers stay safe!', '🦺'],
    cook: ['cook', 'Readers can cook!', '🧑‍🍳'],
    secret: ['secret', 'Readers get secret messages!', '💌'],
    shop: ['shop', 'Readers shop smart!', '🛒'],
    helper: ['helper', 'Readers help their friends!', '📦']
  };
  var CRAB = [['🦀', 'Pinch pinch! A silly crab nipped your sock! Let us try again.']];
  var BUBBLES = [['🫧', 'Bloop bloop! Soapy bubbles! That was the soap. Pop pop pop! Try again.']];
  var STEAM = [['♨️', 'Whoosh! Hot steam! Wiggle your fingers and blow. Try again.']];
  var INK = [['🐙', 'Splosh! An octopus squirted ink! That was not on the list. Try again.']];
  var PENGUIN = [['🐧', 'Waddle waddle! Only a penguin is here. The note said somewhere else. Try again.']];
  var DOG = [['🐶', 'Woof! The dog sniffs it. Not for me! Try again.']];
  var FLOUR = [['💨', 'Poof! A cloud of flour! The cook sneezes. Achoo! Try again.']];
  var PAYOFF_SIGN = 'You read the sign, so you found the treasure! Readers find things other people miss.';
  var PAYOFF_LABEL = 'You read the label, so you stayed safe! Readers stay safe.';
  var PAYOFF_NOTE = 'You read the note, so you met your friend! Readers get secret messages.';
  var PAYOFF_PARCEL = 'You read the name, so the parcel got to the right friend! Readers help their friends.';
  var PAYOFF_LIST = 'You read the list, so you bought just the right things! Readers shop smart.';
  var PAYOFF_COOK = 'You read the recipe, so the pancakes got made! Readers can cook.';
  var PAYOFF_MAP = 'You read the map, so you found the treasure! Readers find things other people miss.';

  var SCENES = [
    /* ---------- LITTLE ---------- */
    { id: 'l-sign-treasure', t: 'little', lv: 1, skin: 'sign', kind: 'pick', read: 'opts',
      setup: 'Ahoy, Captain! The path splits in two. We want the treasure! Which sign shows the way?',
      opts: [{ text: 'treasure', emoji: '💎', dir: 'r', ok: 1 }, { text: 'crabs', emoji: '🦀', dir: 'l' }],
      oops: CRAB, payoff: PAYOFF_SIGN, power: POW.finder },
    { id: 'l-bottle-juice', t: 'little', lv: 1, skin: 'bottle', kind: 'pick', read: 'opts',
      setup: 'The ship cook is thirsty! Two bottles look the same. Which bottle is juice?',
      opts: [{ text: 'soap', emoji: '🧼', col: '#ff9f1c' }, { text: 'juice', emoji: '🧃', col: '#ff9f1c', ok: 1 }],
      oops: BUBBLES, payoff: 'You read the label, so you picked the juice and stayed safe! Readers stay safe.', power: POW.safe },
    { id: 'l-note-rock', t: 'little', lv: 1, skin: 'note', kind: 'pick', read: 'card',
      setup: 'A bottle washed up with a note inside! A friend wants to meet us. Where do we go?',
      title: '💌 a note', lines: ['the rock'],
      opts: [{ emoji: '🌴', label: 'palm' }, { emoji: '🪨', label: 'rock', ok: 1 }, { emoji: '🏠', label: 'hut' }, { emoji: '⛺', label: 'tent' }],
      oops: PENGUIN, payoff: PAYOFF_NOTE, power: POW.secret },
    { id: 'l-parcel-fox', t: 'little', lv: 1, skin: 'parcel', kind: 'pick', read: 'card',
      setup: 'Postman Captain! This parcel has a name on it. Who is it for?',
      title: '📦', lines: ['fox'],
      opts: [{ emoji: '🐶', label: 'dog' }, { emoji: '🦊', label: 'fox', ok: 1 }, { emoji: '🐸', label: 'frog' }],
      oops: DOG, payoff: PAYOFF_PARCEL, power: POW.helper },
    { id: 'l-market-fish', t: 'little', lv: 1, skin: 'market', kind: 'seq', ordered: false,
      setup: 'We are at the harbor market! The shopping list says what to buy.',
      title: '🛒 list', lines: ['fish', 'apple'], pre: '🧺',
      items: [{ id: 'fish', label: 'fish', emoji: '🐟' }, { id: 'sock', label: 'sock', emoji: '🧦' }, { id: 'apple', label: 'apple', emoji: '🍎' }, { id: 'carrot', label: 'carrot', emoji: '🥕' }],
      order: ['fish', 'apple'], oops: INK, payoff: PAYOFF_LIST, power: POW.shop },
    { id: 'l-recipe-eggmilk', t: 'little', lv: 2, skin: 'recipe', kind: 'seq', ordered: true,
      setup: 'The cook needs help making pancakes! Follow the recipe card, one by one.',
      title: '🥞 recipe', lines: ['egg', 'milk'], pre: '🥣',
      items: [{ id: 'milk', label: 'milk', emoji: '🥛' }, { id: 'sock', label: 'sock', emoji: '🧦' }, { id: 'egg', label: 'egg', emoji: '🥚' }, { id: 'fish', label: 'fish', emoji: '🐟' }],
      order: ['egg', 'milk'], oops: FLOUR, payoff: PAYOFF_COOK, power: POW.cook },
    { id: 'l-pot-cool', t: 'little', lv: 2, skin: 'plate', kind: 'pick', read: 'opts',
      setup: 'Two pots sit by the stove. Which pot is safe to touch?',
      opts: [{ text: 'hot', emoji: '🔥', col: '#d62828' }, { text: 'cool', emoji: '❄️', col: '#1d6fd1', ok: 1 }],
      oops: STEAM, payoff: 'You read the sign, so your fingers stayed safe! Readers stay safe.', power: POW.safe },
    { id: 'l-parcel-frog', t: 'little', lv: 2, skin: 'parcel', kind: 'pick', read: 'card',
      setup: 'Another parcel for the post! Read the name and find the right house.',
      title: '📦', lines: ['frog'],
      opts: [{ emoji: '🐱', label: 'cat' }, { emoji: '🐰', label: 'rabbit' }, { emoji: '🐸', label: 'frog', ok: 1 }, { emoji: '🐶', label: 'dog' }],
      oops: DOG, payoff: PAYOFF_PARCEL, power: POW.helper },
    { id: 'l-map-rockpalm', t: 'little', lv: 2, skin: 'map', kind: 'seq', ordered: true,
      setup: 'Here is the treasure map! Follow the words in order.',
      title: '🗺️ map', lines: ['rock', 'palm'], pre: '🧭',
      items: [{ id: 'palm', label: 'palm', emoji: '🌴' }, { id: 'shell', label: 'shell', emoji: '🐚' }, { id: 'rock', label: 'rock', emoji: '🪨' }, { id: 'cactus', label: 'cactus', emoji: '🌵' }],
      order: ['rock', 'palm'], oops: CRAB, payoff: PAYOFF_MAP, power: POW.finder },
    { id: 'l-sign-stop', t: 'little', lv: 3, skin: 'plate', kind: 'pick', read: 'opts',
      setup: 'Beep beep! A wheelbarrow is rolling down the dock. Which sign says to wait?',
      opts: [{ text: 'go', emoji: '🟢', col: '#2a9d3f' }, { text: 'stop', emoji: '🛑', col: '#d62828', ok: 1 }],
      oops: [['🛒', 'Whoosh! The wheelbarrow zoomed past your nose! Wheee! Try again.']],
      payoff: 'You read STOP, so you stayed safe on the dock! Readers stay safe.', power: POW.safe },
    { id: 'l-market-three', t: 'little', lv: 3, skin: 'market', kind: 'seq', ordered: false,
      setup: 'Back at the market! This list is longer. Read it and fill the basket.',
      title: '🛒 list', lines: ['fish', 'egg', 'apple'], pre: '🧺',
      items: [{ id: 'bread', label: 'bread', emoji: '🍞' }, { id: 'egg', label: 'egg', emoji: '🥚' }, { id: 'fish', label: 'fish', emoji: '🐟' }, { id: 'sock', label: 'sock', emoji: '🧦' }, { id: 'apple', label: 'apple', emoji: '🍎' }, { id: 'carrot', label: 'carrot', emoji: '🥕' }],
      order: ['fish', 'egg', 'apple'], oops: INK, payoff: PAYOFF_LIST, power: POW.shop },

    /* ---------- BIG ---------- */
    { id: 'b-sign-cove', t: 'big', lv: 1, skin: 'sign', kind: 'pick', read: 'opts',
      setup: 'Captain, the path splits! One way goes to the treasure and the other goes somewhere else. Read the signs and choose!',
      opts: [{ text: 'crab beach', dir: 'l' }, { text: 'treasure cove', dir: 'r', ok: 1 }],
      oops: CRAB, payoff: PAYOFF_SIGN, power: POW.finder },
    { id: 'b-bottle-juice', t: 'big', lv: 1, skin: 'bottle', kind: 'pick', read: 'opts',
      setup: 'The ship cook is thirsty. Two bottles on the shelf look just the same. Read the labels and find the juice!',
      opts: [{ text: 'orange juice', col: '#ff9f1c', ok: 1 }, { text: 'dish soap', col: '#ff9f1c' }],
      oops: BUBBLES, payoff: PAYOFF_LABEL, power: POW.safe },
    { id: 'b-note-tree', t: 'big', lv: 1, skin: 'note', kind: 'pick', read: 'card',
      setup: 'A bottle washed up on the sand with a note inside! Read it and go to the right place on the map.',
      title: '💌 message in a bottle', lines: ['meet me by the big tree.'],
      opts: [{ emoji: '🪨', label: 'rock' }, { emoji: '⛺', label: 'tent' }, { emoji: '🌳', label: 'tree', ok: 1 }, { emoji: '🏠', label: 'hut' }],
      oops: PENGUIN, payoff: PAYOFF_NOTE, power: POW.secret },
    { id: 'b-parcel-pond', t: 'big', lv: 1, skin: 'parcel', kind: 'pick', read: 'card',
      setup: 'Postman Captain, a parcel needs delivering! Read the tag and choose the right home.',
      title: '📦 parcel', lines: ['for the frog at the pond.'],
      opts: [{ emoji: '🐶', label: 'hill' }, { emoji: '🐸', label: 'pond', ok: 1 }, { emoji: '🐱', label: 'boat' }, { emoji: '🐰', label: 'hut' }],
      oops: DOG, payoff: PAYOFF_PARCEL, power: POW.helper },
    { id: 'b-recipe-eggmilk', t: 'big', lv: 1, skin: 'recipe', kind: 'seq', ordered: true,
      setup: 'The ship cook needs help with the pancakes! Read the recipe card and add things in the right order.',
      title: '🥞 pancakes', lines: ['first, crack an egg.', 'then, add the milk.'], pre: '🥣',
      items: [{ id: 'milk', label: 'milk', emoji: '🥛' }, { id: 'salt', label: 'salt', emoji: '🧂' }, { id: 'egg', label: 'egg', emoji: '🥚' }, { id: 'banana', label: 'banana', emoji: '🍌' }],
      order: ['egg', 'milk'], oops: FLOUR, payoff: PAYOFF_COOK, power: POW.cook },
    { id: 'b-market-list', t: 'big', lv: 2, skin: 'market', kind: 'seq', ordered: false,
      setup: 'Welcome to the harbor market! Read the shopping list, then buy just those things.',
      title: '🛒 shopping list', lines: ['buy a fish, a loaf and an apple.'], pre: '🧺',
      items: [{ id: 'cheese', label: 'cheese', emoji: '🧀' }, { id: 'fish', label: 'fish', emoji: '🐟' }, { id: 'banana', label: 'banana', emoji: '🍌' }, { id: 'loaf', label: 'loaf', emoji: '🍞' }, { id: 'carrot', label: 'carrot', emoji: '🥕' }, { id: 'apple', label: 'apple', emoji: '🍎' }],
      order: ['fish', 'loaf', 'apple'], oops: INK, payoff: PAYOFF_LIST, power: POW.shop },
    { id: 'b-map-rockpalm', t: 'big', lv: 2, skin: 'map', kind: 'seq', ordered: true,
      setup: 'This old treasure map has directions! Read them and tap the places in the right order.',
      title: '🗺️ directions', lines: ['walk past the rock.', 'then dig by the palm.'], pre: '🧭',
      items: [{ id: 'cactus', label: 'cactus', emoji: '🌵' }, { id: 'palm', label: 'palm', emoji: '🌴' }, { id: 'shell', label: 'shell', emoji: '🐚' }, { id: 'rock', label: 'rock', emoji: '🪨' }],
      order: ['rock', 'palm'], oops: CRAB, payoff: PAYOFF_MAP, power: POW.finder },
    { id: 'b-door-pantry', t: 'big', lv: 2, skin: 'plate', kind: 'pick', read: 'opts',
      setup: 'The cook says: please fetch a snack from the safe place. There are two doors. Read the signs and choose the safe one!',
      opts: [{ text: 'danger: hot oven', emoji: '🔥', col: '#d62828' }, { text: 'pantry: snacks', emoji: '🍪', col: '#2a9d3f', ok: 1 }],
      oops: STEAM, payoff: 'You read the sign, so you went through the safe door! Readers stay safe.', power: POW.safe },
    { id: 'b-parcel-boat', t: 'big', lv: 2, skin: 'parcel', kind: 'pick', read: 'card',
      setup: 'Two animals could be right, so read the whole tag with care!',
      title: '📦 parcel', lines: ['for the cat on the boat.'],
      opts: [{ emoji: '🐱', label: 'hill' }, { emoji: '🐶', label: 'boat' }, { emoji: '🐸', label: 'pond' }, { emoji: '🐱', label: 'boat', ok: 1 }],
      oops: DOG, payoff: PAYOFF_PARCEL, power: POW.helper },
    { id: 'b-recipe-pancakes', t: 'big', lv: 3, skin: 'recipe', kind: 'seq', ordered: true,
      setup: 'Big pancake day! This recipe has three steps. Read the card and tap the steps in order.',
      title: '🥞 pancake recipe', lines: ['mix the flour and the milk.', 'pour it in the hot pan.', 'flip the pancake!'], pre: '🥣',
      items: [{ id: 'flip', label: 'flip', emoji: '🥞' }, { id: 'sock', label: 'sock', emoji: '🧦' }, { id: 'mix', label: 'mix', emoji: '🥣' }, { id: 'pan', label: 'pan', emoji: '🍳' }],
      order: ['mix', 'pan', 'flip'], oops: FLOUR, payoff: PAYOFF_COOK, power: POW.cook },
    { id: 'b-note-palm', t: 'big', lv: 3, skin: 'note', kind: 'pick', read: 'card',
      setup: 'Another secret note! Read every word, because the first place is a trick.',
      title: '💌 secret note', lines: ['the treasure is not by the rock.', 'dig under the tall palm.'],
      opts: [{ emoji: '🪨', label: 'rock' }, { emoji: '🌳', label: 'tree' }, { emoji: '⛺', label: 'tent' }, { emoji: '🌴', label: 'palm', ok: 1 }],
      oops: PENGUIN, payoff: 'You read every word, so you dug in the right place! Readers get secret messages.', power: POW.secret },
    { id: 'b-sign-open', t: 'big', lv: 3, skin: 'sign', kind: 'pick', read: 'opts',
      setup: 'Two paths again! One is shut. Read the signs and pick the way that is open.',
      opts: [{ text: 'bat cave: closed today', dir: 'r' }, { text: 'treasure path: open', dir: 'l', ok: 1 }],
      oops: [['🦇', 'Flap flap! A sleepy bat says the cave is closed! Try again.']],
      payoff: PAYOFF_SIGN, power: POW.finder },
    { id: 'b-bottle-water', t: 'big', lv: 3, skin: 'bottle', kind: 'pick', read: 'opts',
      setup: 'The crew is thirsty after a long sail. Which bottle is good to drink? Read the labels with care.',
      opts: [{ text: 'sea water: do not drink', col: '#4cc3ff' }, { text: 'fresh water: safe to drink', col: '#4cc3ff', ok: 1 }],
      oops: [['🧂', 'Blech! Salty splash! That was the sea water. Try again.']],
      payoff: PAYOFF_LABEL, power: POW.safe }
  ];

  /* ---------------- helpers ---------------- */
  function h(tag, cls, text, attrs) {
    var a = attrs || {};
    if (cls) { a['class'] = cls; }
    if (text != null && text !== '') { a.text = text; }
    return RG.el(tag, a);
  }
  function shuffle(a) { return RG.shuffle ? RG.shuffle(a) : a.slice().sort(function () { return Math.random() - 0.5; }); }

  function seenKey(ctx) {
    var id = (ctx.profile && ctx.profile.id) || 'x';
    return 'rq_seen_' + id;
  }
  function loadSeen(ctx) {
    try { return JSON.parse(localStorage.getItem(seenKey(ctx)) || '[]') || []; } catch (e) { return []; }
  }
  function saveSeen(ctx, list) {
    try { localStorage.setItem(seenKey(ctx), JSON.stringify(list.slice(-40))); } catch (e) { /* ignore */ }
  }

  function chooseScenes(track, level, count, seen) {
    var pool = SCENES.filter(function (s) { return s.t === track && s.lv <= level; });
    if (pool.length < count) { pool = SCENES.filter(function (s) { return s.t === track; }); }
    var scored = pool.map(function (s) {
      return { s: s, sc: (seen.indexOf(s.id) >= 0 ? 2 : 0) + (s.lv < level ? 1 : 0) + Math.random() * 0.9 };
    }).sort(function (a, b) { return a.sc - b.sc; });
    var out = [], skins = {};
    scored.forEach(function (x) {
      if (out.length < count && !skins[x.s.skin]) { out.push(x.s); skins[x.s.skin] = 1; }
    });
    scored.forEach(function (x) {
      if (out.length < count && out.indexOf(x.s) < 0) { out.push(x.s); }
    });
    return out.sort(function (a, b) { return a.lv - b.lv; });
  }

  /* ---------------- the game ---------------- */
  RG.registerGame({
    id: 'reading-quest',
    title: 'Reading Quest',
    emoji: '🗺️',
    tracks: ['little', 'big'],
    skill: 'real-world',
    blurb: 'Read the signs, notes and recipes to win each mission!',
    mount: function (container, ctx) {
      if (!document.getElementById(STYLE_ID)) {
        var st = document.createElement('style');
        st.id = STYLE_ID; st.textContent = CSS; document.head.appendChild(st);
      }
      var track = (ctx.profile && ctx.profile.track === 'big') ? 'big' : 'little';
      var little = track === 'little';
      var alive = true, timers = [], listeners = [];
      var seen = loadSeen(ctx);
      var total = ctx.rounds || 5;
      var scenes = chooseScenes(track, ctx.level || 1, total, seen);
      total = scenes.length;
      var wrap = h('div', 'rq-wrap');
      container.appendChild(wrap);

      var collected = [];
      var before = [];
      try { if (RG.superpowers && RG.superpowers.list) { before = (RG.superpowers.list() || []).map(function (p) { return p && p.id; }); } } catch (e) { before = []; }

      // per-round state
      var ri = -1, rid = 0, sc = null, misses = 0, done = false, locked = false, readDone = false;
      var selected = null, pos = 0, entries = [], slotEls = [], hearBtn = null, oopsEl = null, finished = false;

      function later(fn, ms) {
        var id = setTimeout(function () {
          var i = timers.indexOf(id); if (i >= 0) { timers.splice(i, 1); }
          if (alive) { fn(); }
        }, ms);
        timers.push(id);
        return id;
      }
      function on(el, ev, fn) { el.addEventListener(ev, fn); listeners.push([el, ev, fn]); }
      function say(t) {
        try { return Promise.resolve(RG.speak(t)).catch(function () {}); } catch (e) { return Promise.resolve(); }
      }
      function sfx(n) { try { RG.sfx[n](); } catch (e) { /* ignore */ } }

      function tipText() {
        if (sc.read === 'opts') { return 'Tap one to hear it, then press Go!'; }
        if (sc.kind === 'seq') { return 'Tap the card to hear it!'; }
        return 'Tap the card to hear it!';
      }
      function readText() {
        if (sc.read === 'opts') {
          return sc.opts.map(function (o, i) { return (i === 0 ? 'The first one says: ' : 'The next one says: ') + o.text + '.'; }).join(' ');
        }
        return 'Let me read it for you. ' + sc.lines.join(' ');
      }
      function setupSpeech() { return sc.setup + (little ? ' ' + tipText() : ''); }

      /* ---- card ---- */
      function cardEl() {
        var card = h('div', 'rq-card rq-card-' + sc.skin);
        card.appendChild(h('div', 'rq-ctitle', sc.title));
        sc.lines.forEach(function (l) { card.appendChild(h('div', 'rq-line', l)); });
        hearBtn = h('button', 'rq-hear' + (little ? '' : ' rq-hide'), '🔊', { type: 'button', 'aria-label': 'hear it' });
        on(hearBtn, 'click', function () { say(sc.lines.join(' ')); });
        card.appendChild(hearBtn);
        if (little) { on(card, 'click', function (e) { if (e.target !== hearBtn) { say(sc.lines.join(' ')); } }); }
        return card;
      }

      /* ---- pick scenes ---- */
      function optButton(o) {
        var b, inner;
        if (sc.skin === 'sign') {
          b = h('button', 'rq-opt rq-plank ' + (o.dir === 'l' ? 'l' : 'r'), '', { type: 'button' });
          if (little && o.emoji) { b.appendChild(h('span', 'rq-pe', o.emoji)); }
          b.appendChild(h('span', 'rq-pt', o.text));
        } else if (sc.skin === 'bottle') {
          b = h('button', 'rq-opt rq-bottle', '', { type: 'button', 'aria-label': 'bottle ' + o.text });
          b.style.setProperty('--liq', o.col || '#ff9f1c');
          inner = h('div', 'rq-blabel');
          if (little && o.emoji) { inner.appendChild(h('span', 'rq-be', o.emoji)); }
          inner.appendChild(document.createTextNode(o.text));
          b.appendChild(h('div', 'rq-cork')); b.appendChild(h('div', 'rq-neck'));
          var body = h('div', 'rq-body'); body.appendChild(inner); b.appendChild(body);
        } else if (sc.skin === 'plate') {
          b = h('button', 'rq-opt rq-plate' + (o.col === '#f4b400' ? ' dark' : ''), '', { type: 'button' });
          b.style.setProperty('--pc', o.col || '#d62828');
          if (o.emoji) { b.appendChild(h('span', 'rq-pe', o.emoji)); }
          b.appendChild(h('span', '', o.text));
        } else {
          b = h('button', 'rq-opt rq-spot', '', { type: 'button', 'aria-label': o.label });
          b.appendChild(h('span', 'rq-spe', o.emoji));
          if (!little) { b.appendChild(h('span', 'rq-spl', o.label)); }
        }
        b.setAttribute('data-ok', o.ok ? '1' : '0');
        return b;
      }

      function buildPick() {
        var art = h('div', 'rq-art');
        var holder;
        if (sc.read === 'opts') {
          holder = h('div', sc.skin === 'sign' ? 'rq-signpost' : (sc.skin === 'bottle' ? 'rq-shelf' : 'rq-plates'));
        } else {
          art.appendChild(cardEl());
          holder = h('div', 'rq-isle');
        }
        var opts = sc.opts.slice();
        opts.forEach(function (o) {
          var b = optButton(o);
          var ow = h('div', 'rq-ow');
          ow.appendChild(b);
          var go = null;
          if (little && sc.read === 'opts') {
            go = h('button', 'rq-go', '✔ Go!', { type: 'button' });
            ow.appendChild(go);
          }
          var entry = { o: o, ow: ow, btn: b };
          entries.push(entry);
          on(b, 'click', function () {
            if (locked || done) { return; }
            if (little && sc.read === 'opts') {
              entries.forEach(function (x) { x.ow.classList.remove('sel'); });
              ow.classList.add('sel'); selected = entry;
              say(o.text);
              return;
            }
            commit(entry);
          });
          if (go) { on(go, 'click', function () { if (!locked && !done) { commit(entry); } }); }
          holder.appendChild(ow);
        });
        art.appendChild(holder);
        return art;
      }

      function commit(entry) {
        if (entry.o.ok) { correct(entry.ow); } else { miss(entry.ow); }
      }

      /* ---- seq scenes ---- */
      function buildSeq() {
        var art = h('div', 'rq-art');
        art.appendChild(cardEl());
        var slots = h('div', 'rq-slots');
        slots.appendChild(h('span', 'rq-slotpre', sc.pre));
        slotEls = [];
        sc.order.forEach(function () { var s = h('div', 'rq-st', ''); slotEls.push(s); slots.appendChild(s); });
        art.appendChild(slots);
        var toks = h('div', 'rq-toks rq-toks-' + sc.skin);
        sc.items.forEach(function (it) {
          var idx = sc.order.indexOf(it.id);
          var b = h('button', 'rq-tok', '', { type: 'button', 'aria-label': it.label });
          b.appendChild(h('span', 'rq-te', it.emoji));
          b.appendChild(h('span', 'rq-tl', it.label));
          b.setAttribute('data-seq', idx < 0 ? 'x' : (sc.ordered === false ? '0' : String(idx)));
          var ow = h('div', 'rq-ow'); ow.appendChild(b);
          var entry = { it: it, ow: ow, btn: b };
          entries.push(entry);
          on(b, 'click', function () { seqTap(entry); });
          toks.appendChild(ow);
        });
        art.appendChild(toks);
        return art;
      }

      function seqTap(entry) {
        if (locked || done || entry.btn.classList.contains('used')) { return; }
        var id = entry.it.id;
        var ok = sc.ordered === false ? sc.order.indexOf(id) >= 0 : sc.order[pos] === id;
        if (little) { say(entry.it.label); }
        if (!ok) { miss(entry.ow); return; }
        entry.btn.classList.add('used');
        var s = slotEls[pos];
        if (s) { s.textContent = entry.it.emoji; s.classList.add('full'); }
        pos++;
        sfx('pop');
        if (pos >= sc.order.length) { correct(entry.ow); } else { applyHint(); }
      }

      /* ---- hints and outcomes ---- */
      function applyHint() {
        entries.forEach(function (e) { e.ow.classList.remove('rq-hint'); });
        if (hearBtn) { hearBtn.classList.remove('rq-hint'); }
        if (misses < 2 || done) { return; }
        if (sc.kind === 'pick') {
          entries.forEach(function (e) { if (e.o.ok) { e.ow.classList.add('rq-hint'); } });
        } else {
          entries.forEach(function (e) {
            if (e.btn.classList.contains('used')) { return; }
            var want = sc.ordered === false ? sc.order.indexOf(e.it.id) >= 0 : sc.order[pos] === e.it.id;
            if (want) { e.ow.classList.add('rq-hint'); }
          });
        }
      }

      function showOops() {
        var list = (sc.oops && sc.oops.length) ? sc.oops : CRAB;
        var o = list[(misses - 1) % list.length];
        oopsEl = h('div', 'rq-oops');
        var fx = h('div', 'rq-fx');
        for (var i = 0; i < 6; i++) {
          var sp = h('span', '', o[0]);
          sp.style.left = (6 + i * 16) + '%';
          sp.style.animationDelay = (i * 0.3) + 's';
          fx.appendChild(sp);
        }
        oopsEl.appendChild(fx);
        oopsEl.appendChild(h('div', 'rq-oemoji', o[0]));
        oopsEl.appendChild(h('div', 'rq-otext', o[1]));
        wrap.appendChild(oopsEl);
        say(o[1]);
      }

      function miss(ow) {
        misses++; locked = true;
        try { ctx.answer(false); } catch (e) { /* ignore */ }
        try { RG.wobble(ow); } catch (e2) { /* ignore */ }
        showOops();
        var my = rid;
        later(function () {
          if (my !== rid) { return; }
          if (oopsEl && oopsEl.parentNode) { oopsEl.parentNode.removeChild(oopsEl); }
          oopsEl = null;
          locked = false;
          if (misses >= 2) {
            if (hearBtn) { hearBtn.classList.remove('rq-hide'); }
            if (!readDone) { readDone = true; say(readText()); }
            applyHint();
          }
        }, 2400);
      }

      function correct(ow) {
        if (done) { return; }
        done = true; locked = true;
        try { ctx.answer(true); } catch (e) { /* ignore */ }
        ow.classList.remove('rq-hint'); ow.classList.add('rq-correct');
        try { RG.celebrate(ow); } catch (e2) { /* ignore */ }
        try { ctx.roundDone(); } catch (e3) { /* ignore */ }
        if (seen.indexOf(sc.id) < 0) { seen.push(sc.id); saveSeen(ctx, seen); }
        var p = sc.power;
        if (!collected.some(function (c) { return c.id === p[0]; })) {
          collected.push({ id: p[0], label: p[1], emoji: p[2] });
        }
        if (RG.superpowers) { try { RG.superpowers.add(p[0], p[1], p[2]); } catch (e4) { /* ignore */ } }
        var my = rid;
        later(function () { if (my === rid) { showAfter(); } }, 1100);
      }

      function showAfter() {
        wrap.innerHTML = '';
        var p = sc.power;
        var last = ri >= scenes.length - 1;
        var after = h('div', 'rq-after');
        after.appendChild(h('div', 'rq-parrot', '🦜'));
        after.appendChild(h('div', 'rq-payoff', sc.payoff));
        var card = h('div', 'rq-power');
        card.appendChild(h('span', 'rq-pe2', p[2]));
        var tx = h('div', '');
        tx.appendChild(h('div', 'rq-pcap', '🦸 Reading Superpower!'));
        tx.appendChild(h('div', '', p[1]));
        card.appendChild(tx);
        after.appendChild(card);
        var nb = h('button', 'btn primary rq-next', last ? 'See my superpowers ▶' : 'Next mission ▶', { type: 'button' });
        on(nb, 'click', function () { nb.disabled = true; nextRound(); });
        after.appendChild(nb);
        wrap.appendChild(after);
        var my = rid;
        ctx.onReplay = function () { say(sc.payoff + ' ' + p[1]); };
        say(sc.payoff).then(function () { if (alive && my === rid) { return say(p[1]); } });
      }

      /* ---- rounds ---- */
      function startScene(s) {
        rid++; sc = s; misses = 0; done = false; locked = false; readDone = false;
        selected = null; pos = 0; entries = []; slotEls = []; hearBtn = null; oopsEl = null;
        wrap.innerHTML = '';
        var narr = h('div', 'rq-narr');
        narr.appendChild(h('div', 'rq-parrot', '🦜'));
        var bub = h('div', 'rq-bubble', sc.setup);
        if (little) { bub.appendChild(h('span', 'rq-tip', tipText())); }
        narr.appendChild(bub);
        wrap.appendChild(narr);
        wrap.appendChild(sc.kind === 'seq' ? buildSeq() : buildPick());
        ctx.onReplay = function () {
          say(setupSpeech() + (misses >= 2 ? ' ' + readText() : ''));
        };
        say(setupSpeech());
      }

      function nextRound() {
        ri++;
        if (ri >= scenes.length) { finale(); } else { startScene(scenes[ri]); }
      }

      function finale() {
        rid++;
        wrap.innerHTML = '';
        var box = h('div', 'rq-final');
        box.appendChild(h('div', 'rq-parrot', '🦜'));
        box.appendChild(h('h2', '', '🦸 Your Reading Superpowers!'));
        var grid = h('div', 'rq-powers');
        collected.forEach(function (c) {
          var card = h('div', 'rq-power');
          card.appendChild(h('span', 'rq-pe2', c.emoji));
          var tx = h('div', '', c.label);
          if (before.indexOf(c.id) < 0) { tx.appendChild(h('span', 'rq-new', 'NEW')); }
          card.appendChild(tx);
          grid.appendChild(card);
        });
        box.appendChild(grid);
        var totalUnlocked = collected.length;
        try {
          if (RG.superpowers && RG.superpowers.list) { totalUnlocked = Math.max(totalUnlocked, (RG.superpowers.list() || []).length); }
        } catch (e) { /* ignore */ }
        box.appendChild(h('div', 'rq-payoff', 'You have ' + totalUnlocked + ' reading superpower' + (totalUnlocked === 1 ? '' : 's') + '! Reading helps you find, cook, stay safe and share secrets.'));
        var fb = h('button', 'btn primary rq-next', '⚓ Finish', { type: 'button' });
        on(fb, 'click', function () {
          if (finished) { return; }
          finished = true; fb.disabled = true;
          ctx.finish();
        });
        box.appendChild(fb);
        wrap.appendChild(box);
        var line = 'You collected ' + collected.length + ' reading superpower' + (collected.length === 1 ? '' : 's') + '. ' +
          collected.map(function (c) { return c.label; }).join(' ') + ' Reading is a real superpower!';
        ctx.onReplay = function () { say(line); };
        try { RG.sfx.win(); RG.celebrate(); } catch (e2) { /* ignore */ }
        say(line);
      }

      nextRound();

      return function cleanup() {
        alive = false;
        timers.forEach(function (t) { clearTimeout(t); });
        timers = [];
        listeners.forEach(function (l) { try { l[0].removeEventListener(l[1], l[2]); } catch (e) { /* ignore */ } });
        listeners = [];
        try { RG.stopSpeaking(); } catch (e) { /* ignore */ }
      };
    }
  });
})();
