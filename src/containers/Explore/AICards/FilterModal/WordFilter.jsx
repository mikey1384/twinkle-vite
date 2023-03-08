import { useState } from 'react';
import PropTypes from 'prop-types';
import SearchInput from '~/components/Texts/SearchInput';
import Loading from '~/components/Loading';
import SelectedWord from '~/components/Texts/SelectedWord';
import { useSearch } from '~/helpers/hooks';

WordFilter.propTypes = {
  onSelectOwner: PropTypes.func,
  selectedWord: PropTypes.string,
  selectedFilter: PropTypes.string,
  style: PropTypes.object
};

export default function WordFilter({
  onSelectOwner,
  selectedFilter,
  selectedWord,
  style
}) {
  const [searchText, setSearchText] = useState('');
  const [searchedWords, setSearchedWords] = useState([]);
  const { handleSearch, searching } = useSearch({
    onSearch: handleUserSearch,
    onClear: () => setSearchedWords([]),
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
          <b>Word:</b>
        </div>
        <SelectedWord
          selectedWord={selectedWord}
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
          placeholder="Search word..."
          autoFocus={selectedFilter === 'owner'}
          onChange={handleSearch}
          value={searchText}
          searchResults={searchedWords}
          renderItemLabel={(item) => (
            <span>
              {item.username} <small>{`(${item.realName})`}</small>
            </span>
          )}
          onClickOutSide={() => {
            setSearchText('');
            setSearchedWords([]);
          }}
          onSelect={handleSelectUser}
        />
        {searching && <Loading style={{ position: 'absolute', top: 0 }} />}
      </div>
    </div>
  );

  function handleSelectUser(user) {
    onSelectOwner(user.username);
    setSearchedWords([]);
    setSearchText('');
  }

  async function handleUserSearch(text) {
    const words = [text];
    setSearchedWords(words);
  }
}
