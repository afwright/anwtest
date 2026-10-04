# Treasure Island Readers — Build Plan & Interface Contract

A play-based reading game for two kids: a **4-year-old (pre-reader)** and a **7-year-old (early reader)**.
Theme: a sailing adventure. Each child captains a boat, sails to islands (mini-games), and collects
treasure (stars, stickers) for every completed voyage.

## Pedagogy (why it's built this way)

| Track | Child | Skills (in order) | Research basis |
|---|---|---|---|
| `little` | 4 yo | letter names → letter sounds → beginning sounds → rhyme awareness → letter formation | Phonological awareness and alphabet knowledge are the two strongest predictors of later reading |
| `big` | 7 yo | CVC decoding → digraphs/blends → Dolch sight words → sentence comprehension → short stories | Systematic phonics + fluency + comprehension (the "Science of Reading") |

Design rules for every game:
1. **Audio first.** Every prompt is spoken aloud (Web Speech API). Every tappable word/letter speaks itself when tapped. A 🔊 "say it again" button is always visible.
2. **No fail states.** A wrong answer gets a gentle wobble + "Try again!" and the right answer is hinted after 2 misses. Never subtract points.
3. **Short sessions.** One voyage = 5 rounds (about 2–4 minutes). Then a treasure screen.
4. **Adaptive.** The core tracks per-skill accuracy; `ctx.level` (1–3) rises after mastery and drops after struggle. Games scale difficulty from it.
5. **Touch-first.** Targets ≥ 72px, no hover-dependence, drag uses Pointer Events (HTML5 drag-and-drop does not work on iPad).

## Tech constraints (all agents)

- Plain HTML/CSS/JS, **no build step, no frameworks, no ES modules** (must work from `file://` and as a static page). Use classic `<script>` tags and IIFEs.
- No external network resources (no CDNs, no web fonts, no image files). Visuals = emoji + CSS + inline SVG.
- Must work in Safari iPad, Chrome Android, and desktop Chrome. Responsive from 360px wide to desktop.
- `localStorage` wrapped in try/catch everywhere (game must still run if it throws).
- Speech: iOS needs a user gesture before `speechSynthesis` works. The app's "Tap to start" screen handles that.
- Colors as CSS custom properties on `:root`. Bright, friendly, high-contrast. Font: `"Comic Sans MS", "Chalkboard SE", "Comic Neue", system-ui, sans-serif`, with a big base size.
- For reading text, use lowercase by default (as early-reader books do) except where capitals are being taught.

## File layout & ownership

```
reading-game/
  index.html            [CORE agent]  shell; loads scripts in this exact order:
                                       js/content.js, js/core.js, js/games/*.js (listed below), js/app.js
  css/style.css         [CORE agent]  global styles + shared component classes (below)
  js/content.js         [CORE agent]  shared word/letter/story data (schema below)
  js/core.js            [CORE agent]  window.RG API (contract below)
  js/app.js             [CORE agent]  start screen, profile picker, island map hub, game host, treasure screen, grown-ups panel
  js/games/letter-pop.js     [LITTLE agent]
  js/games/sound-hunt.js     [LITTLE agent]
  js/games/letter-trace.js   [LITTLE agent]
  js/games/rhyme-boat.js     [LITTLE agent]  (tracks: little + big)
  js/games/word-builder.js   [BIG agent]
  js/games/sight-fishing.js  [BIG agent]
  js/games/sentence-match.js [BIG agent]
  js/games/story-cove.js     [BIG agent]
```

Game agents may write ONLY their own game files. Game-specific data can live inside the game file;
shared data comes from `RG.content`.

## `window.RG` contract (implemented in core.js)

```js
RG.games                       // array of registered game defs, in registration order
RG.registerGame(def)           // def shape below; called at script load time by each game file

// --- speech ---
RG.speak(text, opts?) -> Promise<void>    // opts: {rate=0.85, pitch=1.1}; cancels any current utterance first;
                                          // resolves on end (or after a timeout fallback if speech is unavailable)
RG.sayLetter(letter) -> Promise           // speaks the letter NAME, e.g. "bee"
RG.sayLetterSound(letter) -> Promise      // speaks the phonics hint, e.g. "b says buh, like ball"
                                          // (uses RG.content.letters[].sound + .word)
RG.stopSpeaking()

// --- feedback ---
RG.sfx.correct(); RG.sfx.wrong(); RG.sfx.pop(); RG.sfx.win()   // short WebAudio tones, no audio files
RG.celebrate(targetEl?)        // confetti/emoji burst over the screen (or from targetEl)
RG.wobble(el)                  // gentle shake animation for wrong answers
RG.praise() -> string          // random: "Great job!", "You did it!", "Awesome reading!", ...  (also spoken by caller if desired)

// --- helpers ---
RG.el(tag, attrs?, ...children) -> HTMLElement  // attrs: {class, text, html, style, on:{click:fn}, ...dataset/aria/other attrs}
RG.shuffle(arr) -> new array
RG.pick(arr, n) -> n random distinct items (new array)
RG.sample(arr) -> one random item
RG.wait(ms) -> Promise
RG.emojiFor(word) -> string | ''          // lookup in RG.content.emoji
RG.makeDraggable(el, {onDrop(el, dropTarget) , dropTargets: () => Element[]})
                                          // Pointer-Events drag; on release over a target calls onDrop, else snaps back

// --- progress (per active profile, persisted in localStorage) ---
RG.profile() -> {id, name, track: 'little'|'big', avatar}
RG.progress.record(skillId, correct:boolean)   // updates rolling accuracy (last 10 attempts)
RG.progress.level(skillId) -> 1|2|3            // starts 1; up when last 8 ≥ 85% correct; down when < 50%
RG.progress.stars() -> number
```

### Game definition & lifecycle

```js
RG.registerGame({
  id: 'letter-pop',             // unique, matches filename
  title: 'Letter Pop',
  emoji: '🎈',                  // island icon on the map
  tracks: ['little'],           // which profiles see it on the map
  skill: 'letters',             // skillId used for RG.progress
  blurb: 'Pop the balloon with the letter you hear!',   // spoken when island is tapped
  mount(container, ctx) {       // container: empty <div class="game-stage"> sized to the play area
    // build UI inside container, run rounds...
    return function cleanup() { /* remove timers/listeners, RG.stopSpeaking() */ };
  }
});
```

`ctx` provided by app.js:
```js
ctx.level        // 1|2|3 from RG.progress.level(def.skill) at mount time
ctx.rounds       // 5
ctx.profile      // RG.profile()
ctx.answer(correct:boolean)   // call once per ATTEMPT; records progress + plays sfx. Does not advance rounds.
ctx.roundDone()  // call when a round is finished (after the correct answer); updates the 5-dot progress bar
ctx.finish()     // call after the last round; app shows the treasure screen (stars awarded = rounds) and unmounts
ctx.exit()       // abandon to map (the app also renders its own ⬅ back button outside the container)
```
The app renders the header (back button, 🔊 replay button, 5-dot round tracker) **outside** `container`.
The 🔊 button calls `ctx.onReplay` if the game sets it: `ctx.onReplay = () => RG.speak(currentPrompt)`.

## Shared CSS classes (style.css, available to all games)

- `.game-stage` — flex column, centered, fills play area
- `.prompt` — big friendly prompt text (≈ 2rem)
- `.choices` — responsive flex-wrap grid of choice buttons, gap 16px
- `.choice` — big rounded tappable card (min 88×88px, ≈ 2.5rem text), white bg, thick colored border, press animation
- `.choice.correct` (green glow), `.choice.wrong` (wobble), `.choice.hint` (pulsing glow)
- `.big-emoji` — ≈ 5rem emoji display
- `.word` — reading-text style (large, wide letter spacing, lowercase)
- `.slot` — empty drop slot (dashed border, same size as `.choice`)
- `.btn` / `.btn.primary` — standard buttons
- `.wobble`, `.bounce`, `.float` — animation utilities

## `RG.content` schema (content.js)

```js
RG.content = {
  letters: [ {letter:'a', sound:'ah', word:'apple', emoji:'🍎'}, ... all 26, short vowel sounds, simple
             speakable sounds: b:'buh', c:'kuh', ... x:'ks', q:'kwuh' ],
  cvcWords: [ {word:'cat', emoji:'🐱'}, ... ≥ 45 picturable CVC words covering all 5 short vowels ],
  digraphWords: [ {word:'ship', emoji:'🚢', pattern:'sh'}, ... ≥ 20 across sh, ch, th, wh, ck, and blends
                  (fr, st, sn, tr, fl, cl, gr, bl) ],
  rhymeFamilies: { at:['cat','hat','bat','mat','rat'], og:['dog','log','frog'], ... ≥ 8 families,
                   every word picturable and present in RG.content.emoji },
  sightWords: { level1:[...Dolch pre-primer], level2:[...primer], level3:[...first grade] },
  sentences: [ {text:'the cat sat on a mat.', emoji:'🐱', distractors:['🐶','🐸'], level:1}, ...
               ≥ 8 per level 1–3; level 1 = CVC + sight words, level 3 = two short sentences ],
  stories: [ { title:'Sam and the Big Fish', level:1, pages:[{text:'sam has a red boat.', emoji:'⛵'}, ...4–6 pages],
               questions:[{q:'what color is the boat?', options:['red','blue','green'], answer:'red'}, ...2–3] },
             ... ≥ 6 stories, 2 per level, sailing/sea/animal themes ],
  emoji: { cat:'🐱', hat:'🎩', ... every picturable word used anywhere above }
};
```

## Game specs

### LITTLE track (4 yo)
- **letter-pop** 🎈 (skill `letters`): balloons with letters float up; voice says "Find the letter B!". Tap the right balloon → pop + celebrate. L1: 3 balloons, uppercase, letters from a starter set (s a t p i n m d). L2: 4 balloons, all letters. L3: 5 balloons, lowercase, with "letter sound" prompts ("Find the letter that says buh").
- **sound-hunt** 🔍 (skill `beginning-sounds`): show a big emoji picture (from `letters[].emoji` / cvcWords); voice: "Ball. What sound does ball start with?" Choose from letter cards (tapping a card says its sound). L1: 2 choices, L2: 3, L3: 4 including similar sounds (b/d/p).
- **letter-trace** ✏️ (skill `writing`): big dotted letter guide drawn on a canvas; the child traces it with a finger and leaves a colorful sparkle trail. Track coverage of guide points (generous tolerance); ≥ 70% coverage → celebrate. Speak the letter name + sound before and after. L1 uppercase straight-line letters (L, T, I, E, F, H), L2 all uppercase, L3 lowercase.
- **rhyme-boat** ⛵ (skill `rhyme`, tracks little+big): a boat shows a picture word ("cat"); 3 picture cards on the dock; "Which one rhymes with cat?" Tap or drag the rhyming one into the boat. For `big` profile, show the written word under each picture and use L2+ distractors that share a first letter.

### BIG track (7 yo)
- **word-builder** 🧱 (skill `phonics`): show an emoji + speak the word ("Build the word: fish"). Letter tiles (shuffled, plus 1–2 extra distractor letters) are dragged into slots (use `RG.makeDraggable`; also support tap-a-tile → it fills the next empty slot). Tapping a tile says its sound. L1 CVC, L2 digraphs/blends, L3 CVCe/longer words (e.g. cake, bike, rope, frog, crab, ship, chest).
- **sight-fishing** 🎣 (skill `sight-words`): fish swim across a sea with words on them; voice: "Catch the word the!" Tap the right fish → it jumps into the bucket. Levels map to sightWords.level1–3. 4–5 fish swimming at a time, CSS animation, slow speed.
- **sentence-match** 🖼️ (skill `comprehension`): show a sentence (each word tappable to hear it; a "read it to me" button reads the whole sentence but only after the child has had about 5 seconds to try first); pick the matching picture from 3 emoji. Uses `RG.content.sentences` filtered by level.
- **story-cove** 📖 (skill `fluency`): a page-turning storybook from `RG.content.stories` by level. Each page: big emoji illustration + text; words are tappable (speak the word); a "🔊 read page" button highlights words karaoke-style as they are spoken (onboundary events with a timer fallback). After the last page, 2–3 comprehension questions (each counts as a round; pad to 5 rounds by counting each page turn as a round if needed, i.e. call roundDone so the 5-dot tracker fills sensibly across the voyage).

## App shell (app.js) behavior
1. **Start screen:** big "Tap to start ⛵" (unlocks speech/audio on iOS).
2. **Profile picker:** two default captains, "Little Captain" (track little, avatar 🐣) and "Big Captain" (track big, avatar 🦊). Grown-ups can rename them and change the avatar and track in the grown-ups panel.
3. **Island map:** an ocean background with islands (game emojis) for that profile's track, laid out on a gently wavy path; star count + treasure chest display; the profile's boat bobs. Tapping an island speaks its blurb and launches it.
4. **Game host:** header with ⬅ back, 🔊 replay, 5-dot round tracker; then `div.game-stage` passed to `mount`.
5. **Treasure screen:** after `ctx.finish()`: chest opens, +5 stars, an awarded random sticker (sea-creature emoji) added to the profile's sticker book; buttons "Play again" / "Back to map".
6. **Sticker book:** a page on the map showing collected stickers (motivation loop).
7. **Grown-ups panel** (gear icon; gate: "hold for 3 seconds"): rename profiles, pick avatar, switch track, speech rate slider, per-skill accuracy + level table, reset progress.

## Definition of done
- Opening `reading-game/index.html` in Chromium shows no console errors; every game can be launched, played to completion (5 rounds), and returns to the map.
- Works at 390×844 (phone) and 1024×768 (iPad) with no horizontal scroll.

---

# ADDENDUM v2 — "Why Reading Matters", Quizzes, and Points (BINDING, supersedes above where it conflicts)

## North star
The game must teach **why** reading is important, not just **how** to read. Every child should repeatedly
feel: *"Because I could read that, I got something / helped someone / stayed safe / had fun."*
Reading is the key that unlocks the island. Points reward what reading *achieves*, not reading itself
(avoids the overjustification trap where kids read only for points).

## Points: Gold Coins 🪙 (core.js / app.js — CORE agent)
```js
RG.coins.balance() -> number          // per profile, persisted
RG.coins.add(n, reason?)              // animates a coin burst + counter tick-up in the header
RG.coins.spend(n) -> boolean          // false if insufficient
RG.rank() -> {name, emoji, next, coinsToNext}   // by lifetime coins earned:
   // 0 Deckhand 🧽, 50 Sailor ⚓, 150 First Mate 🧭, 350 Captain 🏴‍☠️, 700 Admiral 👑
```
- `ctx.answer(correct)` automatically awards coins: **3 for a first-try correct, 1 for a later correct, 0 for wrong (never subtract)**.
- Finishing a voyage (`ctx.finish()`) awards a +5 coin bonus on the treasure screen (stars still awarded as before).
- New optional def field `rounds` (number). If set, `ctx.rounds = def.rounds`, otherwise 5. The header round tracker must render `ctx.rounds` dots.
- New `ctx.award(n, reason)` = `RG.coins.add` for game-specific bonuses (e.g. a quiz perfect-score bonus).
- **Harbor Shop** 🏪 (on map): spend coins on boat colors, sails, flags, pets (a parrot or cat on deck) and hats for the avatar. Bought items show on the map boat. Around 12 items, priced 20–200.
- **Rank badge** on the map + rank-up celebration ("You're now a First Mate!").
- Grown-ups panel: show lifetime coins, quiz history (date, score/total, per-skill breakdown).

## Quizzes & tests (new game file — QUEST agent)
**captains-quiz** 🏆 (`js/games/captains-quiz.js`, skill `quiz`, tracks little+big, `rounds: 10`):
- A mixed 10-question test drawing on every skill for the profile's track, generated from RG.content.
  - little: letter ID, letter sound, beginning sound, rhyme, "which sign says STOP?" (picture-supported).
  - big: decode a word → pick the picture, sight word, missing word in a sentence, rhyme, a short-passage comprehension question, a real-world reading question.
- One attempt per question (it's a test): `ctx.answer(correct)` once, then reveal the right answer kindly, then `ctx.roundDone()`.
- End screen *inside the stage* before `ctx.finish()`: score X/10, a trophy tier (🥉 6+, 🥈 8+, 🥇 10), bonus `ctx.award` (10 for 🥇, 5 for 🥈, 2 for 🥉), and "Skills to practice" (which islands to revisit, mapped from missed question types). Persist the result via `RG.quizLog.add({date, track, score, total, bySkill:{skill:[right,total]}})` (CORE implements RG.quizLog.add/list, persisted per profile).
- Framing is always low-stakes: "Captain's Challenge", never "test" or "grade" in kid-facing text.

## "Why Read?" missions (new game file — QUEST agent)
**reading-quest** 🗺️ (`js/games/reading-quest.js`, skill `real-world`, tracks little+big, rounds 5):
Story-driven scenes where reading is *necessary* to succeed, and the consequence of reading (or not) is shown playfully.
Each scene: a short narrator setup, a piece of real-world text, a choice; the payoff explicitly names why reading helped
("You read the sign, so you found the treasure! Readers find things other people miss.").
Scene types (≥ 15 scenes total, tagged by track/level):
- **Signposts:** a fork in the path with two signs ("treasure →", "← crabs"). Read correctly → treasure; wrong → silly crab pinch, then try again.
- **Safety labels:** two bottles on a ship shelf, "juice" vs "soap", or a door marked "hot", "stop", "danger". Reading keeps you safe.
- **Recipe:** the ship's cook needs help making pancakes; read the recipe card and pick the ingredients in order (cooking).
- **Message in a bottle:** a friend's note ("meet me at the big tree") → go to the right place on a mini-map.
- **Shopping list / market:** read a list and buy the right items at the harbor market.
- **Treasure map directions:** "go past the rock, then dig by the palm" → tap in order.
- **Menu / tickets / names:** read the name on a parcel to deliver it to the right animal.
- little track: 1–2 word signs with picture support, read aloud on tap; the "why" is said by the narrator. big track: phrases and short sentences.
- After each scene, a one-line "Reading Superpower" card (e.g. "🦸 Readers stay safe!", "🦸 Readers can cook!", "🦸 Readers get secret messages!"). The superpowers collected are shown at the end of the voyage.

## Map changes (CORE)
- Islands order: reading-quest and captains-quiz appear on both tracks. captains-quiz is drawn as a special "Challenge Island" at the end of the path.
- A "Why Read?" scroll on the map that lists the Reading Superpowers the child has unlocked (`RG.superpowers.add(id, label, emoji)` / `.list()`, persisted per profile, implemented by CORE, used by reading-quest).
