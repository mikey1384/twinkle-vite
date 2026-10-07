import { U, W, H, r3, star } from '../pixel';
import type { Weather } from './themes';

// Screen-space weather drawn over the level: each kind keeps a small pool of
// pixel flakes that wrap around the screen and drift with the camera.

interface Flake {
  x: number;
  y: number;
  s: number; // speed / size factor
  p: number; // phase
}

const COUNT: Record<Weather, number> = {
  rain: 70,
  snow: 50,
  blizzard: 120,
  fireflies: 18,
  petals: 22,
  leaves: 18,
  bubbles: 20,
  stars: 30,
  sandstorm: 60,
  embers: 30,
  sparkles: 22,
  lightning: 0,
  fog: 4,
  pages: 10,
  confetti: 34,
  glitch: 0
};

export class WeatherLayer {
  kind: Weather | undefined;
  flakes: Flake[] = [];
  lastCam = 0;
  boltAt = 0;
  nextBolt = 2500;

  constructor(kind?: Weather, rand: () => number = Math.random) {
    this.kind = kind;
    if (!kind) return;
    for (let i = 0; i < COUNT[kind]; i++) {
      this.flakes.push({ x: rand() * W, y: rand() * H, s: 0.5 + rand(), p: rand() * Math.PI * 2 });
    }
  }

  draw(g: CanvasRenderingContext2D, cam: number, t: number) {
    const k = this.kind;
    if (!k) return;
    const dcam = cam - this.lastCam;
    this.lastCam = cam;
    const wrap = (f: Flake) => {
      if (f.x < -10) f.x += W + 20;
      if (f.x > W + 10) f.x -= W + 20;
      if (f.y > H + 10) f.y -= H + 20;
      if (f.y < -10) f.y += H + 20;
    };
    for (const f of this.flakes) {
      f.x -= dcam * (0.6 + f.s * 0.4);
      switch (k) {
        case 'rain':
          f.x -= 2 * f.s;
          f.y += 9 * f.s;
          g.fillStyle = 'rgba(190,215,255,.55)';
          g.fillRect(r3(f.x), r3(f.y), U, U * 4);
          break;
        case 'snow':
          f.y += 0.8 * f.s;
          f.x += Math.sin(t / 700 + f.p) * 0.5;
          g.fillStyle = '#ffffff';
          g.fillRect(r3(f.x), r3(f.y), f.s > 1 ? U * 2 : U, f.s > 1 ? U * 2 : U);
          break;
        case 'blizzard':
          f.x -= 7 * f.s;
          f.y += 2 * f.s;
          g.fillStyle = 'rgba(255,255,255,.85)';
          g.fillRect(r3(f.x), r3(f.y), U * 2, U);
          break;
        case 'fireflies': {
          f.x += Math.sin(t / 900 + f.p) * 0.4;
          f.y += Math.cos(t / 1100 + f.p) * 0.3;
          const glow = (Math.sin(t / 400 + f.p * 3) + 1) / 2;
          g.globalAlpha = 0.25 + glow * 0.75;
          g.fillStyle = 'rgba(230,255,120,.35)';
          g.fillRect(r3(f.x) - U, r3(f.y) - U, U * 3, U * 3);
          g.fillStyle = '#f4ff9a';
          g.fillRect(r3(f.x), r3(f.y), U, U);
          g.globalAlpha = 1;
          break;
        }
        case 'petals':
        case 'leaves': {
          f.y += 0.7 * f.s;
          f.x -= 0.6 + Math.sin(t / 500 + f.p) * 0.8;
          const cols = k === 'petals' ? ['#ffb3d1', '#ffffff', '#ffd6e8'] : ['#e8902a', '#d9542b', '#f2c14e'];
          g.fillStyle = cols[Math.floor(f.p * 10) % 3];
          const flip = Math.sin(t / 200 + f.p) > 0;
          g.fillRect(r3(f.x), r3(f.y), flip ? U * 2 : U, flip ? U : U * 2);
          break;
        }
        case 'bubbles':
          f.y -= 0.9 * f.s;
          f.x += Math.sin(t / 400 + f.p) * 0.4;
          g.fillStyle = 'rgba(210,245,255,.7)';
          g.fillRect(r3(f.x), r3(f.y), U * (f.s > 1.1 ? 2 : 1), U * (f.s > 1.1 ? 2 : 1));
          g.fillStyle = '#ffffff';
          g.fillRect(r3(f.x), r3(f.y), U, U);
          break;
        case 'stars': {
          if (f.y > H * 0.6) f.y -= H * 0.6;
          const tw = (Math.sin(t / 300 + f.p * 5) + 1) / 2;
          g.globalAlpha = 0.3 + tw * 0.7;
          g.fillStyle = '#fffbe0';
          if (f.s > 1.3 && tw > 0.8) star(g, f.x, f.y, 5);
          else g.fillRect(r3(f.x), r3(f.y), U, U);
          g.globalAlpha = 1;
          break;
        }
        case 'sandstorm':
          f.x -= 8 * f.s;
          f.y += Math.sin(t / 300 + f.p) * 0.6;
          g.fillStyle = 'rgba(240,200,130,.55)';
          g.fillRect(r3(f.x), r3(f.y), U * 3, U);
          break;
        case 'embers':
          f.y -= 1.1 * f.s;
          f.x += Math.sin(t / 300 + f.p) * 0.6;
          g.fillStyle = Math.sin(t / 150 + f.p) > 0 ? '#ffd84a' : '#ff6a2a';
          g.fillRect(r3(f.x), r3(f.y), U, U);
          break;
        case 'sparkles': {
          f.y -= 0.2;
          const tw = Math.max(0, Math.sin(t / 250 + f.p * 4));
          g.globalAlpha = tw;
          g.fillStyle = '#ffffff';
          star(g, f.x, f.y, 3 + tw * 4);
          g.globalAlpha = 1;
          break;
        }
        case 'fog': {
          f.x -= 0.3 * f.s;
          g.fillStyle = 'rgba(220,210,255,.10)';
          const fy = r3(H * 0.45 + f.p * 25);
          for (let i = 0; i < 6; i++) g.fillRect(r3(f.x + i * 60) - 240, fy + i * U * 2, 420, U * 6);
          if (f.x < -200) f.x += W + 400;
          break;
        }
        case 'pages': {
          f.y += 0.5 * f.s;
          f.x -= 0.8 + Math.sin(t / 600 + f.p);
          const open = Math.sin(t / 220 + f.p) > 0;
          g.fillStyle = '#fbf6e6';
          g.fillRect(r3(f.x), r3(f.y), open ? U * 4 : U * 2, U * 3);
          g.fillStyle = '#c9bc96';
          g.fillRect(r3(f.x), r3(f.y) + U, open ? U * 3 : U, U);
          break;
        }
        case 'confetti': {
          f.y += 1.2 * f.s;
          f.x += Math.sin(t / 300 + f.p) * 0.8;
          const cols = ['#ff4d6d', '#ffcb32', '#418ceb', '#3fbf4f', '#df3296'];
          g.fillStyle = cols[Math.floor(f.p * 10) % cols.length];
          const flip = Math.sin(t / 120 + f.p) > 0;
          g.fillRect(r3(f.x), r3(f.y), flip ? U * 2 : U, flip ? U : U * 2);
          break;
        }
      }
      wrap(f);
    }
    if (k === 'lightning') {
      if (t > this.nextBolt) {
        this.boltAt = t;
        this.nextBolt = t + 3500 + Math.random() * 4000;
      }
      const since = t - this.boltAt;
      if (since < 260) {
        g.fillStyle = `rgba(255,255,255,${since < 60 || (since > 120 && since < 170) ? 0.55 : 0.12})`;
        g.fillRect(0, 0, W, H);
        // a pixel bolt far off
        g.fillStyle = '#fffbe0';
        let x = 200 + ((this.boltAt / 7) % 560);
        for (let y = 0; y < H * 0.55; y += U * 2) {
          x += ((Math.floor(y / 7) * 37) % 3) * U - U;
          g.fillRect(r3(x), y, U * 2, U * 2);
        }
      }
    }
    if (k === 'glitch' && Math.floor(t / 90) % 23 === 0) {
      // a slice of the frame slips sideways for a moment
      const y = r3((t * 7) % (H - 40));
      g.drawImage(g.canvas, 0, y, W, 18, r3(Math.sin(t) * 18), y, W, 18);
      g.fillStyle = 'rgba(255,79,216,.18)';
      g.fillRect(0, y, W, 18);
    }
  }
}
