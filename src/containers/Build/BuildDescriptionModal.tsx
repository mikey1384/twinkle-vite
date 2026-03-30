import React, { useEffect, useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import Textarea from '~/components/Texts/Textarea';
import { Color } from '~/constants/css';
import { css } from '@emotion/css';

export default function BuildDescriptionModal({
  buildTitle,
  initialDescription,
  loading = false,
  onHide,
  onSubmit
}: {
  buildTitle: string;
  initialDescription?: string | null;
  loading?: boolean;
  onHide: () => void;
  onSubmit: (description: string) => void | Promise<void>;
}) {
  const [description, setDescription] = useState(initialDescription || '');

  useEffect(() => {
    setDescription(initialDescription || '');
  }, [initialDescription]);

  return (
    <Modal
      modalKey="BuildDescriptionModal"
      isOpen
      onClose={onHide}
      title={initialDescription?.trim() ? 'Edit Description' : 'Add Description'}
      size="md"
      footer={
        <div>
          <Button
            variant="ghost"
            disabled={loading}
            onClick={onHide}
            style={{ marginRight: '0.7rem' }}
          >
            Cancel
          </Button>
          <Button color="logoBlue" loading={loading} onClick={handleSubmit}>
            Save
          </Button>
        </div>
      }
    >
      <div
        className={css`
          display: flex;
          flex-direction: column;
          gap: 1rem;
        `}
      >
        <div
          className={css`
            font-size: 1.45rem;
            color: ${Color.darkGray()};
            line-height: 1.6;
          `}
        >
          Write a description for <b>{buildTitle}</b>.
        </div>
        <Textarea
          autoFocus
          minRows={4}
          maxRows={8}
          value={description}
          placeholder="What is this build for?"
          onChange={(event) => setDescription(event.target.value)}
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
              event.preventDefault();
              handleSubmit();
            }
          }}
          style={{
            width: '100%'
          }}
        />
      </div>
    </Modal>
  );

  function handleSubmit() {
    onSubmit(description.trim());
  }
}
