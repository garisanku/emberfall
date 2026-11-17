// Game state: the machine that holds a run together.
// Screens: title -> playing -> (paused) -> victory | gameover. Score, embers, ember health.

import { CANVAS, EMBER, ECONOMY, TOTAL_WAVES, BRAZIERS, PLOTS } from './config.js';
import { WaveManager } from './waves.js';
import { Particles } from './particles.js';
import { SoundEngine } from './audio.js';
import { makeRng } from './random.js';
import { makeTower, towerCost, upgradeCost, upgradeTower, sellValue, plotFree, plotAt, updateTower } from './towers.js';
import { updateEnemy } from './enemies.js';

export class Game {
  constructor(canvas, opts = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.rng = makeRng(opts.seed ?? ((Math.random() * 1e9) | 0));
    this.sound = new SoundEngine();
    this.particles = new Particles();
    this.waves = new WaveManager();
    this.screen = 'title'; // title | playing | paused | victory | gameover
    this.time = 0;
    this.score = 0;
    this.embers = ECONOMY.startEmbers;
    this.emberHealth = EMBER.maxHealth;
    this.emberLight = EMBER.lightRadius;
    this.enemies = [];
    this.towers = [];
    this.fx = []; // transient bolt/frost flashes
    this.kills = 0;
    this.wave = 0;
    this.selectedKind = 'spark';
    this.selectedPlot = null;
    this.selectedTower = null;
    this.hoverPlot = null;
    this.mouse = { x: 0, y: 0 };
    this.banner = null;
    this.stats = null;
    this.shake = 0;
    this.autoStart = !!opts.autoStart;
    this.onEvent = opts.onEvent || (() => {});
  }

  // ---- flow ----
  startGame() {
    this.sound.unlock();
    this.screen = 'playing';
    this.time = 0;
    this.score = 0;
    this.embers = ECONOMY.startEmbers;
    this.emberHealth = EMBER.maxHealth;
    this.emberLight = EMBER.lightRadius;
    this.enemies = [];
    this.towers = [];
    this.fx = [];
    this.kills = 0;
    this.selectedPlot = null;
    this.selectedTower = null;
    this.waves = new WaveManager();
    this.nextWave();
  }

  nextWave() {
    if (this.wave >= TOTAL_WAVES) return;
    this.wave += 1;
    this.waves.startWave(this.wave, this);
  }

  togglePause() {
    if (this.screen === 'playing') this.screen = 'paused';
    else if (this.screen === 'paused') this.screen = 'playing';
  }

  restart() {
    this.startGame();
  }

  toTitle() {
    this.screen = 'title';
    this.enemies = [];
    this.towers = [];
    this.fx = [];
    this.wave = 0;
    this.score = 0;
    this.embers = ECONOMY.startEmbers;
    this.emberHealth = EMBER.maxHealth;
    this.emberLight = EMBER.lightRadius;
  }

  // ---- economy ----
  onKill = (e) => {
    this.kills += 1;
    this.embers += e.reward;
    this.score += ECONOMY.killScore + e.reward;
    this.particles.burst(e.x, e.y, e.color, 10, 90);
    this.particles.text(e.x, e.y - 14, `+${e.reward}`, '#ffd97a');
    this.sound.enemyDie();
    this.sound.coin();
  };

  buildAt(plot) {
    if (!plot || !plotFree(plot, this.towers)) return false;
    const kind = this.selectedKind;
    const cost = towerCost(kind);
    if (this.embers < cost) return false;
    this.embers -= cost;
    this.towers.push(makeTower(kind, plot));
    this.particles.ring(plot.x, plot.y, BRAZIERS[kind].color);
    this.sound.build();
    return true;
  }

  upgradeSelected() {
    const t = this.selectedTower;
    if (!t) return false;
    const cost = upgradeCost(t);
    if (cost === null || this.embers < cost) return false;
    this.embers -= cost;
    upgradeTower(t);
    this.particles.ring(t.x, t.y, '#ffffff');
    this.sound.upgrade();
    return true;
  }

  sellSelected() {
    const t = this.selectedTower;
    if (!t) return false;
    this.embers += sellValue(t);
    this.towers = this.towers.filter((x) => x !== t);
    this.particles.burst(t.x, t.y, '#9aa0a6', 8, 60);
    this.selectedTower = null;
    return true;
  }

  rekindle() {
    if (this.embers < ECONOMY.rekindleCost) return false;
    if (this.emberHealth >= EMBER.maxHealth) return false;
    this.embers -= ECONOMY.rekindleCost;
    this.emberHealth = Math.min(EMBER.maxHealth, this.emberHealth + ECONOMY.rekindleHealth);
    this.emberLight = Math.min(EMBER.lightRadiusMax, this.emberLight + 24);
    this.particles.ring(EMBER.x, EMBER.y, '#ffb347');
    this.sound.upgrade();
    return true;
  }

  // ---- picking ----
  pickAt(x, y) {
    // A tower first (click it to select), else a free plot.
    for (const t of this.towers) {
      const dx = x - t.x;
      const dy = y - t.y;
      if (dx * dx + dy * dy < 30 * 30) {
        this.selectedTower = t;
        this.selectedPlot = null;
        return 'tower';
      }
    }
    const plot = plotAt(x, y);
    if (plot) {
      this.selectedPlot = plot;
      this.selectedTower = null;
      return 'plot';
    }
    this.selectedPlot = null;
    this.selectedTower = null;
    return null;
  }

  // ---- update ----
  update(dt) {
    if (this.screen !== 'playing') return;
    this.time += dt;
    // Banner expiry.
    if (this.banner && this.time > this.banner.until) this.banner = null;
    // Waves and spawns.
    this.waves.update(dt, this);
    // Towers fire.
    for (const t of this.towers) updateTower(t, dt, this, this.fx);
    // Enemies walk.
    for (const e of this.enemies) updateEnemy(e, dt, this, this.time);
    // Enemies that reached the ember bite it.
    let hurt = 0;
    for (const e of this.enemies) {
      if (e.reached && !e.dead) {
        e.dead = true;
        hurt += e.damage;
        this.particles.burst(EMBER.x, EMBER.y, '#ff5d5d', 12, 110);
        this.particles.addShake(7);
        this.sound.emberHurt();
      }
    }
    if (hurt > 0) {
      this.emberHealth -= hurt;
      this.emberLight = Math.max(
        EMBER.lightRadiusMin,
        EMBER.lightRadius * (this.emberHealth / EMBER.maxHealth),
      );
    }
    this.enemies = this.enemies.filter((e) => !e.dead);
    // Transient bolt flashes.
    for (const f of this.fx) f.t += dt;
    this.fx = this.fx.filter((f) => f.t < f.dur);
    // Ambient embers drifting up from the fire.
    if (Math.random() < dt * 6) this.particles.emberDrift(EMBER.x, EMBER.y);
    this.particles.update(dt);
    // Wave cleared: bonus, then the next wave (or victory).
    if (this.waves.waveCleared(this)) {
      this.embers += ECONOMY.waveClearBonus;
      this.score += ECONOMY.waveScore;
      this.sound.coin();
      if (this.wave >= TOTAL_WAVES) {
        this.win();
      } else {
        this.banner = { text: `WAVE ${this.wave} CLEARED`, sub: `+${ECONOMY.waveClearBonus} embers`, until: this.time + 2.0 };
        this.nextWave();
      }
    }
    // Ember dead: game over.
    if (this.emberHealth <= 0) {
      this.emberHealth = 0;
      this.lose();
    }
  }

  win() {
    this.screen = 'victory';
    this.score += this.emberHealth * ECONOMY.emberHealthScore;
    this.stats = this.makeStats(true);
    this.sound.victory();
    this.onEvent('victory', this.stats);
  }

  lose() {
    this.screen = 'gameover';
    this.stats = this.makeStats(false);
    this.particles.burst(EMBER.x, EMBER.y, '#ff5d5d', 40, 160);
    this.particles.addShake(12);
    this.sound.defeat();
    this.onEvent('gameover', this.stats);
  }

  makeStats(won) {
    return {
      won,
      score: this.score,
      wave: this.wave,
      kills: this.kills,
      emberHealth: this.emberHealth,
      towers: this.towers.length,
    };
  }

  // Plots for the renderer.
  get plots() {
    return PLOTS;
  }
}
