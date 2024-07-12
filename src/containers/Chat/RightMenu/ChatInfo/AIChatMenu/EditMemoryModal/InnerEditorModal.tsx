import React, { useState } from 'react';
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

  return (
    <Modal modalOverModal closeWhenClickedOutside={false} onHide={onHide}>
      <header>Edit</header>
      <main style={{ flexGrow: 0 }}>
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
        <Button color={doneColor} onClick={handleApply}>
          Apply
        </Button>
      </footer>
    </Modal>
  );

  function handleApply() {
    onApply(editedJson);
    onHide();
  }
}
