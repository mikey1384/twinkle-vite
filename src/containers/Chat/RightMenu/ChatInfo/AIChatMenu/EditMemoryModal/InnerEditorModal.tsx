import React, { useState, useEffect } from 'react';
import Modal from '~/components/Modal';
import JSONEditor from './JSONEditor';
import Button from '~/components/Button';
import { useKeyContext } from '~/contexts';

export default function InnerEditorModal({
  json = '{}',
  onApply,
  onHide,
  onEditNested
}: {
  json: string;
  onApply: (editedJson?: string) => void;
  onHide: () => void;
  onEditNested?: (key: string) => void;
}) {
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);
  const [editedJson, setEditedJson] = useState(json);
  const [isJsonChanged, setIsJsonChanged] = useState(false);

  useEffect(() => {
    setEditedJson(json);
  }, [json]);

  useEffect(() => {
    setIsJsonChanged(json !== editedJson);
  }, [json, editedJson]);

  return (
    <Modal modalOverModal closeWhenClickedOutside={false} onHide={onHide}>
      <header>Edit</header>
      <main style={{ flexGrow: 0 }}>
        <JSONEditor
          initialJson={json}
          onTextEdit={handleTextEdit}
          onChange={setEditedJson}
          onEditNested={onEditNested}
        />
      </main>
      <footer>
        <Button transparent style={{ marginRight: '0.7rem' }} onClick={onHide}>
          Close
        </Button>
        <Button
          color={doneColor}
          onClick={handleApply}
          disabled={!isJsonChanged}
        >
          Apply
        </Button>
      </footer>
    </Modal>
  );

  function handleTextEdit(path: string, value: any) {
    try {
      const updatedJson = JSON.parse(editedJson);
      const keys = path.split(/[.[\]]/).filter(Boolean);
      let current = updatedJson;

      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (!isNaN(Number(key))) {
          // If the key is a number, treat it as an array index
          const index = Number(key);
          if (!Array.isArray(current)) {
            throw new Error(`Trying to access index ${index} of non-array`);
          }
          if (current[index] === undefined) {
            current[index] = {};
          }
          current = current[index];
        } else {
          if (current[key] === undefined) {
            current[key] = {};
          }
          current = current[key];
        }
      }

      const lastKey = keys[keys.length - 1];
      if (!isNaN(Number(lastKey))) {
        // If the last key is a number, treat it as an array index
        current[Number(lastKey)] = value;
      } else {
        current[lastKey] = value;
      }

      setEditedJson(JSON.stringify(updatedJson, null, 2));
    } catch (error) {
      console.error('Error updating JSON:', error);
    }
  }

  function handleApply() {
    onApply(editedJson);
    onHide();
  }
}
