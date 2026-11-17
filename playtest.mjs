// Playtest EMBERFALL end to end: start, build, fight, wave clear, pause, restart,
// game over, victory. Drives the live game through window.__emberfall and checks
// the state after each step. Usage: node playtest.mjs (serve.ts must be running).
import { chromium } from 'playwright-core';

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM || undefined,
  args: ['--no-sandbox', '--use-angle=swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(`console: ${m.text()}`);
});

function check(name, cond, extra = '') {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? '  — ' + extra : ''}`);
  if (!cond) errors.push(`check failed: ${name}`);
}

await page.goto('http://localhost:8080/', { waitUntil: 'load' });
await page.waitForTimeout(500);

// 1. Title screen, then start with Enter.
check('title screen', await page.evaluate(() => window.__emberfall.screen === 'title'));
await page.keyboard.press('Enter');
await page.waitForTimeout(300);
check('playing after Enter', await page.evaluate(() => window.__emberfall.screen === 'playing'));
check('wave 1 started', await page.evaluate(() => window.__emberfall.wave === 1));

// 2. Build three braziers on plots (spark, flame, frost) via clicks on plot coords.
const plots = await page.evaluate(() => window.__emberfall.plots.slice(0, 3).map((p) => ({ x: p.x, y: p.y })));
await page.keyboard.press('1');
await page.mouse.click(plots[0].x, plots[0].y);
await page.keyboard.press('2');
await page.mouse.click(plots[1].x, plots[1].y);
await page.keyboard.press('3');
await page.mouse.click(plots[2].x, plots[2].y);
await page.waitForTimeout(200);
const built = await page.evaluate(() => ({
  towers: window.__emberfall.towers.length,
  embers: window.__emberfall.embers,
}));
check('3 braziers built', built.towers === 3, `towers=${built.towers} embers=${built.embers}`);

// 3. Fast-forward 40 s of game time; enemies should spawn and die, score should rise.
const before = await page.evaluate(() => ({ score: window.__emberfall.score, kills: window.__emberfall.kills }));
await page.evaluate(() => {
  const g = window.__emberfall;
  for (let i = 0; i < 60 * 40; i++) g.update(1 / 60);
});
const after = await page.evaluate(() => ({
  score: window.__emberfall.score,
  kills: window.__emberfall.kills,
  wave: window.__emberfall.wave,
  enemies: window.__emberfall.enemies.length,
  emberHealth: window.__emberfall.emberHealth,
  screen: window.__emberfall.screen,
}));
check('enemies were killed', after.kills > before.kills, `kills ${before.kills} -> ${after.kills}`);
check('score rose', after.score > before.score, `score ${before.score} -> ${after.score}`);
check('wave advanced past 1', after.wave > 1, `wave=${after.wave}`);
check('ember still alive', after.emberHealth > 0, `emberHealth=${after.emberHealth}`);

// 4. Pause and resume.
await page.keyboard.press('p');
check('paused', await page.evaluate(() => window.__emberfall.screen === 'paused'));
await page.keyboard.press('p');
check('resumed', await page.evaluate(() => window.__emberfall.screen === 'playing'));

// 5. Select a tower, upgrade it, sell it.
await page.evaluate(() => {
  const g = window.__emberfall;
  const t = g.towers[0];
  g.selectedTower = t;
  g.embers = 500;
});
await page.keyboard.press('u');
const upgraded = await page.evaluate(() => window.__emberfall.towers[0].level);
check('tower upgraded to level 2', upgraded === 2, `level=${upgraded}`);
await page.keyboard.press('x');
check('tower sold', await page.evaluate(() => window.__emberfall.towers.length === 2));

// 6. Rekindle: hurt the ember, then rekindle.
await page.evaluate(() => {
  const g = window.__emberfall;
  g.emberHealth = 50;
  g.embers = 100;
});
await page.keyboard.press('r');
const rekindled = await page.evaluate(() => ({ h: window.__emberfall.emberHealth, e: window.__emberfall.embers }));
check('rekindle restored health', rekindled.h === 75 && rekindled.e === 70, `health=${rekindled.h} embers=${rekindled.e}`);

// 7. Game over: clear the towers (so none can shoot it), drop ember health to 1,
// and let a tough enemy reach it.
await page.evaluate(() => {
  const g = window.__emberfall;
  g.towers = [];
  g.emberHealth = 1;
  g.enemies = [];
  const e = { kind: 'brute', x: 640, y: 360, hp: 100000, maxHp: 100000, speed: 0, reward: 0, damage: 10, radius: 10, color: '#000', eye: '#fff', slowUntil: 0, slowMult: 1, wobble: 0, wobbleSpeed: 1, dead: false, reached: false, inLight: true };
  g.enemies.push(e);
  for (let i = 0; i < 120; i++) g.update(1 / 60);
});
check('game over screen', await page.evaluate(() => window.__emberfall.screen === 'gameover'));

// 8. Restart from game over, then force a victory.
await page.keyboard.press('Enter');
await page.waitForTimeout(200);
check('restarted to playing', await page.evaluate(() => window.__emberfall.screen === 'playing'));
await page.evaluate(() => {
  const g = window.__emberfall;
  g.wave = 12;
  g.waves.wave = 12;
  g.waves.spawning = false;
  g.waves.queue = [];
  g.enemies = [];
  for (let i = 0; i < 120; i++) g.update(1 / 60);
});
check('victory screen', await page.evaluate(() => window.__emberfall.screen === 'victory'));

// 9. Restart from victory back to title via T, then start again.
await page.keyboard.press('t');
check('back to title', await page.evaluate(() => window.__emberfall.screen === 'title'));

console.log(errors.length === 0 ? 'NO ERRORS — PLAYTEST CLEAN' : `ERRORS:\n${errors.join('\n')}`);
await browser.close();
process.exit(errors.length === 0 ? 0 : 1);
