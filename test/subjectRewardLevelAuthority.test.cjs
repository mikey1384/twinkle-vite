const test = require('node:test');
const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const esbuild = require('esbuild');

const rewardLevelModule = loadTypeScriptModule(
  path.resolve(__dirname, '../src/helpers/rewardLevel.ts')
);
const {
  resolveCommentRewardLevel,
  resolveContentRewardLevel,
  resolveSubjectRewardLevel
} = rewardLevelModule.exports;

const twinkleXpValue = 200;

test('direct level-5 subject resolves to the 50 Twinkle / 10,000 XP cap', () => {
  const rewardLevel = resolveSubjectRewardLevel({
    rootId: 10,
    rootRewardLevel: 1,
    rootType: 'video',
    subject: { id: 7, rewardLevel: 5 }
  });
  const cap = rewardLevelToTwinkleCap(rewardLevel);

  assert.equal(rewardLevel, 5);
  assert.equal(cap, 50);
  assert.equal(cap * twinkleXpValue, 10_000);
});

test('stored subject reward level wins over by-user and root fallbacks', () => {
  assert.equal(
    resolveSubjectRewardLevel({
      rootId: 10,
      rootRewardLevel: 5,
      rootType: 'video',
      subject: { byUser: true, id: 7, rewardLevel: 4 }
    }),
    4
  );
});

test('feed and embedded subject surfaces use the subject level before the root', () => {
  assert.equal(
    resolveContentRewardLevel({
      content: {
        contentType: 'subject',
        id: 7,
        rewardLevel: 5,
        rootId: 10,
        rootType: 'video'
      },
      rootObj: { contentType: 'video', id: 10, rewardLevel: 1 }
    }),
    5
  );
  assert.equal(
    resolveContentRewardLevel({
      content: {
        contentType: 'comment',
        rootId: 10,
        rootType: 'video',
        targetObj: {
          subject: { id: 7, rewardLevel: 5 }
        }
      },
      rootObj: { contentType: 'video', id: 10, rewardLevel: 1 }
    }),
    5
  );
});

test('comments and replies attached to subjects use the subject level', () => {
  const rewardLevel = resolveCommentRewardLevel({
    parent: { contentId: 10, contentType: 'url', rewardLevel: 0 },
    rootContent: { contentType: 'url', id: 10 },
    subject: { id: 7, rewardLevel: 5 }
  });
  const cap = rewardLevelToTwinkleCap(rewardLevel);

  assert.equal(rewardLevel, 5);
  assert.equal(cap, 50);
  assert.equal(cap * twinkleXpValue, 10_000);
});

test('subject reward surfaces are wired to the shared resolver', () => {
  assertSourceIncludes(
    '../src/components/Subjects/SubjectPanel.tsx',
    /resolveSubjectRewardLevel/
  );
  assertSourceIncludes(
    '../src/components/ContentPanel/Body/index.tsx',
    /resolveContentRewardLevel/
  );
  assertSourceIncludes(
    '../src/containers/Home/Stories/FeedCard/helpers/actionState.ts',
    /resolveContentRewardLevel/
  );
  for (const sourcePath of [
    '../src/components/Comments/Container/Comment.tsx',
    '../src/components/Comments/Container/PinnedComment/Comment.tsx',
    '../src/components/Comments/Container/Searched/Comment.tsx',
    '../src/components/Comments/Container/Replies/Reply.tsx',
    '../src/components/ContentPanel/TargetContent/index.tsx'
  ]) {
    assertSourceIncludes(sourcePath, /resolveCommentRewardLevel/);
  }
});

function rewardLevelToTwinkleCap(rewardLevel) {
  return rewardLevel > 0 ? rewardLevel * 10 : 5;
}

function assertSourceIncludes(sourcePath, pattern) {
  const source = readFileSync(path.resolve(__dirname, sourcePath), 'utf8');
  assert.match(source, pattern);
}

function loadTypeScriptModule(entryPoint) {
  const output = esbuild.buildSync({
    bundle: true,
    entryPoints: [entryPoint],
    format: 'cjs',
    platform: 'node',
    write: false
  }).outputFiles[0].text;
  const mod = { exports: {} };
  const localRequire = createRequire(entryPoint);
  const compiled = new Function('require', 'module', 'exports', output);

  compiled(localRequire, mod, mod.exports);

  return mod;
}
