// Particles and transient effects: embers drifting up, hit sparks, death bursts,
// floating score text, and the screen shake that sells an ember hit.

export class Particles {
  constructor() {
    this.list = [];
    this.shake = 0;
  }

  burst(x, y, color, n, speed) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = speed * (0.4 + Math.random() * 0.8);
      this.list.push({
        type: 'spark', x, y,
        vx: Math.cos(a) * s, vy: Math.sin(a) * s - 20,
        life: 0.5 + Math.random() * 0.4, max: 0.9,
        size: 2 + Math.random() * 3, color,
      });
    }
  }

  emberDrift(x, y) {
    this.list.push({
      type: 'ember', x: x + (Math.random() - 0.5) * 40, y: y + (Math.random() - 0.5) * 20,
      vx: (Math.random() - 0.5) * 8, vy: -14 - Math.random() * 22,
      life: 1.6 + Math.random() * 1.2, max: 2.8,
      size: 1.5 + Math.random() * 2.5, color: Math.random() < 0.7 ? '#ffb347' : '#ff7b2f',
    });
  }

  text(x, y, str, color) {
    this.list.push({
      type: 'text', x, y, vx: 0, vy: -28,
      life: 1.0, max: 1.0, size: 15, color, str,
    });
  }

  ring(x, y, color) {
    this.list.push({ type: 'ring', x, y, vx: 0, vy: 0, life: 0.45, max: 0.45, size: 6, color });
  }

  addShake(amount) {
    this.shake = Math.min(14, this.shake + amount);
  }

  update(dt) {
    for (const p of this.list) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.type === 'spark') p.vy += 60 * dt;
      if (p.type === 'ember') p.vx += Math.sin(p.life * 6) * 4 * dt;
    }
    this.list = this.list.filter((p) => p.life > 0);
    if (this.shake > 0) this.shake = Math.max(0, this.shake - 40 * dt);
  }

  // Offset to apply to the whole scene while shaking.
  shakeOffset() {
    if (this.shake <= 0.2) return { x: 0, y: 0 };
    return {
      x: (Math.random() - 0.5) * this.shake,
      y: (Math.random() - 0.5) * this.shake,
    };
  }
}
