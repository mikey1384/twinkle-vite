import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(
  new URL(
    '../src/containers/Home/Stories/FeedCard/Body/styles/targetPreviewStyles.ts',
    import.meta.url
  ),
  'utf8'
);

function extractCssBlock(selector) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = source.match(
    new RegExp(`${escapedSelector} \\{([\\s\\S]*?)\\n    \\}`)
  );

  assert.ok(match, `Expected ${selector} block`);
  return match[1];
}

const answerBlock = extractCssBlock(
  '.home-feed-card__target-daily-reflection-answer'
);
const answerParagraphBlock = extractCssBlock(
  '.home-feed-card__target-daily-reflection-answer p'
);

assert.match(answerBlock, /font-weight: 400;/);
assert.match(answerBlock, /line-height: 1\.34;/);
assert.doesNotMatch(answerBlock, /font-weight: 700;/);

assert.match(
  answerParagraphBlock,
  /font-size: var\(--home-feed-secondary-content-font-size\);/
);
assert.match(answerParagraphBlock, /font-weight: 400;/);
assert.match(answerParagraphBlock, /line-height: 1\.34;/);
assert.doesNotMatch(
  answerParagraphBlock,
  /font-size: max\(1\.48rem, 14\.8px\);/
);

console.log('Daily reflection target preview typography guard passed.');
