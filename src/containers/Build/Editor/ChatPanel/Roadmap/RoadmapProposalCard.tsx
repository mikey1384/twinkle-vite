import React from 'react';
import { css } from '@emotion/css';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { Color } from '~/constants/css';
import {
  formatMoreMilestones,
  formatPlayableLine,
  formatRoadmapEnergyTotal,
  type RoadmapAction,
  type RoadmapView
} from '../../helpers/roadmap';
import {
  energyPillClass,
  ghostButtonClass,
  kickerClass,
  pillClass,
  primaryButtonClass,
  roadmapButtonClass,
  roadmapInk,
  roadmapLine,
  roadmapMuted
} from './styles';

const SHOWN_MILESTONES = 3;

const cardClass = css`
  align-self: stretch;
  max-width: 46rem;
  width: 100%;
  background: #fff;
  border: 2px solid ${Color.violet()};
  border-radius: 16px;
  overflow: hidden;
  color: ${roadmapInk};
`;

const topClass = css`
  padding: 1.4rem 1.6rem 1.2rem;
  background: ${Color.violet(0.09)};
`;

const titleClass = css`
  margin: 0.6rem 0 0;
  font-size: calc(var(--build-workshop-title-font-size, 1.6rem) * 1.2);
  font-weight: 800;
  line-height: 1.2;
  color: ${roadmapInk};
`;

const metaClass = css`
  display: flex;
  flex-wrap: wrap;
  gap: 0.7rem;
  margin-top: 1rem;
`;

const pathClass = css`
  list-style: none;
  margin: 0;
  padding: 1.4rem 1.6rem 0.2rem;
`;

const stopClass = css`
  position: relative;
  display: grid;
  grid-template-columns: 3.4rem minmax(0, 1fr);
  gap: 1.1rem;
  padding-bottom: 1.3rem;
  &:not(:last-child)::before {
    content: '';
    position: absolute;
    left: 1.6rem;
    top: 3.4rem;
    bottom: 0;
    width: 2px;
    background: ${roadmapLine};
  }
`;

const dotClass = css`
  position: relative;
  z-index: 1;
  width: 3.4rem;
  height: 3.4rem;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-weight: 800;
  font-size: 1.4rem;
  background: #fff;
  border: 2px solid ${roadmapLine};
  color: ${roadmapMuted};
`;

const firstDotClass = css`
  background: ${Color.violet()};
  border-color: ${Color.violet()};
  color: #fff;
`;

const stopTitleClass = css`
  display: block;
  font-size: var(--build-workshop-body-font-size, 1.4rem);
  font-weight: 800;
  line-height: 1.35;
  padding-top: 0.5rem;
`;

const stopPlayClass = css`
  display: block;
  margin-top: 0.15rem;
  font-size: var(--build-workshop-label-font-size, 1.2rem);
  color: ${roadmapMuted};
  line-height: 1.4;
`;

const moreClass = css`
  margin: 0;
  padding: 0 1.6rem 1rem calc(1.6rem + 3.4rem + 1.1rem);
  font-size: var(--build-workshop-label-font-size, 1.2rem);
  color: ${roadmapMuted};
  line-height: 1.4;
`;

const honestClass = css`
  margin: 0;
  padding: 0.4rem 1.6rem 1.4rem;
  font-size: var(--build-workshop-label-font-size, 1.2rem);
  color: ${roadmapMuted};
  line-height: 1.5;
`;

const actionsClass = css`
  display: grid;
  gap: 0.8rem;
  padding: 1.3rem 1.6rem 1.6rem;
  border-top: 1px solid ${roadmapLine};
`;

export default function RoadmapProposalCard({
  domId,
  view,
  canAct,
  disabled,
  busyAction,
  onAction
}: {
  domId?: string;
  view: RoadmapView;
  canAct: boolean;
  disabled?: boolean;
  busyAction?: RoadmapAction | null;
  onAction: (action: RoadmapAction) => void;
}) {
  const shown = view.milestones.slice(0, SHOWN_MILESTONES);
  const more = formatMoreMilestones(view.milestones, SHOWN_MILESTONES);
  const anyBusy = Boolean(busyAction);
  return (
    <section
      id={domId}
      className={cardClass}
      aria-label={`Build plan: ${view.title}`}
    >
      <div className={topClass}>
        <div className={kickerClass} style={{ color: Color.violet() }}>
          Your build plan
        </div>
        <h3 className={titleClass}>{view.title}</h3>
        <div className={metaClass}>
          <span className={pillClass}>
            {view.total} milestone{view.total === 1 ? '' : 's'}
          </span>
          {view.energyDays > 0 ? (
            <span className={`${pillClass} ${energyPillClass}`}>
              <Icon icon="bolt" />
              {formatRoadmapEnergyTotal(view.energyDays)}
            </span>
          ) : null}
        </div>
      </div>
      <ol className={pathClass}>
        {shown.map((milestone, index) => {
          const playLine = formatPlayableLine(milestone.playable);
          return (
            <li key={milestone.id} className={stopClass}>
              <div
                className={`${dotClass}${index === 0 ? ` ${firstDotClass}` : ''}`}
                aria-hidden
              >
                {milestone.number}
              </div>
              <div>
                <b className={stopTitleClass}>{milestone.title}</b>
                {playLine ? (
                  <span className={stopPlayClass}>{playLine}</span>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
      {more ? <p className={moreClass}>{more}</p> : null}
      {view.hardestNote ? (
        <p className={honestClass}>{view.hardestNote}</p>
      ) : null}
      {canAct ? (
        <div className={actionsClass}>
          <Button
            color="violet"
            variant="solid"
            uppercase={false}
            stretch
            className={`${roadmapButtonClass} ${primaryButtonClass}`}
            disabled={disabled || (anyBusy && busyAction !== 'start')}
            loading={busyAction === 'start'}
            onClick={() => onAction('start')}
          >
            Start milestone {view.current?.number || 1}
          </Button>
          {view.smaller ? (
            <Button
              color="logoBlue"
              variant="soft"
              uppercase={false}
              stretch
              className={roadmapButtonClass}
              disabled={disabled || (anyBusy && busyAction !== 'smaller')}
              loading={busyAction === 'smaller'}
              onClick={() => onAction('smaller')}
            >
              {view.smaller.label}
            </Button>
          ) : null}
          <Button
            color="white"
            variant="outline"
            uppercase={false}
            stretch
            className={`${roadmapButtonClass} ${ghostButtonClass}`}
            disabled={disabled || (anyBusy && busyAction !== 'skip')}
            loading={busyAction === 'skip'}
            onClick={() => onAction('skip')}
          >
            Just build it, no plan
          </Button>
        </div>
      ) : null}
    </section>
  );
}
