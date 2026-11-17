// EMBERFALL — configuration and balance.
// One place for every number the game tunes: canvas, ember, braziers, enemies, waves, economy.
// The dark is the enemy; light is the ground you fight on.

export const CANVAS = { width: 1280, height: 720 };

// The last ember sits at the centre. Everything walks toward it.
export const EMBER = {
  x: 640,
  y: 360,
  radius: 34,
  maxHealth: 100,
  // Light radius in pixels; shrinks as the ember is hurt, grows when rekindled.
  lightRadius: 190,
  lightRadiusMin: 110,
  lightRadiusMax: 260,
};

// Build plots: fixed spots where a brazier may stand. Rings around the ember.
export const PLOTS = (() => {
  const plots = [];
  const rings = [
    { r: 150, n: 6, off: 0.0 },
    { r: 235, n: 8, off: 0.4 },
    { r: 320, n: 10, off: 0.2 },
  ];
  for (const ring of rings) {
    for (let i = 0; i < ring.n; i++) {
      const a = ring.off + (i / ring.n) * Math.PI * 2;
      plots.push({ x: EMBER.x + Math.cos(a) * ring.r, y: EMBER.y + Math.sin(a) * ring.r, r: 26 });
    }
  }
  return plots;
})();

// Brazier kinds. Cost in embers. Range and damage grow with level (max level 3).
export const BRAZIERS = {
  spark: {
    name: 'Spark Brazier',
    key: '1',
    cost: 40,
    range: 130,
    damage: 10,
    rate: 2.2, // shots per second
    light: 120, // light radius it adds
    color: '#ffb347',
    desc: 'Fast sparks. Cheap, quick, short reach.',
  },
  flame: {
    name: 'Flame Brazier',
    key: '2',
    cost: 80,
    range: 170,
    damage: 22,
    rate: 1.1,
    light: 160,
    color: '#ff7b2f',
    desc: 'Heavy fireballs. Slow, hard-hitting.',
  },
  frost: {
    name: 'Frost Brazier',
    key: '3',
    cost: 60,
    range: 150,
    damage: 4,
    rate: 1.6,
    light: 140,
    color: '#7fd4ff',
    desc: 'Cold light. Little damage, slows shades in its glow.',
    slow: 0.45, // enemy speed multiplier while inside
    slowTime: 1.2,
  },
};

export const UPGRADE_COST = [0, 60, 120]; // to reach level 2, then 3 (added to base cost)
export const UPGRADE_MULT = [1, 1.6, 2.4]; // damage multiplier per level
export const SELL_REFUND = 0.6;

// Enemy kinds. hp and speed scale with wave (see waves.js).
export const ENEMIES = {
  wisp: {
    name: 'Wisp',
    hp: 30, speed: 62, reward: 8, damage: 6, radius: 13,
    color: '#b388ff', eye: '#e8dcff',
    desc: 'Fast and frail. Comes in numbers.',
  },
  shade: {
    name: 'Shade',
    hp: 85, speed: 42, reward: 14, damage: 10, radius: 17,
    color: '#6b5b95', eye: '#ff5d5d',
    desc: 'The common dark. Steady and stubborn.',
  },
  brute: {
    name: 'Brute',
    hp: 260, speed: 26, reward: 30, damage: 22, radius: 24,
    color: '#3d3552', eye: '#ffb347',
    desc: 'Slow, armoured, hits the ember hard.',
  },
  wraith: {
    name: 'Wraith',
    hp: 60, speed: 88, reward: 20, damage: 8, radius: 14,
    color: '#4dd0e1', eye: '#ffffff',
    desc: 'Darts through the dark. Weak in light.',
    lightWeak: 2.0, // takes double damage while inside any light
  },
};

// How darkness empowers enemies: outside every light radius they move faster.
export const DARK_SPEED_MULT = 1.25;
// Inside light, ordinary enemies take this damage multiplier (wraiths take their own).
export const LIGHT_DAMAGE_MULT = 1.25;

// Waves: 12 waves, then victory. Each wave lists spawns as [enemy, count, gapSeconds].
// hp and speed grow with the wave number (see waves.js scaling).
export const WAVES = [
  { spawns: [['wisp', 6, 1.1]] },
  { spawns: [['wisp', 10, 0.9], ['shade', 2, 2.0]] },
  { spawns: [['shade', 8, 1.0], ['wisp', 8, 0.7]] },
  { spawns: [['shade', 10, 0.9], ['wraith', 3, 1.6]] },
  { spawns: [['wisp', 16, 0.55], ['shade', 8, 0.9], ['brute', 1, 3.0]] },
  { spawns: [['shade', 14, 0.8], ['wraith', 6, 1.2], ['brute', 2, 2.5]] },
  { spawns: [['wisp', 22, 0.45], ['shade', 12, 0.8], ['wraith', 5, 1.1]] },
  { spawns: [['brute', 4, 2.2], ['shade', 14, 0.7], ['wisp', 14, 0.5]] },
  { spawns: [['wraith', 10, 0.9], ['shade', 16, 0.7], ['brute', 3, 2.0]] },
  { spawns: [['wisp', 26, 0.4], ['shade', 18, 0.65], ['brute', 4, 1.8], ['wraith', 6, 1.0]] },
  { spawns: [['brute', 6, 1.8], ['wraith', 10, 0.8], ['shade', 20, 0.6]] },
  { spawns: [['brute', 8, 1.6], ['wraith', 12, 0.7], ['shade', 22, 0.55], ['wisp', 24, 0.4]] },
];

export const TOTAL_WAVES = WAVES.length;

// Economy and scoring.
export const ECONOMY = {
  startEmbers: 180,
  waveClearBonus: 25, // embers on clearing a wave
  killScore: 10, // score per kill, times enemy reward tier
  waveScore: 150, // score per cleared wave
  emberHealthScore: 5, // score per ember health point left at victory
  rekindleCost: 30, // embers to restore 25 ember health + light
  rekindleHealth: 25,
};

// Spawn points: the dark edges. Enemies enter from a random edge point.
export const SPAWN_MARGIN = 30;
