import React from 'react';
import Modal from '~/components/Modal';
import JSONEditor from './JSONEditor';
import { css } from '@emotion/css';

export default function InnerEditorModal({
  json,
  onChange,
  onHide
}: {
  json: string;
  onChange: (newJson: string) => void;
  onHide: () => void;
}) {
  return (
    <Modal modalOverModal onHide={onHide}>
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
        <JSONEditor initialJson={json} onChange={onChange} />
      </main>
    </Modal>
  );
}
