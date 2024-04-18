import React from 'react';
import FilterBar from '~/components/FilterBar';
import { css } from '@emotion/css';

export default function Upgrade({
  onSetSelectedSection,
  workshopLabel
}: {
  onSetSelectedSection: (section: string) => void;
  workshopLabel: string;
}) {
  return (
    <div
      className={css`
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
      `}
    >
      <FilterBar>
        <nav onClick={() => onSetSelectedSection('rewrite')}>Rewrite</nav>
        <nav className="active" onClick={() => onSetSelectedSection('upgrade')}>
          {workshopLabel}
        </nav>
      </FilterBar>
      <div
        className={css`
          padding: 5rem 2rem;
        `}
      >
        this is the workshop
      </div>
    </div>
  );
}
