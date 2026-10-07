import { makeSprite, rect, line, poly, eyesX, disc } from '../../pixel';
import { registerBoss } from '../registry';

// Fort 1 of the Forest of Clauses: a mossy golem with a glowing rune. It
// raises its arms and stomps rock waves along the floor; phase 2 shakes
// pebbles down from the ceiling too.

function golem(arms: 'up' | 'down', eyes: 'open' | 'x' | 'glow') {
  return makeSprite(46, 50, (put) => {
    const S = '#9a9488';
    const D = '#6b665d';
    const L = '#cfc9bb';
    const M = '#6fae4f';
    const ay = arms === 'up' ? 4 : 18;
    rect(put, 12, 38, 9, 12, S);
    rect(put, 26, 38, 9, 12, S);
    rect(put, 18, 38, 3, 12, D);
    rect(put, 32, 38, 3, 12, D);
    rect(put, 9, 17, 28, 22, S);
    rect(put, 31, 17, 6, 22, D);
    rect(put, 9, 17, 28, 2, L);
    rect(put, 14, 4, 18, 13, S);
    rect(put, 28, 4, 4, 13, D);
    rect(put, 14, 4, 18, 2, L);
    rect(put, 1, ay, 8, 22, S);
    rect(put, 6, ay, 3, 22, D);
    rect(put, 0, ay + 21, 10, 7, D);
    rect(put, 37, ay, 8, 22, S);
    rect(put, 42, ay, 3, 22, D);
    rect(put, 36, ay + 21, 10, 7, D);
    rect(put, 14, 3, 6, 2, M);
    rect(put, 25, 3, 4, 1, M);
    rect(put, 9, 16, 5, 2, M);
    rect(put, 1, ay - 1, 5, 2, M);
    line(put, 12, 22, 15, 27, D);
    line(put, 27, 30, 30, 34, D);
    line(put, 20, 6, 22, 9, D);
    const rune = eyes === 'glow' ? '#ff6a6a' : '#6ff0ff';
    rect(put, 20, 24, 6, 6, '#3b8f9c');
    rect(put, 21, 25, 4, 4, rune);
    if (eyes === 'x') {
      eyesX(put, 16, 8);
      eyesX(put, 25, 8);
    } else {
      rect(put, 17, 9, 4, 3, rune);
      rect(put, 25, 9, 4, 3, rune);
      rect(put, 15, 7, 6, 1, D);
      rect(put, 25, 7, 6, 1, D);
    }
    rect(put, 19, 14, 8, 1, D);
  });
}
const rockWave = makeSprite(18, 13, (put) => {
  poly(put, [[0, 13], [3, 4], [6, 8], [9, 0], [13, 6], [15, 3], [18, 13]], '#9a9488');
  line(put, 9, 1, 9, 12, '#6b665d');
  rect(put, 13, 7, 4, 6, '#6b665d');
  put(8, 2, '#cfc9bb');
  put(3, 6, '#cfc9bb');
});
const pebble = makeSprite(7, 6, (put) => disc(put, 3.5, 3, 3.5, 3, '#9a9488', '#6b665d', '#cfc9bb'));

registerBoss({
  id: 'stone-golem',
  scale: 4,
  intro: 'drop',
  frames: () => ({
    idle: [golem('down', 'open')],
    wind: [golem('up', 'open')],
    hurt: [golem('down', 'x')],
    angry: [golem('down', 'glow')],
    angryWind: [golem('up', 'glow')]
  }),
  pose(t, state, f) {
    if (state === 'hurt' || state === 'dazed' || state === 'dying') return { frame: f.hurt[0] };
    const breathe = Math.floor(t / 600) % 2 ? 3 : 0;
    if (state === 'wind') return { frame: f.wind[0], dy: -6 };
    return { frame: f.idle[0], dy: breathe };
  },
  moves: [
    {
      id: 'stomp',
      windup: 520,
      run(api) {
        api.shake(6, 220);
        api.sound.thump(0.8);
        api.spawn({ frames: [rockWave], x: api.bossX - api.bossW * 0.5, y: 0, vx: -6, onFloor: true });
      }
    },
    {
      id: 'double-stomp',
      windup: 560,
      weight: 0.6,
      run(api) {
        for (let i = 0; i < 2; i++) {
          api.after(i * 520, () => {
            api.shake(7, 220);
            api.sound.thump(0.8);
            api.spawn({ frames: [rockWave], x: api.bossX - api.bossW * 0.5, y: 0, vx: -6.5, onFloor: true });
          });
        }
      }
    },
    {
      id: 'pebble-rain',
      windup: 600,
      phase: 2,
      run(api) {
        // the ceiling sheds pebbles over the marble (shadows warn first)
        api.shake(10, 500);
        api.sound.thump(1);
        const xs = [0, 1, 2, 3].map((i) => 120 + i * 130 + Math.random() * 60).filter((x) => Math.abs(x - api.marbleX) > 70);
        if (api.aim) xs.unshift(api.marbleX);
        for (let i = 0; i < xs.length; i++) {
          const x = xs[i];
          api.warn(x, 600 + i * 120, () => {
            api.spawn({ frames: [pebble], x: x - 10, y: -30, vy: 6, g: 0.4, dodge: 'none', life: 1500 });
            if (Math.abs(x - api.marbleX) < 50) api.strikeMarble();
          }, { kind: 'shadow', width: 60 });
        }
      }
    }
  ]
});
