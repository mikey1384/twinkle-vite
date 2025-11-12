import React, { useRef } from 'react';
import SearchDropdown from '~/components/SearchDropdown';

export default function DropdownList({
  dropdownFooter,
  indexToHighlight,
  renderItemLabel,
  renderItemUrl,
  searchResults,
  onSelect,
  onSetIndexToHighlight
}: {
  dropdownFooter?: any;
  indexToHighlight: number;
  renderItemLabel?: (item: any) => any;
  renderItemUrl?: (item: any) => string;
  searchResults: any[];
  onSelect?: (item: any) => void;
  onSetIndexToHighlight: (index: number) => void;
}) {
  const DropdownRef = useRef(null);
  return searchResults.length > 0 ? (
    <SearchDropdown
      innerRef={DropdownRef}
      dropdownFooter={dropdownFooter}
      searchResults={searchResults}
      onUpdate={() => onSetIndexToHighlight(0)}
      indexToHighlight={indexToHighlight}
      onItemClick={(item) => onSelect?.(item)}
      renderItemLabel={renderItemLabel}
      renderItemUrl={renderItemUrl}
    />
  ) : null;
}
