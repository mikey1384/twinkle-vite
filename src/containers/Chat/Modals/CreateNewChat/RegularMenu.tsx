import React, { useMemo, useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import Button from '~/components/Button';
import Input from '~/components/Texts/Input';
import SwitchButton from '~/components/Buttons/SwitchButton';
import { Color } from '~/constants/css';
import { useKeyContext } from '~/contexts';

const backLabel = 'Back';
const cancelLabel = 'Cancel';
const createLabel = 'Create';
const enterGroupNameLabel = 'Enter Group Name';
const newGroupLabel = 'New Group';
const groupNameLabel = 'Group name';
const youCanChangeThisSettingLaterLabel = 'You can change this setting later';

export default function RegularMenu({
  creatingChat,
  onBackClick,
  onHide,
  onDone
}: {
  creatingChat: boolean;
  onBackClick?: () => void;
  onHide: () => void;
  onDone: (v: any) => void;
}) {
  const userId = useKeyContext((v) => v.myState.userId);
  const doneColor = useKeyContext((v) => v.theme.done.color);
  const [channelName, setChannelName] = useState('');
  const [isClosed, setIsClosed] = useState(false);

  const anyoneCanInviteLabel = useMemo(() => {
    return (
      <>
        <span style={{ color: Color.logoBlue() }}>Anyone</span> can invite new
        members:
      </>
    );
  }, []);

  return (
    <ErrorBoundary componentPath="CreateNewChat/RegularMenu">
      <header>{newGroupLabel}</header>
      <main>
        <div style={{ width: '100%' }}>
          <div style={{ marginTop: '1.5rem' }}>
            <h3>{groupNameLabel}</h3>
            <Input
              style={{ marginTop: '1rem' }}
              placeholder={enterGroupNameLabel}
              maxLength="150"
              value={channelName}
              onChange={setChannelName}
            />
          </div>
          <div style={{ marginTop: '1.5rem' }}>
            <SwitchButton
              labelStyle={{ fontSize: '1.7rem', fontWeight: 'bold' }}
              label={anyoneCanInviteLabel}
              checked={!isClosed}
              onChange={() => setIsClosed((isClosed) => !isClosed)}
            />
            <p>({youCanChangeThisSettingLaterLabel})</p>
          </div>
        </div>
      </main>
      <footer>
        <Button
          style={{ marginRight: '0.7rem' }}
          variant="ghost"
          onClick={onBackClick || onHide}
        >
          {onBackClick ? backLabel : cancelLabel}
        </Button>
        <Button
          color={doneColor}
          onClick={handleDone}
          disabled={creatingChat || !channelName}
        >
          {createLabel}
        </Button>
      </footer>
    </ErrorBoundary>
  );

  function handleDone() {
    onDone({ userId, channelName, isClosed });
  }
}
