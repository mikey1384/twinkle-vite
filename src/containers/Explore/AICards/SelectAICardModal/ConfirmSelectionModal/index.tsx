import React, { useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import localize from '~/constants/localize';
import Details from './Details';
import FinalConfirm from './FinalConfirm';
import { useAppContext } from '~/contexts';
import { useRoleColor } from '~/theme/useRoleColor';

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
  const { color: doneColor } = useRoleColor('done', {
    fallback: 'blue'
  });
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
        <Button variant="ghost" style={{ marginRight: '0.7rem' }} onClick={onHide}>
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
    try {
      const higherBids = await getHigherAICardBids(selectedCardIds, price);
      setHigherBidCards(higherBids);
      setFinalConfirmShown(true);
    } catch (error) {
      setConfirmingPrice(false);
      console.error(error);
    }
  }
}
