import React, { useEffect } from 'react';
import FilterBar from '~/components/FilterBar';
import { useAppContext } from '~/contexts';
import { css } from '@emotion/css';

export default function Upgrade({
  contentId,
  contentType,
  onSetSelectedSection,
  workshopLabel
}: {
  contentId?: number;
  contentType?: string;
  onSetSelectedSection: (section: string) => void;
  workshopLabel: string;
}) {
  const checkWorkshopAvailability = useAppContext(
    (v) => v.requestHelpers.checkWorkshopAvailability
  );
  useEffect(() => {
    init();
    async function init() {
      await checkWorkshopAvailability({ contentId, contentType });
    }
  });

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
