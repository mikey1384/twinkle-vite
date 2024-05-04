import React, { useState } from 'react';
import SelectedStyle from '~/components/Texts/SelectedStyle';
import SearchInput from '~/components/Texts/SearchInput';
import Loading from '~/components/Loading';
import { useSearch } from '~/helpers/hooks';
import { useAppContext } from '~/contexts';

export default function StyleFilter({
  onSelectStyle,
  selectedFilter,
  selectedStyle,
  style
}: {
  selectedStyle: string;
  onDropdownShown: (isShown: boolean) => void;
  onSelectStyle: (style: string) => void;
  selectedFilter: string;
  style: React.CSSProperties;
}) {
  const searchAICardStyles = useAppContext(
    (v) => v.requestHelpers.searchAICardStyles
  );
  const [searchText, setSearchText] = useState('');
  const [searchedStyles, setSearchedStyles] = useState([]);
  const { handleSearch, searching } = useSearch({
    onSearch: handleWordSearch,
    onClear: () => setSearchedStyles([]),
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
          <b>Style:</b>
        </div>
        <SelectedStyle
          selectedStyle={selectedStyle}
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
          placeholder="Search art style..."
          autoFocus={selectedFilter === 'style'}
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

  async function handleWordSearch(text: string) {
    const styles = await searchAICardStyles(text);
    setSearchedStyles(styles);
  }
}
