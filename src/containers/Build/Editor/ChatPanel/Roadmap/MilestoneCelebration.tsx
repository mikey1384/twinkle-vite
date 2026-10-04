import React from 'react';
import { css, keyframes } from '@emotion/css';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { Color } from '~/constants/css';
import {
  formatMilestoneDoneTitle,
  formatNextMilestoneRibbon,
  type RoadmapAction,
  type RoadmapView
} from '../../helpers/roadmap';
import Confetti from './Confetti';
import {
  ghostButtonClass,
  primaryButtonClass,
  roadmapButtonClass
} from './styles';

const popIn = keyframes`
  0% { transform: scale(0.94); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
`;

const wrapClass = css`
  align-self: stretch;
  display: grid;
  gap: 1.2rem;
  max-width: 46rem;
  width: 100%;
`;

const cardClass = css`
  position: relative;
  overflow: hidden;
  border-radius: 16px;
  background: ${Color.emerald()};
  color: #fff;
  padding: 1.8rem 1.8rem 1.6rem;
  text-align: center;
  animation: ${popIn} 0.35s ease-out 1 both;
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const bigClass = css`
  font-size: 4rem;
  line-height: 1;
`;

const titleClass = css`
  margin: 0.8rem 0 0.4rem;
  font-size: calc(var(--build-workshop-title-font-size, 1.6rem) * 1.2);
  font-weight: 800;
  line-height: 1.25;
`;

const textClass = css`
  margin: 0 0 1.3rem;
  font-size: var(--build-workshop-body-font-size, 1.4rem);
  line-height: 1.45;
  opacity: 0.94;
`;

const playButtonClass = css`
  background: #fff !important;
  border-color: #fff !important;
  color: ${Color.emerald()} !important;
  @media (hover: hover) and (pointer: fine) {
    &:hover {
      background: ${Color.white(0.9)} !important;
    }
  }
`;

const ribbonClass = css`
  display: inline-block;
  margin-top: 1.1rem;
  padding: 0.5rem 1.1rem;
  border-radius: 999px;
  background: ${Color.white(0.16)};
  font-size: var(--build-workshop-label-font-size, 1.2rem);
  font-weight: 700;
  line-height: 1.3;
`;

const offerActionsClass = css`
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
`;

export default function MilestoneCelebration({
  view,
  canAct,
  disabled,
  busyAction,
  onAction,
  onPlay,
  onTomorrow
}: {
  view: RoadmapView;
  canAct: boolean;
  disabled?: boolean;
  busyAction?: RoadmapAction | null;
  onAction: (action: RoadmapAction) => void;
  onPlay?: () => void;
  onTomorrow: () => void;
}) {
  const done = view.lastDone;
  const next = view.current;
  if (!done) return null;
  const body = done.summary || (done.playable ? `${done.playable}.` : '');
  return (
    <div className={wrapClass}>
      <section
        className={cardClass}
        aria-label={formatMilestoneDoneTitle(done)}
      >
        <Confetti />
        <div className={bigClass} aria-hidden>
          🎉
        </div>
        <h4 className={titleClass}>{formatMilestoneDoneTitle(done)}</h4>
        {body ? <p className={textClass}>{body}</p> : null}
        {onPlay ? (
          <Button
            color="white"
            variant="solid"
            uppercase={false}
            stretch
            className={`${roadmapButtonClass} ${playButtonClass}`}
            onClick={onPlay}
          >
            <Icon icon="play" />
            Play it now
          </Button>
        ) : null}
        <div className={ribbonClass}>{formatNextMilestoneRibbon(view)}</div>
      </section>
      {/* Lumine's own message already asks "Want me to start milestone
          k+1?" with its Energy cost; only the answers live here. */}
      {canAct && next ? (
        <>
          <div className={offerActionsClass}>
            <Button
              color="violet"
              variant="solid"
              uppercase={false}
              className={`${roadmapButtonClass} ${primaryButtonClass}`}
              disabled={disabled || Boolean(busyAction)}
              loading={busyAction === 'start'}
              onClick={() => onAction('start')}
            >
              Start milestone {next.number}
            </Button>
            <Button
              color="white"
              variant="outline"
              uppercase={false}
              className={`${roadmapButtonClass} ${ghostButtonClass}`}
              disabled={Boolean(busyAction)}
              onClick={onTomorrow}
            >
              Tomorrow
            </Button>
          </div>
        </>
      ) : null}
    </div>
  );
}
