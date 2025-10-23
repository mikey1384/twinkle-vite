import React, { useState } from 'react';
import SearchInput from '~/components/Texts/SearchInput';
import SelectedCardNumber from './SelectedCardNumber';
import Loading from '~/components/Loading';
import { useAppContext } from '~/contexts';
import { useSearch } from '~/helpers/hooks';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';

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
    <div className={containerClass}>
      <div className={headerRowClass}>
        <div className="label">Card #:</div>
        <SelectedCardNumber
          selectedNumber={selectedNumber}
          onClear={() => {
            onSelectNumber(0);
          }}
          style={{ marginLeft: '0.7rem' }}
        />
      </div>
      <div className={inputWrapperClass}>
        <SearchInput
          placeholder="Card No."
          style={{ width: '100%' }}
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
