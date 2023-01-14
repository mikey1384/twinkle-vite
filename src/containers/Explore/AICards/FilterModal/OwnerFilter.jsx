import { useState } from 'react';
import SearchInput from '~/components/Texts/SearchInput';
import Loading from '~/components/Loading';
import { useAppContext } from '~/contexts';
import { useSearch } from '~/helpers/hooks';

export default function OwnerFilter() {
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
        flexDirection: 'column'
      }}
    >
      <div style={{ display: 'flex' }}>
        <div>
          <b>Owner:</b>
        </div>
        <div style={{ marginLeft: '0.5rem' }}>Anyone</div>
      </div>
      <div
        style={{
          marginTop: '0.5rem',
          position: 'relative'
        }}
      >
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
