import { makeSprite, disc, rect, line, pxEllipse, star, r3, INK, U, W } from '../../pixel';
import type { Sprite } from '../../pixel';
import { registerBoss } from '../registry';
import type { BossApi, Pose } from '../types';

// Fort 1 of the Academy: a boxy desk robot on treads with an old monitor for
// a face and a rack of pencils on its back. Pencil missiles rain down on
// shadows, eraser bombs bounce and pop, a red-pen laser grades the floor.
// Phase 2: the screen goes red, sirens spin, it stamps the floor and empties
// the whole rack at once.

const FW = 72;
const FH = 58;
const MINT = '#5fc2b0';
const MD = '#2f7f78';
const ML = '#a8f0e0';
const CASE = '#e6dcc0';
const CASED = '#b0a586';
const PENCIL = '#ffcf3a';
const ERASER = '#ff8fa3';
const LEAD = '#3a3a44';
const WOOD = '#f2c48d';

type Face = 'happy' | 'blink' | 'angry' | 'x';

function bot(face: Face, red: boolean, tread: number, rackUp: boolean) {
  return makeSprite(FW, FH, (put) => {
    // pencil rack on its back
    const lift = rackUp ? 3 : 0;
    for (let i = 0; i < 4; i++) {
      const x = 47 + i * 4;
      const top = 6 - lift + (i % 2) * 2;
      rect(put, x, top + 3, 3, 14 - top, PENCIL);
      put(x + 2, top + 4, '#d9a21a');
      rect(put, x, top + 1, 3, 2, WOOD);
      put(x + 1, top, LEAD);
    }
    rect(put, 44, 16, 20, 14, '#4a5060');
    rect(put, 44, 16, 20, 2, '#6a7284');
    for (let i = 0; i < 4; i++) rect(put, 46 + i * 4, 19, 3, 2, rackUp ? '#ff5a5a' : '#222632');
    // treads
    rect(put, 10, 48, 54, 9, '#3a3f4a');
    rect(put, 10, 48, 54, 1, '#5a6070');
    for (let x = 11 + tread * 2; x < 63; x += 4) rect(put, x, 56, 2, 2, '#262a33');
    for (const x of [16, 28, 40, 52]) {
      disc(put, x, 52, 3, 3, '#8a90a0', '#5a6070');
      put(x, 52, '#262a33');
    }
    // the desk-box body
    rect(put, 14, 30, 44, 18, MINT);
    rect(put, 52, 30, 6, 18, MD);
    rect(put, 14, 30, 44, 2, ML);
    rect(put, 18, 36, 18, 8, MD);
    rect(put, 19, 37, 16, 6, MINT);
    rect(put, 24, 39, 6, 2, '#c9c9c9');
    for (const [x, c] of [[40, '#ff5a5a'], [44, PENCIL], [48, '#4a8cff']] as [number, string][]) {
      rect(put, x, 36, 3, 3, c);
      put(x, 36, '#fff');
    }
    for (let x = 40; x < 51; x += 2) rect(put, x, 41, 1, 5, MD);
    // a ruler arm with a gripper claw
    for (let k = 0; k < 4; k++) rect(put, 12 - k * 3, 33 + k * 2, 4, 3, k % 2 ? PENCIL : '#e0b02a');
    line(put, 1, 41, 3, 45, '#8a90a0', 2);
    line(put, 4, 41, 6, 45, '#8a90a0', 2);
    // neck and the monitor head
    rect(put, 24, 27, 8, 3, '#8a90a0');
    rect(put, 24, 28, 8, 1, '#5a6070');
    rect(put, 8, 5, 32, 22, CASE);
    rect(put, 36, 5, 4, 22, CASED);
    rect(put, 8, 5, 32, 1, '#fff6dc');
    rect(put, 11, 8, 24, 16, red ? '#3a0f14' : '#12301f');
    const P = red ? '#ff5a5a' : '#6dff9a';
    // the face on the screen
    if (face === 'x') {
      for (const ex of [14, 25]) for (let i = 0; i < 4; i++) {
        put(ex + i, 10 + i, P);
        put(ex + 3 - i, 10 + i, P);
      }
      for (let x = 15; x < 31; x += 2) put(x, 19 + (x % 4 ? 1 : 0), P);
      // static snow
      for (let k = 0; k < 14; k++) put(11 + ((k * 7) % 24), 8 + ((k * 5) % 16), '#9aa0a0');
    } else if (face === 'angry') {
      line(put, 13, 9, 18, 11, P);
      line(put, 32, 9, 27, 11, P);
      rect(put, 14, 12, 4, 3, P);
      rect(put, 27, 12, 4, 3, P);
      for (let x = 16; x < 30; x += 2) put(x, 18 + (x % 4 ? 0 : 1), P);
    } else {
      rect(put, 14, face === 'blink' ? 12 : 10, 4, face === 'blink' ? 1 : 4, P);
      rect(put, 27, face === 'blink' ? 12 : 10, 4, face === 'blink' ? 1 : 4, P);
      line(put, 17, 18, 28, 18, P);
      put(16, 17, P);
      put(29, 17, P);
    }
    // scanlines
    for (let y = 9; y < 24; y += 3) for (let x = 11; x < 35; x += 1) if ((x + y) % 7 === 0) put(x, y, red ? '#5a1820' : '#1d4a2f');
    rect(put, 12, 9, 3, 1, 'rgba(255,255,255,.5)');
    // antenna
    line(put, 24, 1, 24, 5, '#8a90a0');
    disc(put, 24, 1.5, 1.6, 1.6, red ? '#ff3c3c' : '#ffd84a');
    rect(put, 34, 25, 2, 1, red ? '#ff3c3c' : '#6dff9a');
  });
}

const cache = new Map<string, Sprite>();
function look(face: Face, red: boolean, tread: number, rackUp: boolean) {
  const key = `${face}|${red}|${tread}|${rackUp}`;
  let s = cache.get(key);
  if (!s) {
    s = bot(face, red, tread, rackUp);
    cache.set(key, s);
  }
  return s;
}

// pencils: launched up, diving down, or flying flat
const pencilUp = makeSprite(5, 18, (put) => {
  put(2, 0, LEAD);
  rect(put, 1, 1, 3, 3, WOOD);
  rect(put, 0, 4, 5, 10, PENCIL);
  rect(put, 3, 4, 1, 10, '#d9a21a');
  rect(put, 0, 14, 5, 1, '#c0c0c0');
  rect(put, 0, 15, 5, 3, ERASER);
});
const pencilDown = [0, 1].map((f) =>
  makeSprite(7, 26, (put) => {
    // a smoke trail behind the falling pencil
    for (let k = 0; k < 6; k++) put(3 + ((k + f) % 2 ? 1 : -1), k, 'rgba(230,230,230,.8)');
    rect(put, 1, 6, 5, 3, ERASER);
    rect(put, 1, 9, 5, 1, '#c0c0c0');
    rect(put, 1, 10, 5, 10, PENCIL);
    rect(put, 4, 10, 1, 10, '#d9a21a');
    rect(put, 2, 20, 3, 4, WOOD);
    put(3, 24, LEAD);
    put(3, 25, LEAD);
  })
);
const pencilFlat = [0, 1].map((f) =>
  makeSprite(26, 7, (put) => {
    put(0, 3, LEAD);
    rect(put, 1, 2, 4, 3, WOOD);
    rect(put, 5, 1, 12, 5, PENCIL);
    rect(put, 5, 4, 12, 1, '#d9a21a');
    rect(put, 17, 1, 1, 5, '#c0c0c0');
    rect(put, 18, 1, 3, 5, ERASER);
    for (let k = 0; k < 4; k++) put(21 + k, 3 + ((k + f) % 2 ? 1 : -1), '#ff9a3a');
  })
);
const eraser = [0, 1].map((f) =>
  makeSprite(14, 9, (put) => {
    rect(put, 0, 1, 14, 8, ERASER);
    rect(put, 0, 1, 14, 2, '#ffc2cf');
    rect(put, 8, 1, 6, 8, '#4a8cff');
    rect(put, 8, 1, 6, 2, '#8ab8ff');
    // the fuse light blinks faster as it is about to pop
    put(4, 0, f ? '#ff3c3c' : '#ffd84a');
    put(4, 4, INK);
    put(10, 4, INK);
  })
);
const stamp = makeSprite(30, 34, (put) => {
  disc(put, 15, 5, 6, 5, '#b33a4a', '#7a2030', '#e06070');
  rect(put, 12, 9, 6, 10, '#8a5a2a');
  rect(put, 16, 9, 2, 10, '#5a3a1a');
  rect(put, 2, 19, 26, 9, '#6a4a2a');
  rect(put, 2, 19, 26, 2, '#9a7a4a');
  rect(put, 1, 28, 28, 6, '#b33a4a');
});

// ---- bookkeeping for the bot's own effects
let now = 0;
let phase = 1;
let lastPuff = 0;
const lasers: { at: number; y: number; ms: number }[] = [];
const inks: { x: number; at: number }[] = [];
const art = (api: BossApi, x: number, y: number) => ({ x: api.bossX - api.bossW / 2 + (x + 1) * (api.bossW / (FW + 2)), y: api.bossTop + (y + 1) * (api.bossH / (FH + 2)) });

function landXs(api: BossApi, n: number) {
  const xs: number[] = [];
  for (let i = 0; i < n * 4 && xs.length < n; i++) {
    const x = 70 + Math.random() * (W * 0.62);
    if (Math.abs(x - api.marbleX) > 90 && xs.every((o) => Math.abs(o - x) > 60)) xs.push(x);
  }
  return xs;
}

function pencilRain(api: BossApi, n: number, aim: boolean, delay = 0) {
  const rack = art(api, 54, 4);
  // up and out of the rack...
  for (let i = 0; i < n; i++) {
    api.after(delay + i * 90, () => {
      api.spawn({ frames: [pencilUp], x: rack.x - 8 + (i % 4) * 12, y: rack.y - 30, vy: -15, dodge: 'none', life: 600 });
      api.sound.whoosh(0.06, 0.2, 0, 900, 3000);
      api.fx.burst('puff', 2, rack.x + (i % 4) * 12, rack.y);
    });
  }
  // ...and down tip-first onto their shadows
  const xs = landXs(api, n);
  if (aim) xs.unshift(api.marbleX);
  xs.forEach((x, i) => {
    api.warn(x, delay + 700 + i * 140, () => {
      const h = pencilDown[0].height * U;
      api.spawn({
        frames: pencilDown,
        x: x - 10,
        y: api.floorY - h - 260,
        vy: 18,
        dodge: 'none',
        life: 700,
        frameMs: 60,
        update(sh) {
          // stick in the floor, quiver, then pop
          if (sh.y >= api.floorY - h + U * 2) {
            sh.y = api.floorY - h + U * 2;
            sh.vy = 0;
          }
        }
      });
      api.after(230, () => {
        api.shake(4, 120);
        api.sound.thump(0.35);
        api.sound.note(84 + (i % 3) * 2, { instrument: 'glock', level: 0.05 });
        api.fx.burst('shard', 5, x, api.floorY - 6, { color: PENCIL });
      });
      if (Math.abs(x - api.marbleX) < 50) api.after(230, () => api.strikeMarble());
    }, { kind: 'shadow', width: 44 });
  });
}

function erasers(api: BossApi, n: number) {
  const hand = art(api, 4, 42);
  for (let i = 0; i < n; i++) {
    api.after(i * 200, () => {
      const fuse = 1500 + i * 120;
      api.spawn({
        frames: eraser,
        x: hand.x - 30,
        y: hand.y - 30,
        vx: -4.2 - (i % 3) * 0.9,
        vy: -5 - (i % 2),
        g: 0.26,
        bounce: 0.62,
        frameMs: 160,
        update(sh, t) {
          const age = t - (sh.born || t);
          sh.frameMs = age > fuse - 500 ? 50 : 160;
          if (age > fuse && !sh.hit) {
            sh.done = true;
            const cx = sh.x + 21;
            const cy = sh.y + 15;
            api.fx.burst('shard', 10, cx, cy, { color: ERASER });
            api.fx.burst('puff', 5, cx, cy);
            api.sound.note(72, { instrument: 'marimba', level: 0.08 });
            api.sound.thump(0.3);
          }
        }
      });
      api.sound.whoosh(0.05, 0.25, 0, 700, 1600);
    });
  }
}

function laser(api: BossApi, high: boolean, delay = 0) {
  api.after(delay, () => {
    const y = high ? api.floorY - 74 : api.floorY - 14;
    lasers.push({ at: now, y, ms: high ? 520 : 380 });
    api.beam(y, high ? 520 : 380, { dodge: high ? 'duck' : 'hop', color: '#ff3c5a', height: 10 });
    api.sound.note(high ? 93 : 88, { instrument: 'glock', level: 0.08 });
    api.sound.whoosh(0.1, 0.3, 0, 5000, 4000);
    api.shake(3, 300);
  });
}

registerBoss({
  id: 'pop-quiz-bot',
  scale: 3.2,
  intro: 'drop',
  frames: () => ({ idle: [look('happy', false, 0, false)], hurt: [look('x', false, 0, false)] }),
  pose(t, state): Pose {
    const red = phase === 2;
    const tread = Math.floor(t / 180) % 2;
    if (state === 'hurt' || state === 'dazed' || state === 'dying') return { frame: look('x', red, 0, false), dx: Math.floor(t / 40) % 2 ? U : -U };
    if (state === 'wind') return { frame: look('angry', red, tread, true), dy: -U, dx: Math.floor(t / 60) % 2 ? U : 0 };
    const blink = t % 2600 < 140;
    // rocks on its treads, a little restless; jittery once it overheats
    const rock = Math.round(Math.sin(t / (red ? 140 : 420)) * (red ? 1.5 : 1)) * U;
    return { frame: look(blink ? 'blink' : red ? 'angry' : 'happy', red, tread, red), dx: rock };
  },
  moves: [
    {
      id: 'pencil-volley',
      windup: 650,
      run(api) {
        pencilRain(api, api.phase === 2 ? 5 : 4, api.aim);
        if (api.phase === 2) {
          // plus flat missiles at head height
          for (let i = 0; i < 2; i++) {
            api.after(400 + i * 260, () => {
              const h = pencilFlat[0].height * U;
              const p = art(api, 44, 18);
              api.spawn({ frames: pencilFlat, x: p.x - 60, y: api.floorY - 58 - h, vx: -9, dodge: 'duck', frameMs: 60 });
              api.sound.whoosh(0.08, 0.3, 0, 3000, 900);
            });
          }
        }
      }
    },
    {
      id: 'eraser-bombs',
      windup: 600,
      run(api) {
        erasers(api, api.phase === 2 ? 5 : 3);
      }
    },
    {
      id: 'red-pen-laser',
      windup: 700,
      run(api) {
        laser(api, false);
        if (api.phase === 2) laser(api, true, 700);
      }
    },
    {
      id: 'stamp',
      windup: 700,
      phase: 2,
      weight: 0.8,
      run(api) {
        // a giant rubber stamp marks the floor with a star
        const xs = landXs(api, 2);
        if (api.aim) xs.unshift(api.marbleX);
        xs.forEach((x, i) => {
          api.warn(x, 700 + i * 360, () => {
            const h = stamp.height * U;
            api.spawn({
              frames: [stamp],
              x: x - (stamp.width * U) / 2,
              y: api.floorY - h - 300,
              vy: 24,
              dodge: 'none',
              life: 560,
              update(sh) {
                if (sh.y >= api.floorY - h) {
                  sh.y = api.floorY - h;
                  sh.vy = -0.6;
                }
              }
            });
            api.after(200, () => {
              inks.push({ x, at: now });
              api.shake(12, 300);
              api.sound.thump(1.1);
              api.sound.note(60, { instrument: 'bell', level: 0.1 });
              api.fx.burst('star', 6, x, api.floorY - 16, { color: '#ff5a7a' });
              api.fx.burst('dust', 10, x, api.floorY - 4);
              if (Math.abs(x - api.marbleX) < 55) api.strikeMarble();
            });
          }, { kind: 'shadow', width: 96 });
        });
      }
    },
    {
      id: 'overdrive',
      windup: 900,
      phase: 2,
      run(api) {
        // sirens, then everything in the rack at once
        api.tint(1800, 'rgba(255,40,60,.12)');
        api.shake(6, 1600);
        for (let i = 0; i < 4; i++) api.sound.note(i % 2 ? 76 : 81, { at: i * 0.22, instrument: 'glock', level: 0.08 });
        pencilRain(api, 6, api.aim, 100);
        erasers(api, 2);
      }
    }
  ],
  drawExtra(g, t, api, state) {
    now = t;
    if (state === 'intro') {
      // a fresh fight: forget the last one's timers and effects
      lasers.length = 0;
      inks.length = 0;
      lastPuff = 0;
    }
    if (state !== 'dazed' && state !== 'dying') phase = api.phase;
    const red = phase === 2 && state !== 'dazed' && state !== 'dying';
    const bulb = art(api, 24, 1.5);
    const screen = art(api, 23, 16);

    // the screen glows onto the room
    g.globalCompositeOperation = 'lighter';
    g.globalAlpha = 0.18 + Math.abs(Math.sin(t / 300)) * 0.08;
    pxEllipse(g, screen.x, screen.y, api.bossW * 0.2, api.bossH * 0.16, red ? '#ff3c3c' : '#6dff9a');
    g.globalAlpha = 1;
    // the antenna bulb: a slow blink, or a siren once overheated
    const on = red ? Math.floor(t / 120) % 2 === 0 : Math.floor(t / 700) % 2 === 0;
    if (on) {
      g.fillStyle = red ? 'rgba(255,60,60,.7)' : 'rgba(255,216,74,.6)';
      g.fillRect(r3(bulb.x - 9), r3(bulb.y - 9), 18, 18);
    }
    if (red) {
      // rotating siren beams sweep the hall
      const a = t / 220;
      g.fillStyle = 'rgba(255,60,60,.16)';
      for (const s of [0, Math.PI]) {
        const dx = Math.cos(a + s);
        for (let k = 1; k < 26; k++) {
          const w = U * (1 + Math.floor(k / 5));
          g.fillRect(r3(bulb.x + dx * k * 14), r3(bulb.y + Math.sin(a + s) * k * 4) - w / 2, U * 4, w);
        }
      }
    }
    g.globalCompositeOperation = 'source-over';

    // steam from the rack when it is overheated
    if (red && t - lastPuff > 260 && state !== 'intro') {
      lastPuff = t;
      const p = art(api, 64, 18);
      api.fx.burst('puff', 1, p.x, p.y);
      if (Math.random() < 0.4) api.fx.burst('spark', 3, p.x - 20, p.y + 30, { color: '#ffd84a' });
    }

    // red-pen lasers from the eye to the beam
    for (let i = lasers.length - 1; i >= 0; i--) {
      const l = lasers[i];
      if (t - l.at > l.ms || t < l.at - 50) {
        lasers.splice(i, 1);
        continue;
      }
      const e = art(api, 15, 12);
      const n = Math.max(1, Math.round(Math.abs(l.y - e.y) / U));
      g.fillStyle = '#ff3c5a';
      for (let k = 0; k <= n; k++) g.fillRect(r3(e.x - (k / n) * 40), r3(e.y + ((l.y - e.y) * k) / n), U * 2, U);
      // a scribble of red ink where the beam meets the floor
      g.fillStyle = '#fff';
      for (let k = 0; k < 6; k++) g.fillRect(r3((t * 1.5 + k * 160) % W), r3(l.y + Math.sin(t / 30 + k) * 6), U, U);
    }

    // star-shaped ink left by the stamp, fading
    for (let i = inks.length - 1; i >= 0; i--) {
      const s = inks[i];
      const age = t - s.at;
      if (age > 1600 || age < -50) {
        inks.splice(i, 1);
        continue;
      }
      g.globalAlpha = Math.min(0.8, 1 - age / 1600);
      g.fillStyle = '#d0304a';
      star(g, s.x, api.floorY - U * 2, 24);
      pxEllipse(g, s.x, api.floorY - U, 36, U * 2, '#d0304a');
      g.globalAlpha = 1;
    }
  }
});
