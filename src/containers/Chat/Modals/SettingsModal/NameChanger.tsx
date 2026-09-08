import React, { useId } from 'react';
import { exceedsCharLimit } from '~/helpers/stringHelpers';

export default function NameChanger({
  actualChannelName,
  editedChannelName,
  onSetEditedChannelName,
  usingCustomName,
  userIsChannelOwner,
  disabled = false
}: {
  actualChannelName?: string;
  editedChannelName: string;
  onSetEditedChannelName: (value: string) => void;
  usingCustomName: boolean;
  userIsChannelOwner: boolean;
  disabled?: boolean;
}) {
  const id = useId();
  const error = exceedsCharLimit({ contentType: 'group', inputType: 'name', text: editedChannelName });
  return <div style={{ width: '100%', minWidth: 0 }}>
    <label htmlFor={id}>{userIsChannelOwner ? 'Group name' : 'Your name for this group'}</label>
    <input id={id} type="text" autoFocus disabled={disabled}
      placeholder={usingCustomName && !userIsChannelOwner ? actualChannelName : 'Enter group name'}
      value={editedChannelName} aria-invalid={Boolean(error)} aria-describedby={id + '-hint'}
      onChange={event => onSetEditedChannelName(event.target.value)} />
    <p id={id + '-hint'} className={error ? 'error' : 'field-hint'} role={error ? 'alert' : undefined}>
      {error ? 'Group name exceeds the character limit.' : userIsChannelOwner
        ? 'This is the name everyone in the group sees.'
        : <>Only you see this name.{usingCustomName && <> Group name: <strong>{actualChannelName}</strong>.</>}</>}
    </p>
  </div>;
}
