import React, { useState } from 'react';
import Modal from '~/components/Modal';
import RegularMenu from './RegularMenu';
import TeacherMenu from './TeacherMenu';
import { useKeyContext } from '~/contexts';
import { isSupermod } from '~/helpers';
import ErrorBoundary from '~/components/ErrorBoundary';
import { chatFormModalClass } from '../chatFormStyles';

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
  const userId = useKeyContext((v) => v.myState.userId);
  const [classBusy, setClassBusy] = useState(false);
  const busy = creatingChat || classBusy;

  return (
    <ErrorBoundary componentPath="Chat/Modals/CreateNewChat">
      <Modal
        modalKey="CreateNewChat"
        isOpen
        aria-label="Create a chat"
        className={chatFormModalClass}
        showCloseButton={!busy}
        onClose={() => { if (!busy) onHide(); }}
        closeOnEscape={!busy}
        closeOnBackdropClick={!busy}
        hasHeader={false}
        bodyPadding={0}
      >
        <React.Fragment key={userId}>
          {isSupermod(level) ? (
            <TeacherMenu
              channelId={channelId}
              creatingChat={creatingChat}
              onBusyChange={setClassBusy}
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
        </React.Fragment>
      </Modal>
    </ErrorBoundary>
  );
}
