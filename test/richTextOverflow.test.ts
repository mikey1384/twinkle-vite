import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  isRichTextMeasurementOverflown,
  resolveRichTextCollapseThreshold
} from '../src/components/Texts/RichText/helpers/overflow';

test('short Markdown blocks are measured against the configured collapse ceiling', () => {
  const collapseThreshold = resolveRichTextCollapseThreshold({
    computedMaxHeight: '272px',
    fallbackClientHeight: 27
  });

  assert.equal(collapseThreshold, 272);
  assert.equal(
    isRichTextMeasurementOverflown({
      scrollHeight: 28,
      collapseThreshold
    }),
    false
  );
});

test('content beyond the collapse ceiling still offers expansion', () => {
  assert.equal(
    isRichTextMeasurementOverflown({
      scrollHeight: 300,
      collapseThreshold: 272
    }),
    true
  );
  assert.equal(
    isRichTextMeasurementOverflown({
      scrollHeight: 340,
      collapseThreshold: 272,
      extraAllowedHeight: 80
    }),
    false
  );
});

test('RichText uses the CSS ceiling and never subtracts pixels from visible content', () => {
  const richTextSource = readFileSync(
    new URL('../src/components/Texts/RichText/index.tsx', import.meta.url),
    'utf8'
  );
  const measurementSource = readFileSync(
    new URL(
      '../src/components/Texts/RichText/InvisibleTextContainer.tsx',
      import.meta.url
    ),
    'utf8'
  );

  assert.match(
    richTextSource,
    /computedMaxHeight: window\.getComputedStyle\(containerNode\)\.maxHeight/
  );
  assert.match(
    richTextSource,
    /collapsedMaxHeight=\{previewCollapsedMaxHeight\}/
  );
  assert.doesNotMatch(richTextSource, /visibleHeight\s*-\s*20/);
  assert.match(measurementSource, /new ResizeObserver/);
});
