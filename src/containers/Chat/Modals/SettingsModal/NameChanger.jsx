import React from 'react';
import PropTypes from 'prop-types';
import Input from '~/components/Texts/Input';
import { Color } from '~/constants/css';

NameChanger.propTypes = {
  actualChannelName: PropTypes.string.isRequired,
  editedChannelName: PropTypes.string.isRequired,
  onSetEditedChannelName: PropTypes.func.isRequired,
  usingCustomName: PropTypes.bool,
  userIsChannelOwner: PropTypes.bool
};
export default function NameChanger({
  actualChannelName,
  editedChannelName,
  onSetEditedChannelName,
  usingCustomName,
  userIsChannelOwner
}) {
  return (
    <div style={{ width: '100%' }}>
      {userIsChannelOwner && (
        <p style={{ fontWeight: 'bold', fontSize: '1.7rem' }}>Group Name:</p>
      )}
      <Input
        style={{ marginTop: '0.5rem', width: '100%' }}
        autoFocus
        placeholder={
          usingCustomName && !userIsChannelOwner
            ? actualChannelName
            : 'Enter group name...'
        }
        value={editedChannelName}
        onChange={onSetEditedChannelName}
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
