// Input: mouse (place, select, inspect) and keyboard (choose brazier, wave, pause,
// restart, rekindle, mute). All coordinates are canvas coordinates.

import { BRAZIERS } from './config.js';
import { plotAt, plotFree } from './towers.js';

export function attachInput(game, canvas) {
  function toCanvas(e) {
    const r = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * canvas.width,
      y: ((e.clientY - r.top) / r.height) * canvas.height,
    };
  }

  canvas.addEventListener('mousemove', (e) => {
    const p = toCanvas(e);
    game.mouse = p;
    game.hoverPlot = game.screen === 'playing' ? plotAt(p.x, p.y) : null;
  });

  canvas.addEventListener('click', (e) => {
    const p = toCanvas(e);
    game.sound.unlock();
    if (game.screen === 'title') {
      game.startGame();
      return;
    }
    if (game.screen === 'victory' || game.screen === 'gameover') {
      game.restart();
      return;
    }
    if (game.screen !== 'playing') return;
    const picked = game.pickAt(p.x, p.y);
    if (picked === 'plot' && game.selectedPlot && plotFree(game.selectedPlot, game.towers)) {
      game.buildAt(game.selectedPlot);
      game.selectedPlot = null;
    }
  });

  canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    game.selectedPlot = null;
    game.selectedTower = null;
  });

  window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    const k = e.key.toLowerCase();
    if (game.screen === 'title' && (k === 'enter' || k === ' ')) {
      game.startGame();
      return;
    }
    if (game.screen === 'victory' || game.screen === 'gameover') {
      if (k === 'enter' || k === 'r' || k === ' ') {
        game.restart();
        return;
      }
      if (k === 't') {
        game.toTitle();
        return;
      }
      return;
    }
    if (game.screen !== 'playing' && game.screen !== 'paused') return;
    if (k === 'p' || k === 'escape') {
      game.togglePause();
      return;
    }
    if (game.screen !== 'playing') return;
    if (k === '1' || k === '2' || k === '3') {
      const kind = Object.keys(BRAZIERS).find((key) => BRAZIERS[key].key === k);
      if (kind) {
        game.selectedKind = kind;
        game.selectedTower = null;
      }
      return;
    }
    if (k === ' ') {
      // Space: start the next wave early is not needed (waves chain); use it to rekindle.
      game.rekindle();
      return;
    }
    if (k === 'u') {
      game.upgradeSelected();
      return;
    }
    if (k === 'x') {
      game.sellSelected();
      return;
    }
    if (k === 'r') {
      game.rekindle();
      return;
    }
    if (k === 'm') {
      game.sound.toggleMute();
      return;
    }
    if (k === 't') {
      game.toTitle();
    }
  });
}
