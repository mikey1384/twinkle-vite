import assert from 'node:assert/strict';
import test from 'node:test';
import { createWordBattleHostStore } from '../src/containers/Chat/Body/Collect/Vocabulary/WordBattle/battleHost';

// 11-24: a word battle opened from a Word Master card closed by itself when
// another member's card arrived and the opener unmounted. The battle now
// lives in an app-level store; its opener coming and going never closes it.

const state = (wordId: number) => ({
  status: 'ready' as const,
  wordId,
  word: 'cytome',
  wordLevel: 3
});

test('a battle stays open after the gate that opened it unmounts', () => {
  const host = createWordBattleHostStore();
  let renders = 0;
  host.subscribe(() => renders++);
  const unregister = host.registerGate(7, { onFinished: () => {} });
  const id = host.open({ wordId: 7, word: 'cytome', state: state(7) });
  assert.equal(renders, 1);
  unregister();
  assert.equal(host.getSnapshot()?.id, id);
  assert.equal(host.getSnapshot()?.wordId, 7);
});

test('the end of a battle reaches the gates mounted then, and only its own kind', () => {
  const host = createWordBattleHostStore();
  const heard: string[] = [];
  host.registerGate(7, { onFinished: (f) => heard.push(`gate:${f.status}`) });
  host.registerGate(7, {
    rehunt: true,
    onFinished: (f) => heard.push(`rehunt:${f.status}`)
  });
  host.registerGate(8, { onFinished: (f) => heard.push(`other:${f.status}`) });
  const id = host.open({ wordId: 7, word: 'cytome', state: state(7) });
  host.finish(id, { ...state(7), status: 'won', unlocked: { id: 7 } });
  assert.deepEqual(heard, ['gate:won']);
  assert.equal(host.getSnapshot(), null);

  const rehuntId = host.open({
    wordId: 7,
    word: 'cytome',
    rehunt: true,
    state: state(7)
  });
  host.finish(rehuntId, { ...state(7), status: 'lost' });
  assert.deepEqual(heard, ['gate:won', 'rehunt:lost']);
});

test('a gate remounted mid-battle hears its end', () => {
  const host = createWordBattleHostStore();
  const heard: string[] = [];
  const unregister = host.registerGate(7, { onFinished: () => heard.push('first') });
  const id = host.open({ wordId: 7, word: 'cytome', state: state(7) });
  unregister();
  host.registerGate(7, { onFinished: () => heard.push('remounted') });
  host.finish(id, { ...state(7), status: 'won' });
  assert.deepEqual(heard, ['remounted']);
});

test('closing mid-battle tells no gate it ended; stale ids change nothing', () => {
  const host = createWordBattleHostStore();
  const heard: string[] = [];
  host.registerGate(7, {
    onFinished: () => heard.push('finished'),
    onDailyLimit: () => heard.push('limit')
  });
  const first = host.open({ wordId: 7, word: 'cytome', state: state(7) });
  host.close(first);
  assert.equal(host.getSnapshot(), null);
  const second = host.open({ wordId: 7, word: 'cytome', state: state(7) });
  assert.notEqual(second, first);
  host.close(first);
  host.finish(first, { ...state(7), status: 'won' });
  assert.equal(host.getSnapshot()?.id, second, 'an old battle screen cannot close the new one');
  host.dailyLimit(second);
  assert.equal(host.getSnapshot(), null);
  assert.deepEqual(heard, ['limit']);
});

test('reset clears the last account\'s battle', () => {
  const host = createWordBattleHostStore();
  host.open({ wordId: 7, word: 'cytome', state: state(7) });
  host.reset();
  assert.equal(host.getSnapshot(), null);
});
