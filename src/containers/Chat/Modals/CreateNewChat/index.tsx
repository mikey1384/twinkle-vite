import React from 'react';
import Modal from '~/components/Modal';
import RegularMenu from './RegularMenu';
import TeacherMenu from './TeacherMenu';
import { useKeyContext } from '~/contexts';
import ErrorBoundary from '~/components/ErrorBoundary';

export default function CreateNewChatModal({
  channelId,
  creatingChat,
  onHide,
  onDone
}: {
  channelId: number;
  creatingChat: boolean;
  onHide: () => void;
  onDone: (v: any) => void;
}) {
  const { authLevel } = useKeyContext((v) => v.myState);
  return (
    <ErrorBoundary componentPath="Chat/Modals/CreateNewChat">
      <Modal onHide={onHide}>
        {authLevel > 2 ? (
          <TeacherMenu
            channelId={channelId}
            creatingChat={creatingChat}
            onCreateRegularChat={onDone}
            onHide={onHide}
          />
        ) : (
          <RegularMenu
            creatingChat={creatingChat}
            onHide={onHide}
            onDone={onDone}
          />
        )}
      </Modal>
    </ErrorBoundary>
  );
}
