import React, { useState, useEffect, useCallback } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import { useKeyContext } from '~/contexts';
import JSONEditor from './JSONEditor';
import InnerEditorModal from './InnerEditorModal';
import { getValue, setValue } from './helpers';

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
    { path: string; json: string }[]
  >([]);

  async function handleSave() {
    console.log('saving...', channelId, topicId, editedJson);
  }

  const handleJsonChange = useCallback((newJson: string) => {
    setEditedJson(newJson);
    updateNestedEditors(newJson);
  }, []);

  function handleNestedChange(newJson: string, path: string) {
    if (!isValidJson(newJson)) return;

    setEditedJson((prevJson) => {
      let parsedJson = JSON.parse(prevJson);
      parsedJson = setValue(parsedJson, path, JSON.parse(newJson));
      const updatedJson = JSON.stringify(parsedJson, null, 2);
      updateNestedEditors(updatedJson);
      return updatedJson;
    });
  }

  function updateNestedEditors(newJson: string) {
    if (!isValidJson(newJson)) return;
    const parsedJson = JSON.parse(newJson);

    setNestedEditors((prev) =>
      prev.map((editor) => ({
        ...editor,
        json: JSON.stringify(getValue(parsedJson, editor.path), null, 2)
      }))
    );
  }

  const openNestedEditor = useCallback(
    (path: string) => {
      const parsedJson = JSON.parse(editedJson);
      const nestedObj = getValue(parsedJson, path);
      setNestedEditors((prev) => [
        ...prev,
        { path, json: JSON.stringify(nestedObj, null, 2) }
      ]);
    },
    [editedJson]
  );

  useEffect(() => {
    updateNestedEditors(editedJson);
  }, [editedJson]);

  return (
    <Modal onHide={onHide}>
      <header>Memory</header>
      <main
        style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          flexGrow: 0
        }}
      >
        <JSONEditor
          initialJson={editedJson}
          onChange={handleJsonChange}
          onEditNested={openNestedEditor}
        />
      </main>
      <footer>
        <Button transparent style={{ marginRight: '0.7rem' }} onClick={onHide}>
          Cancel
        </Button>
        <Button color={doneColor} onClick={handleSave}>
          Save
        </Button>
      </footer>
      {nestedEditors.map((editor, idx) => (
        <InnerEditorModal
          key={`${editor.path}-${idx}-${editor.json}`}
          json={editor.json}
          onApply={(newJson: any) => handleNestedChange(newJson, editor.path)}
          onHide={() => setNestedEditors((prev) => prev.slice(0, idx))}
          onEditNested={(key) => openNestedEditor(`${editor.path}.${key}`)}
        />
      ))}
    </Modal>
  );
}

function isValidJson(jsonString: string): boolean {
  try {
    JSON.parse(jsonString);
    return true;
  } catch (e) {
    return false;
  }
}
