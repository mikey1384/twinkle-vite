import React, { useEffect, useMemo, useState } from 'react';
import AICard from '~/components/AICard';
import Loading from '~/components/Loading';
import InvalidContent from '../../InvalidContent';
import AICardDetails from '~/components/AICardDetails';
import AICardModal from '~/components/Modals/AICardModal';
import ErrorBoundary from '~/components/ErrorBoundary';
import { useAppContext, useChatContext } from '~/contexts';
import { Card as CardType } from '~/types';
import { tabletMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

export default function SingleCardComponent({ cardId }: { cardId: number }) {
  const onUpdateAICard = useChatContext((v) => v.actions.onUpdateAICard);
  const loadAICard = useAppContext((v) => v.requestHelpers.loadAICard);
  const cardObj = useChatContext((v) => v.state.cardObj);
  const [cardModalShown, setCardModalShown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cardNotFound, setCardNotFound] = useState(false);
  const card = useMemo(() => cardObj[cardId] as CardType, [cardId, cardObj]);

  useEffect(() => {
    if (!cardNotFound && !cardObj[cardId]) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardNotFound, cardId]);

  return (
    <ErrorBoundary componentPath="RichText/EmbeddedComponent/InternalComponent/AICardComponent/SingleCardComponent">
      {loading || (!cardNotFound && !card) ? (
        <Loading />
      ) : cardNotFound ? (
        <InvalidContent style={{ marginTop: '2rem' }} />
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
              width: 100%;
              @media (max-width: ${tabletMaxWidth}) {
                flex-direction: column;
              }
            `}
          >
            <AICard
              onClick={() => setCardModalShown(true)}
              card={card}
              detailShown
            />
            <AICardDetails
              className={css`
                @media (max-width: ${tabletMaxWidth}) {
                  margin-top: 5rem;
                }
              `}
              card={card}
            />
          </div>
        </div>
      )}
      {cardModalShown && (
        <AICardModal cardId={card.id} onHide={() => setCardModalShown(false)} />
      )}
    </ErrorBoundary>
  );
}
