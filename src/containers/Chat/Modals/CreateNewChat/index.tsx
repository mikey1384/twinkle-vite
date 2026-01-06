import React from 'react';
import Modal from '~/components/Modal';
import LegacyModalLayout from '~/components/Modal/LegacyModalLayout';
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
      <Modal
        modalKey="CreateNewChat"
        isOpen
        onClose={onHide}
        hasHeader={false}
        bodyPadding={0}
        allowOverflow
      >
        <LegacyModalLayout wrapped>
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
        </LegacyModalLayout>
      </Modal>
    </ErrorBoundary>
  );
}
