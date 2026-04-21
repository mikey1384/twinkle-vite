import React from 'react';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import { Color } from '~/constants/css';
import { BREAK_GUIDE_ROWS, getToneColor } from './utils';

export default function Guide({
  isCompact,
  breakInterval,
  activeBreakIdx = 0,
  breaksCleared = 0,
  failedBreaksList = []
}: {
  isCompact: boolean;
  breakInterval: number;
  activeBreakIdx?: number;
  breaksCleared?: number;
  failedBreaksList?: number[];
}) {
  return (
    <section
      className={css`
        padding: 1.8rem;
        border-radius: 1.2rem;
        border: 1px solid ${Color.borderGray()};
        background: ${Color.white()};
        display: flex;
        flex-direction: column;
        gap: 1.2rem;
        box-shadow: 0 10px 20px ${Color.black(0.04)};
      `}
    >
      {!isCompact ? (
        <div>
          <div
            className={css`
              display: flex;
              align-items: center;
              gap: 0.6rem;
              font-size: 1.6rem;
              font-weight: 700;
              color: ${Color.darkerGray()};
            `}
          >
            <Icon
              icon="sparkles"
              style={{ color: Color.gold(), fontSize: '1.6rem' }}
            />
            No active break right now.
          </div>
          <div
            className={css`
              font-size: 1.2rem;
              color: ${Color.gray()};
              margin-top: 0.6rem;
              padding: 0.6rem 0.9rem;
              border-radius: 0.9rem;
              border: 1px solid ${Color.borderGray()};
              background: ${Color.whiteGray()};
            `}
          >
            {`Breaks trigger every ${breakInterval} strikes from already-collected word lookups.`}
          </div>
        </div>
      ) : null}
      <div
        className={css`
          display: flex;
          flex-direction: column;
          gap: 1rem;
        `}
      >
        {BREAK_GUIDE_ROWS.map((row) => {
          const isActive =
            activeBreakIdx > 0 &&
            (row.breakNum === activeBreakIdx ||
              (row.breakNum === 6 && activeBreakIdx >= 6));
          const isCleared = row.breakNum <= breaksCleared && !isActive;
          const isFailed = failedBreaksList.includes(row.breakNum);
          const clearedCount =
            row.breakNum === 6 && breaksCleared >= 6
              ? activeBreakIdx >= 6
                ? breaksCleared - 6
                : breaksCleared - 5
              : 0;
          return (
            <GuideRow
              key={row.label}
              label={row.label}
              title={row.title}
              description={row.description}
              tone={row.tone}
              isActive={isActive}
              isCleared={isCleared}
              isFailed={isFailed}
              clearedCount={clearedCount}
            />
          );
        })}
      </div>
    </section>
  );
}

function GuideRow({
  label,
  title,
  description,
  tone,
  isActive,
  isCleared,
  isFailed,
  clearedCount
}: {
  label: string;
  title: string;
  description: string;
  tone?: string;
  isActive?: boolean;
  isCleared?: boolean;
  isFailed?: boolean;
  clearedCount?: number;
}) {
  const toneColor = getToneColor(tone);
  const toneSoft = getToneColor(tone, 0.12);
  const showFailed = Boolean(isFailed);
  const showCleared =
    !showFailed &&
    !isActive &&
    !!(isCleared || (clearedCount && clearedCount > 0));
  return (
    <div
      className={css`
        display: flex;
        gap: 1rem;
        align-items: flex-start;
        padding: 0.6rem 0.8rem;
        margin: -0.6rem -0.8rem;
        border-radius: 0.8rem;
        background: ${showFailed
          ? Color.red(0.08)
          : isActive
            ? toneSoft
            : 'transparent'};
        border-left: ${showFailed
          ? `3px solid ${Color.red()}`
          : isActive
            ? `3px solid ${toneColor}`
            : '3px solid transparent'};
        opacity: ${isCleared && !clearedCount && !showFailed ? 0.6 : 1};
      `}
    >
      <div
        className={css`
          display: flex;
          align-items: center;
          gap: 0.5rem;
        `}
      >
        <div
          className={css`
            padding: 0.3rem 0.8rem;
            border-radius: 999px;
            background: ${showFailed
              ? Color.red(0.15)
              : showCleared
                ? Color.green(0.15)
                : isActive
                  ? toneColor
                  : toneSoft};
            color: ${showFailed
              ? Color.red()
              : showCleared
                ? Color.green()
                : isActive
                  ? Color.white()
                  : toneColor};
            font-size: 1.1rem;
            font-weight: 700;
            white-space: nowrap;
          `}
        >
          {label}
        </div>
        {showFailed ? (
          <span
            className={css`
              display: flex;
              align-items: center;
              gap: 0.2rem;
              color: ${Color.red()};
              font-size: 1.1rem;
              font-weight: 700;
            `}
          >
            <Icon icon="times" />
          </span>
        ) : null}
        {showCleared ? (
          <span
            className={css`
              display: flex;
              align-items: center;
              gap: 0.2rem;
              color: ${Color.green()};
              font-size: 1.1rem;
              font-weight: 700;
            `}
          >
            <Icon icon="check" />
            {!!clearedCount && clearedCount > 0
              ? `×${clearedCount}`
              : undefined}
          </span>
        ) : null}
      </div>
      <div
        className={css`
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        `}
      >
        <div
          className={css`
            font-size: 1.3rem;
            font-weight: 700;
            color: ${Color.darkerGray()};
          `}
        >
          {title}
        </div>
        <div
          className={css`
            font-size: 1.2rem;
            color: ${Color.gray()};
            line-height: 1.4;
          `}
        >
          {description}
        </div>
      </div>
    </div>
  );
}
