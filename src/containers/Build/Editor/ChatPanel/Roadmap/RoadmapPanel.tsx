import React, { useState } from 'react';
import { css } from '@emotion/css';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { Color } from '~/constants/css';
import {
  formatRoadmapDaysLeft,
  type RoadmapAction,
  type RoadmapView
} from '../../helpers/roadmap';
import RoadmapLevelMap from './RoadmapLevelMap';
import {
  energyPillClass,
  kickerClass,
  pillClass,
  primaryButtonClass,
  roadmapButtonClass,
  roadmapInk,
  roadmapLine,
  roadmapMuted
} from './styles';

const panelClass = css`
  flex-shrink: 0;
  margin: 1rem 1.2rem 0;
  background: #fff;
  border: 1px solid ${roadmapLine};
  border-radius: 16px;
  overflow: hidden;
  color: ${roadmapInk};
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
`;

const bodyClass = css`
  max-height: 46vh;
  overflow-y: auto;
  overscroll-behavior: contain;
`;

const headClass = css`
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;
  padding: 1.2rem 1.4rem;
  border: 0;
  background: transparent;
  text-align: left;
  font: inherit;
  color: inherit;
  cursor: pointer;
  &:focus-visible {
    outline: 2px solid ${Color.logoBlue()};
    outline-offset: -2px;
    border-radius: 16px;
  }
`;

const headTextClass = css`
  flex: 1;
  min-width: 0;
`;

const headTitleClass = css`
  display: block;
  margin-top: 0.35rem;
  font-size: var(--build-workshop-title-font-size, 1.6rem);
  font-weight: 800;
  line-height: 1.2;
  overflow-wrap: anywhere;
`;

const chevronClass = css`
  flex-shrink: 0;
  color: ${roadmapMuted};
  transition: transform 0.2s ease;
`;

const collapsedRowClass = css`
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin-top: 0.5rem;
`;

const barClass = css`
  position: relative;
  height: 1rem;
  border-radius: 999px;
  background: #edf0f6;
  overflow: hidden;
`;

const barFillClass = css`
  position: absolute;
  inset: 0 auto 0 0;
  border-radius: 999px;
  background: ${Color.emerald()};
  transition: width 0.4s ease;
`;

const barLabelClass = css`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.6rem 1.4rem 1.2rem;
  font-size: var(--build-workshop-label-font-size, 1.2rem);
  color: ${roadmapMuted};
`;

const nowCardClass = css`
  margin: 0 1.2rem 1.2rem;
  padding: 1.2rem 1.4rem 1.3rem;
  border-radius: 14px;
  background: ${Color.brightGold(0.2)};
  border: 1px solid ${Color.goldOrange(0.55)};
`;

const nowTitleClass = css`
  margin: 0.6rem 0 0.2rem;
  font-size: var(--build-workshop-title-font-size, 1.6rem);
  font-weight: 800;
  line-height: 1.25;
`;

const stepsClass = css`
  list-style: none;
  margin: 0.6rem 0 1.1rem;
  padding: 0;
  display: grid;
  gap: 0.45rem;
  font-size: var(--build-workshop-body-font-size, 1.4rem);
  line-height: 1.35;
`;

const stepClass = css`
  display: grid;
  grid-template-columns: 1.8rem minmax(0, 1fr);
  gap: 0.6rem;
  align-items: start;
`;

const stepMarkClass = css`
  margin-top: 0.15rem;
  width: 1.6rem;
  height: 1.6rem;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 0.9rem;
  border: 2px solid ${Color.goldOrange(0.7)};
  background: #fff;
`;

const stepDoneMarkClass = css`
  border-color: ${Color.emerald()};
  background: ${Color.emerald()};
  color: #fff;
`;

const fixingClass = css`
  display: flex;
  gap: 0.6rem;
  align-items: baseline;
  margin: 0.4rem 0 0.2rem;
  padding: 0.6rem 0.9rem;
  border-radius: 10px;
  background: #fff;
  color: ${Color.darkAmber()};
  font-size: var(--build-workshop-label-font-size, 1.2rem);
  font-weight: 700;
  line-height: 1.4;
  svg {
    flex-shrink: 0;
    color: ${Color.goldOrange()};
  }
`;

const nextNoteClass = css`
  margin: 0.8rem 0 0;
  font-size: var(--build-workshop-label-font-size, 1.2rem);
  color: ${Color.darkAmber()};
  line-height: 1.4;
  text-align: center;
`;

const replanClass = css`
  display: flex;
  align-items: flex-start;
  gap: 0.8rem;
  margin: 0 1.2rem 1.2rem;
  padding: 0.9rem 1rem;
  border-radius: 12px;
  background: ${Color.violet(0.08)};
  border: 1px solid ${Color.violet(0.25)};
  color: ${roadmapInk};
`;

const replanIconClass = css`
  flex-shrink: 0;
  margin-top: 0.2rem;
  color: ${Color.violet()};
`;

const replanTextClass = css`
  flex: 1;
  min-width: 0;
  font-size: var(--build-workshop-label-font-size, 1.2rem);
  line-height: 1.4;
  b {
    display: block;
    font-size: var(--build-workshop-body-font-size, 1.4rem);
    font-weight: 800;
    color: ${Color.violet()};
  }
  span {
    color: ${roadmapMuted};
  }
`;

const replanCloseClass = css`
  flex-shrink: 0;
  border: 0;
  background: none;
  padding: 0.2rem 0.4rem;
  color: ${roadmapMuted};
  cursor: pointer;
  &:hover,
  &:focus-visible {
    color: ${roadmapInk};
  }
`;

const stopRowClass = css`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.8rem;
  padding: 0 1.4rem 1.2rem;
  font-size: var(--build-workshop-label-font-size, 1.2rem);
  color: ${roadmapMuted};
`;

const textButtonClass = css`
  border: 0;
  background: none;
  padding: 0.3rem 0.4rem;
  font: inherit;
  font-weight: 700;
  color: ${roadmapMuted};
  cursor: pointer;
  &:hover,
  &:focus-visible {
    color: ${roadmapInk};
    text-decoration: underline;
  }
  &:disabled {
    opacity: 0.5;
    cursor: default;
  }
`;

export default function RoadmapPanel({
  view,
  collapsed,
  generating,
  canAct,
  disabled,
  busyAction,
  onToggleCollapsed,
  onAction,
  replanNotice,
  onDismissReplan
}: {
  replanNotice?: { reason: string } | null;
  onDismissReplan?: () => void;
  view: RoadmapView;
  collapsed: boolean;
  generating: boolean;
  canAct: boolean;
  disabled?: boolean;
  busyAction?: RoadmapAction | null;
  onToggleCollapsed: () => void;
  onAction: (action: RoadmapAction) => void;
}) {
  const [confirmingStop, setConfirmingStop] = useState(false);
  const progress = view.total > 0 ? view.doneCount / view.total : 0;
  const current = view.current;
  const upNext = Boolean(current && !current.started && !generating);
  // The milestone's acceptance criteria are the real checklist (ticked only
  // when Lumine's checker saw them work); plain steps are the fallback.
  const checklist = current
    ? current.criteria.length > 0
      ? current.criteria
      : current.steps
    : [];
  // NEEDS_WORK says what is being fixed; otherwise the hand-off's "Next: …".
  const fixingNote = current?.fixingNote || '';
  const nextNote = !fixingNote && !upNext ? view.nextNote : '';
  const bodyId = `build-roadmap-panel-${view.buildId}`;
  const bar = (
    <div className={barClass} aria-hidden>
      <i
        className={barFillClass}
        style={{ width: `${Math.max(progress * 100, progress > 0 ? 4 : 0)}%` }}
      />
    </div>
  );
  return (
    <section
      className={panelClass}
      aria-label={`Build plan: ${view.title}, ${view.doneCount} of ${view.total} milestones done`}
    >
      <button
        type="button"
        className={headClass}
        aria-expanded={!collapsed}
        aria-controls={bodyId}
        onClick={onToggleCollapsed}
      >
        <span className={headTextClass}>
          <span className={kickerClass} style={{ color: roadmapMuted }}>
            Your build plan
          </span>
          <span className={headTitleClass}>{view.title}</span>
          {collapsed ? (
            <span className={collapsedRowClass}>
              <span style={{ flex: 1 }}>{bar}</span>
              <span
                style={{
                  fontSize: 'var(--build-workshop-label-font-size, 1.2rem)',
                  color: roadmapMuted,
                  whiteSpace: 'nowrap'
                }}
              >
                {view.doneCount} of {view.total} done
              </span>
            </span>
          ) : null}
        </span>
        {!collapsed && view.daysLeft > 0 ? (
          <span className={`${pillClass} ${energyPillClass}`}>
            <Icon icon="bolt" />
            {formatRoadmapDaysLeft(view.daysLeft)}
          </span>
        ) : null}
        <Icon
          icon="chevron-down"
          className={chevronClass}
          style={{ transform: collapsed ? 'none' : 'rotate(180deg)' }}
        />
      </button>
      {replanNotice ? (
        <div className={replanClass} role="status">
          <Icon icon="wand-magic-sparkles" className={replanIconClass} />
          <span className={replanTextClass}>
            <b>Build plan updated</b>
            <span>{replanNotice.reason}</span>
          </span>
          {onDismissReplan ? (
            <button
              type="button"
              className={replanCloseClass}
              aria-label="Dismiss build plan update"
              onClick={onDismissReplan}
            >
              <Icon icon="times" />
            </button>
          ) : null}
        </div>
      ) : null}
      {collapsed ? null : (
        <div id={bodyId} className={bodyClass}>
          <div style={{ padding: '0 1.4rem' }}>{bar}</div>
          <div className={barLabelClass}>
            <span>
              {view.doneCount} of {view.total} done
            </span>
          </div>
          {current ? (
            <div className={nowCardClass}>
              <div className={kickerClass} style={{ color: Color.darkAmber() }}>
                {upNext ? 'Up next' : 'Now building'} · milestone{' '}
                {current.number}
              </div>
              <h5 className={nowTitleClass}>{current.title}</h5>
              {fixingNote ? (
                <p className={fixingClass}>
                  <Icon icon="wrench" />
                  <span>{fixingNote}</span>
                </p>
              ) : null}
              {checklist.length > 0 ? (
                <ul className={stepsClass}>
                  {checklist.map((step) => (
                    <li
                      key={step.id}
                      className={stepClass}
                      style={{
                        color: step.done ? Color.emerald() : roadmapInk
                      }}
                    >
                      <span
                        className={`${stepMarkClass}${
                          step.done ? ` ${stepDoneMarkClass}` : ''
                        }`}
                        aria-hidden
                      >
                        {step.done ? <Icon icon="check" /> : null}
                      </span>
                      <span
                        aria-label={
                          step.done ? `${step.title} (done)` : undefined
                        }
                      >
                        {step.title}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
              {canAct && !generating ? (
                <Button
                  color="violet"
                  variant="solid"
                  uppercase={false}
                  stretch
                  className={`${roadmapButtonClass} ${primaryButtonClass}`}
                  disabled={disabled || Boolean(busyAction)}
                  loading={busyAction === 'start' || busyAction === 'continue'}
                  onClick={() => onAction(upNext ? 'start' : 'continue')}
                >
                  {upNext ? `Start milestone ${current.number}` : 'Keep going'}
                </Button>
              ) : null}
              {nextNote ? <p className={nextNoteClass}>{nextNote}</p> : null}
            </div>
          ) : null}
          <RoadmapLevelMap milestones={view.milestones} />
          {canAct && !generating ? (
            <div className={stopRowClass}>
              {confirmingStop ? (
                <>
                  <span>Stop this build plan? Your game stays as it is.</span>
                  <button
                    type="button"
                    className={textButtonClass}
                    style={{ color: Color.rose() }}
                    disabled={Boolean(busyAction)}
                    onClick={() => onAction('cancel')}
                  >
                    Stop it
                  </button>
                  <button
                    type="button"
                    className={textButtonClass}
                    onClick={() => setConfirmingStop(false)}
                  >
                    Keep it
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className={textButtonClass}
                  onClick={() => setConfirmingStop(true)}
                >
                  Stop build plan
                </button>
              )}
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
