import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(
  new URL(
    '../src/components/Texts/RichText/Markdown/EmbeddedComponent/InternalComponent/AICardComponent/CompactPreview.tsx',
    import.meta.url
  ),
  'utf8'
);
const multiCardSource = readFileSync(
  new URL(
    '../src/components/Texts/RichText/Markdown/EmbeddedComponent/InternalComponent/AICardComponent/MultiCardComponent.tsx',
    import.meta.url
  ),
  'utf8'
);
const multiCardPreviewBranch = multiCardSource.slice(
  multiCardSource.indexOf('  if (isPreview) {'),
  multiCardSource.indexOf('  return loading ?')
);

function assertNoSubOneRemText(sourceText, label) {
  for (const match of sourceText.matchAll(/font-size:\s*([0-9.]+)rem/g)) {
    const fontSize = Number(match[1]);
    assert.ok(
      fontSize >= 1,
      `${label} has a preview font below 1rem: ${match[0]}`
    );
  }
}

assert.match(source, /function getQualityColor\(card: Partial<Card>\)/);
assert.match(
  source,
  /if \(quality === 'common'\) \{[\s\S]*return '';[\s\S]*\}/
);
assert.match(source, /'--compact-ai-card-quality': qualityColor/);
assert.match(
  source,
  /'--compact-ai-card-quality': qualityColor \|\| cardColor/
);
assert.match(source, /border: 2px solid var\(--compact-ai-card-quality\);/);
assert.match(
  source,
  /<b style=\{qualityColor \? \{ color: qualityColor \} : undefined\}>/
);
assert.match(
  source,
  /return \(qualityProps as any\)\[quality]\?\.color \|\| '';/
);
assert.doesNotMatch(
  source,
  /if \(quality === 'common'\) \{[\s\S]*return Color\.logoBlue\(\);/
);
assert.doesNotMatch(
  source,
  /if \(quality === 'common'\) \{[\s\S]*return Color\.vantaBlack\(\);/
);
assertNoSubOneRemText(source, 'CompactPreview');

assert.match(
  multiCardPreviewBranch,
  /className={`\$\{compactMultiCardClass} compact-ai-card-multi`}/
);
assert.match(multiCardPreviewBranch, /role="button"/);
assert.match(multiCardPreviewBranch, /onClick={handleCompactPreviewOpen}/);
assert.match(multiCardPreviewBranch, /onKeyDown={handleCompactPreviewKeyDown}/);
assert.match(multiCardPreviewBranch, /compact-ai-card-multi__title/);
assert.match(multiCardPreviewBranch, /compact-ai-card-multi__preview/);
assert.match(multiCardPreviewBranch, /onClick={handleCompactCardStripClick}/);
assert.match(multiCardPreviewBranch, /<AICardsPreview/);
assert.match(multiCardPreviewBranch, /isAICardModalShown={!!selectedCardId}/);
assert.match(multiCardPreviewBranch, /cardIds={cardIds}/);
assert.match(multiCardPreviewBranch, /onSetAICardModalCardId={setSelectedCardId}/);
assert.match(
  multiCardPreviewBranch,
  /onLoadMoreClick=\{\(\) => navigate\(src\)\}/
);
assert.match(multiCardPreviewBranch, /<AICardModal/);
assert.match(multiCardSource, /function handleCompactPreviewOpen/);
assert.match(multiCardSource, /function handleCompactCardStripClick/);
assert.match(multiCardSource, /function handleCompactPreviewKeyDown/);
assert.match(multiCardSource, /navigate\(src\);/);
assert.doesNotMatch(multiCardSource, /handleCompactMoreClick/);
assert.doesNotMatch(multiCardSource, /CompactThumb/);
assert.doesNotMatch(
  multiCardPreviewBranch,
  /onClick=\{\(\) => setSelectedCardId\(cardId\)\}/
);
assertNoSubOneRemText(multiCardSource, 'MultiCardComponent');
assert.match(
  multiCardSource,
  /\.compact-ai-card-multi__title \{[\s\S]*font-size: 1\.2rem;/
);
assert.match(multiCardSource, /border: 1px solid \$\{Color\.borderGray\(\)\};/);
assert.doesNotMatch(
  multiCardSource,
  /border: 1(?:\.5)?px solid \$\{Color\.logoBlue/
);

console.log('Compact AI card preview quality color guard passed.');
