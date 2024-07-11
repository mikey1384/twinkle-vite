import React, { useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import { css } from '@emotion/css';
import { useKeyContext } from '~/contexts';
import JSONEditor from './JSONEditor';
import InnerEditorModal from './InnerEditorModal';

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
  const [nestedObjectKey, setNestedObjectKey] = useState<string | null>(null);

  async function handleSave() {
    console.log('saving...', channelId, topicId, editedJson);
  }

  function handleJsonChange(newJson: string) {
    setEditedJson(newJson);
  }

  function handleNestedChange(newJson: string) {
    setEditedJson((prevJson) => {
      const parsedPrevJson = JSON.parse(prevJson);
      parsedPrevJson[nestedObjectKey as string] = JSON.parse(newJson);
      return JSON.stringify(parsedPrevJson, null, 2);
    });
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
        <div
          className={css`
            width: 100%;
            max-height: 400px;
            overflow-y: auto;
          `}
        >
          <JSONEditor
            initialJson={editedJson}
            onChange={handleJsonChange}
            onEditNested={setNestedObjectKey}
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
      {nestedObjectKey && (
        <InnerEditorModal
          json={JSON.stringify(
            JSON.parse(editedJson)[nestedObjectKey],
            null,
            2
          )}
          onChange={handleNestedChange}
          onHide={() => setNestedObjectKey(null)}
        />
      )}
    </Modal>
  );
}
