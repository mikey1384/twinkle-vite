import React, { useState } from 'react';
import SearchInput from '~/components/Texts/SearchInput';
import SelectedCardNumber from './SelectedCardNumber';
import { useAppContext } from '~/contexts';
import { useSearch } from '~/helpers/hooks';

export default function CardIdFilter() {
  const [searchText, setSearchText] = useState('');
  const [selectedNumber, setSelectedNumber] = useState(0);
  const searchAICardIds = useAppContext(
    (v) => v.requestHelpers.searchAICardWords
  );
  const { handleSearch } = useSearch({
    onSearch: handleIdSearch,
    onClear: () => console.log('cleared'),
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
          style={{ marginLeft: '0.7rem' }}
          onClear={() => {
            setSelectedNumber(0);
          }}
        />
      </div>
      <SearchInput
        placeholder="Card No."
        onChange={handleSearch}
        value={searchText}
        style={{ width: '15rem', marginTop: '0.5rem' }}
        onClickOutSide={() => {
          setSearchText('');
        }}
      />
    </div>
  );

  async function handleIdSearch(cardId: string) {
    const ids = await searchAICardIds(cardId);
    console.log(ids);
  }
}
