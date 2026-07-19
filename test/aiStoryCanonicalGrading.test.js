import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

function readSource(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

const gameSource = readSource(
  'src/containers/Home/AIStoriesModal/Game/index.tsx'
);
const readingQuestionsSource = readSource(
  'src/containers/Home/AIStoriesModal/Game/Reading/ContentContainer/Questions.tsx'
);
const listeningQuestionsSource = readSource(
  'src/containers/Home/AIStoriesModal/Game/Listening/ListenSection/Questions.tsx'
);
const multipleChoiceSource = readSource(
  'src/components/MultipleChoiceQuestion.tsx'
);
const choiceListSource = readSource('src/components/ChoiceList/index.tsx');
const choiceListItemSource = readSource(
  'src/components/ChoiceList/ListItem.tsx'
);

test('AI Story graded state uses the selections echoed by the server', () => {
  assert.match(
    gameSource,
    /gradedAnswers\.map\(\(answer: any\) => \[\s*Number\(answer\.questionId\)/
  );
  assert.match(
    gameSource,
    /canonicalChoiceObj\[question\.id\] = graded\.selectedChoiceIndex/
  );
  assert.match(
    gameSource,
    /onSetQuestions\([\s\S]*?handleSetUserChoiceObj\(canonicalChoiceObj\)/
  );
});

test('AI Story choices and duplicate submissions lock while grading', () => {
  assert.match(
    gameSource,
    /if \(isGradingRef\.current\) return;\s*isGradingRef\.current = true;/
  );
  assert.match(readingQuestionsSource, /disabled=\{isGrading\}/);
  assert.match(listeningQuestionsSource, /disabled=\{isGrading\}/);
  assert.match(multipleChoiceSource, /disabled=\{disabled\}/);
  assert.match(choiceListSource, /disabled=\{disabled\}/);
  assert.match(choiceListItemSource, /disabled=\{disabled\}/);
  assert.match(
    gameSource,
    /finally \{\s*isGradingRef\.current = false;\s*setIsGrading\(false\);/
  );
});
