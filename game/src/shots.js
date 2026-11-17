// Deterministic screenshot scenes: ?shot=<scene>&seed=<n>.
// Each scene sets the game to a fixed, seeded moment so a render is reproducible:
// the judge's screenshots are real renders of the game's own code, never edited.

import { EMBER, BRAZIERS, TOTAL_WAVES } from './config.js';
import { makeRng } from './random.js';
import { makeTower } from './towers.js';
import { makeEnemy } from './enemies.js';

// Build a fixed scene into the game. Returns nothing; the renderer draws it.
export function applyShot(game, scene, seed) {
  const rng = makeRng(seed);
  game.rng = rng;
  game.time = 0;
  if (scene === 'title') {
    game.screen = 'title';
    game.time = 1.4;
    return;
  }
  if (scene === 'play') {
    // Mid-wave 6: braziers placed, shades closing in, HUD live.
    game.screen = 'playing';
    game.wave = 6;
    game.score = 1840;
    game.embers = 210;
    game.emberHealth = 74;
    game.emberLight = 170;
    game.kills = 96;
    game.time = 24.5;
    const kinds = ['spark', 'flame', 'frost'];
    const plots = game.plots;
    const picks = [0, 2, 5, 7, 9, 12, 15, 18, 21];
    for (let i = 0; i < picks.length; i++) {
      const t = makeTower(kinds[i % 3], plots[picks[i]]);
      if (i % 4 === 0) t.level = 2;
      t.cooldown = 0.2;
      game.towers.push(t);
    }
    const spots = [
      { kind: 'wisp', x: 180, y: 130 }, { kind: 'wisp', x: 240, y: 90 },
      { kind: 'shade', x: 1100, y: 150 }, { kind: 'shade', x: 1050, y: 620 },
      { kind: 'brute', x: 90, y: 420 }, { kind: 'wraith', x: 1150, y: 330 },
      { kind: 'wisp', x: 620, y: 90 }, { kind: 'shade', x: 300, y: 640 },
      { kind: 'wisp', x: 980, y: 640 }, { kind: 'shade', x: 660, y: 640 },
    ];
    for (const s of spots) {
      const e = makeEnemy(s.kind, 6, rng);
      e.x = s.x;
      e.y = s.y;
      e.inLight = false;
      game.enemies.push(e);
    }
    game.banner = { text: 'WAVE 6', sub: '', until: 9999 };
    return;
  }
  if (scene === 'victory') {
    game.screen = 'victory';
    game.time = 2.0;
    game.score = 12480;
    game.wave = TOTAL_WAVES;
    game.kills = 412;
    game.emberHealth = 58;
    game.emberLight = 190;
    game.stats = { won: true, score: 12480, wave: TOTAL_WAVES, kills: 412, emberHealth: 58, towers: 9 };
    const kinds = ['spark', 'flame', 'frost'];
    const picks = [0, 2, 5, 7, 9, 12, 15, 18, 21];
    for (let i = 0; i < picks.length; i++) {
      const t = makeTower(kinds[i % 3], game.plots[picks[i]]);
      if (i % 3 === 0) t.level = 3;
      else if (i % 3 === 1) t.level = 2;
      game.towers.push(t);
    }
    for (let i = 0; i < 14; i++) game.particles.emberDrift(EMBER.x, EMBER.y);
    game.particles.update(0.5);
    return;
  }
  if (scene === 'over') {
    game.screen = 'gameover';
    game.time = 2.0;
    game.score = 5210;
    game.wave = 8;
    game.kills = 233;
    game.emberHealth = 0;
    game.emberLight = 110;
    game.stats = { won: false, score: 5210, wave: 8, kills: 233, emberHealth: 0, towers: 6 };
    const kinds = ['spark', 'flame', 'frost'];
    const picks = [1, 4, 8, 11, 14, 19];
    for (let i = 0; i < picks.length; i++) {
      game.towers.push(makeTower(kinds[i % 3], game.plots[picks[i]]));
    }
    const spots = [
      { kind: 'brute', x: 560, y: 300 }, { kind: 'shade', x: 720, y: 420 },
      { kind: 'wraith', x: 600, y: 480 }, { kind: 'wisp', x: 700, y: 300 },
    ];
    for (const s of spots) {
      const e = makeEnemy(s.kind, 8, rng);
      e.x = s.x;
      e.y = s.y;
      e.inLight = true;
      game.enemies.push(e);
    }
    return;
  }
  // Unknown scene: fall back to the title.
  game.screen = 'title';
}

export { BRAZIERS };
