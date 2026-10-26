import assert from 'node:assert/strict';
import test from 'node:test';
import { arenaExamPath, getArenaBattleActivity } from '../src/helpers/arenaActivity';
import { createUserActivityRegistry } from '../src/helpers/userActivity';
import type { ArenaBattleSummary } from '../src/containers/Arena/types';

const battle = { id: 42, examKey: 'c1-advanced', mode: 'battle', status: 'open' } as ArenaBattleSummary;

test('only the loaded open timed exam advertises an exam; results, grading and stale loads clear it', () => {
  assert.deepEqual(getArenaBattleActivity(battle, 42), { kind: 'arena', id: 'c1-advanced' });
  for (const status of ['finished', 'grading', 'abandoned'] as const) {
    assert.equal(getArenaBattleActivity({ ...battle, status }, 42), null);
  }
  assert.equal(getArenaBattleActivity({ ...battle, mode: 'untimed' }, 42), null);
  assert.equal(getArenaBattleActivity(battle, 43), null);
  assert.equal(getArenaBattleActivity(null, 42), null);
});

test('Arena yields to foreground activity and clears when the exam view unmounts', () => {
  const registry = createUserActivityRegistry();
  const exam = {}, modal = {};
  const active = getArenaBattleActivity(battle, 42);
  registry.set(exam, 7, active, 10);
  registry.set(modal, 7, { kind: 'game', id: 'wordle' }, 10);
  assert.deepEqual(registry.get(7), { kind: 'game', id: 'wordle' });
  registry.remove(modal);
  assert.deepEqual(registry.get(7), active);
  assert.equal(registry.get(8), null);
  registry.remove(exam);
  assert.equal(registry.get(7), null);
});

test('exam links select only exam setup, never a private attempt or start command', () => {
  for (const key of ['c1-advanced', 'suneung-eng', 'c1-advanced&battle=42']) {
    const url = new URL(arenaExamPath(key), 'https://twin-kle.com');
    assert.equal(url.pathname, '/arena');
    assert.deepEqual([...url.searchParams], [['mode', 'arena'], ['exam', key]]);
  }
});
