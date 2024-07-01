import React, { useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import localize from '~/constants/localize';
import { useKeyContext } from '~/contexts';

const areYouSureLabel = localize('areYouSure');
const cancelLabel = localize('cancel');
const confirmLabel = localize('confirm');

export default function ConfirmModal({
  disabled = false,
  description = areYouSureLabel,
  descriptionFontSize = '2.5rem',
  modalOverModal,
  onHide,
  title,
  onConfirm
}: {
  disabled?: boolean;
  description?: any;
  descriptionFontSize?: string;
  modalOverModal?: boolean;
  onHide: () => void;
  title: any;
  onConfirm: () => void;
}) {
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);
  const [submitting, setSubmitting] = useState(false);
  return (
    <Modal modalOverModal={modalOverModal} onHide={onHide}>
      <header>{title}</header>
      <main
        style={{
          fontSize: descriptionFontSize,
          paddingTop: 0,
          minHeight: '15rem',
          justifyContent: 'center'
        }}
      >
        {description}
      </main>
      <footer>
        <Button transparent style={{ marginRight: '0.7rem' }} onClick={onHide}>
          {cancelLabel}
        </Button>
        <Button
          loading={submitting}
          disabled={disabled}
          color={doneColor}
          onClick={handleConfirm}
        >
          {confirmLabel}
        </Button>
      </footer>
    </Modal>
  );

  async function handleConfirm() {
    try {
      setSubmitting(true);
      await onConfirm();
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  }
}
