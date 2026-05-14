import React, { useEffect, useMemo, useState } from 'react';
import AICardsPreview from '~/components/AICardsPreview';
import AICardModal from '~/components/Modals/AICardModal';
import Loading from '~/components/Loading';
import { CompactThumb } from './CompactPreview';
import { useContentState } from '~/helpers/hooks';
import { useAppContext, useContentContext, useChatContext } from '~/contexts';
import { Color } from '~/constants/css';
import { useNavigate } from 'react-router-dom';
import { css } from '@emotion/css';

export default function MultiCardComponent({
  color,
  isBuyNow,
  engine,
  isPreview,
  quality,
  owner,
  rootId,
  rootType,
  word,
  cardStyle: style,
  src
}: {
  color?: string | null;
  isBuyNow?: string | null;
  engine?: string | null;
  isPreview?: boolean;
  quality?: string | null;
  owner?: string | null;
  rootId?: number | string;
  rootType?: string;
  cardStyle?: string | null;
  word?: string | null;
  src: string;
}) {
  const filters = {
    color,
    isBuyNow,
    engine,
    quality,
    owner,
    word,
    style
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
  const cardObj = useChatContext((v) => v.state.cardObj);
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
  }, [color, engine, isBuyNow, owner, quality, style, word]);

  const title = useMemo(() => {
    const titleParts = [];
    if (owner) {
      titleParts.push(`${owner}'s`);
    }
    if (color) {
      titleParts.push(
        `${color} ${quality ? `${quality} ` : ''}${
          engine ? `${engine} ` : ''
        }card${cardIds?.length === 1 ? '' : 's'}`
      );
    } else if (quality) {
      titleParts.push(
        `${quality ? `${quality} ` : ''}${engine ? `${engine} ` : ''}card${
          cardIds?.length === 1 ? '' : 's'
        }`
      );
    } else {
      titleParts.push(
        `${engine ? `${engine} ` : ''}card${cardIds?.length === 1 ? '' : 's'}`
      );
    }
    if (style) {
      titleParts.push(`with "${style}" art style`);
    }
    if (word) {
      titleParts.push(`containing the word "${word}"`);
    }
    if (isBuyNow) {
      titleParts.push('you can buy now');
    }
    return titleParts.filter(Boolean).join(' ');
  }, [owner, color, quality, style, word, isBuyNow, engine, cardIds?.length]);

  if (isPreview) {
    return (
      <div className={compactMultiCardClass}>
        <div className="compact-ai-card-multi__copy">
          <div className="compact-ai-card-multi__label">AI Cards</div>
          <strong>{title || 'AI Cards'}</strong>
        </div>
        <div className="compact-ai-card-multi__cards">
          {loading || !cardIds ? (
            <Loading />
          ) : cardIds.length > 0 ? (
            cardIds.slice(0, 4).map((cardId: number) => (
                  <CompactThumb
                key={cardId}
                card={cardObj[cardId] || { id: cardId }}
                onClick={() => setSelectedCardId(cardId)}
              />
            ))
          ) : (
            <span>No cards</span>
          )}
          {!loading && cardIds && cardIds.length > 4 ? (
            <button
              type="button"
              className="compact-ai-card-multi__more"
              onClick={handleCompactMoreClick}
            >
              +{cardIds.length - 4}
            </button>
          ) : null}
        </div>
        {selectedCardId && (
          <AICardModal
            cardId={selectedCardId}
            onHide={() => setSelectedCardId(null)}
          />
        )}
      </div>
    );
  }

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

  function handleCompactMoreClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    navigate(src);
  }
}

const compactMultiCardClass = css`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.85rem;
  width: 100%;
  min-height: 7.25rem;
  padding: 0.58rem 0.66rem;
  overflow: hidden;
  border: 1.5px solid ${Color.logoBlue()};
  border-radius: 0.8rem;
  background: #fff;
  .compact-ai-card-multi__copy {
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: 0.2rem;
    line-height: 1.18;
  }
  .compact-ai-card-multi__label {
    color: ${Color.logoBlue()};
    font-size: 1rem;
    font-weight: 850;
  }
  .compact-ai-card-multi__copy strong {
    overflow: hidden;
    color: ${Color.black()};
    font-size: 1.1rem;
    font-weight: 900;
    line-height: 1.15;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }
  .compact-ai-card-multi__cards {
    display: flex;
    align-items: center;
    gap: 0.48rem;
    height: 6.45rem;
    color: ${Color.darkGray()};
    font-size: 1rem;
    font-weight: 800;
  }
  .compact-ai-card-multi__more {
    appearance: none;
    display: inline-flex;
    flex: 0 0 auto;
    align-items: center;
    justify-content: center;
    min-width: 3.4rem;
    height: 3.4rem;
    padding: 0 0.72rem;
    border: 1px solid ${Color.logoBlue(0.22)};
    border-radius: 999px;
    background: ${Color.logoBlue(0.1)};
    color: ${Color.logoBlue()};
    font: inherit;
    font-size: 1.15rem;
    font-weight: 900;
    line-height: 1;
    white-space: nowrap;
    cursor: pointer;
  }
`;
