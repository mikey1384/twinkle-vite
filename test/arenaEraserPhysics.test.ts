import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ERASER_H,
  aimNoise,
  chooseRivalShot,
  createWorld,
  flick,
  mulberry32,
  outcome,
  overlapFraction,
  rivalSkill,
  settle,
  type World
} from '../src/containers/Arena/Eraser/physics';

const desk = { w: 100, h: 150 };

// two square-on erasers, the shooter 40 units below the target
function lineUp(gap = 40, targetY = 70): World {
  const world = createWorld(desk);
  world.erasers[0] = { ...world.erasers[0], x: 50, y: targetY + gap, a: 0 };
  world.erasers[1] = { ...world.erasers[1], x: 50, y: targetY, a: 0 };
  return world;
}

function shoot(world: World, angle: number, power: number) {
  flick(world, 0, angle, power);
  settle(world);
  return outcome(world, 0);
}

const UP = -Math.PI / 2;

test('a straight, medium flick climbs on top and wins the round', () => {
  const world = lineUp();
  const result = shoot(world, UP, 0.7);
  assert.deepEqual(result, { winner: 0, reason: 'climb' });
  assert.equal(world.erasers[0].on, 1);
  assert.ok(overlapFraction(world.erasers[0], world.erasers[1]) >= 0.5);
});

test('a tap only bumps and a slam bounces the other eraser away', () => {
  const soft = lineUp();
  assert.equal(shoot(soft, UP, 0.5).winner, null);
  assert.equal(soft.erasers[0].on, null);

  const hard = lineUp();
  assert.equal(shoot(hard, UP, 0.95).winner, null);
  assert.equal(hard.erasers[0].on, null);
  // the struck eraser was sent well up the desk
  assert.ok(hard.erasers[1].y < 40);
});

test('a glancing hit does not climb', () => {
  const world = lineUp();
  // aimed so it clips the target's side
  const angle = Math.atan2(-40, 11);
  const result = shoot(world, angle, 0.7);
  assert.equal(world.erasers[0].on, null);
  assert.notEqual(result.reason, 'climb');
});

test('sliding off the desk loses; knocking the other off wins', () => {
  const off = lineUp();
  // full power straight down the desk into the near edge
  assert.deepEqual(shoot(off, Math.PI / 2, 1), { winner: 1, reason: 'fall' });

  // target close to the far edge, hit hard
  const knock = lineUp(40, 14);
  assert.deepEqual(shoot(knock, UP, 1), { winner: 0, reason: 'knock' });
});

test('an eraser left hanging over the edge of the other slides off', () => {
  const world = lineUp();
  const top = world.erasers[0];
  // turned crosswise, centre just inside the edge: it covers under half
  Object.assign(top, { x: 50, y: 63, a: Math.PI / 2, on: 1, mounted: true });
  assert.ok(overlapFraction(top, world.erasers[1]) < 0.5);
  settle(world);
  assert.equal(top.on, null);
  assert.equal(outcome(world, 0).winner, null);
});

test('overlap is measured on the rotated blocks', () => {
  const world = lineUp();
  const [a, b] = world.erasers;
  Object.assign(a, { x: 50, y: 70, a: 0 });
  assert.ok(Math.abs(overlapFraction(a, b) - 1) < 1e-9);
  Object.assign(a, { y: 70 - ERASER_H / 2 });
  assert.ok(Math.abs(overlapFraction(a, b) - 0.5) < 1e-9);
  Object.assign(a, { y: 20 });
  assert.equal(overlapFraction(a, b), 0);
  Object.assign(a, { y: 70, a: Math.PI / 2 });
  assert.ok(overlapFraction(a, b) > 0.7 && overlapFraction(a, b) < 0.8);
});

test('the same shot always plays out the same way', () => {
  const run = () => {
    const world = createWorld({ w: 150, h: 100 }, mulberry32(42));
    flick(world, 0, -0.4, 0.66);
    settle(world);
    return JSON.stringify(world.erasers);
  };
  assert.equal(run(), run());
});

test('the computer is reproducible from its seed and aims better with more bosses beaten', () => {
  const world = createWorld(desk, mulberry32(3));
  const a = chooseRivalShot(world, 1, 0.5, mulberry32(9));
  const b = chooseRivalShot(world, 1, 0.5, mulberry32(9));
  assert.deepEqual(a, b);
  // its planned (noise-free) shot wins from the opening position
  const trial = createWorld(desk, mulberry32(3));
  flick(trial, 1, a.planned.angle, a.planned.power);
  settle(trial);
  assert.equal(outcome(trial, 1).winner, 1);

  assert.equal(rivalSkill(0, 6), 0);
  assert.equal(rivalSkill(9, 6), 1);
  assert.ok(aimNoise(1).angle < aimNoise(0).angle);
  assert.ok(aimNoise(1).power < aimNoise(0).power);
});
