import React from 'react';
import { css } from '@emotion/css';
import Button from '~/components/Button';
import { ghostButtonClass, roadmapButtonClass } from './styles';

// The answers to Lumine's "Stop the build plan?" question after a typed
// stop: the question itself is Lumine's chat message right above.
const rowClass = css`
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
`;

export default function RoadmapStopConfirm({
  busy,
  onStop,
  onKeep
}: {
  busy?: boolean;
  onStop: () => void;
  onKeep: () => void;
}) {
  return (
    <div className={rowClass}>
      <Button
        color="rose"
        variant="solid"
        uppercase={false}
        className={roadmapButtonClass}
        loading={busy}
        onClick={onStop}
      >
        Stop build plan
      </Button>
      <Button
        color="white"
        variant="outline"
        uppercase={false}
        className={`${roadmapButtonClass} ${ghostButtonClass}`}
        disabled={busy}
        onClick={onKeep}
      >
        Keep it
      </Button>
    </div>
  );
}
