import React from 'react';
import Modal from '~/components/Modal';
import JSONEditor from './JSONEditor';
import Button from './Button';
import { css } from '@emotion/css';

export default function InnerEditorModal({
  json,
  onChange,
  onSave,
  onHide
}: {
  json: string | null;
  onChange: (newJson: string) => void;
  onSave: () => void;
  onHide: () => void;
}) {
  return (
    <Modal modalOverModal closeWhenClickedOutside={false} onHide={onHide}>
      <header
        className={css`
          font-size: 1.5rem;
          font-weight: bold;
          text-align: center;
          padding: 1rem;
        `}
      >
        Edit Nested Object
      </header>
      <main
        className={css`
          padding: 1.5rem;
        `}
      >
        <JSONEditor
          initialJson={json}
          onChange={onChange}
          onEditNested={() => {
            console.log('pressed');
          }}
        />
      </main>
      <footer
        className={css`
          display: flex;
          justify-content: flex-end;
          padding: 1rem;
        `}
      >
        <Button transparent style={{ marginRight: '0.7rem' }} onClick={onHide}>
          Close
        </Button>
        <Button onClick={onSave}>Apply</Button>
      </footer>
    </Modal>
  );
}
