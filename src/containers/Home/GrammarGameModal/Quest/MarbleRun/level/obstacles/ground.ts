import { makeSprite, rect, disc, drawSprite, U, INK } from '../../pixel';
import { MR } from '../../marble';
import { Enemy, enemyDef } from '../enemies/registry';
import { thump, note, whoosh } from '../../audio';
import type { Entity, MarbleCtl, Builder } from '../types';
import { registerObstacle, ease, easeIn, span } from './registry';

// Ground obstacles for rolling levels: the reference set every other obstacle
// module copies. Each one reads the builder's cursor (b.x, b.y), adds its
// ground and entities, and scripts a pass move and a fail move.

// ---- enemy: stomp it (spiky ones are jumped clean over) ------------------
registerObstacle('enemy', (b) => {
  const waitX = b.x - 80;
  const ex = b.x + 110;
  b.add(300, 'flat');
  const enemy = b.entity(new Enemy(b.enemyKind(), ex));
  const landX = ex + 150;
  const spiky = !!enemyDef(enemy.kind).spiky;
  let stomped = false;
  let bumped = false;
  return {
    kind: 'enemy',
    label: spiky ? 'the spiky enemy' : 'the enemy',
    waitX,
    pass: {
      dur: 950,
      step(k, m, t) {
        stomped = stomped && k > 0;
        if (spiky) {
          const p = m.arc(waitX, landX, 170, ease(k));
          m.place(p.x, p.y);
          m.spin(0.2);
          return;
        }
        if (k < 0.55) {
          const p = m.arc(waitX, enemy.x, 120, k / 0.55);
          const top = enemy.topAt(m) - MR;
          m.place(p.x, Math.min(p.y, k > 0.4 ? top : p.y));
        } else {
          if (!stomped) {
            stomped = true;
            enemy.stomp(t);
            thump(0.5);
            m.fx.burst('puff', 10, enemy.x, enemy.topAt(m) + 10);
            m.fx.text('STOMP!', enemy.x, enemy.topAt(m) - 50, '#fff', 12);
          }
          const p = m.arc(enemy.x, landX, 70, span(k, 0.55, 1));
          m.place(p.x, p.y);
        }
      }
    },
    fail: {
      dur: 950,
      step(k, m) {
        if (k === 0) bumped = false;
        if (k < 0.35) m.roll(waitX + (enemy.x - 40 - waitX) * easeIn(k / 0.35));
        else {
          if (!bumped) {
            bumped = true;
            m.bump();
          }
          const p = m.arc(enemy.x - 40, waitX - 20, 46, span(k, 0.35, 1));
          m.place(p.x, p.y);
        }
      }
    }
  };
});

// ---- slope: rush up and over; a miss rolls back down ---------------------
registerObstacle('slope', (b) => {
  const waitX = b.x - 80;
  const sx = b.x;
  const rise = Math.min(96, b.y - 200);
  b.add(252, 'slope', -rise);
  const landX = b.x + 70;
  b.add(150, 'flat');
  return {
    kind: 'slope',
    label: 'the hill',
    waitX,
    pass: {
      dur: 1100,
      step(k, m) {
        m.roll(waitX + (landX - waitX) * ease(k));
        if (Math.random() < 0.5) m.fx.add({ kind: 'dust', x: m.x - 30, y: m.y + 20, vx: -2, vy: -0.5, life: 0.7 });
      }
    },
    fail: {
      dur: 1500,
      step(k, m) {
        const mid = sx + 130;
        if (k < 0.45) m.roll(waitX + (mid - waitX) * ease(k / 0.45));
        else m.roll(mid + (waitX - mid) * easeIn(span(k, 0.45, 1)));
      }
    }
  };
});

// ---- pit: leap across; a miss tips in and pops back at the edge ----------
registerObstacle('pit', (b) => {
  const waitX = b.x - 60;
  const px = b.x;
  b.add(144, 'gap');
  const landX = b.x + 80;
  b.add(170, 'flat');
  let fell = false;
  let back = false;
  return {
    kind: 'pit',
    label: 'the pit',
    waitX,
    pass: {
      dur: 820,
      step(k, m) {
        const p = m.arc(waitX, landX, 130, k);
        m.place(p.x, p.y);
        m.spin(0.18);
      }
    },
    fail: {
      dur: 2200,
      step(k, m) {
        if (k === 0) fell = back = false;
        const mid = px + 40;
        if (k < 0.3) m.roll(waitX + (mid - waitX) * ease(k / 0.3));
        else if (!fell) {
          fell = true;
          m.fall();
          m.fx.burst('dust', 8, px + 20, b.BASE_Y);
          whoosh(0.08, 0.5, 0, 900, 200);
        } else if (k > 0.82 && !back) {
          back = true;
          m.respawn(waitX);
        }
      }
    }
  };
});

// ---- step: a stone block to hop up onto ----------------------------------
registerObstacle('step', (b) => {
  const waitX = b.x - 80;
  const wallX = b.x;
  b.y -= 72;
  b.add(240, 'raised', 0, 'block');
  b.y += 72;
  b.add(90, 'flat');
  const landX = wallX + 90;
  let bumped = false;
  return {
    kind: 'step',
    label: 'the stone step',
    waitX,
    pass: {
      dur: 850,
      step(k, m) {
        const p = m.arc(waitX, landX, 160, k);
        m.place(p.x, p.y);
      }
    },
    fail: {
      dur: 900,
      step(k, m) {
        if (k === 0) bumped = false;
        if (k < 0.5) {
          const p = m.arc(waitX, wallX - MR, 60, k / 0.5);
          m.place(p.x, p.y);
        } else {
          if (!bumped) {
            bumped = true;
            m.bump();
          }
          const p = m.arc(wallX - MR, waitX, 24, span(k, 0.5, 1));
          m.place(p.x, p.y);
        }
      }
    }
  };
});

// ---- spring: a springboard launches the marble onto a high ledge ---------
const SPRING = [0, 1].map((squashed) =>
  makeSprite(18, 14, (put) => {
    const top = squashed ? 7 : 1;
    rect(put, 0, top, 18, 3, '#ff4d6d');
    rect(put, 0, top, 18, 1, '#ff9db0');
    for (let y = top + 3; y < 12; y += 2) rect(put, 3 + ((y / 2) % 2), y, 12, 1, '#c9ced8');
    rect(put, 1, 12, 16, 2, '#5a5f69');
  })
);
class Spring implements Entity {
  x: number;
  y = 0;
  pressedAt = -1e9;
  constructor(x: number) {
    this.x = x;
  }
  draw(g: CanvasRenderingContext2D, cam: number, t: number, run: any) {
    const s = SPRING[t - this.pressedAt < 160 ? 1 : 0];
    drawSprite(g, s, this.x - cam - (s.width * U) / 2, (run.groundAt(this.x) ?? 309) - s.height * U + U);
  }
}
registerObstacle('spring', (b) => {
  const sx = b.x + 40;
  const waitX = b.x - 70;
  b.add(110, 'flat');
  const spring = b.entity(new Spring(sx));
  const ledgeX = b.x + 60;
  b.add(60, 'flat');
  b.y -= 126;
  b.add(220, 'raised', 0, 'block');
  b.y += 126;
  b.add(80, 'flat');
  const landX = ledgeX + 70;
  let boinged = false;
  let bonked = false;
  return {
    kind: 'spring',
    label: 'the springboard',
    waitX,
    pass: {
      dur: 1250,
      step(k, m, t) {
        if (k === 0) boinged = false;
        if (k < 0.3) m.roll(waitX + (sx - waitX) * ease(k / 0.3));
        else {
          if (!boinged) {
            boinged = true;
            spring.pressedAt = t;
            note(79, { instrument: 'glock', level: 0.1 });
            note(86, { at: 0.06, instrument: 'glock', level: 0.08 });
            m.squash(0.6);
          }
          const p = m.arc(sx, landX, 210, span(k, 0.3, 1));
          m.place(p.x, p.y);
          m.spin(0.15);
        }
      }
    },
    fail: {
      dur: 1300,
      step(k, m, t) {
        if (k === 0) boinged = bonked = false;
        if (k < 0.3) m.roll(waitX + (sx - waitX) * ease(k / 0.3));
        else {
          if (!boinged) {
            boinged = true;
            spring.pressedAt = t;
            note(67, { instrument: 'marimba', level: 0.1 });
          }
          // a weak boing: up, bonks the ledge wall, back down
          const p = m.arc(sx, ledgeX - MR - 10, 90, span(k, 0.3, 0.65));
          if (k < 0.65) m.place(p.x, p.y);
          else {
            if (!bonked) {
              bonked = true;
              m.bump();
            }
            const q = m.arc(ledgeX - MR - 10, waitX, 30, span(k, 0.65, 1));
            m.place(q.x, q.y);
          }
        }
      }
    }
  };
});

// ---- platform: a moving platform carries the marble across a wide gap ----
const PLATFORM = makeSprite(30, 7, (put) => {
  rect(put, 0, 0, 30, 5, '#d9a441');
  rect(put, 0, 0, 30, 1, '#ffe08a');
  for (const x of [4, 14, 24]) rect(put, x, 1, 2, 3, '#a87a24');
  rect(put, 2, 5, 26, 2, '#8a5f1a');
  disc(put, 15, 3, 1.4, 1.4, INK);
});
class MovingPlatform implements Entity {
  x: number;
  y: number;
  from: number;
  to: number;
  ride: number | null = null; // when set, the platform sits at this x
  constructor(from: number, to: number, y: number) {
    this.from = from;
    this.to = to;
    this.x = from;
    this.y = y;
  }
  update(t: number) {
    if (this.ride !== null) this.x = this.ride;
    else this.x = this.from + ((Math.sin(t / 900) + 1) / 2) * (this.to - this.from);
  }
  draw(g: CanvasRenderingContext2D, cam: number) {
    drawSprite(g, PLATFORM, this.x - cam - (PLATFORM.width * U) / 2, this.y);
  }
}
registerObstacle('platform', (b: Builder) => {
  const waitX = b.x - 60;
  const gx = b.x;
  b.add(260, 'gap');
  const landX = b.x + 70;
  b.add(150, 'flat');
  const y = b.BASE_Y - 6;
  const plat = b.entity(new MovingPlatform(gx + 55, gx + 205, y));
  const top = y - MR + U;
  let fell = false;
  let back = false;
  return {
    kind: 'platform',
    label: 'the moving platform',
    waitX,
    pass: {
      dur: 1700,
      step(k, m) {
        // hop on, ride it across, hop off
        if (k < 0.25) {
          plat.ride = gx + 55;
          const p = m.arc(waitX, gx + 55, 70, k / 0.25);
          m.place(p.x, k > 0.9 * 0.25 ? Math.min(p.y, top) : p.y);
        } else if (k < 0.7) {
          plat.ride = gx + 55 + 150 * ease(span(k, 0.25, 0.7));
          m.place(plat.ride, top);
        } else {
          plat.ride = gx + 205;
          const p = m.arc(gx + 205, landX, 70, span(k, 0.7, 1));
          m.place(p.x, Math.min(p.y, k < 0.75 ? top : p.y));
          if (k >= 1) plat.ride = null;
        }
      }
    },
    fail: {
      dur: 2100,
      step(k, m) {
        if (k === 0) fell = back = false;
        // jumps just as the platform drifts away, and drops into the gap
        plat.ride = null;
        if (k < 0.3) {
          const p = m.arc(waitX, gx + 60, 50, k / 0.3);
          m.place(p.x, p.y);
        } else if (!fell) {
          fell = true;
          m.fall();
        } else if (k > 0.82 && !back) {
          back = true;
          m.respawn(waitX);
        }
      }
    }
  };
});
