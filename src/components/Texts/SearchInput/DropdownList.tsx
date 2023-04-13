import React, { useRef } from 'react';
import SearchDropdown from '~/components/SearchDropdown';
import { useOutsideClick } from '~/helpers/hooks';

interface Props {
  indexToHighlight: number;
  renderItemLabel: (item: any) => string;
  renderItemUrl: (item: any) => string;
  searchResults: any[];
  onClickOutSide: () => void;
  onSelect: (item: any) => void;
  onSetIndexToHighlight: (index: number) => void;
}
export default function DropdownList({
  indexToHighlight,
  renderItemLabel,
  renderItemUrl,
  searchResults,
  onClickOutSide,
  onSelect,
  onSetIndexToHighlight
}: Props) {
  const DropdownRef = useRef(null);
  useOutsideClick(DropdownRef, onClickOutSide);
  return searchResults.length > 0 ? (
    <SearchDropdown
      innerRef={DropdownRef}
      searchResults={searchResults}
      onUpdate={() => onSetIndexToHighlight(0)}
      indexToHighlight={indexToHighlight}
      onItemClick={(item) => onSelect(item)}
      renderItemLabel={renderItemLabel}
      renderItemUrl={renderItemUrl}
    />
  ) : null;
}
