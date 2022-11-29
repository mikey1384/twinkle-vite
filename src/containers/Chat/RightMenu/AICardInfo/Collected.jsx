import { useEffect } from 'react';
import { useAppContext, useChatContext } from '~/contexts';

export default function Collected() {
  const loadMyAICardCollections = useAppContext(
    (v) => v.requestHelpers.loadMyAICardCollections
  );
  const myCards = useChatContext((v) => v.state.myCards);
  const onLoadMyAICards = useChatContext((v) => v.actions.onLoadMyAICards);

  useEffect(() => {
    init();
    async function init() {
      const { myCards, myCardsLoadMoreShown } = await loadMyAICardCollections();
      onLoadMyAICards({ cards: myCards, loadMoreShown: myCardsLoadMoreShown });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ width: '100%' }}>
      <div
        style={{
          textAlign: 'center',
          padding: '1.5rem 0',
          fontSize: '1.7rem'
        }}
      >
        <b>My Collections</b>
        {myCards.map((card) => (
          <div key={card.id}>{card.imagePath}</div>
        ))}
      </div>
    </div>
  );
}
