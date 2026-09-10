import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  READ_ALOUD_MIN_CHARS,
  isReadAloudEligible,
  readAloudText
} from '../src/components/Texts/RichText/readAloud';

const here = path.dirname(fileURLToPath(import.meta.url));
const read = (file: string) => readFileSync(path.join(here, '..', file), 'utf8');

test('read-aloud eligibility is a plain length rule on the spoken text', () => {
  assert.equal(isReadAloudEligible('Aww'), false);
  assert.equal(isReadAloudEligible(''), false);
  assert.equal(isReadAloudEligible(null), false);
  const long = 'A poll says about 6 out of 10 South Koreans support making women serve in the military. About 34 out of 100 people disagreed. Both men and women mostly supported the idea.';
  assert.ok(long.length >= READ_ALOUD_MIN_CHARS);
  assert.equal(isReadAloudEligible(long), true);
  // Markup and whitespace padding do not make a short comment "long".
  assert.equal(isReadAloudEligible('<p>hi</p>' + ' '.repeat(300)), false);
  assert.equal(readAloudText('hello<br/>world   again'), 'hello world again');
  // Links and markdown are not spoken, and a post that is only links is not readable.
  assert.equal(readAloudText('See [this](https://x.test/a) and https://y.test/b **now**'), 'See this and now');
  assert.equal(isReadAloudEligible('TEsting… https://www.twin-kle.com/links/137 https://www.twin-kle.com/links/305 https://www.twin-kle.com/links/297 https://www.twin-kle.com/links/1'), false);
});

test('RichText shows read-aloud tools for opted-in text and keeps Copy for bot messages only', () => {
  const src = read('src/components/Texts/RichText/index.tsx');
  assert.match(src, /readAloudToolsShown =\s*!hideDictation &&\s*!isStreaming &&\s*\(isAIMessage \|\| \(readAloud && isReadAloudEligible\(text\)\)\)/);
  assert.match(src, /\{readAloudToolsShown && \(/);
  assert.doesNotMatch(src, /\{isAIMessage && !hideDictation && !isStreaming && \(/);
  const copyBlocks = src.match(/\{isAIMessage && \(\s*<Button[\s\S]*?onClick=\{handleCopyMessage\}/g) || [];
  assert.equal(copyBlocks.length, 2);
});

test('read-aloud is opted in on descriptions and comments', () => {
  for (const file of [
    'src/components/Comments/Container/Comment.tsx',
    'src/components/Comments/Container/Replies/Reply.tsx',
    'src/components/Comments/Container/Searched/Comment.tsx',
    'src/components/Comments/Container/PinnedComment/Comment.tsx',
    'src/components/ContentPanel/TargetContent/index.tsx',
    'src/components/ContentPanel/Body/MainContent/ContentDisplay/Content.tsx',
    'src/containers/VideoPage/Details/Description.tsx'
  ]) {
    assert.match(read(file), /\breadAloud\b/, file);
  }
  const link = read('src/containers/LinkPage/Description.tsx');
  assert.match(link, /<ReadAloudButton[\s\S]*contentKey=\{`url-\$\{linkId\}-description`\}/);
});
