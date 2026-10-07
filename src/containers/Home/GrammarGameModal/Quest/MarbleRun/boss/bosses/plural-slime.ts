import { makeSprite, disc, rect, line, eyesX, INK } from '../../pixel';
import { registerBoss } from '../registry';

// Fort 1 of Starter Village: the gentlest boss. A crowned slime that
// squashes and lobs mini-slimes; a big hit splits a mini-slime off it.

function slime(eyes: 'open' | 'angry' | 'x') {
  return makeSprite(46, 36, (put) => {
    const G = '#5ccf5a';
    const D = '#2f9a43';
    const L = '#c6f7a8';
    disc(put, 23, 26, 22, 10, G, D);
    disc(put, 23, 19, 17, 16, G, D, L);
    rect(put, 8, 33, 3, 2, D);
    rect(put, 34, 33, 4, 2, D);
    rect(put, 16, 3, 14, 3, '#ffcb32');
    for (const [x, h] of [[16, 2], [23, 3], [29, 2]]) for (let k = 1; k <= h; k++) put(x, 3 - k, '#ffcb32');
    put(20, 4, '#e91e8c');
    put(26, 4, '#418ceb');
    if (eyes === 'x') {
      eyesX(put, 13, 14);
      eyesX(put, 27, 14);
    } else {
      rect(put, 12, 13, 6, 7, '#fff');
      rect(put, 27, 13, 6, 7, '#fff');
      rect(put, 12, 16, 3, 4, INK);
      rect(put, 27, 16, 3, 4, INK);
      if (eyes === 'angry') {
        line(put, 11, 10, 17, 13, INK);
        line(put, 33, 10, 27, 13, INK);
      }
    }
    rect(put, 17, 24, 12, 2, INK);
    put(18, 26, '#fff');
    put(27, 26, '#fff');
  });
}
const mini = makeSprite(11, 8, (put) => {
  disc(put, 5.5, 5, 5.5, 3.6, '#5ccf5a', '#2f9a43', '#c6f7a8');
  put(3, 4, INK);
  put(7, 4, INK);
});

registerBoss({
  id: 'plural-slime',
  scale: 4,
  intro: 'drop',
  frames: () => ({ idle: [slime('open')], wind: [slime('angry')], hurt: [slime('x')] }),
  pose(t, state, f) {
    if (state === 'hurt' || state === 'dazed' || state === 'dying') return { frame: f.hurt[0] };
    if (state === 'wind') return { frame: f.wind[0], sx: 1.15, sy: 0.82 };
    if (state === 'laugh') return { frame: f.wind[0], sy: 1 + Math.abs(Math.sin(t / 110)) * 0.1 };
    const q = Math.sin(t / 240) * 0.06;
    return { frame: f.idle[0], sx: 1 + q, sy: 1 - q };
  },
  moves: [
    {
      id: 'lob',
      windup: 380,
      run(api) {
        api.spawn({ frames: [mini], x: api.bossX - api.bossW * 0.42, y: api.bossTop + api.bossH * 0.5, vx: -4.4, vy: -6.5, g: 0.28, bounce: 0.55 });
        api.sound.note(64, { instrument: 'marimba', level: 0.1 });
      }
    },
    {
      id: 'double-lob',
      windup: 420,
      weight: 0.6,
      run(api) {
        // plural: two at once
        for (const [vx, vy] of [[-4, -7], [-5.4, -5]]) {
          api.spawn({ frames: [mini], x: api.bossX - api.bossW * 0.42, y: api.bossTop + api.bossH * 0.5, vx, vy, g: 0.28, bounce: 0.55 });
        }
        api.sound.note(64, { instrument: 'marimba', level: 0.1 });
        api.sound.note(67, { at: 0.08, instrument: 'marimba', level: 0.1 });
      }
    }
  ]
});
