import React from 'react';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import { useKeyContext } from '~/contexts';
import {
  scoreTable,
  perfectScoreBonus
} from '~/components/MarbleQuestions/Main/constants';

export default function ResultScreen({
  result,
  onClose
}: {
  result: {
    isPassed: boolean;
    numCorrect: number;
    total: number;
    grades: string[];
  };
  onClose: () => void;
}) {
  const { isPassed, numCorrect, total, grades } = result;
  // Theme colors for each letter grade
  const colorS = useKeyContext((v) => v.theme.grammarGameScoreS.color);
  const colorA = useKeyContext((v) => v.theme.grammarGameScoreA.color);
  const colorB = useKeyContext((v) => v.theme.grammarGameScoreB.color);
  const colorC = useKeyContext((v) => v.theme.grammarGameScoreC.color);
  const colorD = useKeyContext((v) => v.theme.grammarGameScoreD.color);
  const colorF = useKeyContext((v) => v.theme.grammarGameScoreF.color);

  const letterColor: { [key: string]: string } = {
    S: colorS,
    A: colorA,
    B: colorB,
    C: colorC,
    D: colorD,
    F: colorF
  };

  // Count grades
  const counts: Record<string, number> = { S: 0, A: 0, B: 0, C: 0, D: 0, F: 0 };
  for (const g of grades) {
    const key = counts[g] != null ? g : 'F';
    counts[key]++;
  }
  const entries = Object.entries(counts).filter(([, n]) => n > 0);

  // Compute total score and perfect
  const baseSum = grades.reduce((acc, g) => acc + (scoreTable[g] || 0), 0);
  const isPerfect = grades.length === 10 && baseSum === scoreTable.S * 10; // all S in 10 questions
  const shownTotal = isPerfect ? baseSum * perfectScoreBonus : baseSum;

  const equation = (() => {
    const parts = entries.map(
      ([letter, n]) => `(${scoreTable[letter]} × ${n})`
    );
    const left = parts.join(' + ');
    if (isPerfect) return `${left} × ${perfectScoreBonus}`;
    return left;
  })();

  return (
    <div
      className={css`
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        background: linear-gradient(
          135deg,
          ${isPassed ? Color.green(0.06) : Color.red(0.06)},
          #ffffff
        );
      `}
    >
      <div
        className={css`
          background: #fff;
          border: 1px solid ${Color.borderGray()};
          border-radius: 12px;
          box-shadow: 0 8px 24px ${Color.black(0.1)};
          padding: 2rem 2.4rem;
          max-width: 48rem;
          width: 92%;
          text-align: center;
        `}
      >
        <h3
          className={css`
            margin: 0 0 0.8rem 0;
            font-size: 2rem;
            color: ${isPassed ? Color.green() : Color.red()};
          `}
        >
          {isPassed ? 'Quiz Passed' : 'Quiz Failed'}
        </h3>
        <div
          className={css`
            margin-top: 1.2rem;
            font-size: 1.6rem;
          `}
        >
          {(['S', 'A', 'B', 'C', 'D', 'F'] as const)
            .filter((letter) => counts[letter] > 0)
            .map((letter) => (
              <div key={letter} style={{ margin: '0.2rem 0' }}>
                <b style={{ color: Color[letterColor[letter]]() }}>{letter}</b>{' '}
                ×{counts[letter]}
              </div>
            ))}
        </div>
        <div
          className={css`
            margin-top: 2rem;
            color: ${Color.darkerGray()};
          `}
        >
          <div>
            {equation} = {shownTotal}
          </div>
          {isPerfect && (
            <div style={{ marginTop: '0.6rem', color: Color.magenta() }}>
              Perfect score! {perfectScoreBonus}× bonus applied
            </div>
          )}
        </div>
        <div
          className={css`
            margin-top: 2.4rem;
            color: ${Color.darkerGray()};
          `}
        >
          Correct Answers: {numCorrect} / {total}
        </div>
        {!isPassed && (
          <div
            className={css`
              margin-top: 1rem;
              color: ${Color.red()};
              font-size: 1.4rem;
            `}
          >
            Locked until tomorrow (or unlock with coins)
          </div>
        )}
        <button
          className={css`
            margin-top: 2rem;
            padding: 1rem 2rem;
            background: ${Color.darkGray()};
            color: #fff;
            border: none;
            border-radius: 9999px;
            font-weight: 700;
            cursor: pointer;
          `}
          onClick={onClose}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
