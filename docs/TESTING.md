# HUSH 5.0 verification

Release: **SECOND CHANCES**, 2026-10-13. Results describe the final local release sources, including audio-context suspension on pause/mute. Repeated runs are not counted as extra checks.

## Executed results

| Suite | Passed | Scope |
|---|---:|---|
| `node --test tests/*.test.cjs` | 91 / 91 | 46 core rules, 8 motion tests, 30 recovery tests, 7 music tests |
| `tests/browser.test.py --inline` | 88 / 88 | Existing touch gameplay, lesson, headphones, sound, events, win/loss, lifecycle and twelve layouts |
| `tests/after-midnight.test.py --inline` | 25 / 25 | Pillow, tissue, window, practice, grip offset, cloth and visual regression |
| `tests/second-chances.test.py --inline` | 64 / 64 | Awake/drowsy/asleep, direct hair stroke, three real touch holds, cancellation, independent audio, parked events, recovery layouts |
| Local HTTP integrity | 10 / 10 resources | HTTP 200 and byte equality with referenced local files |
| Unmodified standalone smoke | PASS | No test hooks; real 12.5-second touch hold restores sleep and normal dock |

**177 distinct Chromium assertions total.** All browser suites were rerun after the final audio changes. No uncaught JavaScript errors were reported.

Viewports: 320×568, 360×640, 375×667, 390×844, 393×852, 412×915, 430×932, 768×1024, 1024×768, 568×320, 667×375 and 844×390. Recovery controls remained on-screen, with all three primary care targets at least 44 CSS pixels in both dimensions. These are viewport simulations, not twelve physical-device tests.

## Recovery checks

A full wake is recoverable and counted once. All three care methods work independently, including non-favourites. Slow strokes help; fast strokes and repeated hitting are counterproductive. Holds cannot farm progress without elapsed time. Cancellation stops care. Pillow/tuck cooldowns apply. Drowsiness appears before sleep; recovery gives a quiet interval.

Interruptions preserve progress and countdown while parked, including bathroom walking. Recovery stops an old hold, restores the correct controls and supplies a grace period. No new event can spawn over recovery. Dawn cannot win while the partner is awake, but successful recovery at dawn wins. Patience can still run out. Practice has no score or terminal failure.

## Audio checks

The new nocturne is 45 seconds, stereo, deterministic and independent of gameplay randomness. Five new PCM buffers and all 24 total buffers were finite and non-silent. Tests check ample digital headroom and a small loop-seam discontinuity; they do not certify perceived loudness on every speaker. Music, effects and master controls are independent. Pause/mute fade and resume were checked; repeated resumes did not duplicate the four persistent loops. Muted recovery remains playable.

## Method and limits

This environment blocked browser URL navigation, including localhost. The main suites therefore used `page.set_content()` with the actual runtime sources, changing only the local test-hook condition in the fixture. The public sources keep their localhost/`?test=1` gate. Touch used Chromium CDP input, not only direct function calls; test hooks also selected deterministic events and advanced rule time for repeatable state checks.

A separate smoke used the unmodified single-file build and a real-duration hold, with `window.__hush` absent. HTTP delivery was checked separately through Python's local HTTP client, not browser navigation. Renderer stress timing is diagnostic, not a phone frame-rate benchmark.

**Not verified:** physical iPhone/Android touch and audio routing, Safari, Firefox, mobile-browser chrome and interruptions, hearing the mix on device speakers, long-session battery usage, or live GitHub Pages gameplay. Deployment status must be reported separately from browser/gameplay testing.

Run commands are in the root README. Browser suites regenerate their detailed JSON results and screenshots. The release summary is `tests/RESULTS.json`.
