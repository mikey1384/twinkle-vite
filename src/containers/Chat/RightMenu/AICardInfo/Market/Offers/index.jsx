import { useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import FilterBar from '~/components/FilterBar';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';

export default function Offers() {
  const [selectedTab, setSelectedTab] = useState('outgoing');
  return (
    <ErrorBoundary componentPath="Chat/RightMenu/AICardInfo/Market/Offers">
      <FilterBar
        className={css`
          height: 3.5rem;
          font-size: 1.3rem;
          @media (max-width: ${mobileMaxWidth}) {
            font-size: 1.2rem;
          }
        `}
      >
        <nav
          className={selectedTab === 'incoming' ? 'active' : ''}
          onClick={() => setSelectedTab('incoming')}
        >
          Incoming Offers
        </nav>
        <nav
          className={selectedTab === 'outgoing' ? 'active' : ''}
          onClick={() => setSelectedTab('outgoing')}
        >
          My Offers
        </nav>
      </FilterBar>
    </ErrorBoundary>
  );
}
