import React from 'react';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import { Color, mobileMaxWidth } from '~/constants/css';
import { STEP_ICONS } from './StepTracker';
import type { QuestStep } from './types';

export const questInputClass = css`
  width: 100%;
  font-family: inherit;
  padding: 0.8rem 1rem;
  font-size: 1.4rem;
  border-radius: 0.8rem;
  border: 1px solid var(--ui-border);
  background: #fff;
  color: ${Color.black()};
  &:focus {
    outline: none;
    border-color: ${Color.logoBlue()};
  }
  &:disabled {
    background: ${Color.extraLightGray()};
    color: ${Color.darkGray()};
  }
`;

export const questLabelClass = css`
  display: block;
  font-size: 1.3rem;
  font-weight: bold;
  color: ${Color.darkerGray()};
  margin-bottom: 0.4rem;
`;

export const questHelpClass = css`
  font-size: 1.2rem;
  color: ${Color.darkGray()};
  margin-top: 0.3rem;
`;

export function QuestNote({
  tone,
  children
}: {
  tone: 'info' | 'warning' | 'success';
  children: React.ReactNode;
}) {
  const color =
    tone === 'warning' ? 'orange' : tone === 'success' ? 'green' : 'logoBlue';
  return (
    <div
      className={css`
        padding: 1rem 1.2rem;
        border-radius: 0.8rem;
        background: ${(Color as any)[color](0.1)};
        border: 1px solid ${(Color as any)[color](0.35)};
        font-size: 1.3rem;
        color: ${Color.black()};
        white-space: pre-wrap;
        overflow-wrap: anywhere;
      `}
    >
      {children}
    </div>
  );
}

export default function StepCard({
  step,
  children
}: {
  step: QuestStep;
  children?: React.ReactNode;
}) {
  const isCurrent = step.state === 'current';
  const isLocked = step.state === 'locked';
  return (
    <section
      aria-label={`Step ${step.number}: ${step.label}`}
      className={css`
        border-radius: 1.2rem;
        border: ${isCurrent ? `2px solid ${Color.logoBlue()}` : '1px solid var(--ui-border)'};
        background: ${isLocked ? Color.extraLightGray(0.6) : '#fff'};
        padding: 1.4rem 1.6rem;
        margin-top: 1.2rem;
        ${isCurrent ? `box-shadow: 0 0.4rem 1.4rem ${Color.logoBlue(0.15)};` : ''}
        @media (max-width: ${mobileMaxWidth}) {
          padding: 1.2rem;
        }
      `}
    >
      <header
        className={css`
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        `}
      >
        <span
          className={css`
            width: 3rem;
            height: 3rem;
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 1.3rem;
            color: #fff;
            background: ${step.state === 'done'
              ? Color.green()
              : isCurrent
              ? Color.logoBlue()
              : Color.gray()};
          `}
        >
          <Icon icon={step.state === 'done' ? 'check' : STEP_ICONS[step.key]} />
        </span>
        <h3
          className={css`
            font-size: 1.7rem;
            font-weight: bold;
            color: ${isLocked ? Color.darkGray() : Color.black()};
            margin: 0;
          `}
        >
          Step {step.number}: {step.label}
        </h3>
        <span
          className={css`
            font-size: 1.2rem;
            font-weight: bold;
            padding: 0.2rem 0.8rem;
            border-radius: 1rem;
            color: ${step.state === 'done'
              ? Color.green()
              : isCurrent
              ? Color.logoBlue()
              : Color.darkGray()};
            background: ${step.state === 'done'
              ? Color.green(0.1)
              : isCurrent
              ? Color.logoBlue(0.1)
              : 'transparent'};
          `}
        >
          {step.state === 'done'
            ? 'Done'
            : isCurrent
            ? 'Your bottleneck now'
            : 'Locked'}
        </span>
      </header>
      <p
        className={css`
          font-size: 1.4rem;
          color: ${isLocked ? Color.darkGray() : Color.darkerGray()};
          margin: 0.8rem 0 0;
        `}
      >
        {isLocked
          ? `Unlocks after step ${step.number - 1}. ${step.detail}`
          : step.detail}
      </p>
      {React.Children.toArray(children).length > 0 && (
        <div
          className={css`
            margin-top: 1.2rem;
            display: flex;
            flex-direction: column;
            gap: 1.2rem;
          `}
        >
          {children}
        </div>
      )}
    </section>
  );
}
