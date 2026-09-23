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
import { qualityProps } from '~/constants/defaultValues';
import { isTotalMysteryQuality } from '~/components/AICard/totalMysteryGlow';
import { SITE_NAME } from '~/constants/siteBrand';

// A total-mystery card keeps its quality secret until it is revealed.
function mysteryQualityHidden(card: any) {
  return isTotalMysteryQuality(card?.quality);
}

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
  const { promptText, cardColor } = useAICard(displayedCard);
  const quality = mysteryQualityHidden(displayedCard)
    ? ''
    : String(displayedCard.quality || '');
  const [modalShown, setModalShown] = useState(false);
  const mystery = !displayedCard.imagePath && !Number(displayedCard.isBurned);

  if (!card?.id) return null;

  if (compact) {
    return (
      <div
        className={css`
          display: flex;
          align-items: center;
          gap: 1.6rem;
          min-width: 0;
          @media (max-width: ${mobileMaxWidth}) {
            gap: 1.3rem;
          }
        `}
      >
        <CardThumb
          card={displayedCard}
          style={{ width: '8.4rem', height: '11.8rem', flexShrink: 0 }}
        />
        <div
          className={css`
            min-width: 0;
            flex: 1;
            display: grid;
            gap: 0.5rem;
            overflow-wrap: anywhere;
          `}
        >
          <div
            className={css`
              display: flex;
              flex-wrap: wrap;
              align-items: center;
              gap: 0.6rem;
              font-size: 1.1rem;
              font-weight: 700;
              letter-spacing: 0.06em;
              text-transform: uppercase;
              color: ${Color.gray()};
            `}
          >
            <span>AI card #{card.id}</span>
            {quality && (
              <span
                className={css`
                  padding: 0.2rem 0.7rem;
                  border-radius: 999px;
                  letter-spacing: 0.04em;
                  background: ${Color.highlightGray()};
                `}
                style={{ color: qualityProps[quality]?.color }}
              >
                {quality}
              </span>
            )}
          </div>
          <div
            className={css`
              font-size: 1.9rem;
              font-weight: 700;
              line-height: 1.2;
            `}
            style={{ color: mystery ? undefined : cardColor }}
          >
            {displayedCard.word}
          </div>
          <div
            className={css`
              font-size: 1.3rem;
              line-height: 1.45;
              color: ${Color.darkerGray()};
              display: -webkit-box;
              -webkit-box-orient: vertical;
              -webkit-line-clamp: 2;
              overflow: hidden;
            `}
          >
            {mystery
              ? 'Mystery card · Not revealed yet'
              : displayedCard.prompt || displayedCard.style}
          </div>
          <div
            className={css`
              font-size: 1.2rem;
              color: ${Color.gray()};
            `}
          >
            Summoned by{' '}
            <b style={{ color: Color.darkerGray() }}>
              {displayedCard.creator?.username || `a ${SITE_NAME} member`}
            </b>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className={css`
          display: flex;
          align-items: center;
          gap: 3rem;
          min-width: 0;
          padding: 1rem 0;
          @media (max-width: ${mobileMaxWidth}) {
            gap: 1.2rem;
            flex-direction: column;
            text-align: center;
          }
        `}
      >
        <div style={{ flexShrink: 0 }}>
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
            <AICard card={displayedCard} onClick={() => setModalShown(true)} />
          </div>
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
          <div style={{ fontWeight: 700, fontSize: '2rem' }}>
            {displayedCard.word}
          </div>
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
            {mystery ? 'Mystery card · Not revealed yet' : displayedCard.style}
          </div>
          <Button
            variant="ghost"
            style={{ marginTop: '1rem' }}
            onClick={() => setModalShown(true)}
          >
            View card details
          </Button>
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
