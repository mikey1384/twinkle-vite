import React from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import Textarea from '~/components/Texts/Textarea';
import { css } from '@emotion/css';
import { useKeyContext } from '~/contexts';

export default function EditMemoryModal({
  channelId,
  topicId,
  memoryJSON = '',
  onHide
}: {
  channelId: number;
  topicId: number;
  memoryJSON: string;
  onHide: () => void;
}) {
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);

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
        Memory
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
            placeholder="Enter memory instructions here..."
            style={{
              width: '100%',
              position: 'relative'
            }}
            minRows={3}
            value={memoryJSON}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              console.log(event.target.value)
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
        <Button disabled={true} color={doneColor} onClick={handleSave}>
          Save
        </Button>
      </footer>
    </Modal>
  );

  async function handleSave() {
    console.log('saving...', channelId, topicId);
  }
}
