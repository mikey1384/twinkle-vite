import React, { useEffect, useMemo, useRef, useState } from 'react';
import { css, cx } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import { useAppContext } from '~/contexts';
import RuleCard from '../Review/RuleCard';
import ChallengeModal from '../Review/ChallengeModal';
import useChallengeReviews from '../Review/useChallengeReviews';
import {
  challengeReviewLabel,
  getSavedChallengeReview
} from '../Review/challengeReviews';
import {
  initialKoreanShown,
  saveKoreanShown
} from '~/helpers/grammarblesRuleCard';
import type { QuestAnswer, QuestResult, QuestRun } from './types';
import QuestMarble, { answerLook } from './QuestMarble';
import { playQuestSound } from './sfx';
import { useReadCooldown } from './readCooldown';

// One question at a time, graded by the server per click. A right first try
// grows the combo; a miss shows the rule card before moving on, and can
// challenge its question like a practice stop's (the Nemesis count stays).
export default function Run({
  run,
  onFinished,
  onQuit
}: {
  run: QuestRun;
  onFinished: (result: QuestResult, answers: QuestAnswer[]) => void;
  onQuit: () => void;
}) {
  const answerQuestion = useAppContext(
    (v) => v.requestHelpers.answerGrammarQuestQuestion
  );
  const finishRun = useAppContext(
    (v) => v.requestHelpers.finishGrammarQuestRun
  );
  const [answers, setAnswers] = useState<Record<number, QuestAnswer>>(() =>
    Object.fromEntries((run.answers || []).map((a) => [a.position, a]))
  );
  const [combo, setCombo] = useState(run.combo || 0);
  const [sending, setSending] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState('');
  const [koreanShown, setKoreanShown] = useState(initialKoreanShown);
  const [challengeOpen, setChallengeOpen] = useState(false);
  const { reviews } = useChallengeReviews();
  const shownAt = useRef(Date.now());
  const firstOpen = useMemo(
    () => run.questions.findIndex((q) => !answers[q.position]),
    [run.questions, answers]
  );
  const [position, setPosition] = useState(firstOpen === -1 ? 0 : firstOpen);
  const question = run.questions[position];
  const answer = question ? answers[question.position] : undefined;
  const allAnswered = firstOpen === -1;
  const rightSoFar = Object.values(answers).filter((a) => a.isCorrect).length;
  const challenge = answer && !answer.isCorrect ? answer.challenge : null;
  const challengeReview = challenge ? reviews[challenge.questionId] : undefined;
  const savedReview = getSavedChallengeReview(
    challenge?.checked,
    challenge?.review
  );
  const reviewed = !!savedReview || challengeReview?.status === 'complete';
  // a miss's explanation holds Next/Finish for its read time
  const { reading, secondsLeft } = useReadCooldown(
    answer && !answer.isCorrect ? `miss-${position}` : null,
    answer?.readMs
  );

  useEffect(() => {
    shownAt.current = Date.now();
  }, [position]);

  if (!question) return null;

  return (
    <div className={wrapCls}>
      <div className={topCls}>
        <button className={quitCls} onClick={onQuit}>
          ← Map
        </button>
        <div className={marbleRowCls}>
          {run.questions.map((q) => {
            const a = answers[q.position];
            return (
              <QuestMarble
                key={q.position}
                look={a ? answerLook(a.isCorrect, a.combo || 1) : 'empty'}
                size={q.position === position && !a ? 22 : 18}
                className={
                  q.position === position && !a ? currentMarbleCls : undefined
                }
              />
            );
          })}
        </div>
        <div className={cx(comboCls, combo >= 3 && comboHotCls)}>×{combo}</div>
      </div>
      <div className={metaCls}>
        Question {position + 1} of {run.questions.length} ·{' '}
        <b>{question.skillName}</b>
      </div>
      <div className={questionCls}>{question.question}</div>
      <div className={choicesCls}>
        {question.choices.map((choice, i) => {
          const state = !answer
            ? ''
            : i === answer.correctIndex
              ? 'right'
              : i === answer.selectedIndex
                ? 'wrong'
                : 'dim';
          return (
            <button
              key={i}
              className={cx(
                choiceCls,
                state === 'right' && rightCls,
                state === 'wrong' && wrongCls,
                state === 'dim' && dimCls
              )}
              disabled={!!answer || sending}
              onClick={() => handleAnswer(i)}
            >
              <span className={letterCls}>{'ABCD'[i]}</span>
              {choice}
            </button>
          );
        })}
      </div>
      {error && <div className={errorCls}>{error}</div>}
      {answer && !answer.isCorrect && (
        <div className={missCls}>
          <div className={missNoteCls}>
            Combo reset. Get the next one right on the first try to build it
            again.
          </div>
          {answer.ruleCard && (
            <RuleCard
              card={answer.ruleCard}
              look="quest"
              pickedChoice={question.choices[answer.selectedIndex] ?? null}
              koreanShown={koreanShown}
              onToggleKorean={handleToggleKorean}
            />
          )}
        </div>
      )}
      {answer && (
        <div className={nextRowCls}>
          {challenge && (
            <button
              className={challengeCls}
              title={
                reviewed
                  ? 'Read the reviewer’s explanation'
                  : 'Think the answer key is wrong? Challenge it'
              }
              onClick={() => setChallengeOpen(true)}
            >
              {challengeReviewLabel(challengeReview, savedReview)}
            </button>
          )}
          {allAnswered ? (
            <button
              className={nextCls}
              disabled={finishing || reading}
              onClick={handleFinish}
            >
              {finishing
                ? 'Saving…'
                : reading
                  ? `Read it · ${secondsLeft}`
                  : `Finish · ${rightSoFar}/${run.questions.length}`}
            </button>
          ) : (
            <button className={nextCls} disabled={reading} onClick={handleNext}>
              {reading ? `Read it · ${secondsLeft}` : 'Next'}
            </button>
          )}
        </div>
      )}
      {challengeOpen && challenge && (
        <ChallengeModal
          isOpen
          questionId={challenge.questionId}
          questionText={answer?.prompt ?? question.question}
          savedReview={savedReview}
          questKind="nemesis"
          questRef={{ runId: run.runId, position: question.position }}
          returnLabel="Back to question"
          onClose={() => setChallengeOpen(false)}
        />
      )}
    </div>
  );

  async function handleAnswer(choiceIndex: number) {
    if (sending || answer) return;
    setSending(true);
    setError('');
    try {
      const result: QuestAnswer = await answerQuestion({
        runId: run.runId,
        position: question.position,
        choiceIndex,
        responseMs: Date.now() - shownAt.current
      });
      setAnswers((prev) => ({ ...prev, [result.position]: result }));
      setCombo(result.combo || 0);
      if (result.isCorrect) {
        const streak = result.combo || 0;
        // the chime climbs with the combo; every 5 in a row gets a flourish
        playQuestSound(streak > 0 && streak % 5 === 0 ? 'combo' : 'correct', {
          shift: Math.min(Math.max(streak - 1, 0), 7)
        });
      } else {
        playQuestSound('miss');
      }
    } catch {
      setError('That answer did not reach the server. Try again.');
    } finally {
      setSending(false);
    }
  }

  function handleNext() {
    if (reading) return;
    const next = run.questions.findIndex(
      (q, i) => i > position && !answers[q.position]
    );
    setPosition(next === -1 ? firstOpen : next);
  }

  async function handleFinish() {
    if (reading) return;
    setFinishing(true);
    setError('');
    try {
      // the result lists missed questions to challenge, so it needs their text
      onFinished(
        await finishRun(run.runId),
        run.questions
          .filter((q) => answers[q.position])
          .map((q) => ({
            ...answers[q.position],
            questionText: answers[q.position].prompt ?? q.question
          }))
      );
    } catch {
      setError('Could not save the run. Try again.');
      setFinishing(false);
    }
  }

  function handleToggleKorean() {
    setKoreanShown((shown) => {
      saveKoreanShown(!shown);
      return !shown;
    });
  }
}

const wrapCls = css`
  width: 100%;
  max-width: 760px;
  margin: 0 auto;
  padding: 1rem 0.5rem 2rem;
`;

const topCls = css`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const quitCls = css`
  border: none;
  background: none;
  font-size: 1.3rem;
  font-weight: 700;
  color: ${Color.darkerGray()};
  cursor: pointer;
`;

const marbleRowCls = css`
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem;
`;

const currentMarbleCls = css`
  outline: 2px solid ${Color.logoBlue()};
  outline-offset: 2px;
`;
const comboCls = css`
  min-width: 4rem;
  text-align: center;
  font-size: 1.8rem;
  font-weight: 900;
  color: ${Color.darkerGray()};
`;

const comboHotCls = css`
  color: ${Color.orange()};
`;

const metaCls = css`
  margin-top: 1.4rem;
  font-size: 1.25rem;
  color: ${Color.darkerGray()};
`;

const questionCls = css`
  margin: 0.6rem 0 1.4rem;
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.4;
  color: ${Color.black()};
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 1.7rem;
  }
`;

const choicesCls = css`
  display: grid;
  gap: 0.8rem;
`;

const choiceCls = css`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.2rem;
  border: 2px solid var(--ui-border);
  border-radius: 14px;
  background: #fff;
  font-size: 1.6rem;
  text-align: left;
  color: ${Color.black()};
  cursor: pointer;
  &:disabled {
    cursor: default;
  }
`;

const letterCls = css`
  flex-shrink: 0;
  width: 2.6rem;
  height: 2.6rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${Color.wellGray()};
  font-weight: 800;
`;

const rightCls = css`
  border-color: ${Color.green()};
  background: ${Color.green(0.1)};
`;

const wrongCls = css`
  border-color: ${Color.rose()};
  background: ${Color.rose(0.08)};
`;

const dimCls = css`
  opacity: 0.55;
`;

const errorCls = css`
  margin-top: 1rem;
  color: ${Color.rose()};
  font-size: 1.3rem;
`;

const missCls = css`
  margin-top: 1.2rem;
`;

const missNoteCls = css`
  padding: 0.7rem 1rem;
  border-radius: 10px;
  background: ${Color.orange(0.12)};
  color: ${Color.darkerGray()};
  font-size: 1.25rem;
`;

const nextRowCls = css`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 0.8rem;
  margin-top: 1.4rem;
`;

// a miss's Challenge sits left of Next
const challengeCls = css`
  margin-right: auto;
  padding: 0.7rem 1.4rem;
  border: 2px solid ${Color.rose()};
  border-radius: 12px;
  background: ${Color.rose(0.08)};
  color: ${Color.rose()};
  font-size: 1.3rem;
  font-weight: 800;
  cursor: pointer;
`;

const nextCls = css`
  padding: 0.8rem 2.4rem;
  border: none;
  border-radius: 12px;
  background: ${Color.logoBlue()};
  color: #fff;
  font-size: 1.5rem;
  font-weight: 800;
  cursor: pointer;
  &:disabled {
    background: #b8bec9;
  }
`;
