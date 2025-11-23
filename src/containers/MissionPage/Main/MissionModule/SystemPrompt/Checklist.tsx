import React, { useMemo } from 'react';
import { css } from '@emotion/css';
import { Color, borderRadius } from '~/constants/css';
import Icon from '~/components/Icon';
import ProgressBar from '~/components/ProgressBar';
import Loading from '~/components/Loading';
import TaskComplete from '../components/TaskComplete';

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
  doneColor: string;
  contentColor: string;
  missionId: number;
  style?: React.CSSProperties;
  className?: string;
}

export default function Checklist({
  checklistItems,
  missionCleared,
  progressLoading,
  progressError,
  doneColor,
  contentColor,
  missionId,
  style,
  className
}: ChecklistProps) {
  const checklistCompletedCount = checklistItems.filter(
    (item) => item.complete
  ).length;
  const checklistProgress = Math.round(
    (checklistCompletedCount / checklistItems.length) * 100
  );

  const sectionHeaderClass = useMemo(
    () =>
      css`
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        flex-wrap: wrap;
      `,
    []
  );

  const checklistHeaderClass = useMemo(
    () =>
      css`
        display: inline-flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.5rem 1rem;
        border-radius: 999px;
        background: ${Color.highlightGray(0.4)};
        border: 1px solid var(--ui-border);
        color: ${contentColor};
        font-weight: 800;
      `,
    [contentColor]
  );

  const checklistItemClass = useMemo(
    () =>
      css`
        display: flex;
        align-items: center;
        gap: 0.9rem;
        padding: 1rem 1.1rem;
        border-radius: ${borderRadius};
        background: ${Color.white()};
        border: 1px solid var(--ui-border);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
      `,
    []
  );

  return (
    <aside className={className} style={style}>
      <div
        className={`${sectionHeaderClass} ${css`
          margin-bottom: 0.2rem;
        `}`}
      >
        <div className={checklistHeaderClass}>
          <Icon icon="sparkles" color={Color.darkBlue()} />
          <span>Mission Checklist</span>
        </div>
        <span
          className={css`
            padding: 0.25rem 0.8rem;
            border-radius: 999px;
            border: 1px solid var(--ui-border);
            background: ${missionCleared
              ? Color.green(0.12)
              : Color.highlightGray(0.45)};
            color: ${missionCleared ? doneColor : contentColor};
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
          theme="logoBlue"
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
          {checklistItems.map((item, idx) => (
            <div key={idx} className={checklistItemClass}>
              <Icon
                icon={item.complete ? 'check-circle' : 'circle'}
                style={{
                  color: item.complete ? doneColor : Color.gray()
                }}
              />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span
                  style={{
                    fontWeight: 700,
                    color: Color.black(),
                    fontSize: '1.45rem'
                  }}
                >
                  {item.label}
                </span>
                <small style={{ color: Color.darkerGray() }}>
                  {item.detail}
                </small>
              </div>
            </div>
          ))}
        </>
      )}
      {missionCleared && (
        <TaskComplete
          style={{ marginTop: '0.5rem' }}
          taskId={missionId}
          passMessage="Nice work! Collect your reward."
        />
      )}
    </aside>
  );
}
