import React from 'react';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import { Color } from '~/constants/css';
import type { RoadmapMilestoneView } from '../../helpers/roadmap';
import { glowRingClass, pulseClass, roadmapMuted } from './styles';

const NODE = 3;
const NOW_NODE = 3.8;

const wrapClass = css`
  padding: 0.4rem 0.8rem 1.4rem;
`;

const mapClass = css`
  position: relative;
  display: grid;
  align-items: start;
  list-style: none;
  margin: 0;
  padding: 0;
`;

const trackClass = css`
  position: absolute;
  top: calc(${NOW_NODE / 2}rem - 2px);
  height: 0;
  border-top: 4px dashed #d9deea;
`;

const trackDoneClass = css`
  position: absolute;
  top: calc(${NOW_NODE / 2}rem - 2px);
  height: 4px;
  border-radius: 999px;
  background: ${Color.emerald()};
`;

const cellClass = css`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.55rem;
  min-width: 0;
`;

const nodeSlotClass = css`
  height: ${NOW_NODE}rem;
  display: grid;
  place-items: center;
`;

const nodeClass = css`
  position: relative;
  width: ${NODE}rem;
  height: ${NODE}rem;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: #fff;
  border: 2px solid #d9deea;
  color: #9aa3b6;
  font-weight: 800;
  font-size: 1.25rem;
  line-height: 1;
`;

const doneNodeClass = css`
  background: ${Color.emerald()};
  border-color: ${Color.emerald()};
  color: #fff;
  font-size: 1.1rem;
`;

const nowNodeClass = css`
  width: ${NOW_NODE}rem;
  height: ${NOW_NODE}rem;
  background: ${Color.goldOrange()};
  border: 3px solid #fff;
  color: #fff;
  font-size: 1.4rem;
  box-shadow: 0 0 0 3px ${Color.goldOrange(0.45)};
`;

const goalNodeClass = css`
  border-color: ${Color.violet()};
  background: ${Color.violet(0.1)};
  color: ${Color.violet()};
  font-size: 1.3rem;
`;

const labelClass = css`
  max-width: 100%;
  padding: 0 0.15rem;
  text-align: center;
  font-size: var(--build-workshop-tiny-font-size, 1rem);
  line-height: 1.25;
  color: ${roadmapMuted};
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow-wrap: anywhere;
`;

/* One long word ("Leaderboards") ellipsizes instead of splitting mid-word. */
const singleWordLabelClass = css`
  display: block;
  white-space: nowrap;
  text-overflow: ellipsis;
`;

const nowLabelClass = css`
  font-weight: 800;
  color: ${Color.darkAmber()};
`;

const doneLabelClass = css`
  color: ${Color.emerald()};
  font-weight: 700;
`;

export default function RoadmapLevelMap({
  milestones,
  showLabels = true
}: {
  milestones: RoadmapMilestoneView[];
  showLabels?: boolean;
}) {
  const count = milestones.length;
  if (count === 0) return null;
  // The track runs from the first node's center to the last node's center.
  const edge = `${100 / (2 * count)}%`;
  const reachedIndex = Math.max(
    milestones.findIndex((milestone) => milestone.state === 'now'),
    milestones.filter((milestone) => milestone.state === 'done').length - 1,
    0
  );
  const doneFraction = count > 1 ? reachedIndex / (count - 1) : 0;
  return (
    <div className={wrapClass}>
      <ol
        className={mapClass}
        style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}
        aria-label="Build plan level map"
      >
        <span
          aria-hidden
          className={trackClass}
          style={{ left: edge, right: edge }}
        />
        {doneFraction > 0 ? (
          <span
            aria-hidden
            className={trackDoneClass}
            style={{
              left: edge,
              width: `calc((100% - ${100 / count}%) * ${doneFraction})`
            }}
          />
        ) : null}
        {milestones.map((milestone, index) => {
          const isGoal = index === count - 1;
          const stateClass =
            milestone.state === 'done'
              ? doneNodeClass
              : milestone.state === 'now'
                ? `${nowNodeClass} ${pulseClass}`
                : isGoal
                  ? goalNodeClass
                  : '';
          const stateLabel =
            milestone.state === 'done'
              ? 'done'
              : milestone.state === 'now'
                ? 'building now'
                : 'not started';
          return (
            <li
              key={milestone.id}
              className={cellClass}
              title={`${milestone.number}. ${milestone.title}`}
              aria-label={`Milestone ${milestone.number}: ${milestone.title} (${stateLabel})`}
            >
              <div className={nodeSlotClass}>
                <div className={`${nodeClass} ${stateClass}`}>
                  {milestone.state === 'now' ? (
                    <span aria-hidden className={glowRingClass} />
                  ) : null}
                  <span style={{ position: 'relative' }}>
                    {isGoal ? (
                      <Icon icon="trophy" />
                    ) : milestone.state === 'done' ? (
                      <Icon icon="star" />
                    ) : (
                      milestone.number
                    )}
                  </span>
                </div>
              </div>
              {showLabels ? (
                <span
                  className={`${labelClass}${
                    /\s/.test(milestone.label) ? '' : ` ${singleWordLabelClass}`
                  }${
                    milestone.state === 'now'
                      ? ` ${nowLabelClass}`
                      : milestone.state === 'done'
                        ? ` ${doneLabelClass}`
                        : ''
                  }`}
                >
                  {milestone.label}
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
