import { useEffect, useState } from 'react';
import { Color } from '~/constants/css';
import FilterBar from '~/components/FilterBar';
import Listings from './Listings';
import Offers from './Offers';
import { socket } from '~/constants/io';
import { useKeyContext } from '~/contexts';

export default function Market() {
  const { userId } = useKeyContext((v) => v.myState);
  const {
    loadMoreButton: { color: loadMoreButtonColor }
  } = useKeyContext((v) => v.theme);

  useEffect(() => {
    socket.on('ai_card_offer_posted', handleAICardOfferPosted);
    function handleAICardOfferPosted({ card }) {
      if (card.ownerId === userId) {
        setActiveTab('sell');
        setSelectedSubTab('incoming');
      }
    }
    return function cleanUp() {
      socket.removeListener('ai_card_offer_posted', handleAICardOfferPosted);
    };
  });
  const [activeTab, setActiveTab] = useState('buy');
  const [selectedSubTab, setSelectedSubTab] = useState('incoming');

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
          Offers
        </nav>
      </FilterBar>
      <div style={{ height: '100%' }}>
        {activeTab === 'buy' ? (
          <Listings loadMoreButtonColor={loadMoreButtonColor} />
        ) : (
          <Offers
            onSetSelectedSubTab={setSelectedSubTab}
            selectedSubTab={selectedSubTab}
            loadMoreButtonColor={loadMoreButtonColor}
          />
        )}
      </div>
    </div>
  );
}
