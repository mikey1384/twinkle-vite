import React from 'react';
import Modal from '~/components/Modal';
import RegularMenu from './RegularMenu';
import TeacherMenu from './TeacherMenu';
import { useKeyContext } from '~/contexts';
import { isSupermod } from '~/helpers';
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
  const level = useKeyContext((v) => v.myState.level);

  return (
    <ErrorBoundary componentPath="Chat/Modals/CreateNewChat">
      <Modal wrapped onHide={onHide}>
        {isSupermod(level) ? (
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
