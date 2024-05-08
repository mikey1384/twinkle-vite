import React, { useState } from 'react';
import SearchInput from '~/components/Texts/SearchInput';
import SelectedCardNumber from './SelectedCardNumber';
import Loading from '~/components/Loading';
import { useAppContext } from '~/contexts';
import { useSearch } from '~/helpers/hooks';

export default function CardIdFilter({
  selectedNumber = 0,
  onSelectNumber
}: {
  selectedNumber?: number;
  onSelectNumber: (v: number) => void;
}) {
  const [searchedIds, setSearchedIds] = useState([]);
  const [searchText, setSearchText] = useState('');
  const searchAICardIds = useAppContext(
    (v) => v.requestHelpers.searchAICardIds
  );
  const { handleSearch, searching } = useSearch({
    onSearch: handleIdSearch,
    onClear: () => setSearchedIds([]),
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
        <div className="label">Card #:</div>
        <SelectedCardNumber
          selectedNumber={selectedNumber}
          onClear={() => {
            onSelectNumber(0);
          }}
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
          placeholder="Card No."
          style={{ width: '15rem' }}
          onChange={handleSearch}
          value={searchText}
          searchResults={searchedIds}
          renderItemLabel={(cardId) => cardId}
          onClickOutSide={() => {
            setSearchText('');
            setSearchedIds([]);
          }}
          onSelect={handleSelectId}
        />
        {searching && <Loading style={{ position: 'absolute', top: 0 }} />}
      </div>
    </div>
  );

  function handleSelectId(cardId: number) {
    onSelectNumber(cardId);
    setSearchedIds([]);
    setSearchText('');
  }

  async function handleIdSearch(cardId: string) {
    const ids = await searchAICardIds(cardId);
    setSearchedIds(ids);
  }
}
