import React from 'react';
import FilterBar from '~/components/FilterBar';
import { css } from '@emotion/css';

export default function Upgrade({
  onSetSelectedSection
}: {
  onSetSelectedSection: (section: string) => void;
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
          Upgrade AI Card
        </nav>
      </FilterBar>
    </div>
  );
}
