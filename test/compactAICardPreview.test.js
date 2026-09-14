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
  // The <b> later gained a total-mystery className; the quality-color style
  // binding this guards is unchanged.
  /<b[\s\S]{0,200}style=\{qualityColor \? \{ color: qualityColor \} : undefined\}/
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

// Collection navigation, keyboard activation and thumbnail containment are
// exercised in aiCardCollectionPreview.browser.test.js against the real UI.
assertNoSubOneRemText(multiCardSource, 'MultiCardComponent');
assert.match(multiCardSource, /border: 1px solid \$\{Color\.borderGray\(\)\};/);
assert.doesNotMatch(
  multiCardSource.slice(
    multiCardSource.indexOf('const compactMultiCardClass'),
    multiCardSource.indexOf('  .compact-ai-card-multi__header')
  ),
  /border: 1(?:\.5)?px solid \$\{Color\.logoBlue/
);

console.log('Compact AI card preview quality color guard passed.');
