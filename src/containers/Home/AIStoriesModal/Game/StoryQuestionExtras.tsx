import React from 'react';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';

// AI Story v2 (10-06): questions name the reading skill they test, Level 1–2
// add unscored bonus questions, and after grading each question shows why its
// answer is right and the sentence of the text that proves it.

const SKILL_NAMES: Record<string, string> = {
  main_idea: 'Main idea',
  detail: 'Finding details',
  inference: 'Inference',
  vocab_in_context: 'Word meaning in context',
  author_purpose: "Author's purpose and tone",
  sequence: 'Sequence and cause–effect',
  reference: 'What a word refers to',
  speaker_intent: "Speaker's intention"
};

export function storySkillName(skill?: string | null) {
  const key = String(skill || '').split('.')[1] || '';
  return SKILL_NAMES[key] || '';
}

export function StoryQuestionLabel({ question }: { question: any }) {
  const skillName = storySkillName(question?.skill);
  if (!skillName && !question?.bonus) return null;
  return (
    <div className={labelCls}>
      {skillName}
      {question?.bonus && <span className={bonusCls}>Bonus · not scored</span>}
    </div>
  );
}

export function StoryQuestionNote({ question }: { question: any }) {
  if (!question?.explanation && !question?.evidence) return null;
  return (
    <div className={noteCls}>
      {question.explanation && <div>{question.explanation}</div>}
      {question.evidence && (
        <blockquote className={quoteCls}>{question.evidence}</blockquote>
      )}
    </div>
  );
}

// Old stories have no bonus questions, so every question counts.
export function storyScore(solveObj: any, questions: any[]) {
  const scored = questions.filter((q) => !q?.bonus).length;
  const total = Number(solveObj?.totalQuestions) || scored || questions.length;
  const numCorrect = Number(solveObj?.numCorrect) || 0;
  const isPassed =
    typeof solveObj?.isPassed === 'boolean'
      ? solveObj.isPassed
      : numCorrect === total;
  return {
    numCorrect,
    total,
    isPassed,
    bonusCorrect: Number(solveObj?.bonusCorrect) || 0,
    bonusQuestions: Number(solveObj?.bonusQuestions) || 0
  };
}

export function StoryScoreLine({
  solveObj,
  questions
}: {
  solveObj: any;
  questions: any[];
}) {
  const { numCorrect, total, isPassed, bonusCorrect, bonusQuestions } =
    storyScore(solveObj, questions);
  return (
    <div style={{ textAlign: 'center' }}>
      <div
        style={{
          color: isPassed ? Color.green() : '',
          fontWeight: isPassed ? 'bold' : ''
        }}
      >
        {numCorrect} / {total} correct
        {isPassed ? '!' : ''}
      </div>
      {bonusQuestions > 0 && (
        <div className={bonusLineCls}>
          Bonus: {bonusCorrect} / {bonusQuestions}
        </div>
      )}
    </div>
  );
}

const labelCls = css`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 0.5rem;
  font-size: 1.15rem;
  font-weight: 800;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: ${Color.logoBlue()};
`;

const bonusCls = css`
  flex-shrink: 0;
  white-space: nowrap;
  padding: 0.1rem 0.6rem;
  border-radius: 999px;
  background: ${Color.gold(0.18)};
  color: ${Color.darkerGray()};
  text-transform: none;
  letter-spacing: 0;
  font-weight: 700;
`;

const noteCls = css`
  margin-top: 1rem;
  padding: 0.8rem 1rem;
  border-left: 4px solid ${Color.logoBlue()};
  background: ${Color.wellGray(0.5)};
  border-radius: 8px;
  color: ${Color.darkerGray()};
  font-size: 1.35rem;
  line-height: 1.5;
`;

const quoteCls = css`
  margin: 0.5rem 0 0;
  padding-left: 0.8rem;
  border-left: 2px solid var(--ui-border);
  font-style: italic;
`;

const bonusLineCls = css`
  margin-top: 0.4rem;
  font-size: 1.3rem;
  color: ${Color.darkerGray()};
`;
