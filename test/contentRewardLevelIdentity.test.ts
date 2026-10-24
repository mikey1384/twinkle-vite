import assert from 'node:assert/strict';
import { buildSync } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import test from 'node:test';

// SET_REWARD_LEVEL runs once per visible subject on every tab resume
// (useNotiSocket). Entries that don't hold the subject, or already hold its
// values, must keep their identity so their cards don't re-render.
const reducerPath = fileURLToPath(
  new URL('../src/contexts/Content/reducer.ts', import.meta.url)
);
const { default: ContentReducer } = loadTypeScriptModule(reducerPath);
const action = (
  contentId: number,
  rewardLevel: number,
  rewardLevelRevision = 2
) => ({
  type: 'SET_REWARD_LEVEL',
  contentType: 'subject',
  contentId,
  rewardLevel,
  rewardLevelRevision
});
const base = () => ({
  subject7: {
    contentId: 7,
    contentType: 'subject',
    rewardLevel: 1,
    rewardLevelRevision: 1
  },
  comment9: {
    contentId: 9,
    contentType: 'comment',
    rootId: 7,
    rootType: 'subject',
    rootObj: { id: 7, rewardLevel: 1, rewardLevelRevision: 1 }
  },
  video3: {
    contentId: 3,
    contentType: 'video',
    subjects: [
      { id: 7, rewardLevel: 1, rewardLevelRevision: 1 },
      { id: 8, rewardLevel: 0 }
    ]
  },
  comment5: {
    contentId: 5,
    contentType: 'comment',
    targetObj: { subject: { id: 7, rewardLevel: 1, rewardLevelRevision: 1 } }
  },
  comment77: {
    contentId: 77,
    contentType: 'comment',
    rootId: 4,
    rootType: 'subject',
    rootObj: { id: 4, rewardLevel: 3 }
  }
});

test('a changed level updates every holder and leaves unrelated entries untouched', () => {
  const state = base();
  const next = ContentReducer(state, action(7, 4));
  assert.notEqual(next, state);
  assert.equal(next['subject7'].rewardLevel, 4);
  assert.equal(next['subject7'].rewardLevelRevision, 2);
  assert.equal(next['comment9'].rootObj.rewardLevel, 4);
  assert.equal(next['video3'].subjects[0].rewardLevel, 4);
  assert.equal(next['video3'].subjects[1], state['video3'].subjects[1]);
  assert.equal(next['comment5'].targetObj.subject.rewardLevel, 4);
  assert.equal(
    next['comment77'],
    state['comment77'],
    'unrelated entry keeps its identity'
  );
});

test('an unchanged level returns the same state object (no re-render)', () => {
  const state = ContentReducer(base(), action(7, 4));
  assert.equal(ContentReducer(state, action(7, 4)), state);
  assert.equal(
    ContentReducer(state, action(12345, 2)) === state,
    false,
    'a new subject still gets its entry'
  );
});

test('an unknown subject gets its own entry without touching others', () => {
  const state = base();
  const next = ContentReducer(state, action(42, 3));
  assert.deepEqual(
    [next['subject42'].rewardLevel, next['subject42'].contentId],
    [3, 42]
  );
  for (const key of Object.keys(state))
    assert.equal(next[key], (state as any)[key]);
});

function loadTypeScriptModule(entryPoint: string) {
  const output = buildSync({
    bundle: true,
    define: { 'import.meta.env': JSON.stringify({}) },
    entryPoints: [entryPoint],
    format: 'cjs',
    platform: 'node',
    write: false
  }).outputFiles[0].text;
  const mod: { exports: any } = { exports: {} };
  new Function('require', 'module', 'exports', output)(
    createRequire(entryPoint),
    mod,
    mod.exports
  );
  return mod.exports;
}
