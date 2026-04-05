import React, { useEffect, useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import Input from '~/components/Texts/Input';
import Textarea from '~/components/Texts/Textarea';
import { Color } from '~/constants/css';
import { css } from '@emotion/css';

export default function BuildDescriptionModal({
  initialTitle,
  initialDescription,
  loading = false,
  onHide,
  onSubmit
}: {
  initialTitle: string;
  initialDescription?: string | null;
  loading?: boolean;
  onHide: () => void;
  onSubmit: (metadata: {
    title: string;
    description: string;
  }) => void | Promise<void>;
}) {
  const [title, setTitle] = useState(initialTitle || '');
  const [description, setDescription] = useState(initialDescription || '');

  useEffect(() => {
    setTitle(initialTitle || '');
  }, [initialTitle]);

  useEffect(() => {
    setDescription(initialDescription || '');
  }, [initialDescription]);

  const trimmedTitle = title.trim();
  const isTitleValid = trimmedTitle.length > 0;

  return (
    <Modal
      modalKey="BuildDescriptionModal"
      isOpen
      onClose={onHide}
      title="Edit Build Details"
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
          <Button
            color="logoBlue"
            loading={loading}
            disabled={!isTitleValid}
            onClick={handleSubmit}
          >
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
          Keep your build easy to recognize and understand.
        </div>
        <div
          className={css`
            display: flex;
            flex-direction: column;
            gap: 0.45rem;
          `}
        >
          <label
            className={css`
              font-size: 1.1rem;
              font-weight: 700;
              letter-spacing: 0.04em;
              text-transform: uppercase;
              color: ${Color.darkGray()};
            `}
          >
            Build Name
          </label>
          <Input
            autoFocus
            value={title}
            onChange={setTitle}
            placeholder="My awesome app"
            style={{ width: '100%' }}
          />
        </div>
        <div
          className={css`
            display: flex;
            flex-direction: column;
            gap: 0.45rem;
          `}
        >
          <label
            className={css`
              font-size: 1.1rem;
              font-weight: 700;
              letter-spacing: 0.04em;
              text-transform: uppercase;
              color: ${Color.darkGray()};
            `}
          >
            Description
          </label>
          <Textarea
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
      </div>
    </Modal>
  );

  function handleSubmit() {
    if (!trimmedTitle) return;
    onSubmit({
      title: trimmedTitle,
      description: description.trim()
    });
  }
}
