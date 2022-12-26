import { useState } from 'react';
import PropTypes from 'prop-types';
import ErrorBoundary from '~/components/ErrorBoundary';
import FilterBar from '~/components/FilterBar';
import Incoming from './Incoming';
import Outgoing from './Outgoing';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';

Bids.propTypes = {
  loadMoreButtonColor: PropTypes.string
};

export default function Bids({ loadMoreButtonColor }) {
  const [selectedTab, setSelectedTab] = useState('outgoing');
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
          className={selectedTab === 'incoming' ? 'active' : ''}
          onClick={() => setSelectedTab('incoming')}
        >
          Incoming Bids
        </nav>
        <nav
          className={selectedTab === 'outgoing' ? 'active' : ''}
          onClick={() => setSelectedTab('outgoing')}
        >
          My Bids
        </nav>
      </FilterBar>
      {selectedTab === 'incoming' ? (
        <Incoming loadMoreButtonColor={loadMoreButtonColor} />
      ) : (
        <Outgoing loadMoreButtonColor={loadMoreButtonColor} />
      )}
    </ErrorBoundary>
  );
}
