import React, { useEffect, useMemo, useState } from 'react';
import AICardsPreview from '~/components/AICardsPreview';
import AICardModal from '~/components/Modals/AICardModal';
import Loading from '~/components/Loading';
import Icon from '~/components/Icon';
import CardStrip from './CardStrip';
import { useContentState } from '~/helpers/hooks';
import { useAppContext, useContentContext, useChatContext } from '~/contexts';
import { Color } from '~/constants/css';
import { getAICardCollectionPreviewTitle } from '~/helpers/aiCardEmbedHelpers';
import { Link, useNavigate } from 'react-router-dom';
import { css } from '@emotion/css';

export default function MultiCardComponent({
  color,
  isBuyNow,
  isMystery,
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
  isMystery?: string | null;
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
  const mysteryFilterEnabled = isMystery === 'true';
  const filters = {
    color,
    isBuyNow,
    isMystery,
    engine: mysteryFilterEnabled ? null : engine,
    quality,
    owner,
    word,
    style: mysteryFilterEnabled ? null : style
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
  }, [color, engine, isBuyNow, isMystery, owner, quality, style, word]);

  const title = useMemo(() => {
    return getAICardCollectionPreviewTitle({
      cardCount: cardIds?.length,
      color,
      engine,
      isBuyNow,
      isMystery,
      owner,
      quality,
      style,
      word
    });
  }, [
    owner,
    color,
    quality,
    style,
    word,
    isBuyNow,
    isMystery,
    engine,
    cardIds?.length
  ]);

  if (isPreview) {
    return (
      <div
        className={`${compactMultiCardClass} compact-ai-card-multi`}
        role="group"
        aria-label={title || 'AI cards'}
        onClick={handleCompactPreviewOpen}
      >
        <div className="compact-ai-card-multi__header">
          <div className="compact-ai-card-multi__title" title={title}>
            {title}
          </div>
          <Link
            className="compact-ai-card-multi__browse"
            to={src}
            onClick={handleCollectionLinkClick}
          >
            View all cards <Icon icon="arrow-right" />
          </Link>
        </div>
        {loading || !cardIds ? (
          <div className="compact-ai-card-multi__loading">
            <Loading />
          </div>
        ) : cardIds.length > 0 ? (
          <CardStrip cardIds={cardIds} onSelect={setSelectedCardId} />
        ) : (
          <div className="compact-ai-card-multi__empty">No cards found</div>
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
    // Modal portals bubble through React even though they are outside this strip.
    if (!event.currentTarget.contains(event.target as Node)) return;
    navigate(src);
  }

  function handleCollectionLinkClick(
    event: React.MouseEvent<HTMLAnchorElement>
  ) {
    event.stopPropagation();
  }
}

const compactMultiCardClass = css`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  width: 100%;
  min-width: 0;
  height: auto;
  padding: 1rem;
  border: 1px solid ${Color.borderGray()};
  border-radius: 1rem;
  background: #fff;
  color: ${Color.darkerGray()};
  font: inherit;
  line-height: 1.3;
  text-align: left;
  cursor: pointer;
  .compact-ai-card-multi__header {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    min-width: 0;
  }
  .compact-ai-card-multi__title {
    flex: 1 1 auto;
    min-width: 0;
    overflow: hidden;
    color: ${Color.black()};
    font-size: max(1.45rem, 14.5px);
    font-weight: 800;
    line-height: 1.3;
    overflow-wrap: anywhere;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }
  .compact-ai-card-multi__browse {
    display: inline-flex;
    flex: 0 0 auto;
    align-items: center;
    justify-content: center;
    gap: 0.6rem;
    min-height: max(4.4rem, 44px);
    padding: 0.6rem 0.9rem;
    border: 1px solid ${Color.logoBlue(0.24)};
    border-radius: 0.85rem;
    background: ${Color.logoBlue(0.06)};
    color: ${Color.logoBlue()};
    font-size: max(1.2rem, 12px);
    font-weight: 800;
    line-height: 1.2;
    white-space: nowrap;
    text-decoration: none;
  }
  .compact-ai-card-multi__browse:focus-visible {
    outline: 2px solid ${Color.logoBlue()};
    outline-offset: 2px;
  }
  @media (hover: hover) and (pointer: fine) {
    .compact-ai-card-multi__browse:hover {
      background: ${Color.logoBlue(0.12)};
    }
  }
  .compact-ai-card-multi__loading,
  .compact-ai-card-multi__empty {
    display: flex;
    width: 100%;
    min-height: 10rem;
    align-items: center;
    justify-content: center;
    color: ${Color.black()};
    font-size: 1.3rem;
    text-align: center;
  }
`;
