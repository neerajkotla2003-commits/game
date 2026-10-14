# Validation notes

Completed checks:

- JavaScript syntax check with `node --check game.js`.
- Seven automated tests execute the game with a simulated DOM, Canvas and clock: start/scoring, pause/resume, focus and tab pause, collision/restart, best-score persistence, keyboard and touch steering, opposite inputs and local asset references.
- Tests use built-in Node.js modules; run with `node --test tests/game.test.cjs`.

Limitations:

- A browser executable was unavailable in the build environment, so actual visual layout and real browser interaction were not verified here.
- Docker was unavailable in the build environment, so the Nginx image was not built or run here. Follow the README to build and run it on your computer, then check `/health` and play a round.

The game uses browser-native Canvas drawing and includes all its assets; no remote fonts, images, libraries or APIs are needed during play.
