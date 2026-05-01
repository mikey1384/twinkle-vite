import React, { useEffect, useMemo, useRef } from 'react';
import SearchInput from '~/components/Texts/SearchInput';
import { stringIsEmpty } from '~/helpers/stringHelpers';
import { useOutsideClick } from '~/helpers/hooks';
import Loading from '~/components/Loading';
import ErrorBoundary from '~/components/ErrorBoundary';

export default function TagInput({
  autoFocus,
  className,
  dropdownFooter,
  inputRef,
  inputHeight,
  onClickOutSide,
  loading,
  onAddItem,
  onChange,
  onNotFound,
  placeholder,
  renderDropdownLabel,
  searchResults = [],
  selectedItems,
  searchInputFontSize,
  style,
  value
}: {
  autoFocus?: boolean;
  className?: string;
  dropdownFooter?: any;
  inputRef?: any;
  inputHeight?: string;
  onClickOutSide: () => any;
  loading?: boolean;
  onAddItem: (item: object) => void;
  onChange: (value: string) => void;
  onNotFound?: ({ messageShown }: { messageShown: boolean }) => void;
  placeholder?: string;
  renderDropdownLabel: (item: any) => string;
  searchResults?: { id: number; title: string }[];
  selectedItems: Record<string, { id: number }>;
  searchInputFontSize?: string;
  style?: React.CSSProperties;
  value: string;
}) {
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

  const results = useMemo(() => {
    return searchResults.filter((item) => !selectedItems[item.id]);
  }, [searchResults, selectedItems]);

  useOutsideClick(TagInputRef, onClickOutSide, {
    enabled: results.length === 0
  });

  return (
    <ErrorBoundary componentPath="TagForm/TagInput">
      <div
        className={className}
        ref={TagInputRef}
        style={{ position: 'relative', width: '100%', ...style }}
      >
        <SearchInput
          autoFocus={autoFocus}
          innerRef={inputRef}
          onChange={onChange}
          onClickOutSide={onClickOutSide}
          onSelect={onAddItem}
          placeholder={placeholder}
          inputFontSize={searchInputFontSize}
          inputHeight={inputHeight}
          renderItemLabel={renderDropdownLabel}
          searchResults={results}
          value={value}
          dropdownFooter={dropdownFooter}
        />
        {loading && (
          <Loading
            style={{ position: 'absolute', top: '1rem', right: '1rem' }}
          />
        )}
      </div>
      {dropdownFooter && (
        <div style={{ marginTop: '0.5rem' }}>{dropdownFooter}</div>
      )}
    </ErrorBoundary>
  );
}
