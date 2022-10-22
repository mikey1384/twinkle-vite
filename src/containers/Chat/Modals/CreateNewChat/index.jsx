import PropTypes from 'prop-types';
import Modal from '~/components/Modal';
import RegularMenu from './RegularMenu';
import TeacherMenu from './TeacherMenu';
import { useKeyContext } from '~/contexts';
import ErrorBoundary from '~/components/ErrorBoundary';

CreateNewChatModal.propTypes = {
  creatingChat: PropTypes.bool,
  onDone: PropTypes.func.isRequired,
  onHide: PropTypes.func.isRequired
};

export default function CreateNewChatModal({ creatingChat, onHide, onDone }) {
  const { authLevel } = useKeyContext((v) => v.myState);
  return (
    <ErrorBoundary componentPath="Chat/Modals/CreateNewChat">
      <Modal onHide={onHide}>
        {authLevel > 2 ? (
          <TeacherMenu
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
