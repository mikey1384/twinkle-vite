import { useState } from 'react';
import PropTypes from 'prop-types';
import SearchInput from '~/components/Texts/SearchInput';
import Loading from '~/components/Loading';
import { useAppContext } from '~/contexts';
import { Color } from '~/constants/css';
import { useSearch } from '~/helpers/hooks';
import CloseButton from '~/components/Buttons/CloseButton';

OwnerFilter.propTypes = {
  onSelectOwner: PropTypes.func,
  selectedOwner: PropTypes.string
};

export default function OwnerFilter({ onSelectOwner, selectedOwner }) {
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
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div>
          <b>Owner:</b>
        </div>
        <div
          style={{
            marginLeft: '0.7rem',
            position: 'relative',
            fontWeight: 'bold',
            fontSize: '2rem',
            fontFamily: "'Roboto', sans-serif",
            color: Color.logoBlue(),
            display: 'flex'
          }}
        >
          {selectedOwner || 'Anyone'}
          {selectedOwner && (
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                marginLeft: '0.7rem'
              }}
            >
              <CloseButton
                style={{
                  padding: 0,
                  margin: 0,
                  right: 0,
                  top: 0,
                  display: 'block',
                  position: 'static',
                  width: '1.7rem',
                  height: '1.7rem',
                  background: Color.logoBlue()
                }}
                onClick={() => onSelectOwner('')}
              />
            </div>
          )}
        </div>
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
    onSelectOwner(user.username);
    setSearchedUsers([]);
    setSearchText('');
  }

  async function handleUserSearch(text) {
    const users = await searchUsers(text);
    setSearchedUsers(users);
  }
}
