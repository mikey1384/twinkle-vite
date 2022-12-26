import { useState } from 'react';
import { Color } from '~/constants/css';
import FilterBar from '~/components/FilterBar';
import Listings from './Listings';
import Offers from './Offers';
import { useKeyContext } from '~/contexts';

export default function Market() {
  const {
    loadMoreButton: { color: loadMoreButtonColor }
  } = useKeyContext((v) => v.theme);
  const [activeTab, setActiveTab] = useState('buy');
  return (
    <div
      style={{
        height: 'CALC(50% - 4.5rem)',
        borderBottom: `1px solid ${Color.borderGray()}`
      }}
    >
      <FilterBar
        style={{ height: '4.5rem', fontSize: '1.5rem', marginBottom: 0 }}
      >
        <nav
          className={activeTab === 'buy' ? 'active' : ''}
          onClick={() => setActiveTab('buy')}
        >
          Buy
        </nav>
        <nav
          className={activeTab === 'sell' ? 'active' : ''}
          onClick={() => setActiveTab('sell')}
        >
          Bids
        </nav>
      </FilterBar>
      <div style={{ height: '100%' }}>
        {activeTab === 'buy' ? (
          <Listings loadMoreButtonColor={loadMoreButtonColor} />
        ) : (
          <Offers loadMoreButtonColor={loadMoreButtonColor} />
        )}
      </div>
    </div>
  );
}
