import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import SearchDropdown from '~/components/SearchDropdown';
import Input from '~/components/Texts/Input';
import Icon from '~/components/Icon';
import { Color } from '~/constants/css';
import { css } from '@emotion/css';
import { stringIsEmpty } from '~/helpers/stringHelpers';
import { useOutsideClick } from '~/helpers/hooks';
import Loading from '~/components/Loading';
import ErrorBoundary from '~/components/ErrorBoundary';

TagInput.propTypes = {
  autoFocus: PropTypes.bool,
  className: PropTypes.string,
  dropdownFooter: PropTypes.any,
  inputRef: PropTypes.any,
  onClickOutSide: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  onAddItem: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  onNotFound: PropTypes.func,
  placeholder: PropTypes.string,
  renderDropdownLabel: PropTypes.func.isRequired,
  searchResults: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number,
      title: PropTypes.string
    })
  ),
  selectedItems: PropTypes.objectOf(
    PropTypes.shape({
      id: PropTypes.number
    })
  ),
  style: PropTypes.object,
  value: PropTypes.string.isRequired
};
export default function TagInput({
  autoFocus,
  className,
  dropdownFooter,
  inputRef,
  onClickOutSide,
  loading,
  onAddItem,
  onChange,
  onNotFound,
  placeholder,
  renderDropdownLabel,
  searchResults = [],
  selectedItems,
  style,
  value
}: {
  autoFocus?: boolean;
  className?: string;
  dropdownFooter?: any;
  inputRef?: any;
  onClickOutSide: () => any;
  loading?: boolean;
  onAddItem: (item: object) => void;
  onChange: (value: string) => void;
  onNotFound?: ({ messageShown }: { messageShown: boolean }) => void;
  placeholder?: string;
  renderDropdownLabel: (item: any) => string;
  searchResults?: { id: number; title: string }[];
  selectedItems: Record<string, { id: number }>;
  style?: React.CSSProperties;
  value: string;
}) {
  const [results, setResults] = useState(searchResults);
  const [indexToHighlight, setIndexToHighlight] = useState(0);
  const TagInputRef = useRef(null);
  useEffect(() => {
    if (!loading) {
      const shown =
        !loading &&
        searchResults.filter(({ title }) =>
          title ? title.toLowerCase() === value.toLowerCase() : true
        ).length === 0 &&
        !stringIsEmpty(value) &&
        value.length > 1;
      onNotFound?.({ messageShown: shown });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);
  useEffect(() => {
    setResults(searchResults.filter((item) => !selectedItems[item.id]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchResults]);

  useOutsideClick(TagInputRef, onClickOutSide);

  return (
    <ErrorBoundary componentPath="TagForm/TagInput">
      <div
        className={`${css`
          height: 4.3rem;
          position: relative;
          .addon {
            border: 1px solid ${Color.darkerBorderGray()};
            align-self: stretch;
            padding: 0 1rem;
            display: flex;
            align-items: center;
          }
          input {
            height: 100%;
            border: 1px solid ${Color.darkerBorderGray()};
            border-left: none;
          }
        `} ${className}`}
        ref={TagInputRef}
        style={style}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div className="addon" style={{ background: Color.borderGray() }}>
            <Icon icon="search" />
          </div>
          <Input
            autoFocus={autoFocus}
            inputRef={inputRef}
            value={value}
            placeholder={placeholder}
            onChange={(text) => onChange(text)}
            onKeyDown={onKeyDown}
          />
        </div>
        {loading && <Loading style={{ position: 'absolute', top: '1rem' }} />}
        {renderDropdownList()}
      </div>
      {dropdownFooter && (
        <div style={{ marginTop: '0.5rem' }}>{dropdownFooter}</div>
      )}
    </ErrorBoundary>
  );

  function renderDropdownList() {
    return results.length > 0 ? (
      <SearchDropdown
        dropdownFooter={dropdownFooter}
        searchResults={results}
        onUpdate={() => setIndexToHighlight(0)}
        indexToHighlight={indexToHighlight}
        onItemClick={onAddItem}
        renderItemLabel={renderDropdownLabel}
      />
    ) : null;
  }

  function onKeyDown(event: any) {
    searchResults = searchResults.filter((user) => !selectedItems[user.id]);
    let index = indexToHighlight;
    if (searchResults.length > 0) {
      if (event.keyCode === 40) {
        event.preventDefault();
        const highlightIndex = Math.min(++index, searchResults.length - 1);
        setIndexToHighlight(highlightIndex);
      }

      if (event.keyCode === 38) {
        event.preventDefault();
        const highlightIndex = Math.max(--index, 0);
        setIndexToHighlight(highlightIndex);
      }

      if (event.keyCode === 13) {
        event.preventDefault();
        const user = searchResults[index];
        onAddItem(user);
      }
    }
  }
}
