import React, { useMemo, useState } from 'react';
import { css } from '@emotion/css';
import SanitizedHTML from 'react-sanitized-html';
import AICard from '~/components/AICard';
import CardThumb from '~/components/CardThumb';
import Button from '~/components/Button';
import AICardModal from '~/components/Modals/AICardModal';
import { useChatContext } from '~/contexts';
import useAICard from '~/helpers/hooks/useAICard';
import { Color, mobileMaxWidth } from '~/constants/css';

export default function AICardSummonContent({
  card,
  compact = false
}: {
  card: any;
  compact?: boolean;
}) {
  const liveCard = useChatContext((v) => v.state.cardObj[card?.id]);
  const displayedCard = useMemo(
    () => ({ ...card, ...liveCard }),
    [card, liveCard]
  );
  const { promptText } = useAICard(displayedCard);
  const [modalShown, setModalShown] = useState(false);
  const mystery = !displayedCard.imagePath && !Number(displayedCard.isBurned);

  if (!card?.id) return null;

  return (
    <>
      <div
        className={css`
          display: flex;
          align-items: center;
          gap: ${compact ? '1.4rem' : '3rem'};
          min-width: 0;
          padding: ${compact ? '0' : '1rem 0'};
          @media (max-width: ${mobileMaxWidth}) {
            gap: 1.2rem;
            ${!compact && 'flex-direction: column; text-align: center;'}
          }
        `}
      >
        <div style={{ flexShrink: 0 }}>
          {compact ? (
            <CardThumb
              card={displayedCard}
              style={{ width: '8.4rem', height: '11.8rem' }}
            />
          ) : (
            <div
              role="button"
              tabIndex={0}
              aria-label={`View card #${card.id}`}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setModalShown(true);
                }
              }}
            >
              <AICard
                card={displayedCard}
                onClick={() => setModalShown(true)}
              />
            </div>
          )}
        </div>
        <div
          style={{ minWidth: 0, overflowWrap: 'anywhere', fontSize: '1.4rem' }}
        >
          <div
            style={{
              fontSize: '1.1rem',
              color: Color.darkerGray(),
              marginBottom: '0.5rem'
            }}
          >
            AI card · #{card.id}
          </div>
          <div
            style={{ fontWeight: 700, fontSize: compact ? '1.6rem' : '2rem' }}
          >
            {displayedCard.word}
          </div>
          {compact ? (
            <div style={{ marginTop: '0.5rem', fontSize: '1.2rem' }}>
              Summoned by{' '}
              {displayedCard.creator?.username || 'a Twinkle member'}
            </div>
          ) : (
            <>
              <div style={{ marginTop: '1.2rem', lineHeight: 1.6 }}>
                <SanitizedHTML
                  allowedAttributes={{ b: ['style'] }}
                  html={promptText || ''}
                />
              </div>
              <div
                style={{
                  marginTop: '1rem',
                  color: Color.darkerGray(),
                  fontSize: '1.2rem'
                }}
              >
                {mystery
                  ? 'Mystery card · Not revealed yet'
                  : displayedCard.style}
              </div>
              <Button
                variant="ghost"
                style={{ marginTop: '1rem' }}
                onClick={() => setModalShown(true)}
              >
                View card details
              </Button>
            </>
          )}
        </div>
      </div>
      {modalShown && (
        <AICardModal
          cardId={Number(card.id)}
          onHide={() => setModalShown(false)}
        />
      )}
    </>
  );
}
