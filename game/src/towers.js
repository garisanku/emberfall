// Braziers: the light towers the player builds on plots.
// Each brazier fires at the nearest shade in range; frost slows instead of hurting much.

import { BRAZIERS, UPGRADE_COST, UPGRADE_MULT, SELL_REFUND, EMBER, PLOTS } from './config.js';
import { damageEnemy } from './enemies.js';

let nextId = 1;

export function makeTower(kind, plot) {
  const base = BRAZIERS[kind];
  return {
    id: nextId++,
    kind,
    x: plot.x,
    y: plot.y,
    plot,
    level: 1,
    range: base.range,
    damage: base.damage,
    rate: base.rate,
    light: base.light,
    color: base.color,
    cooldown: 0,
    angle: -Math.PI / 2,
    flash: 0,
  };
}

export function towerCost(kind) {
  return BRAZIERS[kind].cost;
}

export function upgradeCost(t) {
  if (t.level >= 3) return null;
  return UPGRADE_COST[t.level];
}

export function upgradeTower(t) {
  if (t.level >= 3) return false;
  t.level += 1;
  const base = BRAZIERS[t.kind];
  t.damage = base.damage * UPGRADE_MULT[t.level - 1];
  t.range = base.range * (1 + (t.level - 1) * 0.12);
  t.light = base.light * (1 + (t.level - 1) * 0.15);
  return true;
}

export function sellValue(t) {
  let spent = BRAZIERS[t.kind].cost;
  for (let l = 1; l < t.level; l++) spent += UPGRADE_COST[l];
  return Math.floor(spent * SELL_REFUND);
}

// Find the nearest living enemy inside this tower's range.
function nearestInRange(t, enemies) {
  let best = null;
  let bestD = Infinity;
  for (const e of enemies) {
    if (e.dead || e.reached) continue;
    const dx = e.x - t.x;
    const dy = e.y - t.y;
    const d = dx * dx + dy * dy;
    if (d < t.range * t.range && d < bestD) {
      bestD = d;
      best = e;
    }
  }
  return best;
}

export function updateTower(t, dt, state, fx) {
  t.cooldown -= dt;
  if (t.flash > 0) t.flash -= dt;
  const target = nearestInRange(t, state.enemies);
  if (!target) return;
  t.angle = Math.atan2(target.y - t.y, target.x - t.x);
  if (t.cooldown > 0) return;
  t.cooldown = 1 / t.rate;
  t.flash = 0.12;
  const base = BRAZIERS[t.kind];
  if (t.kind === 'frost') {
    target.slowUntil = state.time + base.slowTime;
    target.slowMult = base.slow;
    damageEnemy(target, t.damage, state);
    fx.push({ type: 'frost', x: target.x, y: target.y, t: 0, dur: 0.35, color: base.color });
  } else {
    const killed = damageEnemy(target, t.damage, state);
    fx.push({
      type: 'bolt', x1: t.x, y1: t.y, x2: target.x, y2: target.y,
      t: 0, dur: 0.12, color: base.color, kind: t.kind,
    });
    if (killed) state.onKill(target);
  }
  state.sound.shoot(t.kind);
}

// Is a plot free to build on?
export function plotFree(plot, towers) {
  return !towers.some((t) => t.plot === plot);
}

export function plotAt(x, y) {
  for (const plot of PLOTS) {
    const dx = x - plot.x;
    const dy = y - plot.y;
    if (dx * dx + dy * dy < (plot.r + 12) * (plot.r + 12)) return plot;
  }
  return null;
}

export { EMBER };
