import React from 'react';
import NewModal from '~/components/NewModal';
import Button from '~/components/Button';
import { useKeyContext } from '~/contexts';

export default function AlertModal({
  isOpen = true,
  onHide,
  modalLevel = 2,
  title,
  content
}: {
  isOpen?: boolean;
  onHide: () => void;
  modalLevel?: number;
  title: string;
  content: string | React.ReactNode;
}) {
  const doneColor = useKeyContext((v) => v.theme.done.color);

  return (
    <NewModal
      isOpen={isOpen}
      onClose={onHide}
      title={title}
      size="sm"
      modalLevel={modalLevel}
      footer={
        <Button transparent color={doneColor} onClick={onHide}>
          OK
        </Button>
      }
    >
      <div
        style={{
          textAlign: 'center',
          padding: '1rem 0',
          minHeight: '4rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {content}
      </div>
    </NewModal>
  );
}
