import React, { useEffect, useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import Input from '~/components/Texts/Input';
import { Color } from '~/constants/css';
import { css } from '@emotion/css';

export default function BuildDeleteModal({
  buildTitle,
  loading = false,
  onHide,
  onSubmit
}: {
  buildTitle: string;
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
      title="Delete Build"
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
            Delete Build
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
          This permanently deletes <b>{buildTitle}</b>, including its files,
          versions, chat history, and runtime data.
        </div>
        <div
          className={css`
            font-size: 1.15rem;
            color: ${Color.red(0.9)};
            line-height: 1.6;
          `}
        >
          Type <b>{buildTitle}</b> to confirm.
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
