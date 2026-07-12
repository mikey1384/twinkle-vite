import React, { useState } from 'react';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import { useAppContext, useChatContext } from '~/contexts';

export default function OwnerMenu({
  cardId,
  style
}: {
  cardId: number;
  style?: React.CSSProperties;
}) {
  const [delisting, setDelisting] = useState(false);
  const delistAICard = useAppContext((v) => v.requestHelpers.delistAICard);
  const onListAICard = useChatContext((v) => v.actions.onListAICard);
  const onRemoveListedAICard = useChatContext(
    (v) => v.actions.onRemoveListedAICard
  );

  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        flexDirection: 'column',
        alignItems: 'center',
        ...style
      }}
    >
      <Button
        className={css`
          @media (max-width: ${mobileMaxWidth}) {
            padding: 0.7rem !important;
          }
        `}
        loading={delisting}
        onClick={handleCancelListing}
        color="rose"
      >
        <Icon
          className={css`
            font-size: 1.6rem;
            @media (max-width: ${mobileMaxWidth}) {
              font-size: 1.1rem;
            }
          `}
          icon="redo"
        />
        <span
          className={css`
            font-size: 1.6rem;
            @media (max-width: ${mobileMaxWidth}) {
              font-size: 1.1rem;
            }
          `}
          style={{ marginLeft: '0.7rem' }}
        >
          Cancel Listing
        </span>
      </Button>
    </div>
  );

  async function handleCancelListing() {
    try {
      setDelisting(true);
      const result = await delistAICard(cardId);
      if (result?.success && Number(result?.card?.id) === Number(cardId)) {
        onRemoveListedAICard(cardId);
        onListAICard({ card: result.card });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setDelisting(false);
    }
  }
}
