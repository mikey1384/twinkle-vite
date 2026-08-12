import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const gradingResultSource = readFileSync(
  new URL(
    '../src/components/Modals/DailyQuestionModal/DailyQuestionPanel/GradingResult/index.tsx',
    import.meta.url
  ),
  'utf8'
);
const shareActionsSource = readFileSync(
  new URL(
    '../src/components/Modals/DailyQuestionModal/DailyQuestionPanel/GradingResult/ShareActions.tsx',
    import.meta.url
  ),
  'utf8'
);
const contentRequestHelpersSource = readFileSync(
  new URL('../src/contexts/requestHelpers/content.ts', import.meta.url),
  'utf8'
);

test('Keyword Day feed sharing uses the normal original-versus-polished chooser', () => {
  const shareClickStart = gradingResultSource.indexOf(
    'async function handleShareClick()'
  );
  const confirmShareStart = gradingResultSource.indexOf(
    'async function handleConfirmShare()',
    shareClickStart
  );
  const shareClickSource = gradingResultSource.slice(
    shareClickStart,
    confirmShareStart
  );

  assert.ok(shareClickStart >= 0 && confirmShareStart > shareClickStart);
  assert.doesNotMatch(shareClickSource, /isKeywordDay/);
  assert.match(shareClickSource, /setShowVersionSelector\(true\)/);
  assert.match(
    gradingResultSource,
    /responseText: textToShare,\s*version: selectedVersion/
  );
  assert.doesNotMatch(
    gradingResultSource,
    /!isKeywordDay\s*&&\s*\(canShareToFeedNow/
  );
  assert.match(
    contentRequestHelpersSource,
    /\{ responseId, responseText, version \}/
  );
  assert.match(contentRequestHelpersSource, /if \(!error\?\.response\)/);
  assert.match(
    contentRequestHelpersSource,
    /const \{ data \} = await shareRequest\(\);[\s\S]*const \{ data \} = await shareRequest\(\);/
  );
});

test('public share controls reject concurrent clicks before React rerenders', () => {
  assert.match(gradingResultSource, /const sharingRef = useRef\(false\)/);
  assert.match(
    gradingResultSource,
    /async function handleConfirmShare\(\) \{\s*if \(sharingRef\.current\) return;\s*sharingRef\.current = true;/
  );
  assert.match(
    gradingResultSource,
    /finally \{\s*sharingRef\.current = false;\s*setSharing\(false\);/
  );
  assert.match(
    shareActionsSource,
    /disabled=\{!canShareToFeedNow \|\| refining \|\| sharing\}/
  );
});
