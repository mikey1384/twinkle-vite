import { useState } from 'react';
import PropTypes from 'prop-types';
import SearchInput from '~/components/Texts/SearchInput';
import Loading from '~/components/Loading';
import SelectedUser from '~/components/Texts/SelectedUser';
import { useAppContext } from '~/contexts';
import { useSearch } from '~/helpers/hooks';

OwnerFilter.propTypes = {
  onSelectOwner: PropTypes.func,
  selectedOwner: PropTypes.string,
  selectedFilter: PropTypes.string,
  style: PropTypes.object
};

export default function OwnerFilter({
  onSelectOwner,
  selectedFilter,
  selectedOwner,
  style
}) {
  const searchUsers = useAppContext((v) => v.requestHelpers.searchUsers);
  const [searchText, setSearchText] = useState('');
  const [searchedUsers, setSearchedUsers] = useState([]);
  const { handleSearch, searching } = useSearch({
    onSearch: handleUserSearch,
    onClear: () => setSearchedUsers([]),
    onSetSearchText: setSearchText
  });

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
        <SearchInput
          placeholder="Search user..."
          autoFocus={selectedFilter === 'owner'}
          onChange={handleSearch}
          value={searchText}
          searchResults={searchedUsers}
          renderItemLabel={(item) => (
            <span>
              {item.username} <small>{`(${item.realName})`}</small>
            </span>
          )}
          onClickOutSide={() => {
            setSearchText('');
            setSearchedUsers([]);
          }}
          onSelect={handleSelectUser}
        />
        {searching && <Loading style={{ position: 'absolute', top: 0 }} />}
      </div>
    </div>
  );

  function handleSelectUser(user) {
    onSelectOwner(user.username);
    setSearchedUsers([]);
    setSearchText('');
  }

  async function handleUserSearch(text) {
    const users = await searchUsers(text);
    setSearchedUsers(users);
  }
}
