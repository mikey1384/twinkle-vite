import React, { useEffect, useState } from 'react';
import AICard from '~/components/AICard';
import Loading from '~/components/Loading';
import InvalidContent from '../../InvalidContent';
import AICardDetails from '~/components/AICardDetails';
import AICardModal from '~/components/Modals/AICardModal';
import ErrorBoundary from '~/components/ErrorBoundary';
import CompactPreview from './CompactPreview';
import { useAppContext, useChatContext } from '~/contexts';
import { Card as CardType } from '~/types';
import { css } from '@emotion/css';

export default function SingleCardComponent({
  cardId,
  isPreview
}: {
  cardId: number;
  isPreview?: boolean;
}) {
  const onUpdateAICard = useChatContext((v) => v.actions.onUpdateAICard);
  const loadAICard = useAppContext((v) => v.requestHelpers.loadAICard);
  const card = useChatContext(
    (v) => v.state.cardObj[cardId] as CardType | undefined
  );
  const [cardModalShown, setCardModalShown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cardNotFound, setCardNotFound] = useState(false);

  useEffect(() => {
    if (!cardNotFound && !card) {
      init();
    }
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
    // Request helpers and context actions have stable implementations.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardNotFound, cardId, card]);

  return (
    <ErrorBoundary componentPath="RichText/EmbeddedComponent/InternalComponent/AICardComponent/SingleCardComponent">
      {loading || (!cardNotFound && !card) ? (
        <Loading />
      ) : cardNotFound || !card ? (
        <InvalidContent style={{ marginTop: '2rem' }} />
      ) : isPreview ? (
        <CompactPreview card={card} onClick={() => setCardModalShown(true)} />
      ) : (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            padding: '1rem',
            width: '100%'
          }}
        >
          <div
            className={css`
              display: flex;
              flex-direction: column;
              width: 100%;
            `}
          >
            <AICard
              onClick={() => setCardModalShown(true)}
              card={card}
              detailShown
            />
            <AICardDetails
              className={css`
                margin-top: 5rem;
              `}
              card={card}
            />
          </div>
        </div>
      )}
      {cardModalShown && card && (
        <AICardModal cardId={card.id} onHide={() => setCardModalShown(false)} />
      )}
    </ErrorBoundary>
  );
}
