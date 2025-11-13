import React, { useState } from 'react';
import NewModal from '~/components/NewModal';
import Button from '~/components/Button';import { Color } from '~/constants/css';
import { useRoleColor } from '~/theme/useRoleColor';

const areYouSureLabel = 'Are you sure?';
const cancelLabel = 'Cancel';
const confirmLabel = 'Confirm';

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
  const { colorKey: doneColorKey } = useRoleColor('done', {
    fallback: 'blue'
  });
  const [submitting, setSubmitting] = useState(false);
  const appliedConfirmColor =
    confirmButtonColor ||
    (doneColorKey && doneColorKey in Color ? doneColorKey : 'blue');
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
              color={appliedConfirmColor}
              onClick={handleConfirm}
            >
              {confirmButtonLabel}
            </Button>
            <Button variant="ghost" onClick={onHide}>
              {cancelLabel}
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="ghost"
              style={{ marginRight: '0.7rem' }}
              onClick={onHide}
            >
              {cancelLabel}
            </Button>
            <Button
              loading={submitting}
              disabled={disabled}
              color={appliedConfirmColor}
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
