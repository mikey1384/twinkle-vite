import React from 'react';
import { css } from '@emotion/css';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { Color } from '~/constants/css';
import type { RoadmapAction, RoadmapView } from '../../helpers/roadmap';
import { primaryButtonClass, roadmapInk, roadmapMuted } from './styles';

// The open proposal, folded to one line once the chat has moved past its
// card: Start stays one tap away and View brings the full card back.
const stripClass = css`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 1rem 1.2rem 0;
  padding: 0.9rem 1rem 0.9rem 1.2rem;
  border-radius: 14px;
  border: 2px solid ${Color.violet(0.55)};
  background: ${Color.violet(0.07)};
  color: ${roadmapInk};
`;

const iconClass = css`
  flex-shrink: 0;
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: ${Color.violet()};
  color: #fff;
  font-size: 1.3rem;
`;

const textClass = css`
  flex: 1;
  min-width: 0;
  line-height: 1.25;
  b {
    display: block;
    font-size: var(--build-workshop-body-font-size, 1.4rem);
    font-weight: 800;
  }
  span {
    display: block;
    font-size: var(--build-workshop-label-font-size, 1.2rem);
    color: ${roadmapMuted};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

const startClass = css`
  flex-shrink: 0;
  border-radius: 10px !important;
  font-weight: 800 !important;
  white-space: nowrap;
`;

const viewClass = css`
  flex-shrink: 0;
  border: 0;
  background: none;
  padding: 0.5rem 0.4rem;
  font: inherit;
  font-size: var(--build-workshop-label-font-size, 1.2rem);
  font-weight: 800;
  color: ${Color.violet()};
  cursor: pointer;
  &:hover,
  &:focus-visible {
    text-decoration: underline;
  }
`;

export default function RoadmapProposalStrip({
  view,
  canAct,
  disabled,
  busyAction,
  onAction,
  onView
}: {
  view: RoadmapView;
  canAct: boolean;
  disabled?: boolean;
  busyAction?: RoadmapAction | null;
  onAction: (action: RoadmapAction) => void;
  onView: () => void;
}) {
  return (
    <section className={stripClass} aria-label="Your build plan is ready">
      <span className={iconClass} aria-hidden>
        <Icon icon="flag" />
      </span>
      <span className={textClass}>
        <b>Your build plan is ready</b>
        <span>
          {view.title} · {view.total} milestones
        </span>
      </span>
      {canAct ? (
        <Button
          color="violet"
          variant="solid"
          size="sm"
          uppercase={false}
          className={`${startClass} ${primaryButtonClass}`}
          disabled={disabled || Boolean(busyAction)}
          loading={busyAction === 'start'}
          onClick={() => onAction('start')}
        >
          Start milestone {view.current?.number || 1}
        </Button>
      ) : null}
      <button type="button" className={viewClass} onClick={onView}>
        View
      </button>
    </section>
  );
}
