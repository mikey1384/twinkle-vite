import { useState } from 'react';
import PropTypes from 'prop-types';
import SearchInput from '~/components/Texts/SearchInput';
import Loading from '~/components/Loading';
import SelectedUser from '~/components/Texts/SelectedUser';
import { css } from '@emotion/css';
import { useAppContext } from '~/contexts';
import { mobileMaxWidth } from '~/constants/css';
import { useSearch } from '~/helpers/hooks';

SearchPosterInput.propTypes = {
  searchedUsers: PropTypes.array,
  onSetSearchedUsers: PropTypes.func
};

export default function SearchPosterInput({
  searchedUsers,
  onSetSearchedUsers
}) {
  const searchUsers = useAppContext((v) => v.requestHelpers.searchUsers);
  const [searchText, setSearchText] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const { handleSearch, searching } = useSearch({
    onSearch: handleUserSearch,
    onClear: () => onSetSearchedUsers([]),
    onSetSearchText: setSearchText
  });

  return (
    <div
      style={{
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
          <SearchInput
            placeholder="Search user..."
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
              onSetSearchedUsers([]);
            }}
            onSelect={handleSelectUser}
          />
          {searching && <Loading style={{ position: 'absolute', top: 0 }} />}
        </div>
      ) : (
        <SelectedUser
          selectedUser={selectedUser}
          onClear={() => setSelectedUser('')}
          style={{ marginLeft: '0.7rem' }}
        />
      )}
    </div>
  );

  function handleSelectUser(user) {
    setSelectedUser(user.username);
    onSetSearchedUsers([]);
    setSearchText('');
  }

  async function handleUserSearch(text) {
    const users = await searchUsers(text);
    onSetSearchedUsers(users);
  }
}
