import React, { useRef, useState } from 'react';
import SelectScreen from './SelectScreen';
import ErrorBoundary from '~/components/ErrorBoundary';
import ClassroomChatForm from './ClassroomChatForm';
import RegularMenu from '../RegularMenu';

export default function TeacherMenu({
  channelId,
  creatingChat,
  onCreateRegularChat,
  onBusyChange,
  onHide
}: {
  channelId: number;
  creatingChat: boolean;
  onCreateRegularChat: (v: any) => void;
  onBusyChange?: (busy: boolean) => void;
  onHide: () => void;
}) {
  const [section, setSection] = useState('select');
  const previousChoice = useRef('regular');
  return (
    <ErrorBoundary componentPath="CreateNewChat/TeacherMenu/index">
      {section === 'select' && (
        <SelectScreen
          focusChoice={previousChoice.current}
          onSetSection={(next) => { previousChoice.current = next; setSection(next); }}
          onHide={onHide}
        />
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
          onBusyChange={onBusyChange}
          onBackClick={() => setSection('select')}
          onHide={onHide}
        />
      )}
    </ErrorBoundary>
  );
}
