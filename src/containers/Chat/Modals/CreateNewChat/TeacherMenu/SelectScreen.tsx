import React from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { Color } from '~/constants/css';
const cancelLabel = 'Cancel';
const classroomChatLabel = 'Classroom';
const regularChatLabel = 'Regular Chat';
const startNewChatLabel = 'Start a New Chat';

export default function SelectScreen({
  onHide,
  onSetSection
}: {
  onHide: () => void;
  onSetSection: (section: string) => void;
}) {
  return (
    <ErrorBoundary componentPath="CreateNewChat/TeacherMenu/SelectScreen">
      <header>{startNewChatLabel}</header>
      <main>
        <div
          style={{
            display: 'flex',
            width: '100%',
            justifyContent: 'center'
          }}
        >
          <div
            style={{
              width: '30%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            <div
              style={{
                fontWeight: 'bold',
                fontSize: '2rem',
                color: Color.black()
              }}
            >
              {regularChatLabel}
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                marginTop: '1.5rem'
              }}
            >
              <Button
                variant="soft"
                tone="raised"
                style={{ fontSize: '3.5rem', padding: '1.5rem' }}
                color="blue"
                onClick={() => onSetSection('regular')}
              >
                <Icon icon="comments" />
              </Button>
            </div>
          </div>
          <div
            style={{
              width: '30%',
              flexDirection: 'column',
              alignItems: 'center',
              display: 'flex',
              marginLeft: '1rem'
            }}
          >
            <div
              style={{
                fontWeight: 'bold',
                fontSize: '2rem',
                color: Color.black()
              }}
            >
              {classroomChatLabel}
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                marginTop: '1.5rem'
              }}
            >
              <Button
                variant="soft"
                tone="raised"
                style={{ fontSize: '3.5rem', padding: '1.5rem' }}
                color="pink"
                onClick={() => onSetSection('classroom')}
              >
                <Icon icon="chalkboard-teacher" />
              </Button>
            </div>
          </div>
        </div>
      </main>
      <footer>
        <Button variant="ghost" onClick={onHide}>
          {cancelLabel}
        </Button>
      </footer>
    </ErrorBoundary>
  );
}
