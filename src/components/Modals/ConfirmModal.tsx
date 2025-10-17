import React, { useState } from 'react';
import NewModal from '~/components/NewModal';
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
  onHide,
  title,
  onConfirm,
  confirmButtonColor = '',
  confirmButtonLabel = confirmLabel,
  isReverseButtonOrder,
  modalOverModal = false
}: {
  disabled?: boolean;
  description?: any;
  descriptionFontSize?: string;
  onHide: () => void;
  title: any;
  onConfirm: () => void;
  confirmButtonColor?: string;
  confirmButtonLabel?: string;
  isReverseButtonOrder?: boolean;
  modalOverModal?: boolean;
}) {
  const doneColor = useKeyContext((v) => v.theme.done.color);
  const [submitting, setSubmitting] = useState(false);
  return (
    <NewModal
      isOpen
      onClose={onHide}
      hasHeader
      title={title}
      size="md"
      modalLevel={modalOverModal ? 2 : undefined}
      priority={modalOverModal}
      closeOnBackdropClick
      footer={
        isReverseButtonOrder ? (
          <>
            <Button
              loading={submitting}
              disabled={disabled}
              style={{ marginRight: '1.5rem' }}
              color={confirmButtonColor || doneColor}
              onClick={handleConfirm}
            >
              {confirmButtonLabel}
            </Button>
            <Button transparent onClick={onHide}>
              {cancelLabel}
            </Button>
          </>
        ) : (
          <>
            <Button
              transparent
              style={{ marginRight: '0.7rem' }}
              onClick={onHide}
            >
              {cancelLabel}
            </Button>
            <Button
              loading={submitting}
              disabled={disabled}
              color={confirmButtonColor || doneColor}
              onClick={handleConfirm}
            >
              {confirmButtonLabel}
            </Button>
          </>
        )
      }
    >
      <div
        style={{
          fontSize: descriptionFontSize,
          paddingTop: 0,
          minHeight: '15rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {description}
      </div>
    </NewModal>
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
