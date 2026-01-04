import React from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import { Color } from '~/constants/css';
import { useRoleColor } from '~/theme/useRoleColor';

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
  const { colorKey: doneColorKey } = useRoleColor('done', {
    fallback: 'blue'
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onHide}
      title={title}
      size="sm"
      modalLevel={modalLevel}
      footer={
        <Button
          variant="ghost"
          color={doneColorKey && doneColorKey in Color ? doneColorKey : 'blue'}
          onClick={onHide}
        >
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
    </Modal>
  );
}
