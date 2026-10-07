import { makeSprite, disc, rect, line, poly, eyesX, INK, U, W } from '../../pixel';
import { registerBoss } from '../registry';
import type { BossApi, Shot } from '../types';

// Castle of World 4: the Elder Treant, an ancient oak with a mossy beard, a
// bird's nest on one arm and mushrooms at its feet. Roots erupt from the
// floor in a line toward the marble (each one warned first), acorns rain
// down around it, and a leaf storm sweeps the room. Phase 2: its eyes glow
// and the roots come faster, in pairs.

const BARK = '#7a5232';
const BARK_D = '#4e3220';
const BARK_L = '#a87a4a';
const LEAF = '#2f7d46';
const LEAF_D = '#1f5a36';
const LEAF_L = '#5aae5a';
const MOSS = '#8fcf5a';
const MOSS_D = '#5c9a3a';
const GLOW = '#d8ff6a';

// eye centres in art px (for the phase-2 glow)
const EYES: [number, number][] = [[25, 34], [36, 33]];
const ART_W = 66;
const ART_H = 62;

function treant(arms: 'down' | 'up', mouth: 'shut' | 'roar' | 'x', sway: number) {
  return makeSprite(ART_W, ART_H, (put) => {
    // roots spreading over the ground
    poly(put, [[18, 52], [6, 60], [14, 61], [24, 56]], BARK_D);
    poly(put, [[46, 52], [60, 61], [52, 61], [42, 56]], BARK_D);
    poly(put, [[28, 56], [24, 61], [34, 61], [34, 56]], BARK);
    line(put, 8, 60, 18, 54, BARK, 1);
    line(put, 58, 60, 47, 54, BARK, 1);

    // branch arms (behind the trunk)
    if (arms === 'up') {
      line(put, 18, 34, 6, 12, BARK, 3);
      line(put, 6, 12, 2, 6, BARK_D, 2);
      line(put, 7, 14, 1, 14, BARK_D, 2);
      line(put, 46, 32, 60, 10, BARK, 3);
      line(put, 60, 10, 64, 4, BARK_D, 2);
      line(put, 59, 13, 65, 13, BARK_D, 2);
    } else {
      line(put, 18, 34, 4, 44, BARK, 3);
      line(put, 4, 44, 0, 50, BARK_D, 2);
      line(put, 5, 45, 1, 42, BARK_D, 2);
      line(put, 46, 32, 61, 40, BARK, 3);
      line(put, 61, 40, 65, 46, BARK_D, 2);
      line(put, 60, 40, 64, 36, BARK_D, 2);
    }

    // trunk: wide at the base, bark ridges, a mossy patch
    poly(put, [[15, 58], [50, 58], [45, 22], [20, 22]], BARK);
    poly(put, [[40, 58], [50, 58], [45, 22], [40, 22]], BARK_D);
    for (const x of [19, 23, 42, 46]) line(put, x, 26, x + (x < 30 ? -2 : 2), 56, BARK_D);
    line(put, 30, 50, 31, 57, BARK_D);
    line(put, 20, 24, 22, 40, BARK_L);
    disc(put, 44, 48, 3, 4, MOSS, MOSS_D);
    // a knot hole low on the trunk
    disc(put, 36, 52, 2, 2.5, '#2a1a10');

    // canopy: a big layered crown, swaying a pixel
    const s = sway;
    disc(put, 18 + s, 15, 13, 10, LEAF, LEAF_D, LEAF_L);
    disc(put, 47 + s, 15, 14, 11, LEAF, LEAF_D, LEAF_L);
    disc(put, 33 + s, 9, 16, 9, LEAF, LEAF_D, LEAF_L);
    disc(put, 32 + s, 21, 17, 6, LEAF_D);
    for (const [x, y] of [[12, 10], [24, 5], [38, 4], [52, 9], [30, 13], [44, 17], [17, 18]]) {
      put(x + s, y, LEAF_L);
      put(x + s + 1, y, LEAF_L);
      put(x + s, y - 1, '#8fdc7a');
    }
    // a few autumn leaves and white blossoms
    for (const [x, y, c] of [[9, 14, '#e8a23a'], [56, 20, '#e8a23a'], [27, 3, '#fff3f6'], [48, 6, '#fff3f6'], [20, 22, '#d9572e']] as [number, number, string][]) put(x + s, y, c);
    // hanging moss strands
    for (const [x, len] of [[14, 6], [23, 4], [49, 5], [56, 7]]) line(put, x + s, 22, x + s, 22 + len, MOSS_D);

    // a nest on the right arm with a little blue bird
    const nx = arms === 'up' ? 57 : 58;
    const ny = arms === 'up' ? 14 : 37;
    disc(put, nx, ny, 4, 2, '#b08850', '#7a5a30');
    disc(put, nx - 1, ny - 3, 2, 2, '#5ab0f0', '#3a80c8');
    put(nx - 3, ny - 3, '#ffcb32');
    put(nx - 2, ny - 4, INK);

    // the face: heavy brows, deep eyes, a knot nose
    rect(put, 22, 29, 7, 2, BARK_D);
    rect(put, 33, 28, 7, 2, BARK_D);
    if (mouth === 'x') {
      eyesX(put, 23, 32, '#2a1a10');
      eyesX(put, 34, 31, '#2a1a10');
    } else {
      for (const [ex, ey] of EYES) {
        rect(put, ex - 2, ey - 2, 5, 4, '#2a1a10');
        rect(put, ex - 1, ey - 1, 2, 2, GLOW);
      }
    }
    disc(put, 30, 39, 2.5, 3, BARK_L, BARK_D);
    if (mouth === 'roar') {
      disc(put, 30, 45, 6, 3.5, '#2a1a10');
      rect(put, 26, 43, 2, 1, BARK_L);
      rect(put, 32, 43, 2, 1, BARK_L);
    } else {
      line(put, 24, 44, 28, 45, '#2a1a10');
      line(put, 28, 45, 32, 44, '#2a1a10');
      line(put, 32, 44, 36, 45, '#2a1a10');
    }
    // mossy beard
    for (let k = 0; k < 7; k++) {
      const x = 24 + k * 2;
      const len = 4 + ((k * 5) % 4);
      line(put, x, 47, x + (k % 2), 47 + len, k % 2 ? MOSS : MOSS_D);
    }

    // mushrooms at its feet
    disc(put, 10, 57, 3, 2, '#e23b3b', '#a8222c');
    rect(put, 9, 58, 2, 3, '#fff1c9');
    put(9, 56, '#fff');
    disc(put, 55, 58, 2.5, 1.5, '#e8a23a', '#b0702a');
    rect(put, 54, 59, 2, 2, '#fff1c9');
  });
}

// a root bursting out of the floor, in growth stages (bottom aligned)
const ROOT_H = 26;
const roots = [5, 11, 17, 22, 26].map((hgt) =>
  makeSprite(16, ROOT_H, (put) => {
    const top = ROOT_H - hgt;
    poly(put, [[2, ROOT_H], [7, top], [9, top], [14, ROOT_H]], BARK);
    poly(put, [[9, top], [14, ROOT_H], [10, ROOT_H]], BARK_D);
    if (hgt > 10) {
      line(put, 6, top + 8, 2, top + 4, BARK, 1);
      line(put, 10, top + 11, 14, top + 7, BARK, 1);
    }
    put(8, top, BARK_L);
    if (hgt > 16) put(5, top + 12, MOSS);
    // churned soil at the base
    rect(put, 0, ROOT_H - 2, 16, 2, '#5a3a22');
    put(3, ROOT_H - 3, '#7a5a3a');
    put(12, ROOT_H - 3, '#7a5a3a');
  })
);
const acorn = makeSprite(9, 11, (put) => {
  disc(put, 4.5, 7, 3.5, 4, '#c8843a', '#8a5420', '#f0b870');
  disc(put, 4.5, 3, 4.5, 2.5, '#7a5232', '#4e3220');
  for (const x of [2, 4, 6]) put(x, 2, '#a87a4a');
  rect(put, 4, 0, 1, 1, '#4e3220');
});
const leafClump = [0, 1].map((f) =>
  makeSprite(14, 10, (put) => {
    disc(put, 5, 5, 4, 3, f ? LEAF_L : LEAF, LEAF_D);
    disc(put, 10, 4, 3, 2.5, '#e8a23a', '#b0702a');
    disc(put, 8, 7, 3, 2, f ? LEAF : LEAF_L, LEAF_D);
    line(put, 1, 5, 12, 5, LEAF_D);
  })
);

function rootLine(api: BossApi, pairs: boolean) {
  // warning columns march from the tree toward the marble; each erupts
  const from = api.bossX - api.bossW * 0.45;
  const to = api.aim ? api.marbleX : api.marbleX + 110;
  const step = pairs ? 70 : 92;
  const xs: number[] = [];
  for (let x = from; x > to; x -= step) xs.push(x);
  if (api.aim) xs.push(api.marbleX);
  const gap = pairs ? 110 : 170;
  const warnMs = pairs ? 320 : 460;
  for (let i = 0; i < xs.length; i++) {
    const x = xs[i];
    const lane = pairs ? [x, x - 34] : [x];
    for (const lx of lane) {
      api.after(i * gap, () => {
        api.warn(lx, warnMs, () => erupt(api, lx), { width: 48, color: pairs ? '#ff7a3a' : '#c8a060', kind: 'column' });
      });
    }
  }
  if (api.aim) {
    api.after((xs.length - 1) * gap + warnMs, () => api.strikeMarble());
  }
}

function erupt(api: BossApi, x: number) {
  const sw = roots[0].width * U;
  const s: Shot = {
    frames: [roots[0]],
    x: x - sw / 2,
    y: api.floorY - roots[0].height * U + U,
    dodge: 'none',
    life: 760,
    update(sh, t) {
      const age = t - (sh.born || 0);
      // grow fast, hold, then sink back
      const k = age < 140 ? age / 140 : age < 480 ? 1 : Math.max(0, 1 - (age - 480) / 260);
      sh.frames = [roots[Math.min(roots.length - 1, Math.round(k * (roots.length - 1)))]];
    }
  };
  api.spawn(s);
  api.shake(5, 160);
  api.sound.thump(0.55);
  api.sound.note(43, { instrument: 'marimba', level: 0.08 });
  api.fx.burst('dust', 8, x, api.floorY - 4, { color: '#8a6a46' });
}

registerBoss({
  id: 'elder-treant',
  scale: 3.5,
  intro: 'rise',
  frames: () => ({
    idle: [treant('down', 'shut', 0), treant('down', 'shut', 1)],
    wind: [treant('up', 'roar', 0)],
    hurt: [treant('down', 'x', 0)]
  }),
  pose(t, state, f) {
    if (state === 'hurt' || state === 'dazed' || state === 'dying') return { frame: f.hurt[0] };
    if (state === 'wind') return { frame: f.wind[0], sy: 1.04, sx: 0.98 };
    if (state === 'laugh') return { frame: f.wind[0], sy: 1 + Math.abs(Math.sin(t / 120)) * 0.04 };
    // idle: the crown sways in the wind and the old trunk creaks as it breathes
    const swayIdx = Math.floor(t / 750) % 2;
    return { frame: f.idle[swayIdx], sy: 1 + Math.sin(t / 900) * 0.015, sx: 1 - Math.sin(t / 900) * 0.01 };
  },
  moves: [
    {
      id: 'roots',
      windup: 620,
      phase: 1,
      weight: 1.2,
      run(api) {
        api.sound.whoosh(0.08, 0.6, 0, 200, 500);
        rootLine(api, false);
      }
    },
    {
      id: 'root-pairs',
      windup: 480,
      phase: 2,
      weight: 1.3,
      run(api) {
        api.tint(900, 'rgba(255,120,40,.1)');
        api.sound.whoosh(0.12, 0.5, 0, 200, 600);
        rootLine(api, true);
      }
    },
    {
      id: 'acorn-rain',
      windup: 560,
      run(api) {
        // the tree shakes its crown; acorns drop around the marble, never on it
        api.shake(7, 520);
        api.sound.thump(0.7);
        api.fx.burst('leaf', 12, api.bossX - 20, api.bossTop + 30, { color: LEAF_L });
        const n = api.phase === 2 ? 6 : 4;
        const xs: number[] = [];
        for (let i = 0; i < n * 2 && xs.length < n; i++) {
          const x = 60 + Math.random() * (api.bossX - api.bossW * 0.5 - 80);
          if (Math.abs(x - api.marbleX) > 85 && xs.every((o) => Math.abs(o - x) > 50)) xs.push(x);
        }
        if (api.aim) xs.unshift(api.marbleX);
        xs.forEach((x, i) => {
          api.warn(x, 520 + i * 130, () => {
            const s = api.spawn({ frames: [acorn], x: x - 13, y: api.floorY - 260, vy: 9, g: 0.5, bounce: 0.35, dodge: 'none', life: 1300, spin: 0.2 });
            api.after(260, () => {
              if (s.done) return;
              api.sound.note(72 + (i % 3) * 3, { instrument: 'marimba', level: 0.06 });
              api.fx.burst('dust', 4, x, api.floorY - 4, { color: '#8a6a46' });
            });
            if (Math.abs(x - api.marbleX) < 50) api.after(240, () => api.strikeMarble());
          }, { kind: 'shadow', width: 46 });
        });
      }
    },
    {
      id: 'leaf-storm',
      windup: 700,
      weight: 0.9,
      run(api) {
        // a roar and a gale of leaves: a low band the marble ducks under,
        // with the whole room full of whirling leaves
        api.tint(1500, 'rgba(60,140,60,.14)');
        api.sound.whoosh(0.18, 1.4, 0, 300, 1800);
        api.shake(4, 900);
        for (let i = 0; i < 30; i++) {
          api.after(i * 35, () =>
            api.fx.add({ kind: 'leaf', x: W + 10, y: 40 + Math.random() * 220, vx: -10 - Math.random() * 5, vy: -0.5 + Math.random(), color: [LEAF_L, MOSS, '#e8a23a', LEAF][i % 4], life: 1.3 })
          );
        }
        const n = api.phase === 2 ? 6 : 4;
        for (let i = 0; i < n; i++) {
          api.after(120 + i * 150, () => {
            const base = api.floorY - 74 + (i % 2) * 4;
            api.spawn({
              frames: leafClump,
              x: api.bossX - api.bossW * 0.45,
              y: base,
              vx: -8 - (i % 3),
              dodge: 'duck',
              frameMs: 80,
              update(sh, t) {
                if (sh.hit) return;
                sh.y = base + Math.round(Math.sin(t / 90 + i) * 2) * U;
              }
            });
          });
        }
      }
    }
  ],
  drawExtra(g, t, api, state) {
    // phase 2: the eyes burn with an ember glow
    if (api.phase !== 2 || state === 'hurt' || state === 'dazed' || state === 'dying') return;
    const sx = api.bossW / (ART_W + 2);
    const sy = api.bossH / (ART_H + 2);
    const pulse = 0.55 + Math.sin(t / 140) * 0.25;
    g.globalCompositeOperation = 'lighter';
    for (const [ex, ey] of EYES) {
      const x = api.bossX - api.bossW / 2 + (ex + 1) * sx;
      const y = api.bossTop + (ey + 1) * sy;
      g.globalAlpha = pulse * 0.45;
      g.fillStyle = '#ff7a2a';
      g.fillRect(Math.round(x / U) * U - 4 * U, Math.round(y / U) * U - 3 * U, 8 * U, 6 * U);
      g.globalAlpha = pulse;
      g.fillStyle = '#ffd84a';
      g.fillRect(Math.round(x / U) * U - 2 * U, Math.round(y / U) * U - U, 4 * U, 3 * U);
    }
    g.globalAlpha = 1;
    g.globalCompositeOperation = 'source-over';
    // embers drift up off the crown
    if (Math.floor(t / 90) % 4 === 0) api.fx.add({ kind: 'ember', x: api.bossX - api.bossW * 0.4 + Math.random() * api.bossW * 0.8, y: api.bossTop + 30, vx: (Math.random() - 0.5), vy: -1, color: '#ff9a3a', life: 0.8 });
  }
});
