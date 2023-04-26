import React, { useState } from 'react';
import SelectScreen from './SelectScreen';
import ErrorBoundary from '~/components/ErrorBoundary';
import ClassroomChatForm from './ClassroomChatForm';
import RegularMenu from '../RegularMenu';

export default function TeacherMenu({
  channelId,
  creatingChat,
  onCreateRegularChat,
  onHide
}: {
  channelId: number;
  creatingChat: boolean;
  onCreateRegularChat: (v: any) => void;
  onHide: () => void;
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
