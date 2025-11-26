import React from 'react';
import { css } from '@emotion/css';
import { Color, borderRadius } from '~/constants/css';
import Icon from '~/components/Icon';
import ProgressBar from '~/components/ProgressBar';
import Loading from '~/components/Loading';

interface ChecklistItem {
  label: string;
  complete: boolean;
  detail: string;
}

interface ChecklistProps {
  checklistItems: ChecklistItem[];
  missionCleared: boolean;
  progressLoading: boolean;
  progressError: string;
  themeColor: string;
  style?: React.CSSProperties;
  className?: string;
}

export default function Checklist({
  checklistItems,
  missionCleared,
  progressLoading,
  progressError,
  themeColor,
  style,
  className
}: ChecklistProps) {
  const checklistCompletedCount = checklistItems.filter(
    (item) => item.complete
  ).length;
  const checklistProgress = Math.round(
    (checklistCompletedCount / checklistItems.length) * 100
  );

  const currentStepIndex = checklistItems.findIndex((item) => !item.complete);
  const activeStepIndex =
    currentStepIndex === -1 ? checklistItems.length - 1 : currentStepIndex;

  return (
    <aside className={className} style={style}>
      <div
        className={css`
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
          margin-bottom: 0.2rem;
        `}
      >
        <div
          className={css`
            display: inline-flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.5rem 1rem;
            border-radius: 999px;
            background: ${Color[themeColor](0.08)};
            border: 1px solid ${Color[themeColor](0.3)};
            color: ${Color[themeColor]()};
            font-weight: 800;
            box-shadow: 0 6px 16px ${Color[themeColor](0.12)};
          `}
        >
          <Icon icon="sparkles" color={Color[themeColor]()} />
          <span>Mission Checklist</span>
        </div>
        <span
          className={css`
            padding: 0.25rem 0.8rem;
            border-radius: 999px;
            border: 1px solid ${Color[themeColor](0.35)};
            background: ${missionCleared
              ? Color[themeColor](0.18)
              : Color[themeColor](0.12)};
            color: ${Color[themeColor]()};
            font-weight: 700;
            font-size: 1.1rem;
          `}
        >
          {missionCleared ? 'Complete' : 'In Progress'}
        </span>
      </div>
      <div
        className={css`
          margin: 0.4rem 0 0.8rem;
        `}
      >
        <ProgressBar
          progress={checklistProgress}
          text={`${checklistCompletedCount}/${checklistItems.length} done`}
          theme={themeColor}
        />
      </div>
      {progressLoading ? (
        <Loading />
      ) : (
        <>
          {progressError && (
            <div
              className={css`
                color: ${Color.red()};
                font-size: 1.2rem;
              `}
            >
              {progressError}
            </div>
          )}
          {!missionCleared && (
            <div
              className={css`
                padding: 1rem 1.2rem;
                border-radius: ${borderRadius};
                background: ${Color[themeColor](0.08)};
                border: 1px solid ${Color[themeColor](0.3)};
                margin-bottom: 0.5rem;
              `}
            >
              <div
                className={css`
                  display: flex;
                  align-items: flex-start;
                  gap: 0.7rem;
                `}
              >
                <Icon
                  icon="lightbulb"
                  style={{
                    color: Color[themeColor](),
                    fontSize: '1.5rem',
                    marginTop: '0.1rem'
                  }}
                />
                <div>
                  <div
                    className={css`
                      font-weight: 700;
                      color: ${Color[themeColor]()};
                      margin-bottom: 0.3rem;
                      font-size: 1.2rem;
                    `}
                  >
                    What to do next:
                  </div>
                  <div
                    className={css`
                      color: ${Color.darkerGray()};
                      font-size: 1.2rem;
                      line-height: 1.5;
                    `}
                  >
                    {checklistItems[activeStepIndex]?.detail ||
                      'Complete the remaining steps above'}
                  </div>
                </div>
              </div>
            </div>
          )}
          {checklistItems.map((item, idx) => {
            const isCurrentStep = idx === activeStepIndex && !missionCleared;
            return (
              <div
                key={idx}
                className={css`
                  display: flex;
                  align-items: center;
                  gap: 0.9rem;
                  padding: 1rem 1.1rem;
                  border-radius: ${borderRadius};
                  background: ${Color.white()};
                  border: ${isCurrentStep ? '2px' : '1px'} solid
                    ${isCurrentStep ? Color[themeColor]() : 'var(--ui-border)'};
                  box-shadow: ${isCurrentStep
                    ? `0 2px 12px ${Color[themeColor](0.12)}`
                    : '0 2px 8px rgba(0, 0, 0, 0.04)'};
                `}
              >
                <div
                  className={css`
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.2rem;
                  `}
                >
                  <Icon
                    icon={item.complete ? 'check-circle' : 'circle'}
                    style={{
                      color: item.complete
                        ? Color[themeColor]()
                        : isCurrentStep
                        ? Color[themeColor](0.7)
                        : Color.gray(),
                      fontSize: '1.6rem'
                    }}
                  />
                  <span
                    className={css`
                      font-size: 0.95rem;
                      font-weight: 700;
                      color: ${item.complete
                        ? Color[themeColor]()
                        : isCurrentStep
                        ? Color[themeColor]()
                        : Color.gray()};
                    `}
                  >
                    {idx + 1}/{checklistItems.length}
                  </span>
                </div>
                <div
                  className={css`
                    display: flex;
                    flex-direction: column;
                    flex: 1;
                  `}
                >
                  <div
                    className={css`
                      display: flex;
                      align-items: center;
                      gap: 0.6rem;
                      margin-bottom: 0.2rem;
                    `}
                  >
                    <span
                      className={css`
                        font-weight: 700;
                        color: ${Color.black()};
                        font-size: 1.45rem;
                      `}
                    >
                      {item.label}
                    </span>
                    {isCurrentStep && (
                      <span
                        className={css`
                          padding: 0.2rem 0.6rem;
                          border-radius: 999px;
                          background: ${Color[themeColor]()};
                          color: ${Color.white()};
                          font-size: 0.95rem;
                          font-weight: 700;
                        `}
                      >
                        Current
                      </span>
                    )}
                  </div>
                  <small
                    className={css`
                      color: ${Color.darkerGray()};
                    `}
                  >
                    {item.detail}
                  </small>
                </div>
              </div>
            );
          })}
        </>
      )}
    </aside>
  );
}
