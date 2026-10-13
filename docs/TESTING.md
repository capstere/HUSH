# HUSH 3.0.0 — verification

Date: 2026-10-13. All counts below describe this release, not the previous 2.0 tests.

## Executed

- **34/34 Node rule tests.** Seeded event order; contact strength; repeated-hit loss; waiting recovery; training; battery drain/charging/empty behavior; shush duration; blanket cooldown; each of seven events; nightmare duplicate rejection; bathroom safe/unsafe boards; bounds; stopped end states; dawn; unattended failure. A conservative strategy wins ten seeded normal nights.
- **40/40 functional Chromium checks.** Real emulated finger gestures through Chrome's touch-event interface, not just direct calls to the engine. Full hand/foot/headphone tutorial; drag cancellation; tap-mode animation; loss and replay; headphone dragging and docking; real Web Audio start/mute/unmute; holds released outside controls; seven event interactions; pause; reduced motion; tab-switch handling; win and home navigation.
- **49/49 layout-run checks.** Twelve viewports, each checking the start button, all gameplay controls, no page overflow, and an actual scaled touch nudge. The final check verifies no uncaught JavaScript errors. The no-error check name overlaps the functional run; there are **88 distinct named browser checks**, not 89 unique checks.
- **8/8 local HTTP resources return 200.** CSS, six scripts and icon. Relative paths and cache-version parameters are retained.
- All generated sound buffers are non-silent, finite and below digital clipping; the local nonsense-narrator buffer is 12 seconds. This is a signal check, not a claim that people will enjoy the sound.

Viewports: 320×568, 360×640, 375×667, 390×844, 393×852, 412×915, 430×932, 768×1024, 1024×768, 568×320, 667×375, 844×390.

## Exact browser-test boundary

This environment's browser policy blocks URL navigation. Browser tests therefore ran in **inline mode**: the HTML's exact local CSS and JavaScript files were embedded in their original order, after the document body existed. The only instrumentation change enables the already-existing local-only test hooks on the test document. Production gameplay code is otherwise unchanged. Resource loading was checked separately using a local HTTP server.

The test runner supports normal HTTP navigation on a developer machine. The debug object is gated to `localhost` or `127.0.0.1` with `?test=1`; it is not exposed on GitHub Pages. The downloadable single-file edition is built without enabling test hooks.

```sh
node --test tests/engine.test.cjs
# With a server at http://127.0.0.1:8765/ and Playwright installed:
python tests/browser.test.py
# For a test environment that cannot navigate to local URLs:
python tests/browser.test.py --inline --only-main
python tests/browser.test.py --inline --only-layouts
```

## Not verified

Physical iPhone/Android touch latency, Safari/WebKit, Firefox, mobile audio routing/silent switches/Bluetooth, device energy use and sustained hardware frame rate. Automated touch emulation is not a substitute for these checks. Live GitHub Pages browser navigation was not available from this test environment.

## Phone feedback that matters most

First play: is it obvious which hand and sock to grab? Does a gentle swipe feel different from a fast one? Is the stirring warning clear? Are the narrator and snoring comfortable at a modest volume? Is docking intuitive? Can the cloud, ghost targets and bathroom control be used without scrolling or precision tapping?
