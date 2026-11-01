import assert from 'node:assert/strict';
import { buildSync } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import test from 'node:test';

// 11-01 report: a Book Maker subject showed its "Read book" card only when the
// page was opened by URL. Opened from a profile or a comment, the subject had
// already been stored as `loaded` from a comment's root copy, which carries no
// `bookAvailable`, so the page never fetched the full subject.
const { default: ContentReducer } = loadTypeScriptModule(
  '../src/contexts/Content/reducer.ts'
);
const { getSubjectDisplayDescription, subjectBookAvailabilityUnknown } =
  loadTypeScriptModule('../src/helpers/bookEmbedHelpers.ts');

const BOOK_CARD = '![Read book](https://www.twin-kle.com/app/884/37285)';

// Trimmed from production GET /content?contentId=350748&contentType=comment:
// the root subject row is `content_subjects.*` without the derived flag.
const commentResponse = {
  id: 350748,
  contentId: 350748,
  contentType: 'comment',
  content: 'Day 1',
  rootType: 'subject',
  rootId: 37285,
  rootObj: {
    id: 37285,
    userId: 18643,
    title: 'Daily quotes',
    description: '',
    isDeleted: 0,
    rootType: null,
    rootId: null,
    contentType: 'subject'
  }
};

// Trimmed from production GET /content?contentId=37285&contentType=subject.
const subjectResponse = {
  id: 37285,
  contentId: 37285,
  contentType: 'subject',
  userId: 18643,
  title: 'Daily quotes',
  description: '',
  isDeleted: 0,
  bookAvailable: '1'
};

function initContent(state: any, data: any) {
  return ContentReducer(state, {
    type: 'INIT_CONTENT',
    contentId: Number(data.contentId),
    contentType: data.contentType,
    data
  });
}

// What every loader does with a comment response: store the comment, then
// its root (ContentPanel, MainContentComponent, the Home feed card).
function seedFromComment(state: any) {
  let next = initContent(state, commentResponse);
  next = initContent(next, {
    contentId: commentResponse.rootId,
    contentType: commentResponse.rootType,
    ...commentResponse.rootObj
  });
  return next;
}

test('a subject seeded from a comment root is fetched in full and then shows its book card', () => {
  const seeded = seedFromComment({}).subject37285;
  assert.equal(seeded.loaded, true);
  assert.equal(
    getSubjectDisplayDescription(seeded),
    '',
    'the seeded copy alone cannot show the card (the reported bug)'
  );
  assert.equal(subjectBookAvailabilityUnknown('subject', seeded), true);

  const hydrated = initContent(seedFromComment({}), subjectResponse)
    .subject37285;
  assert.equal(subjectBookAvailabilityUnknown('subject', hydrated), false);
  assert.equal(getSubjectDisplayDescription(hydrated), BOOK_CARD);

  // Re-seeding from another comment afterwards keeps the known flag.
  const reseeded = seedFromComment({ subject37285: hydrated }).subject37285;
  assert.equal(subjectBookAvailabilityUnknown('subject', reseeded), false);
  assert.equal(getSubjectDisplayDescription(reseeded), BOOK_CARD);
});

test('a known flag, missing or deleted subjects and other types never refetch', () => {
  for (const bookAvailable of ['0', 0, '1', 1, true, false])
    assert.equal(
      subjectBookAvailabilityUnknown('subject', { loaded: true, bookAvailable }),
      false,
      String(bookAvailable)
    );
  for (const state of [
    { loaded: false },
    { loaded: true, notFound: true },
    { loaded: true, isDeleted: 1 },
    null
  ])
    assert.equal(
      subjectBookAvailabilityUnknown('subject', state),
      false,
      JSON.stringify(state)
    );
  assert.equal(subjectBookAvailabilityUnknown('comment', { loaded: true }), false);
  assert.equal(subjectBookAvailabilityUnknown('build', { loaded: true }), false);
});

test('every loader that shows a stored subject description completes a seeded copy', () => {
  for (const file of [
    '../src/components/ContentPanel/index.tsx',
    '../src/components/Texts/RichText/Markdown/EmbeddedComponent/InternalComponent/MainContentComponent.tsx',
    '../src/containers/Home/Stories/FeedCard/Body/PreviewPrimitives.tsx'
  ]) {
    const source = readFileSync(new URL(file, import.meta.url), 'utf8');
    assert.match(source, /subjectBookAvailabilityUnknown\(/, file);
  }
});

function loadTypeScriptModule(relativePath: string) {
  const entryPoint = fileURLToPath(new URL(relativePath, import.meta.url));
  const output = buildSync({
    bundle: true,
    define: { 'import.meta.env': JSON.stringify({}) },
    entryPoints: [entryPoint],
    format: 'cjs',
    platform: 'node',
    write: false
  }).outputFiles[0].text;
  const mod: { exports: any } = { exports: {} };
  const compiled = new Function('require', 'module', 'exports', output);
  compiled(createRequire(entryPoint), mod, mod.exports);
  return mod.exports;
}
