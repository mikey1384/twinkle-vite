import React, { useEffect, useMemo, useState } from 'react';
import { Color } from '~/constants/css';
import FilterBar from '~/components/FilterBar';
import Listings from './Listings';
import Offers from './Offers';
import { socket } from '~/constants/sockets/api';
import { useChatContext, useKeyContext } from '~/contexts';

export default function Market() {
  const { userId, notifications } = useKeyContext((v) => v.myState);
  const mostRecentOfferTimeStamp = useChatContext(
    (v) => v.state.mostRecentOfferTimeStamp
  );

  const hasNewOffer = useMemo(() => {
    return (
      Number(mostRecentOfferTimeStamp) >
      Number(notifications?.recentAICardOfferCheckTimeStamp)
    );
  }, [
    mostRecentOfferTimeStamp,
    notifications?.recentAICardOfferCheckTimeStamp
  ]);

  useEffect(() => {
    socket.on('ai_card_offer_posted', handleAICardOfferPosted);
    function handleAICardOfferPosted({ card }: { card: { ownerId: number } }) {
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
          className={`${activeTab === 'sell' ? 'active' : ''} ${
            hasNewOffer ? 'alert' : ''
          }`}
          onClick={() => setActiveTab('sell')}
        >
          Offers
        </nav>
      </FilterBar>
      <div style={{ height: '100%' }}>
        {activeTab === 'buy' ? (
          <Listings />
        ) : (
          <Offers
            onSetSelectedSubTab={setSelectedSubTab}
            selectedSubTab={selectedSubTab}
            hasNewOffer={hasNewOffer}
          />
        )}
      </div>
    </div>
  );
}
