import React, { useMemo } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import localize from '~/constants/localize';
import AICardsPreview from '~/components/AICardsPreview';
import { useKeyContext } from '~/contexts';

const cancelLabel = localize('cancel');

export default function ConfirmSelectionModal({
  higherBidCards,
  isAICardModalShown,
  onHide,
  onSetAICardModalCardId
}: {
  higherBidCards: any[];
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
    return result;
  }, [higherBidCards]);

  return (
    <Modal modalOverModal closeWhenClickedOutside={false} onHide={onHide}>
      <header>Confirm</header>
      <main>
        <AICardsPreview
          isOnModal
          isAICardModalShown={isAICardModalShown}
          cardIds={higherBidCards.map(({ cardId }) => cardId)}
          onSetAICardModalCardId={onSetAICardModalCardId}
        />
        receive {totalCoinsReceivableFromSelling} coins
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
