import React from 'react';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import { Color } from '~/constants/css';
import type { RoadmapView } from '../../helpers/roadmap';

const summaryClass = css`
  flex-shrink: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.3rem 1rem;
  margin: 0.6rem 1rem 0;
  padding: 0.8rem 1rem;
  min-height: 44px;
  border: 1px solid #e3e7ef;
  border-radius: 12px;
  background: #f8fafc;
  color: #1f2a44;
  text-align: left;
  font: inherit;
  cursor: pointer;
  b {
    font-size: var(--build-workshop-label-font-size, 1.2rem);
  }
  span {
    grid-row: 2;
    font-size: var(--build-workshop-label-font-size, 1.2rem);
    color: #6b7488;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  > svg {
    grid-column: 2;
    grid-row: 1 / 3;
  }
  &:hover {
    background: #eef4ff;
  }
  &:focus-visible {
    outline: 2px solid ${Color.logoBlue()};
    outline-offset: 2px;
  }
`;

export default function RoadmapSummary({
  view,
  canAct,
  updated,
  onOpen
}: {
  view: RoadmapView;
  canAct: boolean;
  updated: boolean;
  onOpen: (event: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  const stalled = Boolean(view.current?.stall);
  const status = stalled
    ? canAct
      ? 'Needs your choice'
      : 'Waiting for the owner'
    : updated
      ? 'Plan updated'
      : `${view.doneCount} of ${view.total} done`;
  return (
    <button
      type="button"
      className={summaryClass}
      aria-label={`Open build plan: ${view.title}. ${status}`}
      onClick={onOpen}
    >
      <b style={stalled ? { color: Color.darkAmber() } : undefined}>
        Build plan · {status}
      </b>
      <span title={view.title}>{view.title}</span>
      <Icon icon="chevron-right" />
    </button>
  );
}
