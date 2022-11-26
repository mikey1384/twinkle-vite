import { useState } from 'react';
import { Color } from '~/constants/css';
import FilterBar from '~/components/FilterBar';

export default function Market() {
  const [activeTab, setActiveTab] = useState('buy');
  return (
    <div
      style={{
        borderBottom: `1px solid ${Color.borderGray()}`,
        height: '50%'
      }}
    >
      <FilterBar
        style={{ height: '4.5rem', fontSize: '1.6rem', marginBottom: 0 }}
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
    </div>
  );
}
