import React, { useState } from 'react';
import PropTypes from 'prop-types';
import SearchInput from '~/components/Texts/SearchInput';
import Loading from '~/components/Loading';
import SelectedUser from '~/components/Texts/SelectedUser';
import { css } from '@emotion/css';
import { useAppContext } from '~/contexts';
import { mobileMaxWidth } from '~/constants/css';
import { useSearch } from '~/helpers/hooks';
import { User } from '~/types';

SearchPosterInput.propTypes = {
  selectedUser: PropTypes.object,
  onSetSelectedUser: PropTypes.func.isRequired
};
export default function SearchPosterInput({
  selectedUser,
  onSetSelectedUser
}: {
  selectedUser: User;
  onSetSelectedUser: (user: any) => void;
}) {
  const [searchedUsers, setSearchedUsers] = useState([]);
  const searchUsers = useAppContext((v) => v.requestHelpers.searchUsers);
  const [searchText, setSearchText] = useState('');
  const { handleSearch, searching } = useSearch({
    onSearch: handleUserSearch,
    onClear: () => setSearchedUsers([]),
    onSetSearchText: setSearchText
  });

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
              setSearchedUsers([]);
            }}
            onSelect={handleSelectUser}
          />
          {searching && <Loading style={{ position: 'absolute', top: 0 }} />}
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

  function handleSelectUser(user: any) {
    onSetSelectedUser(user);
    setSearchedUsers([]);
    setSearchText('');
  }

  async function handleUserSearch(text: string) {
    const users = await searchUsers(text);
    setSearchedUsers(users);
  }
}
