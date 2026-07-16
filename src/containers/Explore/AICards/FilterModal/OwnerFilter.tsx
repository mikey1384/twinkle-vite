import React from 'react';
import SelectedUser from '~/components/Texts/SelectedUser';
import UserSearchInput, {
  type UserSearchResult
} from '~/components/UserSearchInput';

export default function OwnerFilter({
  onSelectOwner,
  selectedFilter,
  selectedOwner,
  style
}: {
  onSelectOwner: (owner: string) => void;
  selectedFilter: string;
  selectedOwner: string;
  style: React.CSSProperties;
}) {
  return (
    <div
      style={{
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        ...style
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div>
          <b>Owner:</b>
        </div>
        <SelectedUser
          selectedUser={selectedOwner}
          onClear={() => onSelectOwner('')}
          style={{ marginLeft: '0.7rem' }}
        />
      </div>
      <div
        style={{
          marginTop: '0.5rem',
          position: 'relative'
        }}
      >
        <UserSearchInput
          placeholder="Search user..."
          autoFocus={selectedFilter === 'owner'}
          onSelect={handleSelectUser}
        />
      </div>
    </div>
  );

  function handleSelectUser(user: UserSearchResult) {
    onSelectOwner(user.username);
  }
}
