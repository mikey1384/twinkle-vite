import React, { useState, useEffect } from 'react';
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
    { key: string; json: string }[]
  >([]);

  async function handleSave() {
    console.log('saving...', channelId, topicId, editedJson);
  }

  function handleJsonChange(newJson: string) {
    setEditedJson(newJson);
    updateNestedEditors(newJson);
  }

  function handleNestedChange(newJson = '', level: number) {
    setNestedEditors((prevEditors) => {
      const updatedEditors = [...prevEditors];
      updatedEditors[level].json = newJson;
      return updatedEditors;
    });

    setEditedJson((prevJson) => {
      if (!isValidJson(newJson)) return prevJson;
      const parsedJson = JSON.parse(prevJson);
      const keys = nestedEditors
        .slice(0, level + 1)
        .map((editor) => editor.key);
      let nestedObj = parsedJson;
      keys.forEach((key, idx) => {
        if (idx === keys.length - 1) {
          setValue(nestedObj, key, JSON.parse(newJson));
        } else {
          nestedObj = getValue(nestedObj, key);
        }
      });
      return JSON.stringify(parsedJson, null, 2);
    });
  }

  function updateNestedEditors(newJson: string) {
    setNestedEditors((prev) =>
      prev.map((editor) => {
        if (!isValidJson(newJson)) return editor;
        const parsedJson = JSON.parse(newJson);
        const nestedObj = getValue(parsedJson, editor.key);
        return { ...editor, json: JSON.stringify(nestedObj, null, 2) };
      })
    );
  }

  function openNestedEditor(key: string, json: string) {
    setNestedEditors((prev) => [...prev, { key, json }]);
  }

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
          onEditNested={(key) => {
            const parsedJson = JSON.parse(editedJson);
            openNestedEditor(
              key,
              JSON.stringify(getValue(parsedJson, key), null, 2)
            );
          }}
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
          key={idx}
          json={editor.json}
          onApply={(newJson) => {
            handleNestedChange(newJson || '', idx);
          }}
          onHide={() => setNestedEditors((prev) => prev.slice(0, idx))}
          onEditNested={(key) => {
            if (!isValidJson(editor.json)) return;
            const parsedJson = JSON.parse(editor.json);
            openNestedEditor(
              `${editor.key}.${key}`,
              JSON.stringify(getValue(parsedJson, key), null, 2)
            );
          }}
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
