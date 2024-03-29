import React, { useState } from 'react';
import SearchInput from '~/components/Texts/SearchInput';
import Loading from '~/components/Loading';
import SelectedWord from '~/components/Texts/SelectedWord';
import { useAppContext } from '~/contexts';
import { useSearch } from '~/helpers/hooks';

export default function WordFilter({
  onSelectWord,
  selectedFilter,
  selectedWord,
  style
}: {
  onSelectWord: (word: string) => void;
  selectedFilter: string;
  selectedWord: string;
  style: React.CSSProperties;
}) {
  const searchAICardWords = useAppContext(
    (v) => v.requestHelpers.searchAICardWords
  );
  const [searchText, setSearchText] = useState('');
  const [searchedWords, setSearchedWords] = useState([]);
  const { handleSearch, searching } = useSearch({
    onSearch: handleWordSearch,
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
          onClear={() => onSelectWord('')}
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
          autoFocus={selectedFilter === 'word'}
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

  function handleSelectWord(word: string) {
    onSelectWord(word);
    setSearchedWords([]);
    setSearchText('');
  }

  async function handleWordSearch(text: string) {
    const words = await searchAICardWords(text);
    setSearchedWords(words);
  }
}
