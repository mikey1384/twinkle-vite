import React, { useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import localize from '~/constants/localize';
import Details from './Details';
import { useAppContext, useKeyContext } from '~/contexts';

const cancelLabel = localize('cancel');

export default function ConfirmSelectionModal({
  isAICardModalShown,
  onHide,
  onSetAICardModalCardId,
  selectedCardIds
}: {
  isAICardModalShown: boolean;
  onHide: () => void;
  onSetAICardModalCardId: (v: number) => void;
  selectedCardIds: number[];
}) {
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);
  const getHigherAICardBids = useAppContext(
    (v) => v.requestHelpers.getHigherAICardBids
  );

  const [submitting, setSubmitting] = useState(false);
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
          loading={submitting}
          color={doneColor}
          onClick={handleClickSetPrice}
        >
          Set Price
        </Button>
      </footer>
    </Modal>
  );

  async function handleClickSetPrice() {
    setSubmitting(true);
    const higherBids = await getHigherAICardBids(selectedCardIds, price);
    console.log(higherBids);
  }
}
