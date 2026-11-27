import React, { useRef, useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import { Color } from '~/constants/css';
import { useRoleColor } from '~/theme/hooks/useRoleColor';

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
  modalOverModal = false,
  modalLevel,
  portalTarget
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
  modalLevel?: number;
  // mount inside this element instead of #modal (a fixed page above it)
  portalTarget?: HTMLElement;
}) {
  const { colorKey: doneColorKey } = useRoleColor('done', {
    fallback: 'blue'
  });
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const appliedConfirmColor =
    confirmButtonColor ||
    (doneColorKey && doneColorKey in Color ? doneColorKey : 'blue');
  const handleClose = () => {
    if (!submittingRef.current) onHide();
  };
  return (
    <Modal
      modalKey="ConfirmModal"
      isOpen
      portalTarget={portalTarget}
      onClose={handleClose}
      hasHeader
      title={title}
      size="md"
      modalLevel={modalLevel ?? (modalOverModal ? 2 : undefined)}
      priority={modalOverModal}
      closeOnBackdropClick={!submitting}
      closeOnEscape={!submitting}
      showCloseButton={!submitting}
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
            <Button variant="ghost" disabled={submitting} onClick={handleClose}>
              {cancelLabel}
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="ghost"
              disabled={submitting}
              style={{ marginRight: '0.7rem' }}
              onClick={handleClose}
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
    </Modal>
  );

  async function handleConfirm() {
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      setSubmitting(true);
      await onConfirm();
    } catch (error) {
      console.error(error);
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }
}
