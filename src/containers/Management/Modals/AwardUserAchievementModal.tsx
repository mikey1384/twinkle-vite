import React, { useState, useMemo } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import ErrorBoundary from '~/components/ErrorBoundary';
import SearchInput from '~/components/Texts/SearchInput';
import Loading from '~/components/Loading';
import { useAppContext } from '~/contexts';
import { useSearch } from '~/helpers/hooks';
import localize from '~/constants/localize';

const searchUsersLabel = localize('searchUsers');

export default function AwardUserAchievementModal({
  achievementType,
  onHide,
  onSubmit
}: {
  achievementType: string;
  onHide: () => void;
  onSubmit: (users: string[]) => void;
}) {
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const [searchText, setSearchText] = useState('');
  const [searchedUsers, setSearchedUsers] = useState([]);
  const searchUsers = useAppContext((v) => v.requestHelpers.searchUsers);
  const { handleSearch, searching } = useSearch({
    onSearch: handleUserSearch,
    onClear: () => setSearchedUsers([]),
    onSetSearchText: setSearchText
  });

  const selectedUsernames = useMemo(() => {
    return selectedUsers.map((user) => user.username).join(', ');
  }, [selectedUsers]);

  return (
    <ErrorBoundary componentPath="Management/Main/Achievements/AwardUserAchievementModal">
      <Modal wrapped onHide={onHide}>
        <header>Grant {`"${achievementType}"`} Achievement</header>
        <main>
          <SearchInput
            autoFocus
            onChange={handleSearch}
            onSelect={handleSelectUser}
            placeholder={`${searchUsersLabel}...`}
            onClickOutSide={() => {
              setSearchText('');
              setSearchedUsers([]);
            }}
            renderItemLabel={(item) => (
              <span>
                {item.username} <small>{`(${item.realName})`}</small>
              </span>
            )}
            searchResults={searchedUsers}
            value={searchText}
          />
          {selectedUsers.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              Selected users: {selectedUsernames}
            </div>
          )}
          {searching && (
            <Loading style={{ position: 'absolute', marginTop: '1rem' }} />
          )}
        </main>
        <footer>
          <Button
            transparent
            style={{ marginRight: '0.7rem' }}
            onClick={onHide}
          >
            Cancel
          </Button>
          <Button
            color="blue"
            onClick={handleSubmit}
            disabled={selectedUsers.length === 0}
          >
            Add Users
          </Button>
        </footer>
      </Modal>
    </ErrorBoundary>
  );

  function handleSelectUser(user: any) {
    setSelectedUsers((users) => [...users, user]);
    setSearchedUsers([]);
    setSearchText('');
  }

  function handleSubmit() {
    const userList = selectedUsers.map((user) => user.username);
    onSubmit(userList);
    onHide();
  }

  async function handleUserSearch(text: string) {
    const users = await searchUsers(text);
    setSearchedUsers(users);
  }
}
