import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  DAILY_QUESTION_GRADING_UNAVAILABLE_CODE,
  DAILY_QUESTION_GRADING_UNAVAILABLE_NOTICE,
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

test('an unavailable grader or polisher returns to the kept draft before recovery polling', () => {
  assert.equal(
    DAILY_QUESTION_POLISH_UNAVAILABLE_CODE,
    'daily_question_polish_unavailable'
  );
  assert.match(DAILY_QUESTION_POLISH_UNAVAILABLE_NOTICE, /nothing was saved/);
  assert.equal(DAILY_QUESTION_GRADING_UNAVAILABLE_CODE, 'daily_question_grading_unavailable');
  assert.match(DAILY_QUESTION_GRADING_UNAVAILABLE_NOTICE, /Your draft is still here/);
  const catchStart = panelSource.indexOf(
    "console.error('Failed to submit response:', err);"
  );
  assert.ok(catchStart > 0);
  const branch = panelSource.slice(catchStart, catchStart + 2000);
  const gradingCheck = branch.indexOf(
    'err?.code === DAILY_QUESTION_GRADING_UNAVAILABLE_CODE'
  );
  const polishCheck = branch.indexOf(
    'err?.code === DAILY_QUESTION_POLISH_UNAVAILABLE_CODE'
  );
  const recovery = branch.indexOf('Restoring your result');
  assert.ok(gradingCheck > 0 && polishCheck > gradingCheck);
  assert.ok(recovery > polishCheck, 'before any recovery polling starts');
  const handled = branch.slice(polishCheck, recovery);
  assert.match(handled, /persistDraftRecovery\(/);
  assert.match(
    handled,
    /returnToDraftStartScreen\(\{\s*responseText: trimmedResponse,\s*notice: gradingUnavailable\s*\? DAILY_QUESTION_GRADING_UNAVAILABLE_NOTICE\s*: DAILY_QUESTION_POLISH_UNAVAILABLE_NOTICE/
  );
  assert.match(handled, /return;/);
});
