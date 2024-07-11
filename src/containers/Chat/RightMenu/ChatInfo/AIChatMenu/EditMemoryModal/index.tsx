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
  const [nestedEditors, setNestedEditors] = useState<
    { key: string; json: string }[]
  >([]);

  async function handleSave() {
    console.log('saving...', channelId, topicId, editedJson);
  }

  function handleJsonChange(newJson: string) {
    setEditedJson(newJson);
  }

  function handleNestedChange(newJson: string, level: number) {
    setNestedEditors((prev) =>
      prev.map((editor, idx) =>
        idx === level ? { ...editor, json: newJson } : editor
      )
    );
  }

  function openNestedEditor(key: string, json: string) {
    setNestedEditors((prev) => [...prev, { key, json }]);
  }

  function handleNestedSave(level: number) {
    if (nestedEditors[level]) {
      const { key, json } = nestedEditors[level];
      setEditedJson((prevJson) => {
        const parsedPrevJson = JSON.parse(prevJson);
        parsedPrevJson[key] = JSON.parse(json);
        return JSON.stringify(parsedPrevJson, null, 2);
      });
      setNestedEditors((prev) => prev.slice(0, level));
    }
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
            onEditNested={(key) => {
              const parsedJson = JSON.parse(editedJson);
              openNestedEditor(key, JSON.stringify(parsedJson[key], null, 2));
            }}
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
      {nestedEditors.map((editor, idx) => (
        <InnerEditorModal
          key={idx}
          json={editor.json}
          onChange={(newJson) => handleNestedChange(newJson, idx)}
          onSave={() => handleNestedSave(idx)}
          onHide={() => setNestedEditors((prev) => prev.slice(0, idx))}
          onEditNested={(key) => {
            const parsedJson = JSON.parse(editor.json);
            openNestedEditor(key, JSON.stringify(parsedJson[key], null, 2));
          }}
        />
      ))}
    </Modal>
  );
}
