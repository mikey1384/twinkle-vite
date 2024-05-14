import React, { useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import localize from '~/constants/localize';
import Details from './Details';
import FinalConfirm from './FinalConfirm';
import { useAppContext, useKeyContext } from '~/contexts';

const cancelLabel = localize('cancel');

export default function ConfirmSelectionModal({
  isAICardModalShown,
  onHide,
  onSetAICardModalCardId,
  selectedCardIds,
  onConfirm
}: {
  isAICardModalShown: boolean;
  onHide: () => void;
  onSetAICardModalCardId: (v: number) => void;
  selectedCardIds: number[];
  onConfirm: () => void;
}) {
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);
  const getHigherAICardBids = useAppContext(
    (v) => v.requestHelpers.getHigherAICardBids
  );

  const [confirmingPrice, setConfirmingPrice] = useState(false);
  const [finalConfirmShown, setFinalConfirmShown] = useState(false);
  const [higherBidCards, setHigherBidCards] = useState<number[]>([]);
  const [price, setPrice] = useState(0);

  return (
    <Modal modalOverModal closeWhenClickedOutside={false} onHide={onHide}>
      <header>Sell and/or List Multiple Cards on the Market</header>
      <main>
        <Details
          onSetPrice={setPrice}
          selectedCardIds={selectedCardIds}
          isAICardModalShown={isAICardModalShown}
          onSetAICardModalCardId={onSetAICardModalCardId}
          price={price}
        />
      </main>
      <footer>
        <Button transparent style={{ marginRight: '0.7rem' }} onClick={onHide}>
          {cancelLabel}
        </Button>
        <Button
          disabled={!price}
          loading={confirmingPrice}
          color={doneColor}
          onClick={handleClickSetPrice}
        >
          Set Price
        </Button>
      </footer>
      {finalConfirmShown && (
        <FinalConfirm
          isAICardModalShown={isAICardModalShown}
          selectedCardIds={selectedCardIds}
          higherBidCards={higherBidCards}
          price={price}
          onSetAICardModalCardId={onSetAICardModalCardId}
          onConfirm={onConfirm}
          onHide={() => {
            setFinalConfirmShown(false);
            setConfirmingPrice(false);
          }}
        />
      )}
    </Modal>
  );

  async function handleClickSetPrice() {
    setConfirmingPrice(true);
    const higherBids = await getHigherAICardBids(selectedCardIds, price);
    setHigherBidCards(higherBids);
    setFinalConfirmShown(true);
  }
}
