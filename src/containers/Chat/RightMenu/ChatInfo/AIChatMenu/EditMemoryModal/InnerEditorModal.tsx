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
    const updatedJson = JSON.parse(editedJson);
    const keys = path.split('.');
    let current = updatedJson;
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    setEditedJson(JSON.stringify(updatedJson, null, 2));
  }

  function handleApply() {
    onApply(editedJson);
    onHide();
  }
}
