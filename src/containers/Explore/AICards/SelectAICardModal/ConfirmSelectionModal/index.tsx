import React, { useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import localize from '~/constants/localize';
import Details from './Details';
import { useKeyContext } from '~/contexts';

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

  const [submitting, setSubmitting] = useState(false);

  return (
    <Modal modalOverModal closeWhenClickedOutside={false} onHide={onHide}>
      <header>Sell and/or List Multiple Cards on the Market</header>
      <main>
        <Details
          selectedCardIds={selectedCardIds}
          isAICardModalShown={isAICardModalShown}
          onSetAICardModalCardId={onSetAICardModalCardId}
        />
      </main>
      <footer>
        <Button transparent style={{ marginRight: '0.7rem' }} onClick={onHide}>
          {cancelLabel}
        </Button>
        <Button
          loading={submitting}
          color={doneColor}
          onClick={() => setSubmitting(true)}
        >
          Set
        </Button>
      </footer>
    </Modal>
  );
}
