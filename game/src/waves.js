// Waves: the schedule that feeds shades into the dark, one wave at a time.
// A wave is a list of spawn groups [enemy kind, count, gap in seconds]; groups run
// one after another. Clearing a wave pays a bonus and opens the next.

import { WAVES, TOTAL_WAVES } from './config.js';
import { makeEnemy } from './enemies.js';

export class WaveManager {
  constructor() {
    this.wave = 0; // 1-based while a wave runs
    this.queue = []; // pending spawns: {kind, at}
    this.spawning = false;
    this.betweenWaves = true;
    this.waveClearAt = 0;
  }

  startWave(waveNum, state) {
    this.wave = waveNum;
    this.spawning = true;
    this.betweenWaves = false;
    const def = WAVES[waveNum - 1];
    let t = state.time + 0.8;
    this.queue = [];
    for (const [kind, count, gap] of def.spawns) {
      for (let i = 0; i < count; i++) {
        this.queue.push({ kind, at: t });
        t += gap;
      }
      t += 0.6;
    }
    state.sound.waveHorn();
    state.banner = { text: `WAVE ${waveNum}`, sub: waveNum === TOTAL_WAVES ? 'The last dark' : '', until: state.time + 2.2 };
  }

  update(dt, state) {
    if (!this.spawning) return;
    while (this.queue.length > 0 && this.queue[0].at <= state.time) {
      const s = this.queue.shift();
      state.enemies.push(makeEnemy(s.kind, this.wave, state.rng));
    }
    if (this.queue.length === 0) this.spawning = false;
  }

  // True when the wave is done: nothing left to spawn and nothing left alive.
  waveCleared(state) {
    return !this.spawning && this.queue.length === 0 && state.enemies.length === 0;
  }

  get totalWaves() {
    return TOTAL_WAVES;
  }
}
