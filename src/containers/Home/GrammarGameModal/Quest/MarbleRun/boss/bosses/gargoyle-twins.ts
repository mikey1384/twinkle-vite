import { makeSprite, disc, rect, line, poly, eyesX, star, r3, INK, U, W, type Put, type Sprite } from '../../pixel';
import { registerBoss } from '../registry';
import type { BossApi } from '../types';

// Fort 1 of the Citadel: two stone gargoyles sharing one perch. Horn (the
// horned brute crouched on the ledge) and Beak (the owl-faced one on its
// plinth) take turns: one dives low across the courtyard, the other spits
// bouncing stone orbs. In phase 2 Beak is cracked and dazed, and Horn gets
// faster: double dives and a ledge slam that brings rubble down.

const FW = 88;
const FH = 52;
type Twin = 'perch' | 'wind' | 'gone' | 'x' | 'rage';

const A = { S: '#7d8a86', D: '#545e5c', L: '#a9b5b0', Wg: '#4a5258', WD: '#33393e' };
const B = { S: '#7f8ea6', D: '#55617a', L: '#b2bfd4', Wg: '#5f6c86', WD: '#3f4860' };
const MOSS = '#6f9a4f';
const EYE = '#ffb020';
const RAGE = '#ff3c3c';

function horn(put: Put, st: Twin) {
  if (st === 'gone') return;
  const up = st === 'wind' || st === 'rage';
  // wings folded behind, flared when it means to dive
  const wing: [number, number][] = up ? [[24, 30], [20, 4], [32, 0], [44, 6], [43, 30], [34, 40]] : [[24, 30], [30, 10], [40, 4], [44, 16], [42, 34], [34, 40]];
  poly(put, wing, A.Wg);
  line(put, 26, 30, wing[2][0], wing[2][1], A.WD);
  line(put, 30, 34, wing[3][0], wing[3][1], A.WD);
  line(put, 34, 38, 43, 24, A.WD);
  // tail with a spade tip curling in front
  line(put, 38, 48, 44, 50, A.D, 2);
  poly(put, [[43, 47], [47, 50], [43, 52]], A.D);
  disc(put, 30, 42, 11, 9, A.S, A.D);
  disc(put, 20, 36, 9, 10, A.S, A.D, A.L);
  rect(put, 26, 49, 10, 3, A.D);
  for (const x of [26, 29, 32]) put(x, 52, A.L);
  // forearms planted, claws on the stone
  rect(put, 8, 38, 6, 12, A.S);
  rect(put, 12, 38, 2, 12, A.D);
  for (const x of [7, 9, 11, 13]) put(x, 50, A.L);
  disc(put, 14, 24, 9, 8, A.S, A.D, A.L);
  // snout and a jaw with two little tusks
  rect(put, 3, 25, 9, 6, A.S);
  rect(put, 3, 30, 9, 1, A.D);
  put(4, 26, INK);
  rect(put, 3, 31, 8, 2, A.D);
  put(5, 30, '#fff');
  put(9, 30, '#fff');
  // curling horns
  line(put, 14, 17, 22, 10, A.L, 2);
  line(put, 22, 10, 22, 4, A.L, 2);
  line(put, 18, 18, 26, 13, A.D, 2);
  rect(put, 16, 33, 3, 2, MOSS);
  rect(put, 28, 34, 4, 1, MOSS);
  line(put, 26, 40, 30, 46, A.D);
  if (st === 'x') {
    eyesX(put, 8, 20);
    return;
  }
  rect(put, 8, 21, 4, 3, st === 'rage' ? RAGE : EYE);
  put(8, 22, INK);
  line(put, 6, 19, 13, st === 'rage' ? 21 : 20, A.D, 1);
}

function beak(put: Put, st: Twin) {
  // the plinth stays even when Beak is off diving
  rect(put, 48, 40, 38, 12, '#6d6a66');
  rect(put, 46, 40, 42, 3, '#9a958e');
  rect(put, 50, 45, 34, 1, '#55524e');
  for (let x = 52; x < 84; x += 6) rect(put, x, 47, 3, 2, '#55524e');
  line(put, 78, 43, 81, 51, '#4a4743');
  if (st === 'gone') return;
  const up = st === 'wind';
  poly(put, [[72, 36], [82, 44], [76, 44]], B.WD);
  // wings at its sides, opening a little when it winds up
  disc(put, up ? 76 : 73, up ? 24 : 28, up ? 9 : 6, 12, B.Wg, B.WD);
  disc(put, 66, 28, 10, 12, B.S, B.D, B.L);
  // a feathered chest, carved in stone
  for (let y = 24; y < 38; y += 3) for (let x = 60; x < 70; x += 3) put(x + (y % 2), y, B.D);
  rect(put, 58, 38, 4, 3, B.L);
  rect(put, 66, 38, 4, 3, B.L);
  disc(put, 60, 12, 9, 8, B.S, B.D, B.L);
  poly(put, [[56, 5], [54, -1], [59, 4]], B.S);
  poly(put, [[64, 4], [68, -1], [67, 6]], B.S);
  // hooked beak
  poly(put, [[53, 11], [46, 14], [49, 19], [54, 17]], '#c9b98a');
  line(put, 47, 15, 53, 15, '#8f7f58');
  rect(put, 63, 18, 3, 2, MOSS);
  if (st === 'x') {
    eyesX(put, 54, 8);
    eyesX(put, 61, 8);
    // cracks running down its face
    line(put, 64, 4, 61, 12, INK);
    line(put, 70, 20, 66, 30, INK);
    line(put, 66, 30, 70, 36, INK);
    return;
  }
  disc(put, 56, 10, 2.5, 2.5, EYE);
  disc(put, 63, 10, 2.5, 2.5, EYE);
  put(55, 10, INK);
  put(62, 10, INK);
  line(put, 53, 7, 58, up ? 8 : 7, B.D);
  line(put, 61, up ? 8 : 7, 66, 7, B.D);
}

const cache = new Map<string, Sprite>();
function twins(a: Twin, b: Twin) {
  const key = `${a}|${b}`;
  let s = cache.get(key);
  if (!s) {
    s = makeSprite(FW, FH, (put) => {
      beak(put, b);
      horn(put, a);
    });
    cache.set(key, s);
  }
  return s;
}

// diving shapes: wings spread, flat out, heading left
const diveHorn = [0, 1].map((f) =>
  makeSprite(40, 24, (put) => {
    poly(put, f ? [[14, 10], [22, 0], [30, 2], [28, 12]] : [[14, 12], [24, 22], [32, 22], [28, 12]], A.Wg);
    disc(put, 22, 13, 12, 6, A.S, A.D, A.L);
    line(put, 32, 14, 39, 10, A.D, 2);
    disc(put, 8, 12, 7, 6, A.S, A.D, A.L);
    rect(put, 0, 12, 6, 4, A.S);
    line(put, 8, 6, 14, 2, A.L, 2);
    rect(put, 4, 10, 3, 2, EYE);
    put(2, 16, '#fff');
    poly(put, f ? [[18, 10], [26, 0], [36, 4], [30, 12]] : [[18, 14], [28, 22], [38, 20], [30, 12]], A.WD);
  })
);
const diveBeak = [0, 1].map((f) =>
  makeSprite(40, 24, (put) => {
    poly(put, f ? [[16, 10], [24, 0], [32, 2], [30, 12]] : [[16, 12], [24, 22], [34, 22], [30, 12]], B.Wg);
    disc(put, 22, 13, 11, 7, B.S, B.D, B.L);
    poly(put, [[32, 12], [40, 8], [40, 18]], B.WD);
    disc(put, 9, 11, 7, 6, B.S, B.D, B.L);
    poly(put, [[3, 10], [0, 13], [3, 16], [5, 14]], '#c9b98a');
    disc(put, 7, 9, 2, 2, EYE);
    poly(put, [[8, 5], [7, 1], [11, 4]], B.S);
    poly(put, f ? [[20, 10], [28, 0], [38, 4], [32, 12]] : [[20, 14], [30, 22], [38, 20], [32, 12]], B.WD);
  })
);
const orb = [0, 1].map((f) =>
  makeSprite(10, 10, (put) => {
    disc(put, 5, 5, 5, 5, '#8c8a84', '#5c5a55', '#c4c0b6');
    line(put, 2 + f * 3, 3, 5, 7, '#5c5a55');
    put(6, 3, MOSS);
  })
);
const rubble = makeSprite(12, 10, (put) => {
  poly(put, [[0, 6], [3, 0], [9, 1], [12, 6], [8, 10], [2, 9]], '#7d7a74');
  line(put, 3, 2, 7, 8, '#55524e');
  put(8, 2, '#b0aca4');
});

// ---- the twins' bookkeeping (who is away, whose turn it is)
let now = 0;
let phase = 1;
let awayHorn = 0;
let awayBeak = 0;
let turn: 'horn' | 'beak' = 'horn';
let wasAwayHorn = false;
let wasAwayBeak = false;
const sc = (api: BossApi) => api.bossW / (FW + 2);
const art = (api: BossApi, x: number, y: number) => ({ x: api.bossX - api.bossW / 2 + (x + 1) * sc(api), y: api.bossTop + (y + 1) * (api.bossH / (FH + 2)) });

function actor() {
  // once Beak is cracked, Horn does all the work
  const who = phase === 2 ? 'horn' : turn;
  if (phase !== 2) turn = turn === 'horn' ? 'beak' : 'horn';
  return who;
}

function dive(api: BossApi, who: 'horn' | 'beak', delay = 0) {
  api.after(delay, () => {
    const from = who === 'horn' ? art(api, 14, 24) : art(api, 60, 14);
    const fr = who === 'horn' ? diveHorn : diveBeak;
    const away = now + 2100;
    if (who === 'horn') awayHorn = away;
    else awayBeak = away;
    const h = fr[0].height * U;
    const lane = api.floorY - 58 - h; // just over a ducking marble
    const fast = phase === 2 ? 1.25 : 1;
    api.spawn({
      frames: fr,
      x: from.x - 60,
      y: from.y - h / 2,
      vx: -7 * fast,
      vy: 0,
      frameMs: 80,
      update(sh) {
        if (sh.hit) return;
        // drop into the lane, sweep along it, then climb away past the marble
        if (sh.x < api.marbleX - 140) sh.vy = -5;
        else sh.y += (lane - sh.y) * 0.14;
        sh.vx = Math.max(-11 * fast, (sh.vx || 0) - 0.25);
      }
    });
    api.sound.whoosh(0.16, 0.9, 0, 2600, 300);
    api.fx.burst('dust', 8, from.x, from.y + 20);
    // and it swoops home from the far side of the sky
    api.after(1600, () => {
      const home = who === 'horn' ? art(api, 20, 30) : art(api, 64, 22);
      api.spawn({ frames: fr, x: W + 20, y: -40, vx: (home.x - 60 - W - 20) / 28, vy: (home.y - 40 + 40) / 28, life: 470, dodge: 'none', frameMs: 60 });
      api.sound.whoosh(0.07, 0.4, 0, 1200, 2400);
    });
  });
}

function spit(api: BossApi, who: 'horn' | 'beak', n: number, delay = 0) {
  const mouth = who === 'horn' ? art(api, 4, 29) : art(api, 47, 16);
  for (let i = 0; i < n; i++) {
    api.after(delay + i * (phase === 2 ? 150 : 210), () => {
      api.spawn({
        frames: orb,
        x: mouth.x - 20,
        y: mouth.y - 15,
        vx: -5.2 - (i % 3) * 0.7,
        vy: -3.6 + (i % 2) * 1.4,
        g: 0.2,
        bounce: 0.55,
        frameMs: 120
      });
      api.sound.thump(0.25);
      api.sound.note(45 + (i % 3) * 3, { instrument: 'marimba', level: 0.06 });
      api.fx.burst('dust', 3, mouth.x, mouth.y);
    });
  }
}

registerBoss({
  id: 'gargoyle-twins',
  scale: 3.5,
  intro: 'drop',
  frames: () => ({ idle: [twins('perch', 'perch')], hurt: [twins('x', 'perch')] }),
  pose(t, state) {
    const hornGone = t < awayHorn;
    const beakGone = t < awayBeak;
    const hornSt: Twin = hornGone ? 'gone' : state === 'hurt' || state === 'dazed' || state === 'dying' ? 'x' : phase === 2 ? (state === 'wind' ? 'rage' : 'perch') : state === 'wind' && turn === 'horn' ? 'wind' : 'perch';
    const beakSt: Twin = beakGone ? 'gone' : phase === 2 || state === 'dazed' || state === 'dying' ? 'x' : state === 'wind' && turn === 'beak' ? 'wind' : 'perch';
    // a stony shuffle: they settle a pixel now and then rather than breathe
    const settle = Math.floor(t / 1400) % 3 === 0 ? U : 0;
    const shiver = state === 'wind' && phase === 2 ? (Math.floor(t / 40) % 2) * U : 0;
    return { frame: twins(hornSt, beakSt), dy: settle, dx: shiver };
  },
  moves: [
    {
      id: 'dive',
      windup: 560,
      run(api) {
        dive(api, actor());
      }
    },
    {
      id: 'stone-orbs',
      windup: 520,
      run(api) {
        spit(api, actor(), api.phase === 2 ? 5 : 3);
      }
    },
    {
      id: 'tag-team',
      windup: 640,
      phase: 1,
      weight: 0.8,
      run(api) {
        // one dives while the other covers it with orbs
        const diver = actor();
        dive(api, diver);
        spit(api, diver === 'horn' ? 'beak' : 'horn', 2, 380);
      }
    },
    {
      id: 'fury-dive',
      windup: 380,
      phase: 2,
      run(api) {
        api.tint(900, 'rgba(255,40,40,.08)');
        dive(api, 'horn');
        dive(api, 'horn', 2150);
      }
    },
    {
      id: 'rubble-slam',
      windup: 600,
      phase: 2,
      run(api) {
        // Horn slams the ledge and the battlements shed rubble
        api.shake(13, 700);
        api.flash(80, 'rgba(255,255,255,.3)');
        api.sound.thump(1.2);
        api.fx.burst('dust', 18, api.bossX - api.bossW * 0.25, api.ledgeY - 6);
        const xs: number[] = [];
        for (let i = 0; i < 6 && xs.length < 4; i++) {
          const x = 100 + ((i * 173 + Math.random() * 50) % (W * 0.62));
          if (Math.abs(x - api.marbleX) > 90 && xs.every((o) => Math.abs(o - x) > 70)) xs.push(x);
        }
        if (api.aim) xs.unshift(api.marbleX);
        xs.forEach((x, i) => {
          api.warn(x, 620 + i * 150, () => {
            api.spawn({ frames: [rubble], x: x - 18, y: -40, vy: 13, dodge: 'none', life: 420, spin: 0.3 });
            api.after(300, () => {
              api.shake(5, 140);
              api.sound.thump(0.5);
              api.fx.burst('dust', 8, x, api.floorY - 6);
              api.fx.burst('frag', 5, x, api.floorY - 8, { color: '#7d7a74' });
            });
            if (Math.abs(x - api.marbleX) < 50) api.strikeMarble();
          }, { kind: 'shadow', width: 64 });
        });
      }
    }
  ],
  drawExtra(g, t, api, state) {
    now = t;
    if (state === 'intro') {
      // a fresh fight: forget the last one's timers and effects
      awayHorn = 0;
      awayBeak = 0;
      turn = 'horn';
      wasAwayHorn = false;
      wasAwayBeak = false;
    }
    if (state !== 'dazed' && state !== 'dying') phase = api.phase;
    const hornHere = t >= awayHorn;
    const beakHere = t >= awayBeak;
    // a puff of grit as each twin lands back on its perch
    if (wasAwayHorn && hornHere) {
      const p = art(api, 20, 40);
      api.fx.burst('dust', 10, p.x, p.y);
      api.sound.thump(0.4);
    }
    if (wasAwayBeak && beakHere) {
      const p = art(api, 64, 38);
      api.fx.burst('dust', 10, p.x, p.y);
      api.sound.thump(0.4);
    }
    wasAwayHorn = !hornHere;
    wasAwayBeak = !beakHere;

    // storm rain over the courtyard
    g.fillStyle = 'rgba(190,210,255,.35)';
    for (let i = 0; i < 34; i++) {
      const x = (i * 97 + t * 0.5) % (W + 60) - 30;
      const y = (i * 61 + t * 0.9) % (api.H + 40) - 30;
      g.fillRect(r3(x), r3(y), U, U * 4);
      g.fillRect(r3(x - U), r3(y + U * 4), U, U * 2);
    }

    // the glowing eyes of whichever twins are home
    const pulse = 0.35 + Math.abs(Math.sin(t / 260)) * 0.35;
    g.globalCompositeOperation = 'lighter';
    if (hornHere && state !== 'hurt' && state !== 'dazed' && state !== 'dying') {
      const e = art(api, 10, 22);
      g.fillStyle = phase === 2 ? `rgba(255,60,60,${pulse + 0.2})` : `rgba(255,176,32,${pulse})`;
      g.fillRect(r3(e.x - 12), r3(e.y - 6), 24, 12);
      if (phase === 2) {
        // a red ember trail streams back from the raging twin's eye
        for (let k = 1; k < 6; k++) g.fillRect(r3(e.x + k * 7), r3(e.y - 3 - Math.sin(t / 90 + k) * 4), U * 2, U);
      }
    }
    if (beakHere && phase === 1 && state !== 'dazed' && state !== 'dying') {
      for (const ex of [56, 63]) {
        const e = art(api, ex, 10);
        g.fillStyle = `rgba(255,176,32,${pulse})`;
        g.fillRect(r3(e.x - 9), r3(e.y - 9), 18, 18);
      }
    }
    g.globalCompositeOperation = 'source-over';

    // cracked and seeing stars once phase 2 begins
    if (beakHere && phase === 2) {
      const c = art(api, 60, 2);
      for (let i = 0; i < 3; i++) {
        const a = t / 240 + (i * Math.PI * 2) / 3;
        g.fillStyle = i % 2 ? '#fff' : '#ffcb32';
        star(g, c.x + Math.cos(a) * 30, c.y - 8 + Math.sin(a) * 8, 5);
      }
      if (Math.floor(t / 500) % 4 === 0) {
        const p = art(api, 66, 30);
        g.fillStyle = '#9a958e';
        g.fillRect(r3(p.x), r3(p.y + ((t % 500) / 500) * 60), U * 2, U * 2);
      }
    }
  }
});
