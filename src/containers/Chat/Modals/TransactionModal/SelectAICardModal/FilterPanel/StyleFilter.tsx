import React, { useState } from 'react';
import SearchInput from '~/components/Texts/SearchInput';
import SelectedWord from '~/components/Texts/SelectedWord';
import Loading from '~/components/Loading';
import { useAppContext } from '~/contexts';
import { useSearch } from '~/helpers/hooks';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';

export default function StyleFilter({
  selectedStyle = '',
  onSelectStyle
}: {
  selectedStyle?: string;
  onSelectStyle: (v: string) => void;
}) {
  const [searchedStyles, setSearchedStyles] = useState([]);
  const [searchText, setSearchText] = useState('');
  const searchAICardStyles = useAppContext(
    (v) => v.requestHelpers.searchAICardStyles
  );
  const { handleSearch, searching } = useSearch({
    onSearch: handleStyleSearch,
    onClear: () => setSearchedStyles([]),
    onSetSearchText: setSearchText
  });

  return (
    <div className={containerClass}>
      <div className={headerRowClass}>
        <div className="label">Style:</div>
        <SelectedWord
          selectedWord={selectedStyle}
          onClear={() => onSelectStyle('')}
          style={{ marginLeft: '0.7rem' }}
        />
      </div>
      <div className={inputWrapperClass}>
        <SearchInput
          placeholder="Search word..."
          onChange={handleSearch}
          value={searchText}
          searchResults={searchedStyles}
          renderItemLabel={(word) => word}
          onClickOutSide={() => {
            setSearchText('');
            setSearchedStyles([]);
          }}
          onSelect={handleSelectStyle}
        />
        {searching && <Loading style={{ position: 'absolute', top: 0 }} />}
      </div>
    </div>
  );

  function handleSelectStyle(style: string) {
    onSelectStyle(style);
    setSearchedStyles([]);
    setSearchText('');
  }

  async function handleStyleSearch(text: string) {
    const styles = await searchAICardStyles(text);
    setSearchedStyles(styles);
  }
}

const containerClass = css`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.6rem;
  width: 100%;
  text-align: left;
  position: relative;
  z-index: 900;
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
