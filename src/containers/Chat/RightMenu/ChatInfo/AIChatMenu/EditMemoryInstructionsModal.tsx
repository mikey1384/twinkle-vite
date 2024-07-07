import React, { useMemo, useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import Textarea from '~/components/Texts/Textarea';
import { css } from '@emotion/css';
import { exceedsCharLimit } from '~/helpers/stringHelpers';
import { useChatContext, useKeyContext } from '~/contexts';

export default function EditMemoryInstructionsModal({
  channelId,
  topicId,
  defaultMemoryInstructions,
  memoryInstructions = '',
  onHide
}: {
  channelId: number;
  topicId: number;
  defaultMemoryInstructions: string;
  memoryInstructions: string;
  onHide: () => void;
}) {
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);
  const onSetChannelState = useChatContext((v) => v.actions.onSetChannelState);
  const [editedMemoryInstructions, setEditedMemoryInstructions] =
    useState(memoryInstructions);
  const commentExceedsCharLimit = useMemo(
    () =>
      exceedsCharLimit({
        contentType: 'comment',
        text: editedMemoryInstructions
      }),
    [editedMemoryInstructions]
  );
  return (
    <Modal onHide={onHide}>
      <header
        className={css`
          font-size: 1.5rem;
          font-weight: bold;
          text-align: center;
          padding: 1rem;
        `}
      >
        Memory Instructions
      </header>
      <main
        className={css`
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
        `}
      >
        <div style={{ width: '100%' }}>
          <Textarea
            placeholder={defaultMemoryInstructions}
            style={{
              width: '100%',
              position: 'relative'
            }}
            hasError={!!commentExceedsCharLimit}
            minRows={3}
            value={editedMemoryInstructions}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              setEditedMemoryInstructions(event.target.value)
            }
          />
        </div>
      </main>
      <footer
        className={css`
          display: flex;
          justify-content: flex-end;
          padding: 1rem;
        `}
      >
        <Button transparent style={{ marginRight: '0.7rem' }} onClick={onHide}>
          Cancel
        </Button>
        <Button color={doneColor} onClick={handleSave}>
          Save
        </Button>
      </footer>
    </Modal>
  );

  async function handleSave() {
    try {
      onSetChannelState({
        channelId,
        topicId,
        newState: { selectedTab: 'all' }
      });
      onHide();
    } catch (error) {
      console.error(error);
    }
  }
}
