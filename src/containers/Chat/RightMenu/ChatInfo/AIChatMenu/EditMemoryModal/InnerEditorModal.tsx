import React, { useState } from 'react';
import Modal from '~/components/Modal';
import JSONEditor from './JSONEditor';
import Button from './Button';

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
  const [editedJson, setEditedJson] = useState(json);

  function handleApply() {
    onApply(editedJson);
    onHide();
  }

  return (
    <Modal modalOverModal closeWhenClickedOutside={false} onHide={onHide}>
      <header>Edit</header>
      <main>
        <JSONEditor
          initialJson={json}
          onChange={setEditedJson}
          onEditNested={onEditNested}
        />
      </main>
      <footer>
        <Button transparent style={{ marginRight: '0.7rem' }} onClick={onHide}>
          Close
        </Button>
        <Button onClick={handleApply}>Apply</Button>
      </footer>
    </Modal>
  );
}
