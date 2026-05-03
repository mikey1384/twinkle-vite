import React, { useEffect, useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import Input from '~/components/Texts/Input';
import { Color } from '~/constants/css';
import { css } from '@emotion/css';

export default function BuildDeleteModal({
  buildTitle,
  title = 'Delete Build',
  actionLabel = 'Delete Build',
  body,
  confirmLabel,
  loading = false,
  onHide,
  onSubmit
}: {
  buildTitle: string;
  title?: string;
  actionLabel?: string;
  body?: React.ReactNode;
  confirmLabel?: React.ReactNode;
  loading?: boolean;
  onHide: () => void;
  onSubmit: (confirmTitle: string) => void | Promise<void>;
}) {
  const [confirmTitle, setConfirmTitle] = useState('');

  useEffect(() => {
    setConfirmTitle('');
  }, [buildTitle]);

  const expectedTitle = String(buildTitle || '').trim();
  const matches = confirmTitle.trim() === expectedTitle;

  return (
    <Modal
      modalKey="BuildDeleteModal"
      isOpen
      onClose={onHide}
      title={title}
      size="md"
      footer={
        <div>
          <Button
            variant="ghost"
            disabled={loading}
            onClick={onHide}
            style={{ marginRight: '0.7rem' }}
            uppercase={false}
          >
            Cancel
          </Button>
          <Button
            color="red"
            variant="solid"
            disabled={!matches}
            loading={loading}
            onClick={handleSubmit}
            uppercase={false}
          >
            {actionLabel}
          </Button>
        </div>
      }
    >
      <div
        className={css`
          display: flex;
          flex-direction: column;
          gap: 1.2rem;
        `}
      >
        <div
          className={css`
            font-size: 1.35rem;
            color: ${Color.darkGray()};
            line-height: 1.65;
          `}
        >
          {body || (
            <>
              This permanently deletes <b>{buildTitle}</b>, including its files,
              versions, chat history, and runtime data.
            </>
          )}
        </div>
        <div
          className={css`
            font-size: 1.15rem;
            color: ${Color.red(0.9)};
            line-height: 1.6;
          `}
        >
          {confirmLabel || (
            <>
              Type <b>{buildTitle}</b> to confirm.
            </>
          )}
        </div>
        <Input
          value={confirmTitle}
          onChange={setConfirmTitle}
          placeholder={buildTitle}
          autoFocus
          style={{ width: '100%' }}
        />
      </div>
    </Modal>
  );

  function handleSubmit() {
    if (!matches) return;
    onSubmit(confirmTitle.trim());
  }
}
