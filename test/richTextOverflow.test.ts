import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  applyRichTextOverflowMeasurement,
  isRichTextMeasurementOverflown,
  resolveInitialRichTextHeight,
  resolveInitialRichTextPresentationState,
  resolveRichTextContentTransition,
  resolveRichTextHeightToPersist,
  resolveRichTextCollapseThreshold,
  shouldShowRichTextFully
} from '../src/components/Texts/RichText/helpers/overflow';
import { createStringRevision } from '../src/helpers/stringRevision';

test('short cached RichText never invents overflow while remounting', () => {
  const contentRevision = createStringRevision('One line message');
  const restoredState = resolveInitialRichTextPresentationState({
    cachedState: {
      contentRevision,
      isExpanded: false
    },
    contentRevision
  });

  assert.deepEqual(restoredState, {
    isExpanded: false,
    isOverflown: null
  });
});

test('confirmed user expansion survives an unchanged RichText remount', () => {
  const contentRevision = createStringRevision('A genuinely long response');

  assert.deepEqual(
    resolveInitialRichTextPresentationState({
      cachedState: {
        contentRevision,
        isExpanded: true
      },
      contentRevision
    }),
    {
      isExpanded: true,
      isOverflown: null
    }
  );
});

test('edited RichText does not restore expansion from different same-length text', () => {
  const originalRevision = createStringRevision('first message');
  const editedRevision = createStringRevision('saved version');

  assert.equal('first message'.length, 'saved version'.length);
  assert.notEqual(originalRevision, editedRevision);
  assert.deepEqual(
    resolveInitialRichTextPresentationState({
      cachedState: {
        contentRevision: originalRevision,
        isExpanded: true
      },
      contentRevision: editedRevision
    }),
    {
      isExpanded: false,
      isOverflown: null
    }
  );
});

test('edited RichText does not reserve stale height from the previous content', () => {
  const originalRevision = createStringRevision('old expanded response');
  const editedRevision = createStringRevision('short');

  assert.equal(
    resolveInitialRichTextHeight({
      cachedState: {
        contentRevision: originalRevision,
        height: 640
      },
      contentRevision: editedRevision
    }),
    undefined
  );
  assert.equal(
    resolveInitialRichTextHeight({
      cachedState: {
        contentRevision: originalRevision,
        height: 640
      },
      contentRevision: originalRevision
    }),
    640
  );
});

test('RichText never relabels a measured height as belonging to edited content', () => {
  assert.equal(
    resolveRichTextHeightToPersist({
      contentRevision: 'edited',
      height: 640,
      heightContentRevision: 'original'
    }),
    undefined
  );
  assert.equal(
    resolveRichTextHeightToPersist({
      contentRevision: 'edited',
      height: 180,
      heightContentRevision: 'edited'
    }),
    180
  );
});

test('streaming RichText never restores stale expansion state', () => {
  assert.deepEqual(
    resolveInitialRichTextPresentationState({
      cachedState: {
        contentRevision: 'streaming',
        isExpanded: true
      },
      contentRevision: 'streaming',
      isStreaming: true
    }),
    {
      isExpanded: false,
      isOverflown: null
    }
  );
});

test('overflow measurements never manufacture or discard expansion intent', () => {
  const collapsedAtWideWidth = {
    isExpanded: false,
    isOverflown: false
  };
  const collapsedAtNarrowWidth = applyRichTextOverflowMeasurement({
    state: collapsedAtWideWidth,
    isOverflown: true
  });
  const expandedAtWideWidth = applyRichTextOverflowMeasurement({
    state: {
      isExpanded: true,
      isOverflown: true
    },
    isOverflown: false
  });
  const unchangedWideMeasurement = applyRichTextOverflowMeasurement({
    state: collapsedAtWideWidth,
    isOverflown: false
  });

  assert.deepEqual(collapsedAtNarrowWidth, {
    isExpanded: false,
    isOverflown: true
  });
  assert.deepEqual(expandedAtWideWidth, {
    isExpanded: true,
    isOverflown: false
  });
  assert.equal(unchangedWideMeasurement, collapsedAtWideWidth);
});

test('only measured non-preview RichText can remove its collapse clipping', () => {
  assert.equal(
    shouldShowRichTextFully({
      isExpanded: false,
      isOverflown: false,
      isPreview: false
    }),
    true
  );
  assert.equal(
    shouldShowRichTextFully({
      isExpanded: false,
      isOverflown: null,
      isPreview: false
    }),
    false
  );
  assert.equal(
    shouldShowRichTextFully({
      isExpanded: false,
      isOverflown: false,
      isPreview: true
    }),
    false
  );
  assert.equal(
    shouldShowRichTextFully({
      isExpanded: true,
      isOverflown: null,
      isPreview: false
    }),
    true
  );
});

test('content transitions reset edits but preserve explicit expansion at stream completion', () => {
  assert.equal(
    resolveRichTextContentTransition({
      previousContentRevision: 'old',
      contentRevision: 'new',
      wasStreaming: false,
      isStreaming: false
    }),
    'reset'
  );
  assert.equal(
    resolveRichTextContentTransition({
      previousContentRevision: 'streaming',
      contentRevision: 'final',
      wasStreaming: true,
      isStreaming: false
    }),
    'preserve-expansion'
  );
  assert.equal(
    resolveRichTextContentTransition({
      previousContentRevision: 'streaming',
      contentRevision: 'streaming',
      wasStreaming: true,
      isStreaming: true
    }),
    'unchanged'
  );
  assert.equal(
    resolveRichTextContentTransition({
      previousContentRevision: 'prior-response',
      contentRevision: 'streaming',
      wasStreaming: false,
      isStreaming: true
    }),
    'reset'
  );
});

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
  assert.match(
    richTextSource,
    /renderAsLiteralText=\{renderAsLiteralText\}/
  );
  assert.doesNotMatch(richTextSource, /visibleHeight\s*-\s*20/);
  assert.match(measurementSource, /new ResizeObserver/);
  assert.match(measurementSource, /renderAsLiteralText \? \(/);
});
