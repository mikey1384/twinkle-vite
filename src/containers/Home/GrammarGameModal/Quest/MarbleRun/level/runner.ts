import { U, W, H, INK, r3, drawSprite, lowRes, loadImage, ready, pxEllipse, makeSprite, rect, disc } from '../pixel';
import { Fx } from '../fx';
import { MR, PX, MSCALE, LADDER, Grade, GRADE, marbleSprite, WINGS, CART, HELMET, bubbleRing, Face } from '../marble';
import { practiceChime, perfectBonus, missSound, flagSound } from '../audio';
import { buildLevel, Level, BASE_Y } from './level';
import { drawTerrain } from './terrain';
import { WeatherLayer } from './weather';
import type { MarbleCtl, Move, RunView } from './types';
import type { Theme } from './themes';
import './obstacles';
import './enemies';
import { gqMedia } from '../../../media';

// A practice stop (Mikey 10-07): accuracy only. One marble crosses the level;
// each obstacle is a question. A right answer clears it and promotes the
// marble one grade (glass → D → C → B → A → S); S rolls on to the flag. A
// wrong answer fails the obstacle (never a demotion) and the marble tries
// again with the next question.

export type PracticeState = 'travel' | 'wait' | 'move' | 'goal' | 'done';

export interface PracticeEvents {
  // the marble is ready for the next question (after a pass or a fail)
  onReady?(): void;
  onPromote?(grade: Grade): void;
  onFinish?(result: { misses: number }): void;
}

const GRAV: Record<string, number> = { roll: 0.7, slide: 0.7, rail: 0.7, lowgrav: 0.22, swim: 0, fly: 0 };

const flagFrames = [0, 1, 2, 3].map((f) =>
  makeSprite(22, 42, (put) => {
    rect(put, 2, 4, 2, 34, '#e3e7ee');
    rect(put, 3, 4, 1, 34, '#9aa0aa');
    disc(put, 3, 2.5, 2.6, 2.6, '#ffcb32', '#c98a00');
    rect(put, 0, 38, 6, 4, '#7a5a3a');
    rect(put, 0, 38, 6, 1, '#a07a50');
    for (let x = 0; x < 17; x++) {
      const wave = Math.round(Math.sin(x / 3 + f * (Math.PI / 2)) * 1.3);
      const top = 6 + wave + Math.round(x * 0.18);
      const len = Math.max(1, 11 - Math.round(x * 0.62));
      for (let y = 0; y < len; y++) put(4 + x, top + y, y > len * 0.6 ? '#b0136a' : '#e91e8c');
    }
    put(9, 10, '#ffcb32');
    put(8, 11, '#ffcb32');
    put(9, 11, '#fff');
    put(10, 11, '#ffcb32');
    put(9, 12, '#ffcb32');
  })
);

export function backdropUrl(id: string) {
  return gqMedia(`img/grammar-quest/levels/${id}.png`);
}

export class PracticeRun implements RunView {
  level: Level;
  theme: Theme;
  fx = new Fx();
  weather: WeatherLayer;
  events: PracticeEvents;
  backdrop: HTMLImageElement;

  state: PracticeState = 'travel';
  grade: Grade | null = null;
  misses = 0;
  stop = 0;
  target = 0;
  pending: boolean | null = null;
  move: { m: Move; ok: boolean; at: number } | null = null;
  goalAt = 0;

  // the marble
  x = 60;
  y = 0;
  vy = 0;
  turn = 0;
  squash = 1;
  free = false; // falling (off a ledge, into a pit)
  through = false; // falling straight through the ground (pits)
  hidden = false;
  placed = false;
  cartTilt = 0;
  flashAt = -1e9;
  hurtUntil = 0;
  cam = 0;
  t = 0;

  constructor(theme: Theme, seed: string, events: PracticeEvents = {}) {
    this.theme = theme;
    this.level = buildLevel(theme, seed);
    this.events = events;
    this.weather = new WeatherLayer(theme.weather);
    this.backdrop = loadImage(backdropUrl(theme.id));
    this.y = this.level.restY(this.x) ?? BASE_Y - MR;
    this.target = this.level.obstacles[0].waitX;
  }

  // pick up a run reopened after a reload: the marble is already promoted
  // `rights` times and waits at the next obstacle (or rolls to the flag)
  resume(rights: number, misses: number) {
    const promoted = Math.min(rights, LADDER.length);
    this.misses = misses;
    if (!promoted) return;
    this.grade = LADDER[promoted - 1];
    this.stop = promoted;
    const at = promoted >= LADDER.length ? this.level.goalX - 200 : this.level.obstacles[promoted].waitX - 160;
    this.x = Math.max(60, at);
    this.y = this.level.restY(this.x) ?? BASE_Y - MR;
    this.cam = Math.max(0, this.x - 260);
    this.target = promoted >= LADDER.length ? this.level.goalX : this.level.obstacles[promoted].waitX;
  }

  get mode() {
    return this.theme.mode;
  }
  get marbleX() {
    return this.x;
  }
  get marbleY() {
    return this.y;
  }
  groundAt(x: number) {
    return this.level.groundAt(x);
  }
  get obstacle() {
    return this.level.obstacles[Math.min(this.stop, this.level.obstacles.length - 1)];
  }
  get nextGrade(): Grade {
    return this.grade ? LADDER[Math.min(LADDER.length - 1, LADDER.indexOf(this.grade) + 1)] : 'D';
  }
  get busy() {
    return this.pending !== null || !!this.move || this.state === 'goal' || this.state === 'done' || this.grade === 'S';
  }

  // The player answered the current question. Returns false while the
  // marble is busy (the caller keeps the buttons disabled anyway).
  answer(ok: boolean) {
    if (this.busy) return false;
    if (ok) {
      if (this.grade === 'A' && this.misses === 0) perfectBonus();
      else practiceChime(this.grade ? LADDER.indexOf(this.grade) + 1 : 0);
    } else {
      missSound();
      this.misses++;
    }
    this.pending = ok;
    if (this.state === 'wait') this.beginMove(this.t);
    return true;
  }

  private beginMove(t: number) {
    const ok = !!this.pending;
    this.pending = null;
    this.state = 'move';
    this.move = { m: ok ? this.obstacle.pass : this.obstacle.fail, ok, at: t };
    // every move sees k = 0 first, so it can reset its own flags
    this.move.m.step(0, this.ctl(), t);
  }

  private endMove(t: number) {
    const ok = this.move!.ok;
    this.move = null;
    this.free = this.through = false;
    this.hidden = false;
    if (ok) {
      this.grade = this.nextGrade;
      this.flashAt = t;
      this.fx.burst(this.grade === 'S' ? 'star' : 'sparkle', this.grade === 'S' ? 20 : 12, this.x, this.y, { color: GRADE[this.grade][0] });
      this.fx.text(`${this.grade}!`, this.x, this.y - 56, GRADE[this.grade][0], this.grade === 'S' ? 24 : 18);
      this.stop++;
      this.events.onPromote?.(this.grade);
      this.target = this.grade === 'S' ? this.level.goalX : this.level.obstacles[this.stop].waitX;
    } else {
      this.target = this.obstacle.waitX;
    }
    this.state = 'travel';
    if (this.grade !== 'S') this.events.onReady?.();
  }

  // ---- the controller handed to obstacle moves
  private ctl(): MarbleCtl {
    const run = this;
    const lv = this.level;
    return {
      get x() {
        return run.x;
      },
      get y() {
        return run.y;
      },
      t: this.t,
      mode: this.mode,
      fx: this.fx,
      groundAt: (x) => lv.groundAt(x),
      restY: (x) => lv.restY(x),
      place(x, y) {
        run.turn += (x - run.x) / MR;
        run.x = x;
        run.y = y;
        run.placed = true;
        run.vy = 0;
      },
      roll(x) {
        run.turn += (x - run.x) / MR;
        run.x = x;
      },
      arc(x0, x1, h, k) {
        const y0 = lv.restY(x0) ?? BASE_Y - MR;
        const y1 = lv.restY(x1) ?? BASE_Y - MR;
        return { x: x0 + (x1 - x0) * k, y: y0 + (y1 - y0) * k - h * 4 * k * (1 - k) };
      },
      fall() {
        run.free = true;
        run.through = true;
      },
      respawn(x) {
        run.free = run.through = false;
        run.x = x;
        run.y = lv.restY(x) ?? BASE_Y - MR;
        run.vy = 0;
        run.hidden = false;
        run.fx.burst('sparkle', 10, x, run.y);
        run.flashAt = run.t;
      },
      spin(r) {
        run.turn += r;
      },
      tilt(r) {
        run.cartTilt = r;
      },
      squash(a) {
        run.squash = a;
      },
      bump(text = 'OUCH') {
        run.flashAt = run.t;
        run.hurtUntil = run.t + 700;
        run.squash = 0.7;
        run.fx.shake(run.t, 6, 200);
        run.fx.burst('dust', 8, run.x + 20, run.y);
        run.fx.text(text, run.x, run.y - 50, '#ff9db0', 12);
      },
      hide(h) {
        run.hidden = h;
      }
    };
  }

  private update(t: number) {
    this.t = t;
    const lv = this.level;
    const prevX = this.x;
    this.placed = false;
    this.cartTilt = 0;
    if (this.state === 'move' && this.move) {
      const k = Math.min(1, (t - this.move.at) / this.move.m.dur);
      this.move.m.step(k, this.ctl(), t);
      if (k >= 1) this.endMove(t);
    } else if (this.state === 'travel') {
      const d = this.target - this.x;
      const g0 = lv.groundAt(this.x);
      const g1 = lv.groundAt(this.x + 10);
      const downhill = g0 !== null && g1 !== null && g1 > g0;
      const top = this.grade === 'S' ? 9 : this.mode === 'slide' ? 8 : 6;
      const v = Math.sign(d) * Math.min(Math.abs(d), Math.max(1.5, Math.min(top, Math.abs(d) * 0.06)) + (downhill ? 2 : 0));
      this.x += v;
      if (Math.abs(this.target - this.x) < 1) {
        this.x = this.target;
        if (this.grade === 'S') {
          this.state = 'goal';
          this.goalAt = t;
        } else {
          this.state = 'wait';
          if (this.pending !== null) this.beginMove(t);
        }
      }
    }
    // gravity and the ground (or the lane, underwater and in the sky)
    if (!this.placed) {
      const rest = this.through ? null : lv.restY(this.x);
      const g = GRAV[this.mode];
      if (this.mode === 'swim' || this.mode === 'fly') {
        if (rest !== null) this.y += (rest - this.y) * 0.12;
      } else if (rest === null || this.free || this.y < rest - 1) {
        this.vy += g;
        this.y += this.vy;
        if (rest !== null && !this.through && this.y >= rest) {
          this.y = rest;
          if (this.vy > 3) {
            this.squash = Math.max(0.7, 1 - Math.min(14, this.vy) / 40);
            this.fx.burst('puff', 3, this.x, this.y + MR);
          }
          this.vy = 0;
          this.free = false;
        }
        if (this.y > H + 80) this.hidden = true;
      } else {
        this.y = rest;
        this.vy = 0;
      }
      this.turn += (this.x - prevX) / MR;
    }
    // at rest the roll settles so the letter faces you
    if (this.state === 'wait' || this.state === 'goal' || this.state === 'done') {
      this.turn += (Math.round(this.turn / (Math.PI * 2)) * Math.PI * 2 - this.turn) * 0.15;
    }
    this.squash += (1 - this.squash) * 0.18;
    if (this.state === 'goal' && t - this.goalAt > 200) {
      this.state = 'done';
      this.fx.burst('star', 24, this.x, this.y, { color: GRADE.S[0], speed: 1.3 });
      flagSound();
      this.events.onFinish?.({ misses: this.misses });
    }
    for (const e of lv.entities) e.update?.(t, this);
    lv.entities = lv.entities.filter((e) => !e.dead);
    this.cam += (Math.max(0, this.x - 260) - this.cam) * 0.1;
  }

  frame(g: CanvasRenderingContext2D, t: number) {
    this.update(t);
    const [sx, sy] = this.fx.shakeOffset(t);
    g.save();
    g.translate(sx, sy);
    g.fillStyle = INK;
    g.fillRect(-40, -40, W + 80, H + 80);
    const cam = r3(this.cam);
    this.drawBackdrop(g, cam);
    // sky levels have no ground at all
    if (this.mode !== 'fly') drawTerrain(g, this.level, cam, t);
    this.drawFlag(g, cam, t);
    for (const e of this.level.entities) if (!e.front) e.draw(g, cam, t, this);
    this.drawMarble(g, cam, t);
    for (const e of this.level.entities) if (e.front) e.draw(g, cam, t, this);
    this.fx.draw(g, cam);
    this.weather.draw(g, cam, t);
    g.restore();
    this.fx.overlay(g, t, W, H);
  }

  private drawBackdrop(g: CanvasRenderingContext2D, cam: number) {
    const img = this.backdrop;
    if (!ready(img)) {
      // until the painting loads: a sky in the theme's light
      const sky: Record<string, [string, string]> = {
        day: ['#7cc8f0', '#cdeefc'],
        sunset: ['#f08a5d', '#ffd59a'],
        night: ['#0d1640', '#2a3a7a'],
        dark: ['#140c24', '#2c2044'],
        dream: ['#8f6ad8', '#f3c6f0']
      };
      const [a, b2] = sky[this.theme.light];
      const gr = g.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, a);
      gr.addColorStop(1, b2);
      g.fillStyle = gr;
      g.fillRect(0, 0, W, H);
      return;
    }
    const w = Math.round(img.naturalWidth * (H / img.naturalHeight));
    const low = lowRes(img, w, H);
    const off = r3(cam * 0.35);
    const tile = Math.floor(off / w);
    const x = -(off % w);
    const lift = this.mode === 'fly' || this.mode === 'swim' ? 0 : -18;
    g.imageSmoothingEnabled = false;
    for (let k = 0; k < 3; k++) {
      const left = x + k * w;
      g.save();
      // every other copy is mirrored, so the edges always match
      if ((tile + k) % 2 === 1) {
        g.translate(left + w, 0);
        g.scale(-1, 1);
        g.drawImage(low, 0, lift, w, H);
      } else g.drawImage(low, left, lift, w, H);
      g.restore();
    }
  }

  private drawFlag(g: CanvasRenderingContext2D, cam: number, t: number) {
    const f = flagFrames[Math.floor(t / 160) % 4];
    const fx = this.level.goalX + 70;
    const base = this.level.groundAt(fx) ?? (this.level.restY(fx) ?? BASE_Y) + MR;
    drawSprite(g, f, fx - cam, base - f.height * U + U);
  }

  private drawMarble(g: CanvasRenderingContext2D, cam: number, t: number) {
    if (this.hidden) return;
    const lv = this.level;
    const sx = this.x - cam;
    const gy = lv.groundAt(this.x);
    const lifted = this.placed || this.free;
    if (gy !== null && this.mode !== 'swim') {
      const air = Math.max(0, gy - MR - this.y);
      pxEllipse(g, sx, gy - U, MR * Math.max(0.35, 1 - air / 220), U * 2, 'rgba(0,0,0,.2)');
    }
    const face: Face = t < this.hurtUntil ? 'strained' : this.state === 'wait' ? 'steady' : 'happy';
    const bob = this.state === 'wait' && !lifted ? -Math.round(Math.abs(Math.sin(t / 260)) * 2) * U : 0;
    const swayY = this.mode === 'swim' || this.mode === 'fly' ? Math.sin(t / 400) * 4 : 0;
    const cy = this.y + bob + swayY;
    const sprite = marbleSprite(this.grade, face, this.turn);
    g.save();
    // falling into a pit: hidden below the lip
    if (this.through) {
      g.beginPath();
      g.rect(0, 0, W, BASE_Y + U * 2);
      g.clip();
    }
    if (this.mode === 'rail') {
      // the cart rides under the marble, leaning with the track (loops)
      g.save();
      g.translate(r3(sx), r3(cy));
      if (this.cartTilt) g.rotate(this.cartTilt);
      drawSprite(g, CART, -(CART.width * U) / 2, MR - CART.height * U * 0.55);
      g.restore();
    }
    if (this.mode === 'fly') {
      const wf = WINGS[Math.floor(t / 140) % 2];
      drawSprite(g, wf, sx - MR - wf.width * U + 18, cy - 30);
      drawSprite(g, wf, sx + MR - 18, cy - 30, U, { flip: true });
    }
    const w = (PX * MSCALE) / Math.sqrt(this.squash);
    const h = PX * MSCALE * this.squash;
    g.imageSmoothingEnabled = false;
    g.drawImage(sprite, r3(sx - w / 2), r3(cy + MR - h), Math.round(w), Math.round(h));
    if (this.mode === 'lowgrav') drawSprite(g, HELMET, sx - (HELMET.width * U) / 2, cy - (HELMET.height * U) / 2 + U);
    if (this.mode === 'swim') bubbleRing(g, sx, cy, t);
    g.restore();
    if (t - this.flashAt < 220) {
      g.globalAlpha = 0.55;
      pxEllipse(g, sx, cy, MR + 3, MR + 3, t < this.hurtUntil ? '#ff3c5a' : '#ffffff');
      g.globalAlpha = 1;
    }
    if (this.mode === 'swim' && Math.random() < 0.06) {
      this.fx.add({ kind: 'bubble', x: this.x - 20, y: cy - 10, vy: -0.6, life: 1 });
    }
  }
}
