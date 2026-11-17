// Rendering: everything the player sees, on one 2D canvas.
// The world is dark; light is drawn as glowing holes in the dark. The ember is the
// heart of it, braziers add pools of light, and shades are darker shapes with lit eyes.

import { CANVAS, EMBER, BRAZIERS, ECONOMY, TOTAL_WAVES } from './config.js';
import { plotFree } from './towers.js';

const FONT = (px, weight = 700) => `${weight} ${px}px "Trebuchet MS", Verdana, sans-serif`;

export class Renderer {
  constructor(game) {
    this.game = game;
    // Offscreen canvas for the darkness mask: light is punched out of it.
    this.lightCanvas = document.createElement('canvas');
    this.lightCanvas.width = CANVAS.width;
    this.lightCanvas.height = CANVAS.height;
    this.lightCtx = this.lightCanvas.getContext('2d');
  }

  render() {
    const g = this.game;
    const ctx = g.ctx;
    ctx.save();
    const sh = g.particles.shakeOffset();
    ctx.translate(sh.x, sh.y);
    this.drawBackground(ctx);
    this.drawPlots(ctx);
    this.drawTowers(ctx);
    this.drawEmber(ctx);
    this.drawEnemies(ctx);
    this.drawFx(ctx);
    this.drawParticles(ctx);
    this.drawDarkness(ctx);
    ctx.restore();
    this.drawHud(ctx);
    if (g.banner) this.drawBanner(ctx);
    if (g.screen === 'title') this.drawTitle(ctx);
    if (g.screen === 'paused') this.drawPaused(ctx);
    if (g.screen === 'victory') this.drawEnd(ctx, true);
    if (g.screen === 'gameover') this.drawEnd(ctx, false);
  }

  drawBackground(ctx) {
    const g = this.game;
    // Deep night ground with a faint radial falloff toward the ember.
    const grad = ctx.createRadialGradient(EMBER.x, EMBER.y, 40, EMBER.x, EMBER.y, 620);
    grad.addColorStop(0, '#241a12');
    grad.addColorStop(0.5, '#14101c');
    grad.addColorStop(1, '#0a0812');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);
    // Faint ground texture: deterministic dots from the game's rng seed.
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    for (let i = 0; i < 90; i++) {
      const x = (i * 137.5) % CANVAS.width;
      const y = (i * 89.3) % CANVAS.height;
      ctx.fillRect(x, y, 2, 2);
    }
    // A scorched ring where the ember sits.
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(EMBER.x, EMBER.y, EMBER.radius + 26, 0, Math.PI * 2);
    ctx.stroke();
    void g;
  }

  drawPlots(ctx) {
    const g = this.game;
    for (const plot of g.plots) {
      const free = plotFree(plot, g.towers);
      const hovered = g.hoverPlot === plot;
      ctx.beginPath();
      ctx.arc(plot.x, plot.y, plot.r, 0, Math.PI * 2);
      ctx.fillStyle = hovered ? 'rgba(255,179,71,0.22)' : 'rgba(255,255,255,0.05)';
      ctx.fill();
      ctx.strokeStyle = hovered ? '#ffb347' : 'rgba(255,255,255,0.18)';
      ctx.lineWidth = hovered ? 2.5 : 1.5;
      ctx.setLineDash(free ? [6, 5] : []);
      ctx.stroke();
      ctx.setLineDash([]);
      if (free && g.screen === 'playing') {
        ctx.fillStyle = hovered ? '#ffd97a' : 'rgba(255,255,255,0.35)';
        ctx.font = FONT(16);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('+', plot.x, plot.y + 1);
      }
    }
  }

  drawTowers(ctx) {
    const g = this.game;
    for (const t of g.towers) {
      // Light pool under the brazier.
      const lg = ctx.createRadialGradient(t.x, t.y, 4, t.x, t.y, t.light);
      lg.addColorStop(0, t.color + '55');
      lg.addColorStop(1, t.color + '00');
      ctx.fillStyle = lg;
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.light, 0, Math.PI * 2);
      ctx.fill();
      // Range ring when selected.
      if (g.selectedTower === t) {
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 6]);
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.range, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      // Brazier body: stone base + glowing bowl.
      ctx.fillStyle = '#3a3345';
      ctx.beginPath();
      ctx.arc(t.x, t.y + 8, 15, 0, Math.PI);
      ctx.fill();
      ctx.fillStyle = '#241f2e';
      ctx.fillRect(t.x - 15, t.y + 6, 30, 8);
      const flick = 0.85 + Math.sin(g.time * 7 + t.id * 1.7) * 0.15;
      const fg = ctx.createRadialGradient(t.x, t.y - 2, 1, t.x, t.y - 2, 16 * flick + 6);
      fg.addColorStop(0, '#fff6d8');
      fg.addColorStop(0.45, t.color);
      fg.addColorStop(1, t.color + '00');
      ctx.fillStyle = fg;
      ctx.beginPath();
      ctx.arc(t.x, t.y - 2, 16 * flick + 4, 0, Math.PI * 2);
      ctx.fill();
      // Level pips.
      for (let i = 0; i < t.level; i++) {
        ctx.fillStyle = '#ffd97a';
        ctx.beginPath();
        ctx.arc(t.x - 10 + i * 10, t.y + 20, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      // Muzzle flash when it fires.
      if (t.flash > 0) {
        ctx.fillStyle = `rgba(255,255,255,${t.flash * 4})`;
        ctx.beginPath();
        ctx.arc(t.x + Math.cos(t.angle) * 18, t.y + Math.sin(t.angle) * 18, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  drawEmber(ctx) {
    const g = this.game;
    const flick = 0.9 + Math.sin(g.time * 9) * 0.1 + Math.sin(g.time * 23) * 0.05;
    const r = EMBER.radius * flick;
    // Big glow.
    const glow = ctx.createRadialGradient(EMBER.x, EMBER.y, 4, EMBER.x, EMBER.y, g.emberLight);
    glow.addColorStop(0, 'rgba(255,190,90,0.55)');
    glow.addColorStop(0.55, 'rgba(255,123,47,0.16)');
    glow.addColorStop(1, 'rgba(255,123,47,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(EMBER.x, EMBER.y, g.emberLight, 0, Math.PI * 2);
    ctx.fill();
    // Stone ring.
    ctx.fillStyle = '#4a4238';
    ctx.beginPath();
    ctx.arc(EMBER.x, EMBER.y, EMBER.radius + 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2b241c';
    ctx.beginPath();
    ctx.arc(EMBER.x, EMBER.y, EMBER.radius + 2, 0, Math.PI * 2);
    ctx.fill();
    // The flame: layered teardrops.
    ctx.fillStyle = '#ff7b2f';
    ctx.beginPath();
    ctx.ellipse(EMBER.x, EMBER.y - 4, r * 0.55, r * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffb347';
    ctx.beginPath();
    ctx.ellipse(EMBER.x, EMBER.y + 2, r * 0.38, r * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff6d8';
    ctx.beginPath();
    ctx.ellipse(EMBER.x, EMBER.y + 6, r * 0.2, r * 0.32, 0, 0, Math.PI * 2);
    ctx.fill();
    // Health arc around the ember.
    const frac = Math.max(0, g.emberHealth / EMBER.maxHealth);
    ctx.strokeStyle = 'rgba(0,0,0,0.55)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(EMBER.x, EMBER.y, EMBER.radius + 16, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = frac > 0.5 ? '#7ddc7d' : frac > 0.25 ? '#ffb347' : '#ff5d5d';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(EMBER.x, EMBER.y, EMBER.radius + 16, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
    ctx.stroke();
  }

  drawEnemies(ctx) {
    const g = this.game;
    for (const e of g.enemies) {
      const bob = Math.sin(g.time * 6 + e.wobble) * 2;
      // Body: a dark blob, darker outside light.
      ctx.fillStyle = e.inLight ? e.color : '#1a1626';
      ctx.strokeStyle = e.inLight ? e.color : 'rgba(120,100,180,0.6)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(e.x, e.y + bob, e.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Spikes for brutes.
      if (e.kind === 'brute') {
        ctx.fillStyle = '#241f2e';
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * Math.PI * 2 + g.time * 0.4;
          ctx.beginPath();
          ctx.arc(e.x + Math.cos(a) * (e.radius + 3), e.y + Math.sin(a) * (e.radius + 3), 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      // Glowing eyes, always visible: two dots that face the ember.
      const ang = Math.atan2(EMBER.y - e.y, EMBER.x - e.x);
      const ex = Math.cos(ang);
      const ey = Math.sin(ang);
      const px = -ey;
      const py = ex;
      ctx.fillStyle = e.eye;
      ctx.beginPath();
      ctx.arc(e.x + ex * 6 + px * 5, e.y + bob + ey * 6 + py * 5, 2.6, 0, Math.PI * 2);
      ctx.arc(e.x + ex * 6 - px * 5, e.y + bob + ey * 6 - py * 5, 2.6, 0, Math.PI * 2);
      ctx.fill();
      // Slow tint for frost.
      if (g.time < e.slowUntil) {
        ctx.strokeStyle = 'rgba(127,212,255,0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(e.x, e.y + bob, e.radius + 3, 0, Math.PI * 2);
        ctx.stroke();
      }
      // Health bar when hurt.
      if (e.hp < e.maxHp) {
        const w = e.radius * 2;
        const frac = Math.max(0, e.hp / e.maxHp);
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(e.x - w / 2, e.y - e.radius - 10 + bob, w, 4);
        ctx.fillStyle = '#ff5d5d';
        ctx.fillRect(e.x - w / 2, e.y - e.radius - 10 + bob, w * frac, 4);
      }
    }
  }

  drawFx(ctx) {
    const g = this.game;
    for (const f of g.fx) {
      const a = 1 - f.t / f.dur;
      if (f.type === 'bolt') {
        ctx.strokeStyle = f.color;
        ctx.globalAlpha = a;
        ctx.lineWidth = f.kind === 'flame' ? 4 : 2;
        ctx.beginPath();
        ctx.moveTo(f.x1, f.y1);
        ctx.lineTo(f.x2, f.y2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      } else if (f.type === 'frost') {
        ctx.strokeStyle = f.color;
        ctx.globalAlpha = a;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(f.x, f.y, 6 + (1 - a) * 18, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }
  }

  drawParticles(ctx) {
    const g = this.game;
    for (const p of g.particles.list) {
      const a = Math.max(0, p.life / p.max);
      if (p.type === 'text') {
        ctx.globalAlpha = a;
        ctx.fillStyle = p.color;
        ctx.font = FONT(p.size);
        ctx.textAlign = 'center';
        ctx.fillText(p.str, p.x, p.y);
        ctx.globalAlpha = 1;
      } else if (p.type === 'ring') {
        ctx.globalAlpha = a;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size + (1 - a) * 30, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      } else {
        ctx.globalAlpha = a;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * a + 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
  }

  drawDarkness(ctx) {
    const g = this.game;
    const lc = this.lightCtx;
    lc.clearRect(0, 0, CANVAS.width, CANVAS.height);
    // Darkness everywhere...
    lc.fillStyle = 'rgba(4,3,10,0.82)';
    lc.fillRect(0, 0, CANVAS.width, CANVAS.height);
    // ...punched out where light falls.
    lc.globalCompositeOperation = 'destination-out';
    const punch = (x, y, r) => {
      const grad = lc.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, 'rgba(0,0,0,1)');
      grad.addColorStop(0.7, 'rgba(0,0,0,0.85)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      lc.fillStyle = grad;
      lc.beginPath();
      lc.arc(x, y, r, 0, Math.PI * 2);
      lc.fill();
    };
    punch(EMBER.x, EMBER.y, g.emberLight);
    for (const t of g.towers) punch(t.x, t.y, t.light);
    lc.globalCompositeOperation = 'source-over';
    ctx.drawImage(this.lightCanvas, 0, 0);
  }

  drawHud(ctx) {
    const g = this.game;
    if (g.screen === 'title') return;
    // Top bar.
    ctx.fillStyle = 'rgba(8,6,14,0.72)';
    ctx.fillRect(0, 0, CANVAS.width, 52);
    ctx.fillStyle = '#ffd97a';
    ctx.font = FONT(20);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`WAVE ${Math.max(1, g.wave)} / ${TOTAL_WAVES}`, 18, 27);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`SCORE ${g.score}`, 190, 27);
    ctx.fillStyle = '#ffb347';
    ctx.fillText(`EMBERS ${g.embers}`, 360, 27);
    // Ember health bar (top right).
    const bw = 220;
    const bx = CANVAS.width - bw - 18;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(bx, 16, bw, 20);
    const frac = Math.max(0, g.emberHealth / EMBER.maxHealth);
    ctx.fillStyle = frac > 0.5 ? '#7ddc7d' : frac > 0.25 ? '#ffb347' : '#ff5d5d';
    ctx.fillRect(bx, 16, bw * frac, 20);
    ctx.fillStyle = '#ffffff';
    ctx.font = FONT(13);
    ctx.textAlign = 'center';
    ctx.fillText(`EMBER ${Math.ceil(g.emberHealth)}`, bx + bw / 2, 27);
    ctx.textAlign = 'left';
    // Bottom bar: brazier shop + actions.
    ctx.fillStyle = 'rgba(8,6,14,0.72)';
    ctx.fillRect(0, CANVAS.height - 64, CANVAS.width, 64);
    let x = 18;
    for (const key of Object.keys(BRAZIERS)) {
      const b = BRAZIERS[key];
      const selected = g.selectedKind === key;
      ctx.fillStyle = selected ? 'rgba(255,179,71,0.25)' : 'rgba(255,255,255,0.05)';
      ctx.strokeStyle = selected ? '#ffb347' : 'rgba(255,255,255,0.25)';
      ctx.lineWidth = selected ? 2 : 1;
      ctx.beginPath();
      ctx.roundRect(x, CANVAS.height - 54, 210, 44, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(x + 20, CANVAS.height - 32, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = FONT(14);
      ctx.fillText(`[${b.key}] ${b.name}`, x + 36, CANVAS.height - 40);
      ctx.fillStyle = '#ffd97a';
      ctx.font = FONT(12, 400);
      ctx.fillText(`${b.cost} embers`, x + 36, CANVAS.height - 22);
      x += 224;
    }
    // Rekindle button hint.
    ctx.fillStyle = '#ffffff';
    ctx.font = FONT(13);
    ctx.fillText(`[R] Rekindle ember (${ECONOMY.rekindleCost} embers)`, x + 8, CANVAS.height - 40);
    ctx.fillStyle = '#9aa0a6';
    ctx.font = FONT(12, 400);
    ctx.fillText('[U] upgrade  [X] sell  [P] pause  [M] mute', x + 8, CANVAS.height - 22);
    // Selected tower panel.
    if (g.selectedTower) {
      const t = g.selectedTower;
      const b = BRAZIERS[t.kind];
      ctx.fillStyle = 'rgba(8,6,14,0.85)';
      ctx.strokeStyle = '#ffb347';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(CANVAS.width - 260, 62, 242, 96, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = FONT(15);
      ctx.fillText(`${b.name}  Lv ${t.level}`, CANVAS.width - 244, 82);
      ctx.fillStyle = '#c9c9c9';
      ctx.font = FONT(12, 400);
      ctx.fillText(`Damage ${Math.round(t.damage)}   Range ${Math.round(t.range)}`, CANVAS.width - 244, 104);
      const up = t.level < 3 ? `Upgrade [U] — ${[0, 60, 120][t.level]} embers` : 'Max level';
      ctx.fillText(up, CANVAS.width - 244, 124);
      ctx.fillText(`Sell [X] — ${this.gameSellValue(t)} embers`, CANVAS.width - 244, 144);
    }
  }

  gameSellValue(t) {
    let spent = BRAZIERS[t.kind].cost;
    for (let l = 1; l < t.level; l++) spent += [0, 60, 120][l];
    return Math.floor(spent * 0.6);
  }

  drawBanner(ctx) {
    const g = this.game;
    ctx.save();
    ctx.globalAlpha = 0.92;
    ctx.fillStyle = '#ffd97a';
    ctx.font = FONT(44);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(g.banner.text, CANVAS.width / 2, CANVAS.height / 2 - 60);
    if (g.banner.sub) {
      ctx.fillStyle = '#ffffff';
      ctx.font = FONT(20, 400);
      ctx.fillText(g.banner.sub, CANVAS.width / 2, CANVAS.height / 2 - 18);
    }
    ctx.restore();
  }

  drawTitle(ctx) {
    const g = this.game;
    ctx.fillStyle = 'rgba(6,4,12,0.66)';
    ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffb347';
    ctx.font = FONT(64);
    ctx.fillText('EMBERFALL', CANVAS.width / 2, 190);
    ctx.fillStyle = '#ffd97a';
    ctx.font = FONT(22, 400);
    ctx.fillText('Defend the last ember against the dark.', CANVAS.width / 2, 248);
    ctx.fillStyle = '#ffffff';
    ctx.font = FONT(17, 400);
    const lines = [
      'Shades walk out of the dark toward your ember. Build braziers on the stone plots —',
      'their light slows the dark and burns it. Enemies in darkness move faster.',
      'Spend embers to build and upgrade. If the ember dies, the dark wins.',
      '',
      'Click a plot to build the chosen brazier  •  1 / 2 / 3 choose brazier',
      'U upgrade  •  X sell  •  R rekindle the ember  •  P pause  •  M mute',
      'Survive all 12 waves to win.',
    ];
    lines.forEach((ln, i) => ctx.fillText(ln, CANVAS.width / 2, 300 + i * 26));
    ctx.fillStyle = '#ffb347';
    ctx.font = FONT(24);
    ctx.fillText('CLICK OR PRESS ENTER TO BEGIN', CANVAS.width / 2, 540);
    ctx.fillStyle = '#9aa0a6';
    ctx.font = FONT(13, 400);
    ctx.fillText('A game of light against the dark. Best score is kept on this machine.', CANVAS.width / 2, 580);
    void g;
  }

  drawPaused(ctx) {
    ctx.fillStyle = 'rgba(6,4,12,0.6)';
    ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.font = FONT(44);
    ctx.fillText('PAUSED', CANVAS.width / 2, CANVAS.height / 2 - 20);
    ctx.font = FONT(18, 400);
    ctx.fillText('Press P to resume  •  T for title', CANVAS.width / 2, CANVAS.height / 2 + 24);
  }

  drawEnd(ctx, won) {
    const g = this.game;
    const s = g.stats || { score: 0, wave: 0, kills: 0, emberHealth: 0, towers: 0 };
    ctx.fillStyle = won ? 'rgba(20,16,6,0.72)' : 'rgba(12,4,8,0.78)';
    ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = won ? '#ffd97a' : '#ff5d5d';
    ctx.font = FONT(56);
    ctx.fillText(won ? 'THE EMBER ENDURES' : 'THE DARK PREVAILS', CANVAS.width / 2, 200);
    ctx.fillStyle = '#ffffff';
    ctx.font = FONT(20, 400);
    ctx.fillText(
      won ? 'Twelve waves broken on your light. Dawn comes.' : 'The last ember is gone. The dark takes the field.',
      CANVAS.width / 2, 258,
    );
    ctx.font = FONT(22);
    ctx.fillStyle = '#ffd97a';
    ctx.fillText(`SCORE  ${s.score}`, CANVAS.width / 2, 320);
    ctx.fillStyle = '#ffffff';
    ctx.font = FONT(18, 400);
    ctx.fillText(`Waves cleared: ${won ? TOTAL_WAVES : Math.max(0, g.wave - 1)} / ${TOTAL_WAVES}    Shades banished: ${s.kills}`, CANVAS.width / 2, 362);
    ctx.fillText(`Braziers standing: ${s.towers}    Ember health: ${Math.ceil(s.emberHealth)}`, CANVAS.width / 2, 392);
    // Best score, kept on this machine.
    let best = 0;
    try {
      best = Number(window.localStorage.getItem('emberfall-best') || 0);
      if (s.score > best) {
        best = s.score;
        window.localStorage.setItem('emberfall-best', String(best));
      }
    } catch { /* storage unavailable: ignore */ }
    ctx.fillStyle = '#ffd97a';
    ctx.font = FONT(18);
    ctx.fillText(`BEST SCORE  ${best}`, CANVAS.width / 2, 436);
    ctx.fillStyle = '#ffb347';
    ctx.font = FONT(24);
    ctx.fillText('CLICK OR PRESS ENTER TO PLAY AGAIN', CANVAS.width / 2, 510);
    ctx.fillStyle = '#9aa0a6';
    ctx.font = FONT(13, 400);
    ctx.fillText('T for title', CANVAS.width / 2, 548);
  }
}
