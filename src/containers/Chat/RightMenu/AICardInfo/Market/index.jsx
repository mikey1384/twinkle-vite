import { useState } from 'react';
import { Color } from '~/constants/css';
import FilterBar from '~/components/FilterBar';
import Listings from './Listings';
import Offers from './Offers';

export default function Market() {
  const [activeTab, setActiveTab] = useState('buy');
  return (
    <div
      style={{
        height: '50%',
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
          Offers
        </nav>
      </FilterBar>
      <div style={{ height: '100%' }}>
        {activeTab === 'buy' ? <Listings /> : <Offers />}
      </div>
    </div>
  );
}
