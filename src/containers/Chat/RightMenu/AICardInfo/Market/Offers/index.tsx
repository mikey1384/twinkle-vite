import React from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import FilterBar from '~/components/FilterBar';
import Incoming from './Incoming';
import Outgoing from './Outgoing';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';

export default function Offers({
  onSetSelectedSubTab,
  selectedSubTab
}: {
  onSetSelectedSubTab: (subTab: string) => void;
  selectedSubTab: string;
}) {
  return (
    <ErrorBoundary componentPath="Chat/RightMenu/AICardInfo/Market/Bids">
      <FilterBar
        style={{ marginBottom: 0 }}
        className={css`
          height: 3.5rem !important;
          font-size: 1.3rem !important;
          @media (max-width: ${mobileMaxWidth}) {
            font-size: 1.2rem !important;
          }
        `}
      >
        <nav
          className={selectedSubTab === 'incoming' ? 'active' : ''}
          onClick={() => onSetSelectedSubTab('incoming')}
        >
          Incoming Offers
        </nav>
        <nav
          className={selectedSubTab === 'outgoing' ? 'active' : ''}
          onClick={() => onSetSelectedSubTab('outgoing')}
        >
          My offers
        </nav>
      </FilterBar>
      {selectedSubTab === 'incoming' ? <Incoming /> : <Outgoing />}
    </ErrorBoundary>
  );
}
