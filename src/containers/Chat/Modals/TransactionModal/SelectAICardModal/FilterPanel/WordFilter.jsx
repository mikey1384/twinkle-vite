import { useState } from 'react';
import PropTypes from 'prop-types';
import SearchInput from '~/components/Texts/SearchInput';
import SelectedWord from '~/components/Texts/SelectedWord';
import Loading from '~/components/Loading';
import { useAppContext } from '~/contexts';
import { useSearch } from '~/helpers/hooks';

WordFilter.propTypes = {
  selectedWord: PropTypes.string,
  onSelectWord: PropTypes.func
};

export default function WordFilter({ selectedWord = '', onSelectWord }) {
  const [searchedWords, setSearchedWords] = useState([]);
  const [searchText, setSearchText] = useState('');
  const searchAICardWords = useAppContext(
    (v) => v.requestHelpers.searchAICardWords
  );
  const { handleSearch, searching } = useSearch({
    onSearch: handleWordSearch,
    onClear: () => setSearchedWords([]),
    onSetSearchText: setSearchText
  });

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <div className="label">Word:</div>
        <SelectedWord
          selectedWord={selectedWord}
          onClear={() => onSelectWord('')}
          style={{ marginLeft: '0.7rem' }}
        />
      </div>
      <div
        style={{
          paddingLeft: '10%',
          paddingRight: '10%',
          marginTop: '0.5rem',
          position: 'relative'
        }}
      >
        <SearchInput
          placeholder="Search word..."
          onChange={handleSearch}
          value={searchText}
          searchResults={searchedWords}
          renderItemLabel={(word) => word}
          onClickOutSide={() => {
            setSearchText('');
            setSearchedWords([]);
          }}
          onSelect={handleSelectWord}
        />
        {searching && <Loading style={{ position: 'absolute', top: 0 }} />}
      </div>
    </div>
  );

  function handleSelectWord(word) {
    onSelectWord(word);
    setSearchedWords([]);
    setSearchText('');
  }

  async function handleWordSearch(text) {
    const words = await searchAICardWords(text);
    setSearchedWords(words);
  }
}
