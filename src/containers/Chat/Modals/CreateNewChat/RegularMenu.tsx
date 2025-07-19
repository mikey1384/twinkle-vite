import React, { useMemo, useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import Button from '~/components/Button';
import Input from '~/components/Texts/Input';
import SwitchButton from '~/components/Buttons/SwitchButton';
import { Color } from '~/constants/css';
import { SELECTED_LANGUAGE } from '~/constants/defaultValues';
import { useKeyContext } from '~/contexts';
import localize from '~/constants/localize';

const backLabel = localize('back');
const cancelLabel = localize('cancel');
const createLabel = localize('create');
const enterGroupNameLabel = localize('enterGroupName');
const newGroupLabel = localize('newGroup');
const groupNameLabel = localize('groupName');
const youCanChangeThisSettingLaterLabel = localize(
  'youCanChangeThisSettingLater'
);

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
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);
  const [channelName, setChannelName] = useState('');
  const [isClosed, setIsClosed] = useState(false);

  const anyoneCanInviteLabel = useMemo(() => {
    if (SELECTED_LANGUAGE === 'kr') {
      return (
        <>
          <span style={{ color: Color.logoBlue() }}>누구나</span> 새로운 멤버
          초대 가능:
        </>
      );
    }
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
          transparent
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
