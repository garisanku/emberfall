// EMBERFALL entry point: wire the canvas, the game, input and the render loop.
// A fixed 1/60 s step keeps the simulation the same on every machine; rendering
// follows the browser's own frame rate. ?shot=<scene>&seed=<n> draws one fixed scene
// and stops, for screenshots; window.__shotReady tells the renderer it is done.

import { CANVAS } from './config.js';
import { Game } from './state.js';
import { Renderer } from './render.js';
import { attachInput } from './input.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
canvas.width = CANVAS.width;
canvas.height = CANVAS.height;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seed = Number(params.get('seed') || 20261117);

const game = new Game(canvas, { seed });
const renderer = new Renderer(game);
attachInput(game, canvas);
// Debug/testing hook: lets a playtest inspect the live game state.
window.__emberfall = game;

if (shot) {
  // Screenshot mode: one fixed scene, no loop, no wall clock.
  applyShot(game, shot, seed);
  renderer.render();
  window.__shotReady = true;
} else {
  // Play mode: fixed-step simulation, requestAnimationFrame rendering.
  const STEP = 1 / 60;
  let last = performance.now();
  let acc = 0;
  function frame(now) {
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.25) dt = 0.25;
    acc += dt;
    while (acc >= STEP) {
      game.update(STEP);
      acc -= STEP;
    }
    renderer.render();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
