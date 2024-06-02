import React, { useMemo } from 'react';
import Input from '~/components/Texts/Input';
import { Color } from '~/constants/css';
import { exceedsCharLimit } from '~/helpers/stringHelpers';

export default function NameChanger({
  actualChannelName,
  editedChannelName,
  onSetEditedChannelName,
  usingCustomName,
  userIsChannelOwner
}: {
  actualChannelName?: string;
  editedChannelName: string;
  onSetEditedChannelName: (v: string) => void;
  usingCustomName: boolean;
  userIsChannelOwner: boolean;
}) {
  const nameExceedsCharLimit = useMemo(
    () =>
      exceedsCharLimit({
        contentType: 'group',
        inputType: 'name',
        text: editedChannelName
      }),
    [editedChannelName]
  );

  return (
    <div style={{ width: '100%' }}>
      {userIsChannelOwner && (
        <p style={{ fontWeight: 'bold', fontSize: '1.7rem' }}>Group Name:</p>
      )}
      <Input
        style={{
          marginTop: '0.5rem',
          width: '100%'
        }}
        hasError={!!nameExceedsCharLimit}
        autoFocus
        placeholder={
          usingCustomName && !userIsChannelOwner
            ? actualChannelName
            : 'Enter group name...'
        }
        value={editedChannelName}
        onChange={onSetEditedChannelName}
        errorMessage="Group name exceeds character limit"
      />
      {!userIsChannelOwner && usingCustomName && (
        <div
          style={{
            marginTop: '0.5rem',
            color: Color.darkerGray(),
            fontSize: '1.3rem'
          }}
        >
          <b>Actual name:</b> {actualChannelName}
        </div>
      )}
    </div>
  );
}
