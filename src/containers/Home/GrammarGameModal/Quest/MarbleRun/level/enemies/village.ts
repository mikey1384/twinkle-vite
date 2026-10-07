import { makeSprite, disc, line, rect, INK } from '../../pixel';
import { registerEnemy } from './registry';

// World 1 critters. Reference implementations for the enemy kit: frames face
// left, 2 frames, outline added by makeSprite.

registerEnemy('beetle', {
  motion: 'walk',
  frames: [0, 1].map((f) =>
    makeSprite(20, 14, (put) => {
      disc(put, 11, 7, 8, 6, '#e0403a', '#a02828', '#ff8a7a');
      line(put, 11, 2, 11, 12, '#a02828');
      put(8, 4, '#a02828');
      put(14, 5, '#a02828');
      put(13, 9, '#a02828');
      put(8, 9, '#a02828');
      disc(put, 3.5, 9, 3.5, 3, '#2a2236');
      put(2, 8, '#fff');
      put(1, 6, INK);
      put(0, 5, INK);
      for (const lx of [6, 11, 16]) {
        put(lx + (f ? 1 : 0), 13, INK);
        put(lx, 12, INK);
      }
    })
  )
});

registerEnemy('snail', {
  motion: 'walk',
  patrol: 14,
  frameMs: 320,
  frames: [0, 1].map((f) =>
    makeSprite(24, 18, (put) => {
      rect(put, 1 + f, 13, 21, 4, '#ffd27a');
      rect(put, 1 + f, 16, 21, 1, '#e0a850');
      disc(put, 4 + f, 12, 3.5, 3.5, '#ffd27a', '#e0a850');
      line(put, 3 + f, 9, 2 + f, 3, '#e0a850');
      line(put, 6 + f, 9, 6 + f, 3, '#e0a850');
      put(2 + f, 2, INK);
      put(6 + f, 2, INK);
      disc(put, 14, 8, 8, 8, '#ff8fc0', '#d0507f', '#ffd0e6');
      for (let a = 0; a < 28; a++) {
        const rr = 1 + a * 0.2;
        put(14 + Math.round(Math.cos(a * 0.55) * rr), 8 + Math.round(Math.sin(a * 0.55) * rr), '#b03a6a');
      }
    })
  )
});
