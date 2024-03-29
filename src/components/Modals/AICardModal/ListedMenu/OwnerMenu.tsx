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
  const onDelistAICard = useChatContext((v) => v.actions.onDelistAICard);

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
        filled
      >
        <Icon
          className={css`
            font-size: 1.6rem;
            @media (max-width: ${mobileMaxWidth}) {
              font-size: 1rem;
            }
          `}
          icon="redo"
        />
        <span
          className={css`
            font-size: 1.6rem;
            @media (max-width: ${mobileMaxWidth}) {
              font-size: 1rem;
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
      const success = await delistAICard(cardId);
      if (success) {
        onDelistAICard(cardId);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setDelisting(false);
    }
  }
}
