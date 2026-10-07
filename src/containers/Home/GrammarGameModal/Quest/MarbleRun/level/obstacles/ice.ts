import { makeSprite, rect, disc, line, poly, drawSprite, drawStanding, r3, U, INK } from '../../pixel';
import { MR } from '../../marble';
import { thump, note, whoosh } from '../../audio';
import type { Entity, MarbleCtl, RunView } from '../types';
import { registerObstacle, ease, easeIn, easeInOut, span } from './registry';

// Ice obstacles for slide levels. The marble slides rather than rolls:
// passes kick off fast and end in long skids that throw up snow and ice
// sparkles; misses skid back the same way.

const BASE = 309;
// A move restarts with k below where it last stopped. The runner starts a
// move one frame late, so k is almost never exactly 0 on the first step.
function starts() {
  let last = Infinity;
  return (k: number) => {
    const fresh = k < last;
    last = k;
    return fresh;
  };
}
function hop(x0: number, y0: number, x1: number, y1: number, h: number, k: number) {
  return { x: x0 + (x1 - x0) * k, y: y0 + (y1 - y0) * k - h * 4 * k * (1 - k) };
}
// a long skid: fast at first, then easing out over the whole distance
const skid = (k: number) => 1 - Math.pow(1 - k, 3);
// snow thrown up behind the marble and glints on the ice; amt 0..1
function spray(m: MarbleCtl, amt: number, dir = 1) {
  if (Math.random() < amt) {
    m.fx.add({
      kind: 'snow',
      x: m.x - dir * MR * 0.7,
      y: m.y + MR - U,
      vx: -dir * (1 + Math.random() * 2.5),
      vy: -0.8 - Math.random() * 1.6,
      gravity: 0.08,
      life: 0.8
    });
  }
  if (Math.random() < amt * 0.35) {
    m.fx.add({ kind: 'sparkle', x: m.x + (Math.random() - 0.5) * MR * 1.4, y: m.y + MR - U * 2, vy: -0.3, gravity: 0, life: 0.7 });
  }
}
function skidHiss(level = 0.05) {
  whoosh(level, 0.55, 0, 3200, 1400);
}

// ---- ramp: an ice ramp to jump a wide gap ----------------------------------
const PENNANT = [0, 1].map((f) =>
  makeSprite(9, 16, (put) => {
    rect(put, 0, 1, 1, 15, '#e3e7ee');
    disc(put, 0.5, 0.5, 1.2, 1.2, '#ffcb32');
    poly(put, [[1, 2], [8, 4 + f], [1, 7]], '#3fa9f5');
    line(put, 1, 3, 6, 4 + f, '#9fd8ff');
  })
);
class RampDressing implements Entity {
  x: number;
  y = 0;
  lipX: number;
  constructor(x0: number, lipX: number) {
    this.x = x0;
    this.lipX = lipX;
  }
  draw(g: CanvasRenderingContext2D, cam: number, t: number, run: RunView) {
    if (this.lipX - cam < -200 || this.x - cam > 1100) return;
    // a glint that sweeps up the ramp face every couple of seconds
    const ph = (t % 2400) / 900;
    if (ph < 1) {
      for (let i = 0; i < 4; i++) {
        const x = this.x + (this.lipX - this.x) * ph - i * U * 2;
        if (x < this.x || x > this.lipX) continue;
        const gy = run.groundAt(x) ?? BASE;
        g.fillStyle = i ? 'rgba(255,255,255,.55)' : '#ffffff';
        g.fillRect(r3(x - cam), r3(gy) + U, U * 2, U * (3 - Math.min(2, i)));
      }
    }
    // a pair of pennants marks the kicker
    const lipY = run.groundAt(this.lipX - U) ?? BASE;
    const f = PENNANT[Math.floor(t / 200) % 2];
    drawStanding(g, f, this.lipX - cam - 12, lipY);
    drawStanding(g, f, this.x - cam + 8, run.groundAt(this.x) ?? BASE);
  }
}
registerObstacle('ramp', (b) => {
  const x0 = b.x;
  const waitX = x0 - 70;
  // on snow fields the ramp is a slab of clear ice; elsewhere it is the ground
  const mat = b.theme.terrain === 'snow' ? 'ice' : undefined;
  const rise = 66;
  b.add(156, 'slope', -rise, mat);
  const lipX = b.x;
  const lipY = b.y;
  b.add(216, 'gap');
  const farX = b.x;
  b.add(210, 'flat');
  b.add(156, 'slope', rise);
  b.add(60, 'flat');
  b.entity(new RampDressing(x0, lipX));
  const touchX = farX + 50;
  const stopX = farX + 175;
  const passNew = starts();
  const failNew = starts();
  let launched = false;
  let landed = false;
  let fell = false;
  let back = false;
  return {
    kind: 'ramp',
    label: 'the ice ramp',
    waitX,
    pass: {
      dur: 1900,
      step(k, m) {
        if (passNew(k)) launched = landed = false;
        if (k < 0.28) {
          m.roll(waitX + (lipX - waitX) * easeIn(k / 0.28));
          spray(m, 0.4 + k);
        } else if (k < 0.6) {
          if (!launched) {
            launched = true;
            whoosh(0.08, 0.4, 0, 900, 2600);
            note(79, { instrument: 'glock', level: 0.08 });
            note(86, { at: 0.08, instrument: 'glock', level: 0.07 });
            m.fx.burst('snow', 10, lipX, lipY - 4, { speed: 0.8 });
          }
          const p = hop(lipX, lipY - MR, touchX, lipY - MR, 130, span(k, 0.28, 0.6));
          m.place(p.x, p.y);
          m.spin(0.32);
        } else {
          const s = span(k, 0.6, 1);
          if (!landed) {
            landed = true;
            thump(0.4);
            m.squash(0.72);
            m.fx.burst('sparkle', 8, touchX, lipY - 6, { speed: 0.7 });
            m.fx.burst('snow', 12, touchX, lipY - 4, { speed: 0.9 });
            skidHiss(0.06);
          }
          m.roll(touchX + (stopX - touchX) * skid(s));
          spray(m, 1 - s);
        }
      }
    },
    fail: {
      dur: 2400,
      step(k, m) {
        if (failNew(k)) fell = back = false;
        if (k < 0.32) {
          // not enough speed: it crawls up the kicker
          m.roll(waitX + (lipX - waitX) * easeInOut(k / 0.32));
          spray(m, 0.2);
        } else if (k < 0.46) {
          const p = hop(lipX, lipY - MR, lipX + 72, lipY - MR + 24, 34, span(k, 0.32, 0.46));
          m.place(p.x, p.y);
          m.spin(0.06);
        } else if (!fell) {
          fell = true;
          m.fall();
          m.fx.burst('snow', 10, lipX + 10, lipY, { speed: 0.6 });
          m.fx.text('UH-OH', lipX + 72, lipY - 90, '#d8f2ff', 12);
          whoosh(0.08, 0.6, 0, 900, 200);
        } else if (k > 0.86 && !back) {
          back = true;
          m.respawn(waitX);
        }
      }
    }
  };
});

// ---- crack: thin ice over freezing water -----------------------------------
interface Panel {
  x0: number;
  x1: number;
  crackAt: number;
  breakAt: number;
  regrowAt: number;
  grownAt: number;
  splashed: boolean;
  crack: [number, number][]; // a zigzag across the panel, in art px
}
class ThinIce implements Entity {
  x: number;
  y: number; // the ice's top
  x1: number;
  panels: Panel[] = [];
  constructor(x0: number, x1: number, y: number, rand: () => number) {
    this.x = x0;
    this.x1 = x1;
    this.y = y;
    const n = 8;
    for (let i = 0; i < n; i++) {
      const a = r3(x0 + ((x1 - x0) * i) / n);
      const b2 = r3(x0 + ((x1 - x0) * (i + 1)) / n);
      const w = (b2 - a) / U;
      const crack: [number, number][] = [];
      let cx = Math.floor(w * (0.3 + rand() * 0.4));
      for (let y = 0; y < 5; y++) {
        crack.push([cx, y]);
        cx = Math.max(1, Math.min(w - 2, cx + (rand() < 0.5 ? -1 : 1)));
      }
      this.panels.push({ x0: a, x1: b2, crackAt: 1e12, breakAt: 1e12, regrowAt: 1e12, grownAt: -1e9, splashed: false, crack });
    }
  }
  near(x: number, r: number) {
    return this.panels.filter((p) => p.x1 > x - r && p.x0 < x + r);
  }
  // a fresh sheet freezes back over the hole, from both edges in
  refreeze(t: number) {
    const n = this.panels.length;
    this.panels.forEach((p, i) => {
      if (p.breakAt > t && p.crackAt > t) return;
      p.regrowAt = t + 120 + Math.min(i, n - 1 - i) * 110;
    });
  }
  update(t: number, run: RunView) {
    for (const p of this.panels) {
      if (t >= p.breakAt && !p.splashed) {
        p.splashed = true;
        const cx = (p.x0 + p.x1) / 2;
        run.fx.burst('splash', 7, cx, this.y + 6, { speed: 0.7 });
        run.fx.burst('shard', 3, cx, this.y, { color: '#c4ecff', speed: 0.5 });
        whoosh(0.05, 0.25, 0, 1400, 400);
      }
      if (t >= p.regrowAt) {
        p.crackAt = p.breakAt = p.regrowAt = 1e12;
        p.splashed = false;
        p.grownAt = t;
        run.fx.burst('sparkle', 3, (p.x0 + p.x1) / 2, this.y, { speed: 0.4 });
      }
    }
  }
  draw(g: CanvasRenderingContext2D, cam: number, t: number, run: RunView) {
    const l = r3(this.x - cam);
    const r = r3(this.x1 - cam);
    if (r < -40 || l > 1000) return;
    const top = this.y;
    const surf = top + U * 5;
    // freezing water in the hole: dark under the ice, bands by depth
    g.fillStyle = '#163851';
    g.fillRect(l + U * 2, top, r - l - U * 4, U * 6);
    // inset, so the terrain's frosted lips and drips stay visible
    for (let x = l + U * 2; x < r - U * 2; x += U) {
      const wave = r3(Math.sin((x + cam) / 18 + t / 320) * U);
      const y = surf + wave;
      g.fillStyle = '#2f7fb0';
      g.fillRect(x, y, U, U * 6);
      g.fillStyle = '#245f8a';
      g.fillRect(x, y + U * 6, U, U * 8);
      g.fillStyle = '#1a476b';
      g.fillRect(x, y + U * 14, U, 400);
      g.fillStyle = (Math.floor((x + cam) / U) + Math.floor(t / 200)) % 9 === 0 ? '#ffffff' : '#9fe0ff';
      g.fillRect(x, y, U, U);
    }
    this.panels.forEach((p, i) => {
      const px = r3(p.x0 - cam);
      const pw = r3(p.x1 - p.x0);
      if (t >= p.breakAt) {
        const d = t - p.breakAt;
        if (d < 700) {
          // the slab splits and tips into the water
          const k = d / 700;
          g.globalAlpha = 1 - k;
          const half = r3(pw / 2);
          slab(g, px - r3(k * 6), top + r3(k * 30), half - U, U * 3);
          slab(g, px + half + r3(k * 6), top + r3(k * 42), pw - half, U * 3);
          g.globalAlpha = 1;
        } else {
          // a little floe bobbing where it was
          const bob = r3(Math.sin(t / 420 + i * 1.7) * U);
          slab(g, px + U * 2 + (i % 2) * U * 2, surf - U + bob, r3(pw * 0.45), U * 2);
        }
        return;
      }
      const grow = Math.min(1, (t - p.grownAt) / 500);
      const over = Math.abs(run.marbleX - (p.x0 + p.x1) / 2) < (p.x1 - p.x0) / 2 + MR * 0.6 && run.marbleY > top - MR - 12;
      const sag = over ? U : 0;
      g.globalAlpha = grow;
      slab(g, px, top - U + sag, pw, U * 4);
      g.globalAlpha = 1;
      if (grow < 1) {
        g.fillStyle = `rgba(255,255,255,${0.8 * (1 - grow)})`;
        g.fillRect(px, top - U + sag, pw, U * 4);
      }
      if (t >= p.crackAt) {
        for (const [cx, cy] of p.crack) {
          g.fillStyle = INK;
          g.fillRect(px + cx * U, top - U + sag + cy * U * 0.8, U, U);
          g.fillStyle = '#ffffff';
          g.fillRect(px + cx * U + U, top - U + sag + cy * U * 0.8, U, U);
        }
      }
    });
  }
}
// one slab of ice: outlined, a bright top and a darker underside
function slab(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  if (w <= 0) return;
  g.fillStyle = INK;
  g.fillRect(r3(x), r3(y) - U, w, h + U * 2);
  g.fillStyle = '#c4ecff';
  g.fillRect(r3(x) + U, r3(y), w - U * 2, h);
  g.fillStyle = '#ffffff';
  g.fillRect(r3(x) + U, r3(y), w - U * 2, U);
  g.fillStyle = '#7fbfe8';
  g.fillRect(r3(x) + U, r3(y) + h - U, w - U * 2, U);
  if (w > U * 6) {
    g.fillStyle = '#eaf8ff';
    g.fillRect(r3(x) + U * 3, r3(y) + U, U * 2, U);
  }
}
registerObstacle('crack', (b) => {
  const waitX = b.x - 60;
  const gx = b.x;
  const y0 = b.y;
  b.add(228, 'gap');
  const farX = b.x;
  b.add(220, 'flat');
  const ice = b.entity(new ThinIce(gx, farX, y0, b.rand));
  const restY = y0 - MR;
  const stopX = farX + 160;
  const passNew = starts();
  const failNew = starts();
  let ticks = 0;
  let creaks = 0;
  let broke = false;
  let back = false;
  return {
    kind: 'crack',
    label: 'the thin ice',
    waitX,
    pass: {
      dur: 1600,
      step(k, m, t) {
        if (passNew(k)) ticks = 0;
        if (k < 0.62) {
          // skims across too fast to sink; the sheet cracks up behind it
          const s = span(k, 0, 0.62);
          const x = waitX + (farX + 30 - waitX) * (s < 0.25 ? easeIn(s / 0.25) * 0.18 : 0.18 + (s - 0.25) * (0.82 / 0.75));
          m.place(x, restY);
          spray(m, 0.8);
          for (const p of ice.panels) {
            if (p.crackAt > t && x > p.x1 + 18) {
              p.crackAt = t;
              p.breakAt = t + 260;
              note(96 - ticks * 2, { instrument: 'glock', level: 0.04 });
              ticks++;
            }
          }
        } else {
          const s = span(k, 0.62, 1);
          if (ticks < 99) {
            ticks = 99;
            skidHiss();
          }
          m.roll(farX + 30 + (stopX - farX - 30) * skid(s));
          spray(m, 1 - s);
        }
      }
    },
    fail: {
      dur: 2600,
      step(k, m, t) {
        if (failNew(k)) {
          broke = back = false;
          creaks = 0;
        }
        const midX = gx + 84;
        if (k < 0.26) {
          m.place(waitX + (midX - waitX) * ease(k / 0.26), restY);
          spray(m, 0.3);
        } else if (k < 0.44) {
          // it stops on the ice; cracks spread out from under it
          const s = span(k, 0.26, 0.44);
          m.place(midX + Math.sin(k * 160) * 2, restY + (Math.sin(k * 90) > 0 ? U : 0));
          for (const p of ice.near(midX, 20 + s * 70)) if (p.crackAt > t) p.crackAt = t;
          const want = Math.floor(s * 3);
          if (want >= creaks) {
            creaks = want + 1;
            note(50 - creaks, { instrument: 'marimba', level: 0.1 });
            m.fx.shake(t, 2, 120);
            m.fx.burst('sweat', 2, m.x, m.y - 30, { speed: 0.4 });
          }
        } else if (!broke) {
          broke = true;
          for (const p of ice.near(midX, 46)) p.breakAt = Math.min(p.breakAt, t);
          m.fall();
          thump(0.5);
          whoosh(0.16, 0.6, 0, 1300, 200);
          m.fx.burst('splash', 18, midX, y0 + 4, { speed: 1 });
          m.fx.text('SPLASH', midX, y0 - 90, '#bfefff', 14);
        } else if (k > 0.84 && !back) {
          back = true;
          ice.refreeze(t);
          m.respawn(waitX);
          m.fx.text('BRRR', waitX, restY - 54, '#bfefff', 12);
          note(84, { at: 0.3, instrument: 'glock', level: 0.06 });
        }
      }
    }
  };
});

// ---- icicle: icicles drop from an overhang ---------------------------------
const ICICLE = makeSprite(7, 22, (put) => {
  poly(put, [[0, 0], [7, 0], [3.5, 22]], '#cfefff');
  poly(put, [[3.5, 0], [7, 0], [3.5, 22]], '#9fd8f5');
  line(put, 1, 1, 3, 15, '#ffffff');
  rect(put, 0, 0, 7, 1, '#eaf8ff');
});
const STUB = makeSprite(4, 8, (put) => {
  poly(put, [[0, 0], [4, 0], [2, 8]], '#cfefff');
  line(put, 1, 0, 2, 5, '#ffffff');
});
const SHARDS = makeSprite(16, 4, (put) => {
  for (const [x, w, h] of [[0, 3, 2], [4, 2, 3], [7, 4, 2], [12, 2, 3], [14, 2, 1]]) rect(put, x, 4 - h, w, h, '#cfefff');
  put(5, 1, '#ffffff');
  put(8, 2, '#ffffff');
});
const LEDGE = makeSprite(86, 26, (put) => {
  rect(put, 0, 0, 86, 16, '#6c7a96');
  for (let x = 0; x < 86; x++) {
    if ((x * 7) % 11 === 0) put(x, (x * 5) % 13 + 1, '#56627c');
    if ((x * 3) % 13 === 0) put(x, (x * 7) % 12 + 2, '#8796b2');
    // an ice crust along the underside, drips hanging off it
    const d = 18 + Math.round(Math.abs(Math.sin(x / 4.7)) * 3 + (x % 9 === 4 ? 3 : 0) + (x % 17 === 8 ? 4 : 0));
    for (let y = 14; y < d; y++) put(x, y, y < 16 ? '#e8f8ff' : y > d - 2 ? '#8fd0f2' : '#bfe6fa');
  }
  for (let x = 3; x < 86; x += 7) put(x, 15, '#ffffff');
});
interface Icicle {
  x: number;
  shakeAt: number;
  dropAt: number;
  shatterAt: number;
  growAt: number;
  regrowDelay: number;
}
const DROP_G = 0.0026; // px per ms², so a drop takes about a third of a second
class IceLedge implements Entity {
  x: number;
  y: number; // the ledge's underside, where icicles hang
  icicles: Icicle[];
  constructor(x: number, y: number, xs: number[]) {
    this.x = x;
    this.y = y;
    this.icicles = xs.map((ix) => ({ x: ix, shakeAt: -1e9, dropAt: 1e12, shatterAt: 1e12, growAt: -1e9, regrowDelay: 2400 }));
  }
  tipY(ic: Icicle, t: number) {
    const d = Math.max(0, t - ic.dropAt);
    return this.y - U * 2 + ICICLE.height * U + 0.5 * DROP_G * d * d;
  }
  update(t: number, run: RunView) {
    for (const ic of this.icicles) {
      if (t >= ic.dropAt && ic.shatterAt > t) {
        const ground = run.groundAt(ic.x) ?? BASE;
        if (this.tipY(ic, t) >= ground) {
          ic.shatterAt = t;
          ic.growAt = t + ic.regrowDelay;
          run.fx.burst('shard', 10, ic.x, ground - 8, { color: '#c4ecff', speed: 0.8 });
          run.fx.burst('sparkle', 4, ic.x, ground - 16, { speed: 0.5 });
          run.fx.shake(t, 3, 120);
          thump(0.3);
          note(96, { instrument: 'glock', level: 0.07 });
          note(91, { at: 0.05, instrument: 'glock', level: 0.06 });
          note(100, { at: 0.1, instrument: 'glock', level: 0.04 });
        }
      }
      if (t >= ic.growAt && ic.dropAt < ic.growAt) {
        ic.dropAt = ic.shatterAt = 1e12;
        run.fx.burst('sparkle', 2, ic.x, this.y + 20, { speed: 0.3 });
      }
      // a shiver shakes loose a little snow
      if (t - ic.shakeAt < 600 && ic.dropAt > t && Math.random() < 0.15) {
        run.fx.add({ kind: 'snow', x: ic.x + (Math.random() - 0.5) * 30, y: this.y + 4, vy: 0.5, life: 0.8 });
      }
    }
  }
  draw(g: CanvasRenderingContext2D, cam: number, t: number, run: RunView) {
    const lx = this.x - cam;
    const w = LEDGE.width * U;
    if (lx > 1000 || lx + w < -40) return;
    const top = this.y - 22 * U;
    // the ledge runs up off the top of the screen
    g.fillStyle = INK;
    g.fillRect(r3(lx), -60, w, top + 60 + U);
    g.fillStyle = '#6c7a96';
    g.fillRect(r3(lx) + U, -60, w - U * 2, top + 60 + U * 2);
    for (const sx of [10, 40, 70]) drawSprite(g, STUB, lx + sx * U, this.y - U * 3);
    for (const ic of this.icicles) {
      const ground = run.groundAt(ic.x) ?? BASE;
      const ix = ic.x - cam - (ICICLE.width * U) / 2;
      if (t >= ic.shatterAt) {
        // the pieces lie on the ice until it regrows
        const fade = Math.max(0, Math.min(1, (ic.growAt - t) / 400));
        drawSprite(g, SHARDS, ic.x - cam - (SHARDS.width * U) / 2, ground - SHARDS.height * U + U, U, { alpha: fade });
      }
      if (t >= ic.shatterAt && t < ic.growAt) continue;
      const hangY = this.y - U * 2;
      if (t >= ic.dropAt) {
        drawSprite(g, ICICLE, ix, this.tipY(ic, t) - ICICLE.height * U);
        continue;
      }
      // growing back: revealed from the root down
      const grown = Math.min(1, (t - ic.growAt) / 600);
      const shaking = t - ic.shakeAt < 600;
      const jit = shaking ? (Math.floor(t / 40) % 2 ? U : -U) : 0;
      g.save();
      g.beginPath();
      g.rect(ix - U * 2, hangY, ICICLE.width * U + U * 4, ICICLE.height * U * grown);
      g.clip();
      drawSprite(g, ICICLE, ix + jit, hangY);
      g.restore();
    }
    drawSprite(g, LEDGE, lx, top);
  }
}
registerObstacle('icicle', (b) => {
  const x0 = b.x;
  const waitX = x0 - 70;
  b.add(400, 'flat');
  const ix = [x0 + 110, x0 + 170, x0 + 230];
  const ledge = b.entity(new IceLedge(x0 + 40, 102, ix));
  const stopX = x0 + 360;
  const passNew = starts();
  const failNew = starts();
  let shook = false;
  let reactK = -1;
  let fromX = 0;
  let startT = 0;
  const shiver = (t: number) => {
    for (const ic of ledge.icicles) ic.shakeAt = t;
    note(62, { instrument: 'marimba', level: 0.08 });
    note(61, { at: 0.09, instrument: 'marimba', level: 0.07 });
    note(62, { at: 0.18, instrument: 'marimba', level: 0.06 });
  };
  return {
    kind: 'icicle',
    label: 'the icicles',
    waitX,
    pass: {
      dur: 1600,
      step(k, m, t) {
        if (passNew(k)) shook = false;
        if (!shook) {
          shook = true;
          shiver(t);
          for (const ic of ledge.icicles) ic.regrowDelay = 2400;
        }
        if (k < 0.14) return;
        // pushes off hard and slides under; they fall in its wake
        const s = span(k, 0.14, 1);
        m.roll(waitX + (stopX - waitX) * skid(s));
        spray(m, 1 - s * 0.8);
        if (s < 0.05) skidHiss(0.04);
        for (const ic of ledge.icicles) {
          if (ic.dropAt > t && ic.shatterAt > t && m.x > ic.x + 70) ic.dropAt = t;
        }
      }
    },
    fail: {
      dur: 1800,
      step(k, m, t) {
        if (failNew(k)) {
          shook = false;
          reactK = -1;
          startT = t;
        }
        if (!shook) {
          shook = true;
          shiver(t);
          for (const ic of ledge.icicles) ic.regrowDelay = 900;
        }
        const first = ledge.icicles[0];
        if (first.dropAt > t && first.shatterAt > t && k > 0.16) first.dropAt = t;
        if (reactK < 0) {
          m.roll(waitX + (ix[0] - 84 - waitX) * ease(span(k, 0.08, 0.5)));
          spray(m, 0.3);
          if ((first.shatterAt >= startT && first.shatterAt <= t) || k > 0.55) {
            reactK = k;
            fromX = m.x;
            m.bump('EEK');
            skidHiss(0.05);
          }
        } else {
          // skids back the way it came, spinning
          const s = span(k, reactK, 1);
          m.roll(fromX + (waitX - fromX) * skid(s));
          spray(m, (1 - s) * 0.8, -1);
        }
      }
    }
  };
});
