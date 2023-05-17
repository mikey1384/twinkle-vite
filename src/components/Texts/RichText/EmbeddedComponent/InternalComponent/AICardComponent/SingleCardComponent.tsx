import React, { useEffect, useMemo, useState } from 'react';
import AICard from '~/components/AICard';
import Loading from '~/components/Loading';
import InvalidContent from '../../InvalidContent';
import { useAppContext, useChatContext } from '~/contexts';
import { Card as CardType } from '~/types';

export default function SingleCardComponent({ cardId }: { cardId: number }) {
  const onUpdateAICard = useChatContext((v) => v.actions.onUpdateAICard);
  const loadAICard = useAppContext((v) => v.requestHelpers.loadAICard);
  const cardObj = useChatContext((v) => v.state.cardObj);
  const [loading, setLoading] = useState(false);
  const [cardNotFound, setCardNotFound] = useState(false);
  useEffect(() => {
    init();
    async function init() {
      setLoading(true);
      const { card } = await loadAICard(cardId);
      if (card) {
        onUpdateAICard({
          cardId: card.id,
          newState: card
        });
      } else {
        setCardNotFound(true);
      }
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardId]);
  const card = useMemo(() => cardObj[cardId] as CardType, [cardId, cardObj]);

  return loading ? (
    <Loading />
  ) : cardNotFound ? (
    <InvalidContent />
  ) : (
    <div>
      <AICard card={card} detailShown />
    </div>
  );
}
