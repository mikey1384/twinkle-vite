import React, { RefObject, useRef } from 'react';
import SearchDropdown from '~/components/SearchDropdown';

export default function DropdownList({
  anchorRef,
  dropdownRef,
  dropdownFooter,
  indexToHighlight,
  renderItemLabel,
  renderItemUrl,
  searchResults,
  onSelect,
  onSetIndexToHighlight
}: {
  anchorRef?: RefObject<HTMLElement | null>;
  dropdownRef?: RefObject<HTMLDivElement | null>;
  dropdownFooter?: any;
  indexToHighlight: number;
  renderItemLabel?: (item: any) => any;
  renderItemUrl?: (item: any) => string;
  searchResults: any[];
  onSelect?: (item: any) => void;
  onSetIndexToHighlight: (index: number) => void;
}) {
  const DropdownRef = useRef<HTMLDivElement | null>(null);
  const resolvedDropdownRef = dropdownRef || DropdownRef;
  return searchResults.length > 0 ? (
    <SearchDropdown
      anchorRef={anchorRef}
      innerRef={resolvedDropdownRef}
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
