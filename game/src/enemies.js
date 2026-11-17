// Enemies: the shades that walk out of the dark toward the ember.
// Each enemy walks straight at the ember; light slows and weakens them.

import { CANVAS, EMBER, ENEMIES, DARK_SPEED_MULT, LIGHT_DAMAGE_MULT, SPAWN_MARGIN } from './config.js';

let nextId = 1;

export function spawnPoint(rng) {
  const edge = rng.int(0, 3);
  const m = SPAWN_MARGIN;
  if (edge === 0) return { x: rng.range(m, CANVAS.width - m), y: -m };
  if (edge === 1) return { x: rng.range(m, CANVAS.width - m), y: CANVAS.height + m };
  if (edge === 2) return { x: -m, y: rng.range(m, CANVAS.height - m) };
  return { x: CANVAS.width + m, y: rng.range(m, CANVAS.height - m) };
}

export function makeEnemy(kind, wave, rng) {
  const base = ENEMIES[kind];
  const p = spawnPoint(rng);
  // Health and speed grow with the wave so later waves stay threatening.
  const hpMult = 1 + (wave - 1) * 0.22;
  const speedMult = 1 + Math.min(0.5, (wave - 1) * 0.03);
  return {
    id: nextId++,
    kind,
    x: p.x,
    y: p.y,
    hp: base.hp * hpMult,
    maxHp: base.hp * hpMult,
    speed: base.speed * speedMult,
    reward: base.reward,
    damage: base.damage,
    radius: base.radius,
    color: base.color,
    eye: base.eye,
    slowUntil: 0,
    slowMult: 1,
    wobble: rng.range(0, Math.PI * 2),
    wobbleSpeed: rng.range(1.5, 3.5),
    dead: false,
    reached: false,
  };
}

// Is this point inside any light? Light comes from the ember and every brazier.
export function lightAt(x, y, state) {
  const dx = x - EMBER.x;
  const dy = y - EMBER.y;
  if (dx * dx + dy * dy < state.emberLight * state.emberLight) return true;
  for (const t of state.towers) {
    const ddx = x - t.x;
    const ddy = y - t.y;
    const r = t.light;
    if (ddx * ddx + ddy * ddy < r * r) return true;
  }
  return false;
}

export function updateEnemy(e, dt, state, time) {
  if (e.dead || e.reached) return;
  const dx = EMBER.x - e.x;
  const dy = EMBER.y - e.y;
  const dist = Math.hypot(dx, dy) || 1;
  const inLight = lightAt(e.x, e.y, state);
  // Darkness makes them faster; frost slows them; light weakens wraiths.
  let speed = e.speed;
  if (!inLight) speed *= DARK_SPEED_MULT;
  if (time < e.slowUntil) speed *= e.slowMult;
  // A gentle wobble so they do not walk in a perfect straight line.
  const wob = Math.sin(time * e.wobbleSpeed + e.wobble) * 0.35;
  const nx = dx / dist;
  const ny = dy / dist;
  const px = -ny * wob;
  const py = nx * wob;
  e.x += (nx + px * 0.4) * speed * dt;
  e.y += (ny + py * 0.4) * speed * dt;
  e.inLight = inLight;
  // Reached the ember: it bites, then dissolves.
  if (dist < EMBER.radius + e.radius * 0.6) {
    e.reached = true;
  }
}

export function damageEnemy(e, amount, state) {
  if (e.dead) return false;
  let mult = 1;
  if (e.inLight) {
    mult = e.kind === 'wraith' ? ENEMIES.wraith.lightWeak : LIGHT_DAMAGE_MULT;
  }
  e.hp -= amount * mult;
  if (e.hp <= 0) {
    e.dead = true;
    return true;
  }
  return false;
}
