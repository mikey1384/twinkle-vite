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
  resolveDirectSubjectRewardLevel,
  resolveSubjectRewardLevel
} = rewardLevelModule.exports;

const twinkleXpValue = 200;

test('direct level-2 subject keeps the old standalone subject cap', () => {
  const rewardLevel = resolveDirectSubjectRewardLevel({
    rootRewardLevel: 0,
    subject: { byUser: false, id: 7, rewardLevel: 2 }
  });
  const cap = rewardLevelToTwinkleCap(rewardLevel);

  assert.equal(rewardLevel, 0);
  assert.equal(cap, 5);
  assert.equal(cap * twinkleXpValue, 1_000);
});

test('direct level-2 subject under a rewarded root keeps the old root fallback cap', () => {
  assert.equal(
    resolveDirectSubjectRewardLevel({
      rootRewardLevel: 5,
      subject: { byUser: false, id: 7, rewardLevel: 2 }
    }),
    1
  );
});

test('subject response reward level still uses the stored subject level', () => {
  assert.equal(
    resolveSubjectRewardLevel({
      rootId: 10,
      rootRewardLevel: 1,
      rootType: 'video',
      subject: { byUser: false, id: 7, rewardLevel: 2 }
    }),
    2
  );
});

test('direct subject content surfaces ignore stored subject level for caps', () => {
  assert.equal(
    resolveContentRewardLevel({
      content: {
        contentType: 'subject',
        id: 7,
        rewardLevel: 2,
        rootId: 10,
        rootType: 'video'
      },
      rootObj: { contentType: 'video', id: 10, rewardLevel: 0 }
    }),
    0
  );
});

test('comments and replies attached to a level-2 subject use level 2', () => {
  const rewardLevel = resolveCommentRewardLevel({
    parent: { contentId: 10, contentType: 'url', rewardLevel: 0 },
    rootContent: { contentType: 'url', id: 10 },
    subject: { id: 7, rewardLevel: 2 }
  });
  const cap = rewardLevelToTwinkleCap(rewardLevel);

  assert.equal(rewardLevel, 2);
  assert.equal(cap, 20);
  assert.equal(cap * twinkleXpValue, 4_000);
});

test('subject reward surfaces are wired to the shared resolver', () => {
  assertSourceIncludes(
    '../src/components/Subjects/SubjectPanel.tsx',
    /resolveDirectSubjectRewardLevel/
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

test('home feed subject effort display still uses stored subject reward level', () => {
  assertSourceIncludes(
    '../src/containers/Home/Stories/FeedCard/Body/index.tsx',
    /<CompactEffortStrip rewardLevel=\{Number\(content\.rewardLevel\)\} \/>/
  );
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
