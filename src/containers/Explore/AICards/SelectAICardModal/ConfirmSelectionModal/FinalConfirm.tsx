import React, { useMemo } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import localize from '~/constants/localize';
import AICardsPreview from '~/components/AICardsPreview';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { useKeyContext } from '~/contexts';

const cancelLabel = localize('cancel');

export default function ConfirmSelectionModal({
  higherBidCards,
  selectedCardIds,
  isAICardModalShown,
  onHide,
  onSetAICardModalCardId
}: {
  higherBidCards: any[];
  selectedCardIds: number[];
  isAICardModalShown: boolean;
  onHide: () => void;
  onSetAICardModalCardId: (v: number) => void;
}) {
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);

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

  return (
    <Modal modalOverModal closeWhenClickedOutside={false} onHide={onHide}>
      <header>Confirm</header>
      <main>
        <div>
          <p>
            The following cards have bids higher than the price you are listing
            the cards for and will be sold immediately
          </p>
          <AICardsPreview
            isOnModal
            isAICardModalShown={isAICardModalShown}
            cardIds={higherBidCardIds}
            onSetAICardModalCardId={onSetAICardModalCardId}
          />
          You will receive {totalCoinsReceivableFromSelling} coins
        </div>
        <div>
          <p>
            The following cards will be listed on the market for the price you
            have set
          </p>
          <AICardsPreview
            isOnModal
            isAICardModalShown={isAICardModalShown}
            cardIds={selectedCardIds.filter(
              (cardId) => !higherBidCardIds.includes(cardId)
            )}
            onSetAICardModalCardId={onSetAICardModalCardId}
          />
        </div>
      </main>
      <footer>
        <Button transparent style={{ marginRight: '0.7rem' }} onClick={onHide}>
          {cancelLabel}
        </Button>
        <Button color={doneColor} onClick={() => console.log('clicked')}>
          Confirm
        </Button>
      </footer>
    </Modal>
  );
}
