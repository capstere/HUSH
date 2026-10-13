# HUSH 4.0.0 — verification

Date: 2026-10-13. Results refer to After Midnight, not the previous release.

## Automated scope

**54 Node checks** cover the original rules plus pillow benefits/cooldown/rough handling, sneeze and window outcomes, correct nightmare particle origin, practice boundaries, pinned cloth endpoints, convergence, finite bounded simulation, particle lifetime/caps, reduced motion, headphone interpolation, reset isolation and separation of presentation from gameplay randomness.

**113 distinct Chromium checks** combine the full regression/layout suite (88) and new After Midnight suite (25). They use emulated touch events for the tutorial, hand and foot contacts, headphones, all nine interruptions, pillow flipping, off-centre grip, cancellation, practice navigation, tap alternatives, audio start/mute, waiting, loss/win and replay. Twelve viewport sizes check visible controls, no page overflow and a scaled touch nudge.

Viewports: 320×568, 360×640, 375×667, 390×844, 393×852, 412×915, 430×932, 768×1024, 1024×768, 568×320, 667×375, 844×390.

The loss and win regression tests now wait for the intentional reaction beat before looking for the result card. Touch-event scheduling affects measured force, so the repeated-hit browser test permits a third contact if the first two did not cross the loss threshold. The deterministic rule test still verifies that two maximum-force contacts wake the sleeper.

Audio buffers are checked for finite samples, nonzero energy and peaks below digital clipping. Four new sounds are wind, sniff, muffled sneeze and pillow movement. This is a signal check, not a subjective listening assessment.

## Browser boundary

Browser navigation to a local HTTP origin was attempted and returned `ERR_BLOCKED_BY_ADMINISTRATOR`. Browser tests therefore use the exact local runtime sources embedded in an inline document, with only the existing local test-hook gate enabled. Production files never expose the hook on GitHub Pages. Relative file loading is checked separately on a local HTTP server.

A 180-frame synthetic renderer timing is recorded in the new test evidence. It is not a hardware frame-rate, battery-life or input-latency benchmark. Automated rendering and touch emulation do not certify a physical phone.

The short preview video is captured from the running Chromium fixture with actual emulated gestures. It has no audio track. Scene selection in the preview uses the practice system; it is not a full uninterrupted scored round.

## Reproduce

```sh
node --test tests/*.test.cjs
python tests/browser.test.py --inline
python tests/after-midnight.test.py --inline
python tools/build.py
node tools/render-audio.cjs
```

Without `--inline`, first serve the folder at `http://127.0.0.1:8765/`.

## Not verified

Physical iPhone/Android touch latency and sustained performance; Safari/WebKit; Firefox; mobile silent switches, audio routing and Bluetooth; live public-site gameplay. Check the separate GitHub Pages deployment status for publication — a successful deploy is not a play test.

Manual priorities: do off-centre grabs feel natural, is the pillow tab discoverable, can tissues reach the nose without covering all feedback, does the stirring period feel fair, and does Reduced motion feel comfortable?
