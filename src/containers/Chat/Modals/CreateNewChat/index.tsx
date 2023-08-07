import React from 'react';
import Modal from '~/components/Modal';
import RegularMenu from './RegularMenu';
import TeacherMenu from './TeacherMenu';
import { useKeyContext } from '~/contexts';
import { useUserLevel } from '~/helpers/hooks';
import { TEACHER_AUTH_LEVEL } from '~/constants/defaultValues';
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
  const { userId } = useKeyContext((v) => v.myState);
  const { level } = useUserLevel(userId);

  return (
    <ErrorBoundary componentPath="Chat/Modals/CreateNewChat">
      <Modal onHide={onHide}>
        {level >= TEACHER_AUTH_LEVEL ? (
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
