import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

// defaultValues.ts reads import.meta.env at module scope, so read sources.
function readCap(source: string) {
  return Number(source.match(/MAX_PINNED_CHAT_TOPICS\s*=\s*(\d+)/)?.[1]);
}
const defaultsSource = readFileSync(
  new URL('../src/constants/defaultValues.ts', import.meta.url),
  'utf8'
);
const topicItemSource = readFileSync(
  new URL(
    '../src/containers/Chat/Modals/TopicSelectorModal/TopicItem.tsx',
    import.meta.url
  ),
  'utf8'
);

test('pinned chat topic cap is 5 and matches the API mirror when checked out', () => {
  assert.equal(readCap(defaultsSource), 5);
  const apiConstantPath = fileURLToPath(
    new URL('../../twinkle-api/constants/chatTopics.ts', import.meta.url)
  );
  if (!existsSync(apiConstantPath)) return;
  assert.equal(
    readCap(readFileSync(apiConstantPath, 'utf8')),
    readCap(defaultsSource)
  );
});

test('the Topic selector hides Pin using the shared cap', () => {
  assert.match(
    topicItemSource,
    /import \{ MAX_PINNED_CHAT_TOPICS \} from '~\/constants\/defaultValues'/
  );
  assert.match(
    topicItemSource,
    /\(pinnedTopicIds \|\| \[\]\)\.length < MAX_PINNED_CHAT_TOPICS/
  );
});
