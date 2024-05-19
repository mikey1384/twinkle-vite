import React, { useState } from 'react';
import SearchInput from '~/components/Texts/SearchInput';
import SelectedWord from '~/components/Texts/SelectedWord';
import Loading from '~/components/Loading';
import { useAppContext } from '~/contexts';
import { useSearch } from '~/helpers/hooks';

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
    <div
      style={{
        zIndex: 900,
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
        <div className="label">Style:</div>
        <SelectedWord
          selectedWord={selectedStyle}
          onClear={() => onSelectStyle('')}
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
          style={{ width: '15rem' }}
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
