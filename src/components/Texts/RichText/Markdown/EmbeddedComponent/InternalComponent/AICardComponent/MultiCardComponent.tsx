import React, { useEffect, useMemo, useState } from 'react';
import AICardsPreview from '~/components/AICardsPreview';
import AICardModal from '~/components/Modals/AICardModal';
import Loading from '~/components/Loading';
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
      <div
        className={`${compactMultiCardClass} compact-ai-card-multi`}
        role="button"
        tabIndex={0}
        onClick={handleCompactPreviewOpen}
        onKeyDown={handleCompactPreviewKeyDown}
      >
        <div className="compact-ai-card-multi__title">{title}</div>
        {loading || !cardIds ? (
          <div className="compact-ai-card-multi__loading">
            <Loading />
          </div>
        ) : cardIds.length > 0 ? (
          <div
            className="compact-ai-card-multi__preview"
            onClick={handleCompactCardStripClick}
          >
            <AICardsPreview
              compact
              isAICardModalShown={!!selectedCardId}
              cardIds={cardIds}
              moreAICardsModalTitle={title}
              onSetAICardModalCardId={setSelectedCardId}
              onLoadMoreClick={() => navigate(src)}
            />
          </div>
        ) : (
          <div className="compact-ai-card-multi__empty">No Cards Found</div>
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

  function handleCompactPreviewOpen(event: React.MouseEvent<HTMLElement>) {
    event.stopPropagation();
    navigate(src);
  }

  function handleCompactCardStripClick(event: React.MouseEvent<HTMLElement>) {
    event.stopPropagation();
  }

  function handleCompactPreviewKeyDown(
    event: React.KeyboardEvent<HTMLElement>
  ) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    event.stopPropagation();
    navigate(src);
  }
}

const compactMultiCardClass = css`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  width: 100%;
  height: 100%;
  min-height: 16rem;
  padding: 1rem;
  overflow: hidden;
  border: 1px solid ${Color.borderGray()};
  border-radius: 0.8rem;
  background: #fff;
  color: ${Color.darkerGray()};
  font: inherit;
  text-align: center;
  cursor: pointer;
  .compact-ai-card-multi__title {
    width: 100%;
    overflow: hidden;
    color: ${Color.black()};
    font-family: 'Roboto', sans-serif;
    font-size: 1.2rem;
    font-weight: 900;
    line-height: 1.2;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }
  .compact-ai-card-multi__preview {
    display: flex;
    min-width: 0;
    max-width: 100%;
    height: 14rem;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }
  .compact-ai-card-multi__preview > div {
    max-width: 100%;
  }
  .compact-ai-card-multi__loading,
  .compact-ai-card-multi__empty {
    display: flex;
    width: 100%;
    min-height: 10rem;
    align-items: center;
    justify-content: center;
    color: ${Color.black()};
    font-size: 1.1rem;
    font-weight: 900;
  }
`;
