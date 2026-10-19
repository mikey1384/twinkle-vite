import React, { useLayoutEffect, useRef, useState } from 'react';
import { css } from '@emotion/css';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { Color } from '~/constants/css';
import {
  formatEnergyDays,
  formatRoadmapPlanDaysLeft,
  formatRoadmapOverEstimate,
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

// In the chat panel's fixed-height column the plan may shrink, but never
// below its head (min-height is set from the measured head, plus room to
// scroll to the choices while a milestone is stalled); the body scrolls.
const panelClass = css`
  flex: 0 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  margin: 1rem 1.2rem 0;
  background: #fff;
  border: 1px solid ${roadmapLine};
  border-radius: 16px;
  overflow: hidden;
  color: ${roadmapInk};
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
`;

// While stalled, the body keeps at least this much height so the choices
// can be scrolled to even on the shortest columns (one choice button + air).
const STALL_SCROLL_MIN_PX = 64;

const bodyClass = css`
  flex: 0 1 auto;
  min-height: 0;
  max-height: 46vh;
  overflow-y: auto;
  overscroll-behavior: contain;
`;

// The head is a grid, never absolutely positioned pieces: kicker and chevron
// share the first row, the title owns the second (two lines at most), and
// the days chip / progress bar get their own row, so nothing can overlap at
// narrow chat-panel widths (Oct 2026: 310px tablet column).
const headClass = css`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  column-gap: 0.8rem;
  row-gap: 0.45rem;
  flex-shrink: 0;
  width: 100%;
  padding: 1.2rem 1.4rem;
  @media (max-height: 560px) {
    padding: 0.8rem 1.2rem;
    row-gap: 0.3rem;
  }
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

const headKickerClass = css`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const headTitleClass = css`
  grid-column: 1 / -1;
  min-width: 0;
  font-size: var(--build-workshop-title-font-size, 1.6rem);
  font-weight: 800;
  line-height: 1.2;
  overflow-wrap: anywhere;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

// Short screens (landscape tablets, an open keyboard): the chip steps aside
// so the head stays small; the body still says how long it is taking.
const headChipsClass = css`
  @media (max-height: 560px) {
    display: none !important;
  }
  grid-column: 1 / -1;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
`;

// Chips may wrap their own text on the narrowest panels instead of pushing
// past the edge (pillClass is nowrap for the wider cards).
const headChipClass = css`
  max-width: 100%;
  white-space: normal;
  text-align: left;
`;

const overEstimateChipClass = css`
  border-color: ${Color.orange(0.45)};
  background: ${Color.orange(0.08)};
  color: ${Color.darkAmber()};
  svg {
    color: ${Color.orange()};
  }
`;

const chevronClass = css`
  flex-shrink: 0;
  color: ${roadmapMuted};
  transition: transform 0.2s ease;
`;

const collapsedRowClass = css`
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  gap: 0.8rem;
  min-width: 0;
`;

const stallBoxClass = css`
  margin: 0.6rem 0 1rem;
  padding: 0.9rem 1rem;
  border-radius: 12px;
  background: #fff;
  border: 1px solid ${Color.orange(0.35)};
  font-size: var(--build-workshop-body-font-size, 1.4rem);
  line-height: 1.4;
  b {
    display: block;
    margin-bottom: 0.3rem;
    color: ${Color.darkAmber()};
  }
  p {
    margin: 0;
    color: ${roadmapInk};
  }
`;

const stallChoicesClass = css`
  display: grid;
  gap: 0.6rem;
  margin-bottom: 1rem;
  > :first-child {
    margin-bottom: 0.4rem;
  }
`;

const spentNoteClass = css`
  margin: 0.2rem 0 0.8rem;
  font-size: var(--build-workshop-label-font-size, 1.2rem);
  color: ${Color.darkAmber()};
  line-height: 1.4;
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
  const stall = current?.stall || null;
  const stalled = Boolean(stall);
  // When the checker could not see the code, more tries will not settle it:
  // "It works, mark it done" leads and Keep trying is offered last-but-one.
  const stallChoices: Array<{
    action: RoadmapAction;
    label: string;
    color: string;
  }> =
    stall?.reason === 'unverified'
      ? [
          { action: 'mark_done', label: 'It works, mark it done', color: 'green' },
          { action: 'replan_milestone', label: 'Re-plan it into smaller steps', color: 'violet' },
          { action: 'keep_trying', label: 'Keep trying anyway', color: 'violet' },
          { action: 'next_milestone', label: 'Move on to the next milestone', color: 'darkerGray' }
        ]
      : [
          { action: 'keep_trying', label: 'Keep trying', color: 'violet' },
          { action: 'mark_done', label: 'It works, mark it done', color: 'green' },
          { action: 'replan_milestone', label: 'Re-plan it into smaller steps', color: 'violet' },
          { action: 'next_milestone', label: 'Move on to the next milestone', color: 'darkerGray' }
        ];
  const fixingNote = stalled ? '' : current?.fixingNote || '';
  const nextNote = !fixingNote && !upNext ? view.nextNote : '';
  const bodyId = `build-roadmap-panel-${view.buildId}`;
  // The panel's floor: its head (title, chip), never clipped on short
  // columns, plus a scrollable strip for a stall's choices.
  const headRef = useRef<HTMLButtonElement | null>(null);
  const [headHeight, setHeadHeight] = useState(0);
  useLayoutEffect(() => {
    const head = headRef.current;
    if (!head) return;
    const measure = () =>
      setHeadHeight(Math.ceil(head.getBoundingClientRect().height));
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(head);
    return () => observer.disconnect();
  }, []);
  const panelMinHeight = headHeight
    ? headHeight + 2 + (stalled && canAct && !collapsed ? STALL_SCROLL_MIN_PX : 0)
    : undefined;
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
      style={panelMinHeight ? { minHeight: panelMinHeight } : undefined}
      aria-label={`Build plan: ${view.title}, ${view.doneCount} of ${view.total} milestones done`}
    >
      <button
        ref={headRef}
        type="button"
        className={headClass}
        aria-expanded={!collapsed}
        aria-controls={bodyId}
        onClick={onToggleCollapsed}
      >
        <span
          className={`${kickerClass} ${headKickerClass}`}
          style={{ color: roadmapMuted }}
        >
          Your build plan
        </span>
        <Icon
          icon="chevron-down"
          className={chevronClass}
          style={{ transform: collapsed ? 'none' : 'rotate(180deg)' }}
        />
        <span className={headTitleClass} title={view.title}>
          {view.title}
        </span>
        {collapsed ? (
          <span className={collapsedRowClass}>
            <span style={{ flex: 1, minWidth: 0 }}>{bar}</span>
            <span
              style={{
                fontSize: 'var(--build-workshop-label-font-size, 1.2rem)',
                color: stalled ? Color.darkAmber() : roadmapMuted,
                whiteSpace: 'nowrap'
              }}
            >
              {stalled
                ? canAct
                  ? 'Needs your choice'
                  : 'Waiting for the owner'
                : `${view.doneCount} of ${view.total} done`}
            </span>
          </span>
        ) : view.daysLeft > 0 ? (
          <span className={headChipsClass}>
            <span
              className={`${pillClass} ${energyPillClass} ${headChipClass}${
                view.overEstimate ? ` ${overEstimateChipClass}` : ''
              }`}
            >
              <Icon icon={view.overEstimate ? 'hourglass-half' : 'bolt'} />
              {view.overEstimate
                ? formatRoadmapOverEstimate(view)
                : formatRoadmapPlanDaysLeft(view.daysLeft)}
            </span>
          </span>
        ) : null}
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
              {/* While stalled, the stall message already says it is over
                  budget; dropping the note keeps the choices above the fold. */}
              {view.overEstimate &&
              !upNext &&
              !stall &&
              formatEnergyDays(view.overEstimate.spentDays) !==
                formatEnergyDays(view.overEstimate.estimateDays) ? (
                <p className={spentNoteClass}>
                  Used about {formatEnergyDays(view.overEstimate.spentDays)} of
                  Energy so far (planned{' '}
                  {formatEnergyDays(view.overEstimate.estimateDays)}).
                </p>
              ) : null}
              {stall ? (
                <div className={stallBoxClass} role="status">
                  <p>
                    {stall.message}{' '}
                    {canAct
                      ? 'What should we do?'
                      : 'Lumine is waiting for the owner to choose what happens next.'}
                  </p>
                </div>
              ) : null}
              {/* The choices sit right under the question, before the checklist,
                  so they are visible without scrolling on a narrow panel. */}
              {canAct && !generating && stall ? (
                <div className={stallChoicesClass}>
                  {stallChoices.map((choice, index) => (
                    <Button
                      key={choice.action}
                      color={choice.color}
                      variant={index === 0 ? 'solid' : 'soft'}
                      uppercase={false}
                      stretch
                      className={`${roadmapButtonClass}${
                        index === 0 ? ` ${primaryButtonClass}` : ''
                      }`}
                      disabled={disabled || Boolean(busyAction)}
                      loading={busyAction === choice.action}
                      onClick={() => onAction(choice.action)}
                    >
                      {choice.label}
                    </Button>
                  ))}
                </div>
              ) : null}
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
              {canAct && !generating && !stall ? (
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
