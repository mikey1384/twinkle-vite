import React from 'react';
import { css, keyframes } from '@emotion/css';
import Icon from '~/components/Icon';
import { Color, mobileMaxWidth } from '~/constants/css';
import type { QuestProgress, QuestStepKey } from './types';

export const STEP_ICONS: Record<QuestStepKey, string> = {
  crew: 'users',
  grownUp: 'chalkboard-teacher',
  plan: 'clipboard-check',
  film: 'film',
  review: 'trophy'
};

const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(65, 140, 235, 0.45); }
  70% { box-shadow: 0 0 0 0.9rem rgba(65, 140, 235, 0); }
  100% { box-shadow: 0 0 0 0 rgba(65, 140, 235, 0); }
`;

const pop = keyframes`
  0% { transform: scale(0.6); opacity: 0; }
  70% { transform: scale(1.12); opacity: 1; }
  100% { transform: scale(1); }
`;

export default function StepTracker({
  progress,
  completed
}: {
  progress: QuestProgress;
  completed: boolean;
}) {
  return (
    <div>
      <ol
        className={css`
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          position: relative;
        `}
      >
        {progress.steps.map((step, index) => {
          const isDone = step.state === 'done';
          const isCurrent = step.state === 'current';
          return (
            <li
              key={step.key}
              aria-current={isCurrent ? 'step' : undefined}
              className={css`
                position: relative;
                display: flex;
                flex-direction: column;
                align-items: center;
                text-align: center;
                gap: 0.6rem;
              `}
            >
              {index > 0 && (
                <span
                  aria-hidden
                  className={css`
                    position: absolute;
                    top: 2.2rem;
                    right: 50%;
                    width: 100%;
                    height: 0.4rem;
                    border-radius: 1rem;
                    background: ${step.state === 'locked'
                      ? 'var(--ui-border)'
                      : Color.green()};
                    z-index: 0;
                  `}
                />
              )}
              <span
                className={css`
                  position: relative;
                  z-index: 1;
                  width: 4.4rem;
                  height: 4.4rem;
                  border-radius: 50%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 1.7rem;
                  font-weight: bold;
                  color: #fff;
                  background: ${isDone
                    ? Color.green()
                    : isCurrent
                    ? Color.logoBlue()
                    : Color.lightGray()};
                  border: 3px solid
                    ${isDone
                      ? Color.green()
                      : isCurrent
                      ? Color.logoBlue()
                      : 'var(--ui-border)'};
                  animation: ${isCurrent
                    ? `${pulse} 1.8s ease-out infinite`
                    : isDone
                    ? `${pop} 0.45s ease-out`
                    : 'none'};
                  @media (max-width: ${mobileMaxWidth}) {
                    width: 3.6rem;
                    height: 3.6rem;
                    font-size: 1.4rem;
                  }
                `}
              >
                {isDone ? (
                  <Icon icon="check" />
                ) : isCurrent ? (
                  <Icon icon={STEP_ICONS[step.key]} />
                ) : (
                  <Icon icon="lock" style={{ color: Color.darkGray() }} />
                )}
              </span>
              <span
                className={css`
                  font-size: 1.3rem;
                  font-weight: ${isCurrent ? 'bold' : 'normal'};
                  color: ${isCurrent
                    ? Color.logoBlue()
                    : isDone
                    ? Color.darkerGray()
                    : Color.gray()};
                  @media (max-width: ${mobileMaxWidth}) {
                    font-size: 1.1rem;
                  }
                `}
              >
                {step.number}. {step.label}
              </span>
            </li>
          );
        })}
      </ol>
      <div
        className={css`
          display: flex;
          flex-wrap: wrap;
          gap: 0.6rem;
          margin-top: 1.6rem;
          justify-content: center;
        `}
      >
        {progress.steps.map((step) => {
          const earned = step.state === 'done';
          return (
            <span
              key={step.key}
              title={earned ? 'Badge earned' : 'Not earned yet'}
              className={css`
                display: inline-flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0.4rem 1rem;
                border-radius: 2rem;
                font-size: 1.2rem;
                font-weight: bold;
                border: 1px solid
                  ${earned ? Color.gold() : 'var(--ui-border)'};
                background: ${earned ? Color.gold(0.15) : 'transparent'};
                color: ${earned ? Color.darkerGray() : Color.gray()};
                ${earned ? `animation: ${pop} 0.45s ease-out;` : ''}
              `}
            >
              <Icon
                icon={earned ? 'award' : STEP_ICONS[step.key]}
                style={{ color: earned ? Color.gold() : Color.gray() }}
              />
              {step.badge}
            </span>
          );
        })}
      </div>
      {!completed && progress.blocking && (
        <div
          role="status"
          className={css`
            margin-top: 1.6rem;
            padding: 1.2rem 1.4rem;
            border-radius: 1rem;
            border-left: 0.5rem solid ${Color.orange()};
            background: ${Color.orange(0.1)};
            font-size: 1.5rem;
            color: ${Color.black()};
            display: flex;
            gap: 1rem;
            align-items: flex-start;
          `}
        >
          <Icon
            icon="exclamation-circle"
            style={{ color: Color.orange(), marginTop: '0.3rem' }}
          />
          <div>
            <b>What&apos;s blocking you: </b>
            {progress.blocking}
          </div>
        </div>
      )}
    </div>
  );
}
