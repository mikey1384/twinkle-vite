import { makeSprite, disc, rect, line, poly, eyesX, pxEllipse, r3, INK, U, W, type Sprite } from '../../pixel';
import { registerBoss } from '../registry';
import type { BossApi, Pose, Shot } from '../types';

// Fort 3 of the Academy: the school bell, grown into a bronze giant with an
// oak yoke for shoulders, chain arms, a mallet fist and a stern moustache.
// It strikes itself to send shockwave rings along the floor, rains detention
// handbells, and leaps up to swing down across the hall like a pendulum.
// Phase 2: it cracks and glows, rings in fives, and swings there and back
// twice.

const FW = 76;
const FH = 60;
const BR = '#c88a3a';
const BRD = '#7a4e1e';
const BRL = '#ffd27a';
const PAT = '#5fa38a';
const OAK = '#6b4024';
const OAKL = '#9a6438';
const IRON = '#4a4652';
const IRONL = '#8a8696';
const GLOWY = '#ffe08a';
const RAGE = '#ff8a2a';

type Arms = 'down' | 'up' | 'strike';
type Eyes = 'open' | 'glow' | 'x';

function chain(put: (x: number, y: number, c: string | null) => void, x0: number, y0: number, x1: number, y1: number) {
  const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / 3));
  for (let i = 0; i <= n; i++) {
    const x = Math.round(x0 + ((x1 - x0) * i) / n);
    const y = Math.round(y0 + ((y1 - y0) * i) / n);
    rect(put, x, y, 2, 2, i % 2 ? IRON : IRONL);
  }
}

function golem(arms: Arms, eyes: Eyes, cracked: boolean, sway: number) {
  return makeSprite(FW, FH, (put) => {
    // the far arm, behind the bell
    const farFist: [number, number] = arms === 'up' ? [70, 2] : [70, 38];
    chain(put, 64, 12, farFist[0], farFist[1]);
    disc(put, farFist[0], farFist[1] + 2, 4, 4, BR, BRD);
    // stout legs and bronze feet
    rect(put, 22, 46, 8, 12, '#8a7f74');
    rect(put, 46, 46, 8, 12, '#8a7f74');
    rect(put, 27, 46, 3, 12, '#5f5750');
    rect(put, 51, 46, 3, 12, '#5f5750');
    rect(put, 19, 56, 13, 4, BRD);
    rect(put, 43, 56, 13, 4, BRD);
    // the clapper, swaying between its legs
    line(put, 38, 44, 38 + sway, 51, IRON, 2);
    disc(put, 38 + sway, 53, 4, 4, IRON, '#2a2830', IRONL);
    // the bell body flaring to a heavy lip
    const squash = arms === 'strike' ? 1 : 0;
    poly(put, [[26, 13], [50, 13], [56, 26], [60 + squash, 40], [65 + squash, 46], [11 - squash, 46], [16 - squash, 40], [20, 26]], BR);
    poly(put, [[44, 13], [50, 13], [56, 26], [60 + squash, 40], [65 + squash, 46], [52, 46], [50, 30]], BRD);
    poly(put, [[24, 16], [28, 16], [24, 36], [19, 42], [18, 40]], BRL);
    rect(put, 10 - squash, 44, 56 + squash * 2, 4, BRL);
    rect(put, 10 - squash, 47, 56 + squash * 2, 1, BRD);
    line(put, 22, 21, 54, 21, BRD);
    line(put, 18, 37, 58, 37, BRD);
    for (let x = 20; x < 58; x += 4) put(x, 39, BRL);
    // patina spots
    for (const [x, y] of [[48, 18], [52, 33], [30, 42], [56, 41], [44, 26]]) {
      rect(put, x, y, 2, 2, PAT);
      put(x + 2, y, PAT);
    }
    // the face: brows, eyes, and a magnificent moustache
    line(put, 22, 25, 29, 27, BRD, 2);
    line(put, 40, 25, 33, 27, BRD, 2);
    if (eyes === 'x') {
      eyesX(put, 24, 28, INK);
      eyesX(put, 34, 28, INK);
    } else {
      const c = eyes === 'glow' ? (cracked ? RAGE : GLOWY) : GLOWY;
      rect(put, 24, 29, 5, eyes === 'glow' ? 3 : 2, c);
      rect(put, 33, 29, 5, eyes === 'glow' ? 3 : 2, c);
      put(24, 29, INK);
      put(33, 29, INK);
    }
    poly(put, [[31, 33], [22, 33], [16, 37], [24, 36], [31, 35], [38, 36], [45, 37], [40, 33]], '#5a3a18');
    line(put, 22, 34, 40, 34, '#7a5228');
    // the oak yoke and a brass finial
    rect(put, 6, 8, 64, 6, OAK);
    rect(put, 6, 8, 64, 1, OAKL);
    rect(put, 6, 13, 64, 1, '#4a2a14');
    for (const x of [14, 36, 58]) rect(put, x, 8, 3, 6, IRON);
    disc(put, 6, 11, 3, 3, OAKL, OAK);
    disc(put, 70, 11, 3, 3, OAKL, OAK);
    rect(put, 36, 3, 4, 5, BR);
    disc(put, 38, 2, 2.5, 2, BRL, BR);
    if (cracked) {
      line(put, 47, 15, 44, 24, INK);
      line(put, 44, 24, 48, 31, INK);
      line(put, 20, 40, 24, 44, INK);
      for (const [x, y] of [[45, 20], [46, 28], [22, 42]]) put(x, y, RAGE);
    }
    // the near arm with its mallet fist
    const fist: [number, number] = arms === 'up' ? [4, 0] : arms === 'strike' ? [14, 30] : [6, 38];
    chain(put, 10, 12, fist[0] + 2, fist[1] + 2);
    disc(put, fist[0] + 2, fist[1] + 3, 4, 4, BR, BRD, BRL);
    // the mallet: a short handle and a fat head
    const mx = fist[0] + 2;
    const my = fist[1] + 3;
    if (arms === 'up') {
      line(put, mx, my, mx - 1, Math.max(0, my - 6), OAKL, 2);
      rect(put, 0, 0, 7, 4, IRONL);
    } else {
      line(put, mx, my, mx - 6, my + 2, OAKL, 2);
      rect(put, Math.max(0, mx - 10), my - 1, 4, 7, IRONL);
    }
  });
}

const cache = new Map<string, Sprite>();
function look(arms: Arms, eyes: Eyes, cracked: boolean, sway: number) {
  const key = `${arms}|${eyes}|${cracked}|${sway}`;
  let s = cache.get(key);
  if (!s) {
    s = golem(arms, eyes, cracked, sway);
    cache.set(key, s);
  }
  return s;
}

// a ring of sound skimming the floor, and a high one
const wave = [0, 1].map((f) =>
  makeSprite(12, 16, (put) => {
    for (let y = 0; y < 16; y++) {
      const dx = Math.round(Math.abs(y - 7.5) ** 2 / 9);
      rect(put, dx, y, 3, 1, y % 4 === f * 2 ? '#fff6c0' : GLOWY);
      rect(put, dx + 5, y, 2, 1, '#e0a850');
    }
  })
);
const handbell = makeSprite(14, 16, (put) => {
  rect(put, 6, 0, 2, 4, OAKL);
  poly(put, [[4, 4], [10, 4], [12, 12], [13, 13], [1, 13], [2, 12]], BR);
  poly(put, [[8, 4], [10, 4], [12, 12], [13, 13], [9, 13]], BRD);
  rect(put, 0, 13, 14, 1, BRL);
  disc(put, 7, 15, 1.5, 1.5, IRON);
});
const hitbox = makeSprite(40, 8, () => {}, { outline: false });

// ---- bookkeeping: rings in the air, and the big swing
let now = 0;
let phase = 1;
let strikeUntil = 0;
let leaveAt = -1e9;
let swingMs = 0;
let landed = true;
const rings: { at: number; x: number; y: number; big: boolean }[] = [];
const LEAP = 260;
const DROP = 240;

const art = (api: BossApi, x: number, y: number) => ({ x: api.bossX - api.bossW / 2 + (x + 1) * (api.bossW / (FW + 2)), y: api.bossTop + (y + 1) * (api.bossH / (FH + 2)) });

function swingGeometry(api: BossApi, frame: Sprite, scale: number, low: boolean) {
  const h = frame.height * scale;
  // the lowest point of the arc passes just over a ducking marble (or, aimed, through it)
  const bottom = api.floorY - (low ? 6 : 58);
  const px = api.marbleX + 90;
  const py = -560;
  const chainLen = bottom - h - py;
  return { px, py, chainLen, h, R: chainLen + h };
}

function strike(api: BossApi, i: number, high: boolean) {
  strikeUntil = now + 220;
  const b = art(api, 38, 30);
  rings.push({ at: now, x: b.x, y: b.y, big: false });
  api.shake(5, 180);
  api.sound.note([48, 55, 52, 57, 60][i % 5], { instrument: 'bell', level: 0.14 });
  api.sound.thump(0.45);
  const from = api.bossX - api.bossW * 0.55;
  api.warn(from, 240, () => {
    const h = wave[0].height * U;
    if (high) api.spawn({ frames: wave, x: from - 30, y: api.floorY - 58 - h, vx: -8.4, dodge: 'duck', glow: GLOWY, frameMs: 70 });
    else api.spawn({ frames: wave, x: from - 30, y: 0, vx: -7.6, onFloor: true, glow: GLOWY, frameMs: 70 });
  }, { kind: 'ring', color: GLOWY, width: 70 });
}

registerBoss({
  id: 'bell-golem',
  scale: 3.2,
  intro: 'drop',
  frames: () => ({ idle: [look('down', 'open', false, 0)], hurt: [look('down', 'x', false, 0)] }),
  pose(t, state): Pose {
    const cracked = phase === 2;
    const sway = [0, 1, 0, -1][Math.floor(t / 220) % 4];
    // away on the pendulum: leap up out of sight, then drop back to the ledge
    const k = t - leaveAt;
    if (k >= 0 && k < LEAP + swingMs + DROP && state !== 'dazed' && state !== 'dying') {
      if (k < LEAP) return { frame: look('up', 'glow', cracked, 0), dy: -Math.round(((k / LEAP) ** 2 * 420) / U) * U };
      if (k < LEAP + swingMs) return { frame: look('up', 'glow', cracked, 0), alpha: 0 };
      const d = (k - LEAP - swingMs) / DROP;
      return { frame: look('down', 'glow', cracked, 0), dy: -Math.round(((1 - d * d) * 420) / U) * U };
    }
    if (state === 'hurt' || state === 'dazed' || state === 'dying') return { frame: look('down', 'x', cracked, sway), sx: 1.03, sy: 0.97 };
    if (t < strikeUntil) return { frame: look('strike', 'glow', cracked, sway * 2), sx: 1.04, sy: 0.96 };
    if (state === 'wind') return { frame: look('up', 'glow', cracked, sway), dy: -U * 2 };
    // a heavy, ringing stillness: the clapper sways and it hums
    return { frame: look('down', cracked ? 'glow' : 'open', cracked, sway), dy: Math.floor(t / 1000) % 2 ? U : 0 };
  },
  moves: [
    {
      id: 'shockwave-rings',
      windup: 700,
      run(api) {
        // each strike of the mallet sends a ring along the floor to hop
        const n = api.phase === 2 ? 5 : 3;
        const gap = api.phase === 2 ? 380 : 520;
        for (let i = 0; i < n; i++) api.after(i * gap, () => strike(api, i, api.phase === 2 && i % 2 === 1));
      }
    },
    {
      id: 'pendulum',
      windup: 900,
      run(api) {
        // it leaps up and swings down across the hall on a chain; duck!
        swingMs = api.phase === 2 ? 3000 : 1900;
        leaveAt = now;
        landed = false;
        api.sound.whoosh(0.12, 0.4, 0, 400, 1800);
        const aimed = api.aim;
        let crossed = false;
        api.after(LEAP, () => {
          const fr = look('up', 'glow', phase === 2, 0);
          const geo = swingGeometry(api, fr, 3.2, aimed);
          const born = now;
          const s: Shot = {
            frames: [hitbox],
            x: -200,
            y: 0,
            dodge: aimed ? 'none' : 'duck',
            life: swingMs,
            update(sh, t) {
              const th = swingAngle(t - born);
              const bx = geo.px + Math.sin(th) * (geo.chainLen + geo.h);
              const by = geo.py + Math.cos(th) * (geo.chainLen + geo.h);
              sh.x = bx - 60;
              sh.y = by - 24;
              if (aimed && !crossed && Math.abs(bx - api.marbleX) < 40) {
                crossed = true;
                api.strikeMarble();
              }
            }
          };
          swing = { born, geo, frame: fr };
          api.spawn(s);
          api.tint(swingMs, 'rgba(60,30,0,.12)');
          for (let i = 0; i < (api.phase === 2 ? 4 : 2); i++) api.sound.whoosh(0.16, 0.6, (i * swingMs) / 2000, 300, 1200);
        });
      }
    },
    {
      id: 'detention-bells',
      windup: 760,
      run(api) {
        // one great toll, and handbells rain down onto their shadows
        strikeUntil = now + 260;
        rings.push({ at: now, ...art(api, 38, 30), big: true });
        api.sound.note(43, { instrument: 'bell', level: 0.18 });
        api.shake(8, 400);
        const xs: number[] = [];
        for (let i = 0; i < 12 && xs.length < 4; i++) {
          const x = 80 + Math.random() * (W * 0.62);
          if (Math.abs(x - api.marbleX) > 90 && xs.every((o) => Math.abs(o - x) > 70)) xs.push(x);
        }
        if (api.aim) xs.unshift(api.marbleX);
        xs.forEach((x, i) => {
          api.warn(x, 640 + i * 160, () => {
            api.spawn({ frames: [handbell], x: x - 21, y: -50, vy: 14, dodge: 'none', life: 380, spin: i % 2 ? 0.2 : -0.2 });
            api.after(300, () => {
              api.sound.note(84 + (i % 3) * 3, { instrument: 'bell', level: 0.08 });
              api.fx.burst('star', 4, x, api.floorY - 10, { color: GLOWY });
              api.fx.burst('dust', 6, x, api.floorY - 4);
              api.shake(3, 120);
            });
            if (Math.abs(x - api.marbleX) < 50) api.strikeMarble();
          }, { kind: 'shadow', width: 56 });
        });
      }
    },
    {
      id: 'grand-toll',
      windup: 950,
      phase: 2,
      run(api) {
        // the loudest bell in the school: the hall flashes gold and shudders
        strikeUntil = now + 360;
        rings.push({ at: now, ...art(api, 38, 30), big: true });
        api.flash(120, 'rgba(255,224,138,.55)');
        api.tint(900, 'rgba(255,170,40,.14)');
        api.shake(16, 800);
        api.sound.thump(1.4);
        api.sound.note(36, { instrument: 'bell', level: 0.2 });
        api.sound.note(31, { instrument: 'pad', level: 0.16, hold: 1.2 });
        api.fx.burst('dust', 20, api.W * 0.4, 20);
        strike(api, 0, false);
        api.after(420, () => strike(api, 1, true));
        api.after(840, () => strike(api, 2, false));
      }
    }
  ],
  // mid-swing it hangs from its chain far from the ledge: throws go there
  target(t) {
    if (!swing || t - swing.born < 0 || t - swing.born >= swingMs) return null;
    const { geo } = swing;
    const th = swingAngle(t - swing.born);
    const d = geo.chainLen + geo.h / 2;
    return { x: geo.px + Math.sin(th) * d, y: geo.py + Math.cos(th) * d };
  },
  drawExtra(g, t, api, state) {
    now = t;
    if (state === 'intro') {
      // a fresh fight: forget the last one's timers and effects
      strikeUntil = 0;
      leaveAt = -1e9;
      swingMs = 0;
      landed = true;
      swing = null;
      rings.length = 0;
    }
    if (state !== 'dazed' && state !== 'dying') phase = api.phase;
    const hot = phase === 2 && state !== 'dazed' && state !== 'dying';

    // it lands back on its ledge with a crash
    const k = t - leaveAt;
    if (!landed && k > LEAP + swingMs + DROP) {
      landed = true;
      api.shake(12, 300);
      api.sound.thump(1.1);
      api.sound.note(45, { instrument: 'bell', level: 0.12 });
      api.fx.burst('dust', 18, api.bossX, api.ledgeY - 6);
    }

    // a warm glow (an angry orange one in phase 2) around the bronze
    if (k < 0 || k > LEAP + swingMs) {
      g.globalCompositeOperation = 'lighter';
      g.globalAlpha = hot ? 0.16 + Math.abs(Math.sin(t / 150)) * 0.14 : 0.08;
      pxEllipse(g, api.bossX, api.bossTop + api.bossH * 0.5, api.bossW * 0.44, api.bossH * 0.46, hot ? RAGE : GLOWY);
      g.globalAlpha = 1;
      if (hot && state !== 'hurt') {
        for (const ex of [26, 35]) {
          const e = art(api, ex, 30);
          g.fillStyle = 'rgba(255,138,42,.8)';
          g.fillRect(r3(e.x - 12), r3(e.y - 6), 24, 12);
        }
      }
      g.globalCompositeOperation = 'source-over';
      // a glint sliding over the bronze every few seconds
      const gk = (t % 2800) / 600;
      if (gk < 1) {
        const p = art(api, 18 + gk * 40, 18 + gk * 24);
        g.fillStyle = '#fff';
        g.fillRect(r3(p.x), r3(p.y), U * 2, U * 2);
        g.fillRect(r3(p.x - U * 2), r3(p.y + U * 2), U, U);
      }
      if (hot && Math.floor(t / 300) % 3 === 0) {
        const p = art(api, 46, 20);
        api.fx.burst('ember', 1, p.x, p.y);
      }
    }

    // sound rings spreading from the bell
    for (let i = rings.length - 1; i >= 0; i--) {
      const r = rings[i];
      const age = t - r.at;
      const life = r.big ? 1100 : 600;
      if (age > life || age < -50) {
        rings.splice(i, 1);
        continue;
      }
      g.globalAlpha = 1 - age / life;
      for (let j = 0; j < (r.big ? 3 : 2); j++) {
        const rad = 30 + age * (r.big ? 0.7 : 0.45) - j * 30;
        if (rad <= 10) continue;
        const steps = Math.max(12, Math.round(rad / 5));
        g.fillStyle = j ? '#fff6c0' : GLOWY;
        for (let s = 0; s < steps; s++) {
          const a = (s / steps) * Math.PI * 2;
          g.fillRect(r3(r.x + Math.cos(a) * rad), r3(r.y + Math.sin(a) * rad * 0.7), U * 2, U);
        }
      }
      g.globalAlpha = 1;
    }

    // the pendulum swing, drawn on its chain from far above
    if (swing && t - swing.born >= 0 && t - swing.born < swingMs && state !== 'dazed' && state !== 'dying') {
      const { geo, frame } = swing;
      const th = swingAngle(t - swing.born);
      g.save();
      g.translate(geo.px, geo.py);
      g.rotate(-th);
      g.imageSmoothingEnabled = false;
      for (let y = 0; y < geo.chainLen; y += 9) {
        g.fillStyle = (y / 9) % 2 ? IRON : IRONL;
        g.fillRect(-U, y, U * 2, 9);
      }
      const w = frame.width * 3.2;
      g.drawImage(frame, Math.round(-w / 2), Math.round(geo.chainLen), Math.round(w), Math.round(geo.h));
      g.restore();
      // a trail of sound behind it at the bottom of the arc
      const bx = geo.px + Math.sin(th) * geo.R;
      const by = geo.py + Math.cos(th) * geo.R;
      g.fillStyle = 'rgba(255,224,138,.5)';
      for (let j = 1; j < 5; j++) g.fillRect(r3(bx + Math.sin(th) * -j * 10), r3(by - j * U), U * 2, U);
    } else if (swing && t - swing.born >= swingMs) swing = null;
  }
});

// there and back (twice in phase 2), starting high on the right
let swing: { born: number; geo: ReturnType<typeof swingGeometry>; frame: Sprite } | null = null;
function swingAngle(ms: number) {
  const laps = swingMs > 2500 ? 2 : 1;
  const k = Math.min(1, ms / swingMs);
  return 1.05 * Math.cos(Math.PI * 2 * laps * k);
}
