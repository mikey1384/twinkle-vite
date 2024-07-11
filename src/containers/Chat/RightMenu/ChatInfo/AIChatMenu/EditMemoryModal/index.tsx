import React, { useState } from 'react';
import Modal from '~/components/Modal';
import CustomButton from './Button';
import { css } from '@emotion/css';
import { useKeyContext } from '~/contexts';
import JSONEditor from './JSONEditor';

export default function EditMemoryModal({
  channelId,
  topicId,
  memoryJSON = '',
  onHide
}: {
  channelId: number;
  topicId: number;
  memoryJSON?: string;
  onHide: () => void;
}) {
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);
  const [editedJson, setEditedJson] = useState(memoryJSON);

  async function handleSave() {
    console.log('saving...', channelId, topicId, editedJson);
  }

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
          <JSONEditor json={memoryJSON} onChange={setEditedJson} />
        </div>
      </main>
      <footer
        className={css`
          display: flex;
          justify-content: flex-end;
          padding: 1rem;
        `}
      >
        <CustomButton
          transparent
          style={{ marginRight: '0.7rem' }}
          onClick={onHide}
        >
          Cancel
        </CustomButton>
        <CustomButton color={doneColor} onClick={handleSave}>
          Save
        </CustomButton>
      </footer>
    </Modal>
  );
}
