import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  DAILY_QUESTION_POLISH_UNAVAILABLE_CODE,
  DAILY_QUESTION_POLISH_UNAVAILABLE_NOTICE
} from '../src/components/Modals/DailyQuestionModal/DailyQuestionPanel/constants';

const panelSource = readFileSync(
  new URL(
    '../src/components/Modals/DailyQuestionModal/DailyQuestionPanel/index.tsx',
    import.meta.url
  ),
  'utf8'
);

test('a polish-unavailable submit returns to the kept draft instead of polling for a result', () => {
  assert.equal(
    DAILY_QUESTION_POLISH_UNAVAILABLE_CODE,
    'daily_question_polish_unavailable'
  );
  assert.match(DAILY_QUESTION_POLISH_UNAVAILABLE_NOTICE, /nothing was saved/);
  const catchStart = panelSource.indexOf(
    "console.error('Failed to submit response:', err);"
  );
  assert.ok(catchStart > 0);
  const branch = panelSource.slice(catchStart, catchStart + 2000);
  const polishCheck = branch.indexOf(
    'err?.code === DAILY_QUESTION_POLISH_UNAVAILABLE_CODE'
  );
  const recovery = branch.indexOf('Restoring your result');
  assert.ok(polishCheck > 0, 'the polish code is checked');
  assert.ok(recovery > polishCheck, 'before any recovery polling starts');
  const handled = branch.slice(polishCheck, recovery);
  assert.match(handled, /persistDraftRecovery\(/);
  assert.match(
    handled,
    /returnToDraftStartScreen\(\{\s*responseText: trimmedResponse,\s*notice: DAILY_QUESTION_POLISH_UNAVAILABLE_NOTICE/
  );
  assert.match(handled, /return;/);
});
