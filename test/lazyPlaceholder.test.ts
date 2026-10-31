import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { lazyContentShown } from '../src/helpers/lazyPlaceholder';

const base = {
  inView: false,
  isVisible: false,
  measuredHeight: undefined as number | undefined,
  standInReady: false,
  heightCachedAtMount: undefined as number | undefined
};

test('an item with no measured height renders its content, never a guessed box', () => {
  assert.equal(lazyContentShown(base), true);
  assert.equal(lazyContentShown({ ...base, standInReady: true }), true);
  assert.equal(
    lazyContentShown({ ...base, standInReady: true, measuredHeight: 0 }),
    true
  );
});

test('an item measured on this mount keeps its content until its stand-in is ready', () => {
  assert.equal(lazyContentShown({ ...base, measuredHeight: 240 }), true);
  assert.equal(
    lazyContentShown({ ...base, measuredHeight: 240, standInReady: true }),
    false
  );
  assert.equal(
    lazyContentShown({
      ...base,
      measuredHeight: 240,
      standInReady: true,
      inView: true
    }),
    true
  );
  assert.equal(
    lazyContentShown({
      ...base,
      measuredHeight: 240,
      standInReady: true,
      isVisible: true
    }),
    true
  );
});

test('a height cached from an earlier mount may stand in from the first frame', () => {
  assert.equal(
    lazyContentShown({
      ...base,
      measuredHeight: 240,
      heightCachedAtMount: 240
    }),
    false
  );
});

const LAZY_LIST_SOURCES = [
  'src/components/Comments/Container/Comment.tsx',
  'src/components/ContentPanel/index.tsx',
  'src/components/ContentListItem/index.tsx',
  'src/containers/MissionPage/SystemPromptShared/SharedPromptCard.tsx',
  'src/containers/Chat/Body/Collect/Vocabulary/FeedsContainer/Feed/index.tsx'
];

test('lazy list items use the measured-height rule and no guessed fallback', () => {
  for (const file of LAZY_LIST_SOURCES) {
    const source = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
    assert.match(source, /lazyContentShown\(\{/, file);
    assert.doesNotMatch(
      source,
      /placeholderHeight \|\| ['"\d]|\? '17rem'/,
      `${file} still falls back to a guessed placeholder height`
    );
  }
});
