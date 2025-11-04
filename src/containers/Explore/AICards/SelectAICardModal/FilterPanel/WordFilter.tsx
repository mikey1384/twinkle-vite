import React, { useState } from 'react';
import SearchInput from '~/components/Texts/SearchInput';
import SelectedWord from '~/components/Texts/SelectedWord';
import Loading from '~/components/Loading';
import { useAppContext } from '~/contexts';
import { useSearch } from '~/helpers/hooks';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';

export default function WordFilter({
  selectedWord = '',
  onSelectWord
}: {
  selectedWord?: string;
  onSelectWord: (v: string) => void;
}) {
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
    <div className={containerClass}>
      <div className={headerRowClass}>
        <div className="label">Word:</div>
        <SelectedWord
          selectedWord={selectedWord}
          onClear={() => onSelectWord('')}
          style={{ marginLeft: '0.7rem' }}
        />
      </div>
      <div className={inputWrapperClass}>
        <SearchInput
          placeholder="Search word..."
          style={{ width: '100%' }}
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

const containerClass = css`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.6rem;
  width: 100%;
  text-align: left;
  @media (max-width: ${mobileMaxWidth}) {
    gap: 0.5rem;
  }
`;

const headerRowClass = css`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
  justify-content: flex-start;
`;

const inputWrapperClass = css`
  position: relative;
  width: 100%;
  max-width: 22rem;
  @media (max-width: ${mobileMaxWidth}) {
    max-width: 100%;
  }
`;
