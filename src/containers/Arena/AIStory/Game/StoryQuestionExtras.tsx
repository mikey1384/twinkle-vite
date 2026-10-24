import React from 'react';
import { css } from '@emotion/css';
import { ARENA } from '../../theme';

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
          color: isPassed ? ARENA.train : ARENA.ink,
          fontWeight: 900,
          fontSize: '2.2rem'
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

// Arena look (Mikey 10-24): the skill as a small ink tag over the question
const labelCls = css`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-bottom: 0.7rem;
  font-size: 1.1rem;
  font-weight: 900;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: ${ARENA.inkSoft};
`;

const bonusCls = css`
  flex-shrink: 0;
  white-space: nowrap;
  padding: 0.1rem 0.6rem;
  border: 2px solid ${ARENA.line};
  border-radius: 999px;
  background: #f2c14e;
  color: ${ARENA.ink};
  text-transform: none;
  letter-spacing: 0;
  font-weight: 700;
`;

const noteCls = css`
  width: 100%;
  max-width: 72rem;
  margin: 1rem auto 0;
  padding: 1rem 1.2rem;
  border: 2px solid ${ARENA.line};
  border-left-width: 6px;
  background: ${ARENA.paper};
  border-radius: 10px;
  color: ${ARENA.ink};
  font-size: 1.35rem;
  line-height: 1.5;
`;

const quoteCls = css`
  margin: 0.5rem 0 0;
  padding-left: 0.8rem;
  border-left: 2px solid ${ARENA.inkSoft};
  font-style: italic;
`;

const bonusLineCls = css`
  margin-top: 0.4rem;
  font-size: 1.3rem;
  font-weight: 700;
  color: ${ARENA.inkSoft};
`;
