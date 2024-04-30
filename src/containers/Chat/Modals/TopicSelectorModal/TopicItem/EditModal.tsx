import React, { useMemo, useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import Input from '~/components/Texts/Input';
import { useKeyContext } from '~/contexts';
import { css } from '@emotion/css';

export default function EditModal({
  onHide,
  onEditTopic,
  topicText
}: {
  onHide: () => void;
  onEditTopic: (text: string) => void;
  topicText: string;
}) {
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);
  const [submitting, setSubmitting] = useState(false);
  const [newTopicText, setNewTopicText] = useState(topicText);
  const isSubmitDisabled = useMemo(() => {
    if (topicText === newTopicText) return true;
    return newTopicText.trim().length === 0;
  }, [newTopicText, topicText]);

  return (
    <Modal modalOverModal onHide={onHide}>
      <header>Edit Topic</header>
      <main>
        <div
          style={{
            width: '100%',
            height: '15rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Input
            className={css`
              width: 50%;
              @media (max-width: 800px) {
                width: 100%;
              }
            `}
            placeholder="Enter Topic..."
            value={newTopicText}
            onChange={(text) => setNewTopicText(text)}
          />
        </div>
      </main>
      <footer>
        <Button transparent style={{ marginRight: '0.7rem' }} onClick={onHide}>
          Cancel
        </Button>
        <Button
          disabled={isSubmitDisabled}
          loading={submitting}
          color={doneColor}
          onClick={handleConfirm}
        >
          Confirm
        </Button>
      </footer>
    </Modal>
  );

  async function handleConfirm() {
    try {
      setSubmitting(true);
      onEditTopic(newTopicText);
    } catch (error) {
      console.error(error);
      setSubmitting(false);
    }
  }
}
