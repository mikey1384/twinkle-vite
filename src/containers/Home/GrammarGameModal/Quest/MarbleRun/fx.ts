import { U, r3, star, pixelText } from './pixel';

// Particles, floating text, screen shake and flashes, shared by levels and
// boss fights. Positions are in world space; draw() takes the camera offset.

export type ParticleKind =
  | 'star'
  | 'sparkle'
  | 'puff'
  | 'dust'
  | 'sweat'
  | 'shard'
  | 'frag'
  | 'bubble'
  | 'splash'
  | 'ember'
  | 'leaf'
  | 'snow'
  | 'spark';

interface Particle {
  kind: ParticleKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
  gravity: number;
  fade: number;
}

interface Float {
  text: string;
  x: number;
  y: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

const GRAVITY: Partial<Record<ParticleKind, number>> = {
  dust: 0.05,
  bubble: -0.06,
  ember: -0.04,
  leaf: 0.03,
  snow: 0.02,
  sweat: 0.18,
  spark: 0.1
};
const FADE: Partial<Record<ParticleKind, number>> = { star: 0.018, frag: 0.012, bubble: 0.012, leaf: 0.01, snow: 0.01 };

export class Fx {
  particles: Particle[] = [];
  floats: Float[] = [];
  shakeUntil = 0;
  shakeMag = 0;
  flashUntil = 0;
  flashColor = 'rgba(255,255,255,.7)';
  tintUntil = 0;
  tintColor = '';

  burst(
    kind: ParticleKind,
    n: number,
    x: number,
    y: number,
    { color = '#ffcb32', speed = 1, size = 0, spread = Math.PI * 2, dir = 0, up = 2 } = {}
  ) {
    for (let i = 0; i < n; i++) {
      const a = dir - spread / 2 + (spread * (i + Math.random() * 0.6)) / n;
      const sp = (kind === 'dust' ? 1.5 + Math.random() * 1.5 : 3 + Math.random() * 4) * speed;
      this.particles.push({
        kind,
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - (kind === 'dust' ? 1 : up),
        life: kind === 'frag' ? 1.4 : 1,
        color,
        size: size || (kind === 'frag' ? U * 2 : 0),
        gravity: GRAVITY[kind] ?? 0.18,
        fade: FADE[kind] ?? 0.03
      });
    }
  }

  add(p: Partial<Particle> & { kind: ParticleKind; x: number; y: number }) {
    this.particles.push({
      vx: 0,
      vy: 0,
      life: 1,
      color: '#fff',
      size: 0,
      gravity: GRAVITY[p.kind] ?? 0.18,
      fade: FADE[p.kind] ?? 0.03,
      ...p
    });
  }

  text(text: string, x: number, y: number, color = '#fff', size = 14) {
    this.floats.push({ text, x, y, vy: -2.2, life: 1, color, size });
  }

  shake(t: number, mag: number, ms: number) {
    this.shakeMag = t < this.shakeUntil ? Math.max(this.shakeMag, mag) : mag;
    this.shakeUntil = Math.max(this.shakeUntil, t + ms);
  }

  flash(t: number, ms: number, color = 'rgba(255,255,255,.7)') {
    this.flashUntil = t + ms;
    this.flashColor = color;
  }

  tint(t: number, ms: number, color: string) {
    this.tintUntil = t + ms;
    this.tintColor = color;
  }

  shakeOffset(t: number): [number, number] {
    if (t >= this.shakeUntil) return [0, 0];
    return [r3((Math.random() - 0.5) * 2 * this.shakeMag), r3((Math.random() - 0.5) * 2 * this.shakeMag)];
  }

  draw(g: CanvasRenderingContext2D, camX = 0) {
    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      if (p.kind === 'leaf' || p.kind === 'snow') p.vx += Math.sin(p.y / 20) * 0.05;
      p.life -= p.fade;
      g.globalAlpha = Math.max(0, Math.min(1, p.life));
      const x = r3(p.x - camX);
      const y = r3(p.y);
      switch (p.kind) {
        case 'star':
          g.fillStyle = p.color;
          star(g, p.x - camX, p.y, 7);
          break;
        case 'sparkle':
          g.fillStyle = '#fff';
          star(g, p.x - camX, p.y, 5);
          break;
        case 'sweat':
          g.fillStyle = '#7cc7ff';
          g.fillRect(x, y, 6, 9);
          break;
        case 'frag':
          g.fillStyle = p.color;
          g.fillRect(x, y, p.size, p.size);
          break;
        case 'shard':
          g.fillStyle = p.color;
          g.fillRect(x, y, 9, 6);
          g.fillStyle = '#fff';
          g.fillRect(x, y, U, U);
          break;
        case 'bubble':
          g.fillStyle = 'rgba(210,245,255,.8)';
          g.fillRect(x, y, U * 2, U * 2);
          g.fillStyle = '#fff';
          g.fillRect(x, y, U, U);
          break;
        case 'splash':
          g.fillStyle = 'rgba(190,235,255,.9)';
          g.fillRect(x, y, U * 2, U * 2);
          break;
        case 'ember':
          g.fillStyle = p.life > 0.5 ? '#ffd84a' : '#ff6a2a';
          g.fillRect(x, y, U, U);
          break;
        case 'leaf':
          g.fillStyle = p.color;
          g.fillRect(x, y, U * 2, U);
          break;
        case 'snow':
          g.fillStyle = '#fff';
          g.fillRect(x, y, U, U);
          break;
        case 'spark':
          g.fillStyle = p.color;
          g.fillRect(x, y, U, U);
          break;
        default: {
          g.fillStyle = p.kind === 'dust' ? 'rgba(150,120,90,.75)' : 'rgba(255,255,255,.9)';
          const z = p.kind === 'dust' ? 9 : 6;
          g.fillRect(x, y, z, z);
        }
      }
      g.globalAlpha = 1;
    }
    this.particles = this.particles.filter((p) => p.life > 0 && p.y < 520 && p.y > -200);
    for (const f of this.floats) {
      f.y += f.vy;
      f.vy *= 0.94;
      f.life -= 0.016;
      g.globalAlpha = Math.max(0, Math.min(1, f.life * 2));
      pixelText(g, f.text, f.x - camX, f.y, f.size, f.color);
      g.globalAlpha = 1;
    }
    this.floats = this.floats.filter((f) => f.life > 0);
  }

  // full-screen overlays, drawn last
  overlay(g: CanvasRenderingContext2D, t: number, w: number, h: number) {
    if (t < this.tintUntil) {
      g.fillStyle = this.tintColor;
      g.fillRect(0, 0, w, h);
    }
    if (t < this.flashUntil) {
      g.fillStyle = this.flashColor;
      g.fillRect(0, 0, w, h);
    }
  }
}
