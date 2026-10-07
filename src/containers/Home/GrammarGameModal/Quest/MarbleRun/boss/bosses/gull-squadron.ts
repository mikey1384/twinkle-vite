import { makeSprite, disc, rect, line, poly, INK, W, Put, Sprite, drawSprite } from '../../pixel';
import { registerBoss } from '../registry';
import type { Shot } from '../types';

// Fort 2 of Harbor Town: the Gull Squadron, three seagulls flying in a V.
// The leader wears a sailor cap, the top gull a red scarf, the round one at
// the back has a fish-bone in its beak. They peel off and dive one after
// another (the formation sprite loses that gull and it swoops in from the
// right to rejoin), drop shells from above, and lob a flapping fish.

type Kind = 'cap' | 'scarf' | 'chubby';
const KINDS: Kind[] = ['cap', 'scarf', 'chubby'];
// each gull's top-left inside the formation sprite (art px)
const SLOTS: [number, number][] = [[0, 14], [24, 0], [28, 27]];
const GW = 24;
const GH = 14;
const SCALE = 3;

// when each gull is back in formation (it is away diving until then)
const backAt = [-1e9, -1e9, -1e9];
const RETURN_MS = 650;

function gull(put: Put, ox: number, oy: number, kind: Kind, wing: 0 | 1, eyes: 'open' | 'angry' | 'x') {
  const P = (x: number, y: number, c: string | null) => put(ox + x, oy + y, c);
  const Wh = '#f4f6fa';
  const Gr = '#b9c2d0';
  const GrD = '#7d889a';
  const fat = kind === 'chubby' ? 1 : 0;
  // tail and body
  poly(P, [[17, 7], [23, 4], [23, 10]], Gr);
  disc(P, 12, 8, 7 + fat, 4 + fat, Wh, Gr);
  // head and beak (facing left)
  disc(P, 5, 6, 3.6, 3.4, Wh);
  poly(P, [[-0.2, 6], [2, 5], [2, 8]], '#ffb02e');
  P(1, 7, '#e2433a');
  if (eyes === 'x') {
    P(3, 4, INK);
    P(5, 4, INK);
    P(4, 5, INK);
    P(3, 6, INK);
    P(5, 6, INK);
  } else {
    P(4, 5, INK);
    if (eyes === 'angry') {
      P(3, 3, INK);
      P(4, 4, INK);
      P(5, 4, INK);
    }
  }
  // wing: up or down, with black tips
  if (wing) {
    poly(P, [[9, 6], [13, -0.5], [20, 0], [16, 7]], Gr);
    line(P, 13, 0, 19, 0, INK);
    line(P, 10, 6, 15, 2, GrD);
  } else {
    poly(P, [[9, 8], [13, 14], [20, 14], [16, 8]], Gr);
    line(P, 13, 14, 19, 14, INK);
  }
  // tucked orange feet
  P(12, 12 + fat, '#ff8a2e');
  P(14, 12 + fat, '#ff8a2e');
  if (kind === 'cap') {
    // little blue sailor cap with a white band
    rect(P, 3, 2, 6, 2, '#2f5fc8');
    rect(P, 3, 3, 6, 1, '#fff');
    P(9, 3, '#2f5fc8');
    P(6, 1, '#d93a4a');
  } else if (kind === 'scarf') {
    rect(P, 6, 8, 3, 2, '#e2433a');
    line(P, 9, 9, 13, 11, '#e2433a');
    P(13, 12, '#b02a3a');
  } else {
    // a fish-bone hanging from its beak
    line(P, 0, 9, 0, 12, '#e8e2d0');
    P(-1, 10, '#e8e2d0');
    P(1, 10, '#e8e2d0');
    P(-1, 11, '#e8e2d0');
    P(1, 11, '#e8e2d0');
  }
}

function formation(mask: number, flap: 0 | 1, eyes: 'open' | 'angry' | 'x') {
  return makeSprite(53, 44, (put) => {
    for (let i = 0; i < 3; i++) {
      if (!(mask & (1 << i))) continue;
      gull(put, SLOTS[i][0] + 1, SLOTS[i][1] + 1, KINDS[i], ((flap + i) % 2) as 0 | 1, eyes);
    }
  });
}

// single gulls for dives and the flying-back animation
const single = KINDS.map((k) => [0, 1].map((w) => makeSprite(GW + 1, GH + 2, (put) => gull(put, 1, 1, k, w as 0 | 1, 'angry'))));

const shell = makeSprite(10, 9, (put) => {
  poly(put, [[5, 0], [10, 7], [0, 7]], '#ffc4d6');
  for (const x of [3, 5, 7]) line(put, 5, 1, x, 7, '#e88aa6');
  rect(put, 2, 7, 6, 2, '#e88aa6');
});

const fish = [0, 1].map((f) =>
  makeSprite(16, 9, (put) => {
    disc(put, 7, 4.5, 6.5, 3.5, '#5cb8e6', '#3a86b8', '#bfe9ff');
    poly(put, f ? [[12, 4], [16, 0], [15, 5]] : [[12, 5], [15, 4], [16, 9]], '#3a86b8');
    put(3, 3, INK);
    put(1, 5, INK);
  })
);

function awayMask(t: number) {
  let m = 0;
  for (let i = 0; i < 3; i++) if (t >= backAt[i]) m |= 1 << i;
  return m;
}

registerBoss({
  id: 'gull-squadron',
  scale: SCALE,
  hover: 80,
  intro: 'fly',
  frames() {
    const f: Record<string, Sprite[]> = {};
    for (let m = 0; m < 8; m++) {
      f[`m${m}`] = [formation(m, 0, 'open'), formation(m, 1, 'open')];
      f[`w${m}`] = [formation(m, 0, 'angry'), formation(m, 1, 'angry')];
    }
    f.hurt = [formation(7, 0, 'x')];
    return f;
  },
  pose(t, state, f) {
    // timers from an earlier fight on another clock: forget them
    for (let i = 0; i < 3; i++) if (backAt[i] > t + 4500) backAt[i] = -1e9;
    if (state === 'hurt' || state === 'dazed' || state === 'dying') return { frame: f.hurt[0], dy: Math.sin(t / 200) * 4 };
    const m = state === 'intro' ? 7 : awayMask(t);
    const flap = Math.floor(t / (state === 'wind' ? 90 : 170)) % 2;
    if (state === 'wind') return { frame: f[`w${m}`][flap], dy: -6 };
    if (state === 'laugh') return { frame: f[`m${m}`][flap], dy: -Math.abs(Math.sin(t / 90)) * 10 };
    // drifting in formation on the sea breeze
    return { frame: f[`m${m}`][flap], dy: Math.sin(t / 420) * 10, dx: Math.sin(t / 900) * 8 };
  },
  drawExtra(g, t, api, state) {
    if (state === 'hurt' || state === 'dazed' || state === 'dying' || state === 'intro') return;
    const left = api.bossX - api.bossW / 2;
    // a gull that dove swoops back in from the right to its slot
    for (let i = 0; i < 3; i++) {
      const k = 1 - (backAt[i] - t) / RETURN_MS;
      if (k < 0 || k >= 1) continue;
      const tx = left + (SLOTS[i][0] + 1) * SCALE;
      const ty = api.bossTop + (SLOTS[i][1] + 1) * SCALE;
      const e = 1 - (1 - k) * (1 - k);
      const x = W + 30 + (tx - W - 30) * e;
      const y = ty - 70 * (1 - e) + Math.sin(k * Math.PI) * 20;
      drawSprite(g, single[i][Math.floor(t / 80) % 2], x, y, SCALE);
    }
  },
  moves: [
    {
      id: 'dive',
      windup: 500,
      run(api) {
        // one after another: peel off, swoop low (the marble ducks), climb away
        const left = api.bossX - api.bossW / 2;
        const top = api.bossTop;
        let n = 0;
        for (let i = 0; i < 3; i++) {
          if (api.t < backAt[i]) continue;
          const at = n++ * 420;
          api.after(at, () => {
            backAt[i] = api.t + at + 2500;
            let lowAt = 0;
            const s: Shot = {
              frames: single[i],
              frameMs: 80,
              x: left + SLOTS[i][0] * SCALE,
              y: top + SLOTS[i][1] * SCALE,
              vx: -7.5,
              vy: 4.2,
              dodge: 'duck',
              update(sh, t) {
                if (sh.hit) return;
                const bottom = sh.y + (GH + 4) * SCALE;
                if (!lowAt && bottom >= api.floorY - 66) {
                  lowAt = t;
                  sh.vy = 0;
                }
                if (lowAt && t - lowAt > 420) sh.vy = -3.6;
              }
            };
            api.spawn(s);
            api.sound.note(81 - i * 2, { instrument: 'marimba', level: 0.08 });
            api.sound.note(77 - i * 2, { at: 0.08, instrument: 'marimba', level: 0.07 });
            api.sound.whoosh(0.08, 0.5, 0.1, 2000, 500);
          });
        }
        if (!n && api.aim) api.strikeMarble();
      }
    },
    {
      id: 'shells',
      windup: 560,
      run(api) {
        // shells rain from up high; shadows show where (never on the marble
        // unless this answers a wrong pick)
        api.sound.note(84, { instrument: 'glock', level: 0.06 });
        const xs = [0, 1, 2, 3].map((i) => 110 + i * 150 + Math.random() * 50).filter((x) => Math.abs(x - api.marbleX) > 75);
        if (api.aim) xs.unshift(api.marbleX);
        for (let i = 0; i < xs.length; i++) {
          const x = xs[i];
          api.warn(x, 650 + i * 160, () => {
            // frames to fall from y -30 to the floor at vy 9, g 0.3 (~60fps)
            const d = api.floorY - 30 + 30;
            const land = ((-9 + Math.sqrt(81 + 0.6 * d)) / 0.3) * 16.7;
            api.spawn({ frames: [shell], x: x - 16, y: -30, vy: 9, g: 0.3, dodge: 'none', spin: 0.3, life: land });
            api.after(land, () => {
              api.fx.burst('shard', 8, x, api.floorY - 8, { color: '#ffc4d6', speed: 0.6 });
              api.sound.note(91, { instrument: 'glock', level: 0.05 });
            });
            if (Math.abs(x - api.marbleX) < 50) api.strikeMarble();
          }, { kind: 'shadow', width: 52 });
        }
      }
    },
    {
      id: 'fish',
      windup: 420,
      weight: 0.7,
      run(api) {
        // the round gull drops its lunch: a fish that flops along the floor
        const i = api.t >= backAt[2] ? 2 : 0;
        api.spawn({
          frames: fish,
          frameMs: 100,
          x: api.bossX - api.bossW / 2 + SLOTS[i][0] * SCALE,
          y: api.bossTop + (SLOTS[i][1] + 10) * SCALE,
          vx: -4.6,
          vy: -1,
          g: 0.3,
          bounce: 0.62
        });
        api.sound.note(72, { instrument: 'marimba', level: 0.09 });
        api.sound.note(67, { at: 0.1, instrument: 'marimba', level: 0.08 });
      }
    }
  ]
});
