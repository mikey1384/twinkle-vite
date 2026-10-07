import { makeSprite, disc, rect, line, poly, eyesX, ring, INK } from '../../pixel';
import { registerBoss } from '../registry';
import type { Shot } from '../types';

// Fort 2 of Starter Village: a very proper bat with a gold monocle. Sonic
// rings skim the floor; sometimes it swoops low across the room.

function bat(wing: 'up' | 'down', eyes: 'open' | 'x') {
  return makeSprite(56, 32, (put) => {
    const P = '#7b4bc4';
    const D = '#4b2a86';
    const L = '#b597ee';
    const M = '#5e3a9c';
    const wy = wing === 'up' ? 6 : 16;
    for (const s of [-1, 1]) {
      const cx = 28 + s * 16;
      disc(put, cx, wy + 4, 13, 7, M, D);
      for (let k = 0; k < 3; k++) disc(put, cx + s * (-6 + k * 6), wy + 11, 2.6, 2.6, null);
      line(put, 28 + s * 6, 16, cx + s * 11, wy + 1, D);
    }
    disc(put, 28, 17, 9, 10, P, D, L);
    poly(put, [[20, 9], [21, 1], [25, 8]], P);
    poly(put, [[36, 9], [35, 1], [31, 8]], P);
    if (eyes === 'x') {
      eyesX(put, 21, 13);
      eyesX(put, 31, 13);
    } else {
      rect(put, 21, 13, 4, 4, '#ffd84a');
      rect(put, 31, 13, 4, 4, '#ffd84a');
      rect(put, 21, 14, 2, 2, '#c0204a');
      rect(put, 31, 14, 2, 2, '#c0204a');
      ring(put, 33, 15, 3.4, '#ffcb32', 16);
      line(put, 36, 18, 37, 24, '#ffcb32');
    }
    rect(put, 23, 21, 10, 1, INK);
    for (const x of [24, 31]) {
      put(x, 22, '#fff');
      put(x, 23, '#fff');
    }
  });
}
const sonic = makeSprite(14, 16, (put) => {
  disc(put, 7, 8, 7, 8, '#d7c2ff');
  disc(put, 7, 8, 4.5, 5.5, null);
  disc(put, 8, 8, 4.5, 5.5, null);
});

registerBoss({
  id: 'article-bat',
  scale: 4,
  hover: 70,
  intro: 'fly',
  frames: () => ({ up: [bat('up', 'open')], down: [bat('down', 'open')], hurt: [bat('down', 'x')] }),
  pose(t, state, f) {
    if (state === 'hurt' || state === 'dazed' || state === 'dying') return { frame: f.hurt[0] };
    const flap = Math.floor(t / (state === 'wind' ? 80 : 140)) % 2;
    return { frame: flap ? f.up[0] : f.down[0], dy: Math.sin(t / 380) * 12 };
  },
  moves: [
    {
      id: 'rings',
      windup: 360,
      run(api) {
        // rings skim the floor in a little train; the marble hops them
        for (let i = 0; i < 2; i++) {
          api.after(i * 260, () => {
            const s: Shot = {
              frames: [sonic],
              x: api.bossX - api.bossW * 0.4,
              y: api.bossTop + api.bossH * 0.4,
              vx: -6.5,
              vy: 0,
              update(sh) {
                // drop down to skim the floor
                const target = api.floorY - 60;
                sh.y += (target - sh.y) * 0.08;
              }
            };
            api.spawn(s);
            api.sound.note(88, { instrument: 'glock', level: 0.05 });
          });
        }
      }
    },
    {
      id: 'swoop',
      windup: 500,
      weight: 0.7,
      run(api) {
        // a bat-shaped shadow swoops low across the room
        const s: Shot = {
          frames: [bat('down', 'open')],
          x: api.bossX - 60,
          y: api.bossTop,
          vx: -9,
          vy: 3.4,
          scale: 2,
          update(sh) {
            if (sh.y > api.floorY - 80) sh.vy = -1.5;
          }
        };
        api.spawn(s);
        api.sound.whoosh(0.1, 0.6, 0, 2400, 400);
      }
    }
  ]
});
