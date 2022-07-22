import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import SearchDropdown from '~/components/SearchDropdown';
import { useOutsideClick } from '~/helpers/hooks';

DropdownList.propTypes = {
  indexToHighlight: PropTypes.number,
  renderItemUrl: PropTypes.func,
  renderItemLabel: PropTypes.func,
  searchResults: PropTypes.array,
  onClickOutSide: PropTypes.func,
  onSelect: PropTypes.func,
  onSetIndexToHighlight: PropTypes.func
};

export default function DropdownList({
  indexToHighlight,
  renderItemLabel,
  renderItemUrl,
  searchResults,
  onClickOutSide,
  onSelect,
  onSetIndexToHighlight
}) {
  const DropdownRef = useRef(null);
  useOutsideClick(DropdownRef, onClickOutSide);
  return searchResults.length > 0 ? (
    <SearchDropdown
      innerRef={DropdownRef}
      searchResults={searchResults}
      onUpdate={() => onSetIndexToHighlight(0)}
      onUnmount={() => onSetIndexToHighlight(0)}
      indexToHighlight={indexToHighlight}
      onItemClick={(item) => onSelect(item)}
      renderItemLabel={renderItemLabel}
      renderItemUrl={renderItemUrl}
    />
  ) : null;
}
