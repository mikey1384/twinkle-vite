import React from 'react';
import { css, keyframes } from '@emotion/css';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { Color } from '~/constants/css';
import type { RoadmapView } from '../../helpers/roadmap';
import Confetti from './Confetti';
import RoadmapLevelMap from './RoadmapLevelMap';
import {
  ghostButtonClass,
  primaryButtonClass,
  roadmapButtonClass,
  roadmapInk,
  roadmapMuted
} from './styles';

export interface RoadmapPublishControl {
  label: string;
  busy?: boolean;
  onPublish: () => void;
}

const popIn = keyframes`
  0% { transform: scale(0.94); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
`;

const cardClass = css`
  position: relative;
  align-self: stretch;
  max-width: 46rem;
  width: 100%;
  overflow: hidden;
  border-radius: 16px;
  border: 2px solid ${Color.violet()};
  background: #fff;
  color: ${roadmapInk};
  text-align: center;
  animation: ${popIn} 0.35s ease-out 1 both;
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const topClass = css`
  position: relative;
  padding: 2rem 1.8rem 1.2rem;
  background: ${Color.violet(0.09)};
`;

const trophyClass = css`
  width: 6.4rem;
  height: 6.4rem;
  margin: 0 auto;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 3rem;
  color: #fff;
  background: ${Color.goldOrange()};
  border: 4px solid #fff;
  box-shadow: 0 0 0 4px ${Color.goldOrange(0.4)};
`;

const titleClass = css`
  margin: 1rem 0 0.4rem;
  font-size: calc(var(--build-workshop-title-font-size, 1.6rem) * 1.3);
  font-weight: 800;
  line-height: 1.2;
`;

const textClass = css`
  margin: 0;
  font-size: var(--build-workshop-body-font-size, 1.4rem);
  line-height: 1.5;
  color: ${roadmapMuted};
`;

const actionsClass = css`
  display: grid;
  gap: 0.8rem;
  padding: 0.4rem 1.6rem 1.2rem;
`;

const closeClass = css`
  border: 0;
  background: none;
  padding: 0.4rem 0.8rem 1.4rem;
  font: inherit;
  font-size: var(--build-workshop-label-font-size, 1.2rem);
  font-weight: 700;
  color: ${roadmapMuted};
  cursor: pointer;
  &:hover,
  &:focus-visible {
    color: ${roadmapInk};
    text-decoration: underline;
  }
`;

export default function RoadmapCompleteCard({
  view,
  canAct,
  publishControl,
  onPlay,
  onClose
}: {
  view: RoadmapView;
  canAct: boolean;
  publishControl?: RoadmapPublishControl | null;
  onPlay?: () => void;
  onClose?: () => void;
}) {
  return (
    <section className={cardClass} aria-label="Build plan complete">
      <div className={topClass}>
        <Confetti />
        <div className={trophyClass}>
          <Icon icon="trophy" />
        </div>
        <h4 className={titleClass}>Build plan complete!</h4>
        {/* Lumine's message carries the publish nudge; the card just
            celebrates and offers the buttons. */}
        <p className={textClass}>
          You built all {view.total} milestones of {view.title}.
        </p>
      </div>
      <RoadmapLevelMap milestones={view.milestones} />
      {canAct ? (
        <div className={actionsClass}>
          {publishControl ? (
            <Button
              color="violet"
              variant="solid"
              uppercase={false}
              stretch
              className={`${roadmapButtonClass} ${primaryButtonClass}`}
              loading={publishControl.busy}
              onClick={publishControl.onPublish}
            >
              <Icon icon="rocket" />
              {publishControl.label}
            </Button>
          ) : null}
          {onPlay ? (
            <Button
              color="white"
              variant="outline"
              uppercase={false}
              stretch
              className={`${roadmapButtonClass} ${ghostButtonClass}`}
              onClick={onPlay}
            >
              <Icon icon="play" />
              Play it now
            </Button>
          ) : null}
        </div>
      ) : null}
      {onClose ? (
        <button type="button" className={closeClass} onClick={onClose}>
          Close build plan
        </button>
      ) : null}
    </section>
  );
}
