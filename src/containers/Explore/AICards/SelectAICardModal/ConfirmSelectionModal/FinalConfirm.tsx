import React, { useMemo, useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import localize from '~/constants/localize';
import AICardsPreview from '~/components/AICardsPreview';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';

const cancelLabel = localize('cancel');

export default function ConfirmSelectionModal({
  higherBidCards,
  selectedCardIds,
  isAICardModalShown,
  price,
  onHide,
  onConfirm,
  onSetAICardModalCardId
}: {
  higherBidCards: any[];
  selectedCardIds: number[];
  isAICardModalShown: boolean;
  price: number;
  onHide: () => void;
  onConfirm: () => void;
  onSetAICardModalCardId: (v: number) => void;
}) {
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const onListAICard = useChatContext((v) => v.actions.onListAICard);
  const userId = useKeyContext((v) => v.myState.userId);
  const doneColor = useKeyContext((v) => v.theme.done.color);
  const [confirming, setConfirming] = useState(false);
  const batchSellAICards = useAppContext(
    (v) => v.requestHelpers.batchSellAICards
  );

  const totalCoinsReceivableFromSelling = useMemo(() => {
    let result = 0;
    for (const { higherBid } of higherBidCards) {
      result += higherBid;
    }
    return addCommasToNumber(result);
  }, [higherBidCards]);

  const higherBidCardIds = useMemo(() => {
    return higherBidCards.map(({ cardId }) => cardId);
  }, [higherBidCards]);

  const restOfTheCardIds = useMemo(() => {
    return selectedCardIds.filter(
      (cardId) => !higherBidCardIds.includes(cardId)
    );
  }, [selectedCardIds, higherBidCardIds]);

  const displayedPrice = useMemo(() => {
    return `${addCommasToNumber(price)} coin${price === 1 ? '' : 's'}`;
  }, [price]);

  return (
    <Modal modalOverModal closeWhenClickedOutside={false} onHide={onHide}>
      <header>Final Confirmation</header>
      <main
        className={css`
          font-family: 'Helvetica Neue', Arial, sans-serif;
          text-align: center;
          color: #333;
          background-color: #fff;
          border-radius: 8px;
          p {
            margin-bottom: 1rem;
          }
          .card-section {
            display: flex;
            flex-direction: column;
            align-items: center;
            margin-bottom: 3rem;
          }
        `}
      >
        {!!higherBidCardIds?.length && (
          <div className="card-section">
            <p>
              The following cards have bids higher than {displayedPrice} and
              will be sold immediately:
            </p>
            <AICardsPreview
              isOnModal
              isAICardModalShown={isAICardModalShown}
              cardIds={higherBidCardIds}
              onSetAICardModalCardId={onSetAICardModalCardId}
            />
            <div
              className={css`
                margin-top: 1rem;
                font-weight: bold;
                color: ${Color.logoBlue()};
              `}
            >
              You will receive {totalCoinsReceivableFromSelling} coins
            </div>
          </div>
        )}
        {!!restOfTheCardIds?.length && (
          <div className="card-section">
            <p>
              The following cards will be listed on the market for{' '}
              {displayedPrice}:
            </p>
            <AICardsPreview
              isOnModal
              isAICardModalShown={isAICardModalShown}
              cardIds={restOfTheCardIds}
              onSetAICardModalCardId={onSetAICardModalCardId}
            />
          </div>
        )}
      </main>
      <footer>
        <Button transparent style={{ marginRight: '0.7rem' }} onClick={onHide}>
          {cancelLabel}
        </Button>
        <Button loading={confirming} color={doneColor} onClick={handleConfirm}>
          Confirm
        </Button>
      </footer>
    </Modal>
  );

  async function handleConfirm() {
    setConfirming(true);
    try {
      const { coins } = await batchSellAICards({
        selectedCardIds,
        cardIdsToSellNow: higherBidCardIds || [],
        price
      });
      onSetUserState({ userId, newState: { twinkleCoins: coins } });
      for (const cardId of selectedCardIds) {
        if (!higherBidCardIds.includes(cardId)) {
          onListAICard({
            card: { id: cardId },
            price: price || 0
          });
        }
      }
      onConfirm();
    } catch (error) {
      console.error(error);
    } finally {
      setConfirming(false);
    }
  }
}
