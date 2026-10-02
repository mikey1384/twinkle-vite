import React, { useMemo, useState } from 'react';
import { css } from '@emotion/css';
import AICard from '~/components/AICard';
import AICardDetails from '~/components/AICardDetails';
import AICardPreview from '~/components/AICardPreview';
import Button from '~/components/Button';
import AICardModal from '~/components/Modals/AICardModal';
import { useChatContext } from '~/contexts';
import { mobileMaxWidth } from '~/constants/css';

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
  const [modalShown, setModalShown] = useState(false);

  if (!card?.id) return null;

  if (compact) {
    return (
      <AICardPreview
        card={displayedCard}
        artwork={<AICard card={displayedCard} compact />}
        summoner={displayedCard.creator}
        density="target"
        framed={false}
      />
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
          <AICardDetails card={displayedCard} showIdentity />
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
