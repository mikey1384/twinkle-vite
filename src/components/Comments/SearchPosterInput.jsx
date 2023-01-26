import { useState } from 'react';
import SearchInput from '~/components/Texts/SearchInput';
import Loading from '~/components/Loading';
import { css } from '@emotion/css';
import { useAppContext } from '~/contexts';
import { mobileMaxWidth } from '~/constants/css';
import { useSearch } from '~/helpers/hooks';

export default function SearchPosterInput() {
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
        Filter comments by poster:
      </span>
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
  );

  function handleSelectUser(user) {
    console.log(user);
    setSearchedUsers([]);
    setSearchText('');
  }

  async function handleUserSearch(text) {
    const users = await searchUsers(text);
    setSearchedUsers(users);
  }
}
