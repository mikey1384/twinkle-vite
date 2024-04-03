import React, { useEffect, useMemo, useState } from 'react';
import AICardsPreview from '~/components/AICardsPreview';
import AICardModal from '~/components/Modals/AICardModal';
import Loading from '~/components/Loading';
import { useContentState } from '~/helpers/hooks';
import { useAppContext, useContentContext, useChatContext } from '~/contexts';
import { Color } from '~/constants/css';
import { useNavigate } from 'react-router-dom';

export default function MultiCardComponent({
  color,
  isBuyNow,
  quality,
  owner,
  rootId,
  rootType,
  word,
  src
}: {
  color?: string | null;
  isBuyNow?: string | null;
  quality?: string | null;
  owner?: string | null;
  rootId?: number | string;
  rootType?: string;
  word?: string | null;
  src: string;
}) {
  const filters = {
    color,
    isBuyNow,
    quality,
    owner,
    word
  };
  const { cardIds } = useContentState({
    contentType: rootType,
    contentId: rootId,
    targetKey: JSON.stringify(filters)
  });
  const navigate = useNavigate();
  const onSetDisplayedCardIds = useContentContext(
    (v) => v.actions.onSetDisplayedCardIds
  );
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const onUpdateAICard = useChatContext((v) => v.actions.onUpdateAICard);
  const [loading, setLoading] = useState(false);
  const loadFilteredAICards = useAppContext(
    (v) => v.requestHelpers.loadFilteredAICards
  );

  useEffect(() => {
    init();
    async function init() {
      try {
        if (!cardIds) {
          setLoading(true);
        }
        const { cards } = await loadFilteredAICards({
          filters,
          limit: 6
        });
        const newCardIds = [];
        for (const card of cards) {
          onUpdateAICard({
            cardId: card.id,
            newState: card
          });
          newCardIds.push(card.id);
        }
        onSetDisplayedCardIds({
          contentId: rootId,
          contentType: rootType,
          targetKey: JSON.stringify(filters),
          cardIds: newCardIds
        });
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [color, isBuyNow, owner, quality, word]);

  const title = useMemo(() => {
    const titleParts = [];
    if (owner) {
      titleParts.push(`${owner}'s`);
    }
    if (color) {
      titleParts.push(
        `${color} ${quality ? `${quality} ` : ''}card${
          cardIds?.length === 1 ? '' : 's'
        }`
      );
    } else {
      titleParts.push(
        `${quality ? `${quality} ` : ''}card${cardIds?.length === 1 ? '' : 's'}`
      );
    }
    if (word) {
      titleParts.push(`containing the word "${word}"`);
    }
    if (isBuyNow) {
      titleParts.push('you can buy now');
    }
    return titleParts.filter(Boolean).join(' ');
  }, [color, isBuyNow, owner, quality, word, cardIds]);

  return loading ? (
    <div
      style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        height: '20rem',
        padding: '1rem'
      }}
    >
      <Loading />
    </div>
  ) : (
    <div
      style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        height: '20rem',
        padding: '1rem'
      }}
    >
      <div
        style={{
          fontWeight: 'bold',
          fontFamily: 'Roboto, sans-serif',
          marginBottom: '1rem',
          color: Color.black()
        }}
      >
        {title}
      </div>
      {cardIds?.length > 0 ? (
        <AICardsPreview
          isAICardModalShown={!!selectedCardId}
          cardIds={cardIds}
          moreAICardsModalTitle={title}
          onSetAICardModalCardId={setSelectedCardId}
          onLoadMoreClick={() => navigate(src)}
        />
      ) : (
        <div
          style={{
            marginTop: '1rem',
            height: '10rem',
            fontWeight: 'bold',
            color: Color.black(),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          No Cards Found
        </div>
      )}
      {selectedCardId && (
        <AICardModal
          cardId={selectedCardId}
          onHide={() => setSelectedCardId(null)}
        />
      )}
    </div>
  );
}
