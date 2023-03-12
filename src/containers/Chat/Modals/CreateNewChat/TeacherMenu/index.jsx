import { useState } from 'react';
import PropTypes from 'prop-types';
import SelectScreen from './SelectScreen';
import ErrorBoundary from '~/components/ErrorBoundary';
import ClassroomChatForm from './ClassroomChatForm';
import RegularMenu from '../RegularMenu';

TeacherMenu.propTypes = {
  channelId: PropTypes.number,
  creatingChat: PropTypes.bool,
  onCreateRegularChat: PropTypes.func.isRequired,
  onHide: PropTypes.func.isRequired
};

export default function TeacherMenu({
  channelId,
  creatingChat,
  onCreateRegularChat,
  onHide
}) {
  const [section, setSection] = useState('select');
  return (
    <ErrorBoundary componentPath="CreateNewChat/TeacherMenu/index">
      {section === 'select' && (
        <SelectScreen onSetSection={setSection} onHide={onHide} />
      )}
      {section === 'regular' && (
        <RegularMenu
          creatingChat={creatingChat}
          onBackClick={() => setSection('select')}
          onDone={onCreateRegularChat}
          onHide={onHide}
        />
      )}
      {section === 'classroom' && (
        <ClassroomChatForm
          channelId={channelId}
          onBackClick={() => setSection('select')}
          onHide={onHide}
        />
      )}
    </ErrorBoundary>
  );
}
