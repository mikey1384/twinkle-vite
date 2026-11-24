import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  createLazyContentHold,
  lazyContentShown
} from '../src/helpers/lazyPlaceholder';

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

// 11-24: a word battle opened from a Word Master card closed when a new card
// pushed that card off screen and it was swapped for its stand-in.
test('an item holding an open window keeps its content off screen', () => {
  const offScreen = {
    ...base,
    measuredHeight: 240,
    standInReady: true,
    heightCachedAtMount: 240
  };
  assert.equal(lazyContentShown(offScreen), false);
  assert.equal(lazyContentShown({ ...offScreen, held: true }), true);
});

test('the hold lasts until every window inside the item has closed', () => {
  const changes: boolean[] = [];
  const hold = createLazyContentHold((held) => changes.push(held));
  const releaseWordWindow = hold.acquire();
  const releaseBattle = hold.acquire();
  releaseBattle();
  releaseBattle();
  assert.deepEqual(changes, [true], 'a double release does not end the hold');
  releaseWordWindow();
  assert.deepEqual(changes, [true, false]);
});

test('every open Modal holds its item, and Word Master cards provide the hold', () => {
  const modal = readFileSync(
    new URL('../src/components/Modal/index.tsx', import.meta.url),
    'utf8'
  );
  assert.match(modal, /useHoldLazyContent\(isOpen\)/);
  const feed = readFileSync(
    new URL(
      '../src/containers/Chat/Body/Collect/Vocabulary/FeedsContainer/Feed/index.tsx',
      import.meta.url
    ),
    'utf8'
  );
  assert.match(feed, /<LazyContentHoldContext\.Provider value=\{hold\}>/);
  assert.match(feed, /lazyContentShown\(\{[^}]*\bheld\b[^}]*\}\)/);
});
