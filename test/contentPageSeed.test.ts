import assert from 'node:assert/strict';
import { buildSync } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const reducerPath = fileURLToPath(
  new URL('../src/contexts/Content/reducer.ts', import.meta.url)
);
const seedPath = fileURLToPath(
  new URL('../src/helpers/contentPageSeed.ts', import.meta.url)
);
const { default: ContentReducer } = loadTypeScriptModule(reducerPath);
const {
  CONTENT_PAGE_SEED_MAX_AGE_MS,
  buildCommentContentPageSeed,
  contentPageSeedCanRender
} = loadTypeScriptModule(seedPath);
const contentPanelSource = readFileSync(
  new URL('../src/components/ContentPanel/index.tsx', import.meta.url),
  'utf8'
);

const threadComment = {
  id: 335037,
  userId: 7,
  content: 'Pinned answer',
  timeStamp: 1_790_000_000,
  rootType: 'subject',
  rootId: 900,
  subjectId: null,
  commentId: 0,
  replyId: 0,
  uploader: { id: 7, username: 'kiwi' },
  likes: [{ id: 3, username: 'mango' }],
  rewards: [],
  recommendations: [],
  replies: [{ id: 335040, content: 'reply' }],
  loadMoreButton: true,
  numReplies: 4,
  targetObj: { subject: { id: 900 } },
  isExpanded: true
};

function seedState(state: any, comment: any, seededAt = 1_000) {
  return ContentReducer(state, {
    type: 'SEED_CONTENT_PAGE',
    contentId: comment.id,
    contentType: 'comment',
    seed: buildCommentContentPageSeed(comment),
    seededAt
  });
}

test('a thread copy seeds only fields the full comment load replaces', () => {
  const seed = buildCommentContentPageSeed(threadComment);

  assert.equal(seed.content, 'Pinned answer');
  assert.deepEqual(seed.uploader, threadComment.uploader);
  assert.deepEqual(seed.likes, threadComment.likes);
  for (const threadOnlyField of [
    'replies',
    'loadMoreButton',
    'numReplies',
    'targetObj',
    'isExpanded',
    'loaded'
  ]) {
    assert.equal(threadOnlyField in seed, false, threadOnlyField);
  }
});

test('copies that cannot paint the page faithfully are not seeded', () => {
  for (const comment of [
    { ...threadComment, isDeleted: true },
    { ...threadComment, isDeleteNotification: true },
    { ...threadComment, isNotification: true },
    { ...threadComment, notFound: true },
    { ...threadComment, uploader: undefined },
    { ...threadComment, likes: undefined },
    { ...threadComment, rootId: 0 },
    // replies: their page heading and target panel need the parent comment
    { ...threadComment, commentId: 335000 },
    { ...threadComment, commentId: 335000, replyId: 335010 },
    // a non-subject root without an explicit subjectId: the secret gate
    // cannot be checked, so a missing field must not open the comment
    (({ subjectId: _omit, ...rest }) => ({
      ...rest,
      rootType: 'video',
      rootId: 12
    }))(threadComment),
    // a video-subject comment: its secret gate reads a subject the seeded
    // paint does not have
    { ...threadComment, rootType: 'video', rootId: 12, subjectId: 900 }
  ]) {
    assert.equal(buildCommentContentPageSeed(comment), null);
  }
  assert.ok(
    buildCommentContentPageSeed({ ...threadComment, subjectId: 900 }),
    'a subject comment whose subjectId is its root still seeds'
  );
  assert.ok(
    buildCommentContentPageSeed({
      ...threadComment,
      rootType: 'video',
      rootId: 12,
      subjectId: null
    }),
    'a non-subject root whose copy states it has no subject still seeds'
  );
  const { subjectId: _omit, ...withoutSubjectField } = threadComment;
  assert.ok(
    buildCommentContentPageSeed(withoutSubjectField),
    'a subject root needs no subjectId field'
  );
});

test('the seed never marks the entry loaded and never replaces a loaded entry', () => {
  const seeded = seedState({}, threadComment);
  const entry = seeded.comment335037;

  assert.equal(entry.loaded, false);
  assert.equal(entry.content, 'Pinned answer');
  assert.equal(entry.contentPageSeededAt, 1_000);
  assert.deepEqual(entry.comments, []);

  const loadedState = {
    comment335037: { ...entry, loaded: true, content: 'Full copy' }
  };
  assert.equal(seedState(loadedState, threadComment), loadedState);
});

test('newer live fields already on the entry win over the thread copy', () => {
  const state = {
    comment335037: {
      contentId: 335037,
      contentType: 'comment',
      content: 'Edited after the thread loaded',
      liveObservedAt: 5
    }
  };

  const entry = seedState(state, threadComment).comment335037;

  assert.equal(entry.content, 'Edited after the thread loaded');
  assert.deepEqual(entry.uploader, threadComment.uploader);
});

test('the full load then replaces every seeded field', () => {
  const seeded = seedState({}, threadComment);
  const loaded = ContentReducer(seeded, {
    type: 'INIT_CONTENT',
    contentId: 335037,
    contentType: 'comment',
    data: {
      ...threadComment,
      content: 'Server copy',
      likes: [],
      replies: undefined,
      viewCount: 12
    }
  }).comment335037;

  assert.equal(loaded.loaded, true);
  assert.equal(loaded.content, 'Server copy');
  assert.deepEqual(loaded.likes, []);
  assert.equal(loaded.viewCount, 12);
});

test('only a fresh seed with its root in memory paints before the full load', () => {
  const mountedAt = 10_000;
  const contentState = {
    ...seedState({}, threadComment, mountedAt - 20).comment335037
  };
  const rootObj = { id: 900, loaded: true };
  const base = {
    contentState,
    contentType: 'comment',
    isContentPage: true,
    mountedAt,
    rootObj
  };

  assert.equal(contentPageSeedCanRender(base), true);
  assert.equal(
    contentPageSeedCanRender({ ...base, rootObj: { id: 900, loaded: false } }),
    false,
    'secret-message gating needs the root'
  );
  assert.equal(
    contentPageSeedCanRender({ ...base, isContentPage: false }),
    false
  );
  assert.equal(
    contentPageSeedCanRender({
      ...base,
      contentState: {
        ...contentState,
        contentPageSeededAt: mountedAt - CONTENT_PAGE_SEED_MAX_AGE_MS - 1
      }
    }),
    false,
    'a seed left behind by an earlier visit is ignored'
  );
  assert.equal(
    contentPageSeedCanRender({
      ...base,
      contentState: { ...contentState, loaded: true }
    }),
    false,
    'a loaded entry renders through the normal path'
  );
  assert.equal(
    contentPageSeedCanRender({
      ...base,
      contentState: { ...contentState, isDeleted: true }
    }),
    false
  );
});

test('the content page panel paints on mount instead of waiting for the observer', () => {
  assert.match(
    contentPanelSource,
    /const contentShown = useMemo\(\s*\(\) =>\s*alwaysShow \|\|\s*isContentPage \|\|/
  );
  assert.match(
    contentPanelSource,
    /const bodyShown = loaded \|\| seededPreviewShown;/
  );
  assert.match(
    contentPanelSource,
    /\{!bodyShown && <Loading theme=\{theme \|\| profileTheme\} \/>\}/
  );
  // Pieces that need the full copy still wait for it.
  assert.match(contentPanelSource, /\{loaded && targetObj\?\.comment && \(/);
});

function loadTypeScriptModule(entryPoint: string) {
  const output = buildSync({
    bundle: true,
    define: {
      'import.meta.env': JSON.stringify({})
    },
    entryPoints: [entryPoint],
    format: 'cjs',
    platform: 'node',
    write: false
  }).outputFiles[0].text;
  const mod: { exports: any } = { exports: {} };
  const localRequire = createRequire(entryPoint);
  const compiled = new Function('require', 'module', 'exports', output);

  compiled(localRequire, mod, mod.exports);

  return mod.exports;
}
