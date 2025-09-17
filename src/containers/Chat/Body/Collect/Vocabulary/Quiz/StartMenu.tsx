import React from 'react';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import GameCTAButton from '~/components/Buttons/GameCTAButton';

const funFont =
  "'Trebuchet MS', 'Comic Sans MS', 'Segoe UI', 'Arial Rounded MT Bold', -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif";

export default function StartMenu({
  onStart,
  onCancel,
  title,
  questionCount,
  quiz
}: {
  onStart: () => void;
  onCancel?: () => void;
  title?: string;
  questionCount?: number;
  quiz?: {
    attemptsPlayed: number;
    attemptsRemaining: number;
    bestAttemptIndex: number | null;
    bestAttemptTotal: number;
    historyId: number | null;
    finished: boolean;
    maxAttempts: number;
  } | null;
}) {
  const startDisabled = !!quiz?.finished;
  return (
    <div
      className={css`
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        background: ${Color.whiteGray()};
        background-image: radial-gradient(${Color.logoBlue(0.08)} 8%, transparent 9%),
          radial-gradient(${Color.pink(0.06)} 8%, transparent 9%);
        background-position: 0 0, 2.4rem 2.4rem;
        background-size: 4.8rem 4.8rem;
        padding: 2rem;
      `}
    >
      <div
        className={css`
          background: #fff;
          border: 3px dashed ${Color.logoBlue(0.25)};
          border-radius: 18px;
          box-shadow: 0 12px 26px ${Color.black(0.1)};
          padding: 2.4rem 2.8rem;
          max-width: 42rem;
          width: 90%;
          text-align: center;
          font-family: ${funFont};
        `}
      >
        <h3
          className={css`
            margin: 0 0 0.8rem 0;
            font-size: 2.4rem;
            letter-spacing: 0.8px;
            color: ${Color.logoBlue()};
          `}
        >
          {title || 'Word Master Quiz'}
        </h3>
        <p
          className={css`
            margin: 0 0 1.6rem 0;
            color: ${Color.darkerGray()};
            line-height: 1.5;
          `}
        >
          {questionCount
            ? `${questionCount} questions are ready.`
            : 'Press Start to begin the quiz.'}
        </p>
        {quiz && (
          <div
            className={css`
              margin-bottom: 1.4rem;
              color: ${Color.darkGray()};
              display: flex;
              flex-direction: column;
              gap: 0.4rem;
              font-size: 1.1rem;
            `}
          >
            <span>
              Attempts used: {quiz.attemptsPlayed} / {quiz.maxAttempts}
            </span>
            <span>
              Best score: {quiz.bestAttemptTotal}
              {quiz.bestAttemptIndex
                ? ` (Attempt #${quiz.bestAttemptIndex})`
                : ''}
            </span>
            {quiz.finished && (
              <span style={{ color: Color.green() }}>
                Word Master score already recorded
              </span>
            )}
          </div>
        )}
        <div
          className={css`
            display: flex;
            justify-content: center;
            gap: 1rem;
            margin-top: 1.8rem;
            flex-wrap: wrap;
          `}
        >
          <GameCTAButton
            icon={startDisabled ? 'lock' : 'play'}
            onClick={() => {
              if (!startDisabled) {
                onStart();
              }
            }}
            disabled={startDisabled}
            variant={startDisabled ? 'neutral' : 'logoBlue'}
            size="lg"
            shiny={!startDisabled}
          >
            {startDisabled ? 'Score Recorded' : 'Start Quiz'}
          </GameCTAButton>
          {onCancel && (
            <GameCTAButton
              icon="arrow-left"
              onClick={onCancel}
              variant="magenta"
              size="lg"
            >
              Back
            </GameCTAButton>
          )}
        </div>
      </div>
    </div>
  );
}
