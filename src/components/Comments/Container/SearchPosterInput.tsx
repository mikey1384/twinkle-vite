import React from 'react';
import SelectedUser from '~/components/Texts/SelectedUser';
import UserSearchInput from '~/components/UserSearchInput';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import { User } from '~/types';

export default function SearchPosterInput({
  selectedUser,
  onSetSelectedUser
}: {
  selectedUser: User;
  onSetSelectedUser: (user: any) => void;
}) {
  return (
    <div
      style={{
        fontSize: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        marginBottom: '1rem'
      }}
    >
      <span
        className={css`
          font-family: 'Roboto', sans-serif;
          font-size: 1.5rem;
          @media (max-width: ${mobileMaxWidth}) {
            font-size: 1.25rem;
          }
        `}
      >
        Filter by Poster:
      </span>
      {!selectedUser ? (
        <div style={{ marginLeft: '1rem', position: 'relative' }}>
          <UserSearchInput
            placeholder="Search user..."
            onSelect={onSetSelectedUser}
          />
        </div>
      ) : (
        <SelectedUser
          selectedUser={selectedUser.username}
          onClear={() => onSetSelectedUser(null)}
          style={{ marginLeft: '0.7rem' }}
        />
      )}
    </div>
  );
}
