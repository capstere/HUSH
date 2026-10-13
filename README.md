# HUSH. — Love is a light sleeper.

**4.0.0 · AFTER MIDNIGHT · 2026-10-13**

Play: https://capstere.github.io/HUSH/?v=4

A mobile-first, top-down midnight game based on Jesper's bedroom sketch. The sleeper is on the left; you are on the right. Survive from 02:00 to 07:00 in 150 seconds without waking your partner or losing your patience. All sounds are generated locally. No microphone, account, API key, tracking or downloads are required to play.

## Grab the room, not a menu

Grab your hand and drag it left onto their shoulder, or your sock towards their leg. Your grip keeps its original offset, the limbs follow your finger and spring back on release. Faster contact is stronger and riskier. A small ring at the grip shows force. One drag produces at most one contact.

When one eye opens, **FREEZE**. A countdown arc and the status text show the sensitive period. Hitting again can wake the sleeper completely. A loss now leaves time to see their reaction before the result card appears.

Drag the large headphones from the right stand onto your head, or tap **Listen**. The muffled nonsense audiobook protects your patience. Full battery lasts about 15 seconds; docking recharges it in about 22 seconds. Headphones visibly travel between your head and the charging stand. Hold **Shhh** for a short, safe breather.

## New: the cool side

Drag the small mint tab on the left pillow slowly to the right. The pillow flexes, a few feathers float away and the sleeper leans into a quieter position. The effect lasts 17 seconds, with an 18-second cooldown. A rough flip, or moving the pillow while the sleeper is already stirring, raises wake-up risk. It is not an unlimited reset button.

## Nine midnight interruptions

Only one interruption runs at a time. Fart, nightmare and bathroom still appear before the optional events, in a shuffled order. A normal short night does not guarantee every event.

| Interruption | Direct interaction |
|---|---|
| Fart | Swipe the green cloud back and forth; it moves and disperses as you fan. |
| Nightmare | Pop three differently dressed dream creatures. They dissolve into stars at the creature you actually touched. |
| Bathroom | Tap the right-hand door. Hold Tiptoe on green and release on red. A moving timing marker warns of the next creaky board. |
| Sneeze — new | Drag a tissue from the box on the right to your nose before the sneeze escapes. |
| Open window — new | Pull the glowing top window latch down to shut out the breeze. |
| Phone | Tap the buzzing phone on the left table. |
| Cat | Drag the kneading cat to the little rug. |
| Stolen duvet | Pull the right-hand blue edge back to your side. |
| Mosquito | Tap the flying nuisance. The touch target is larger than its illustration. |

## Try everything now

Tap **Try the chaos** on the home screen, or open it through the pause menu. Ten practice scenes include the pillow and all nine interruptions. Practice has **no ticking night clock, no score and no game over**; event countdowns still run so you can learn their timing. **Scenes** switches exercises. **Start a real night** creates a fresh scored round.

The original hands-on tutorial remains available and teaches the hand, foot, waiting and headphones. Skip or replay it from the menu.

## What moves in 4.0

Contact impulses travel through a bounded 19-node cloth simulation. The duvet folds respond locally, the pillow compresses and rebounds, rounded limbs have shadows and short speed trails, and character eyes glance towards your grip. Snoring follows the breathing cycle. Headphones move between their two physical locations; charging pulses and drifting notes show their state. Moonlight, sparse dust, dream particles, fluttering curtains and new sniff/wind/pillow sounds add atmosphere without additional permanent control panels.

**Reduced motion** removes cloth waves, speed trails and decorative particles. Essential control feedback remains. **Tap instead of drag** also supports the new pillow, tissue and window. Keyboard: A / K for hand / foot, H for headphones, Space to shush or tiptoe, P to pause. New object-specific actions are available by touch/mouse; the game is not a fully nonvisual keyboard game.

## Files

- `index.html`, `style.css`: mobile layout and entry point. Keep these in the root.
- `src/engine.js`: deterministic rules, battery, events and outcomes.
- `src/app.js`: touch ownership, tutorial, practice gallery, lifecycle and controls.
- `src/scene.js`: illustration and picking in 400 × 520 world coordinates.
- `src/motion.js`: new bounded cloth, particles, trails and physical transitions. Presentation only; it does not consume gameplay randomness or change rules.
- `src/audio.js`, `assets/audio/*.js`: original local synthesis and playback.
- `tests/`, `tools/`, `docs/`: reproducible verification and optional export helpers.

## Publish or develop

GitHub Pages: **main → / (root)**, as before. Versioned resource URLs avoid mixing old scripts with the new entry point. No install or build is needed for the public multi-file edition.

```sh
python -m http.server 8765 --bind 127.0.0.1
node --test tests/*.test.cjs
python tests/browser.test.py
python tests/after-midnight.test.py
python tools/build.py
node tools/render-audio.cjs
```

Playwright/Chromium are needed only for browser tests. `--inline` runs an embedded-source fixture where browser navigation is unavailable. Test hooks are gated to local development origins, never enabled on the public game. The single-file build includes the same art, motion and sound code. Optional WAV exports are not runtime assets.

See [verification and limitations](docs/TESTING.md). Physical phone touch/audio behavior, Safari and Firefox remain hands-on checks. This standalone repository is the active game; `capstere/sw` is unchanged.
