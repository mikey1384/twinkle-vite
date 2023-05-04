import React, { memo, useMemo, useState, CSSProperties } from 'react';
import PropTypes from 'prop-types';
import { useSearch } from '~/helpers/hooks';
import TagInput from './TagInput';
import Tag from './Tag';
import ErrorBoundary from '~/components/ErrorBoundary';
import { objectify } from '~/helpers';

TagForm.propTypes = {
  autoFocus: PropTypes.bool,
  children: PropTypes.any,
  className: PropTypes.string,
  dropdownFooter: PropTypes.any,
  inputRef: PropTypes.any,
  filter: PropTypes.func.isRequired,
  itemLabel: PropTypes.string.isRequired,
  maxItems: PropTypes.number,
  onAddItem: PropTypes.func.isRequired,
  onClear: PropTypes.func.isRequired,
  searchResults: PropTypes.array.isRequired,
  selectedItems: PropTypes.array.isRequired,
  onNotFound: PropTypes.func,
  onRemoveItem: PropTypes.func.isRequired,
  onSearch: PropTypes.func.isRequired,
  onSubmit: PropTypes.func,
  renderDropdownLabel: PropTypes.func.isRequired,
  renderTagLabel: PropTypes.func,
  searchPlaceholder: PropTypes.string,
  subTitle: PropTypes.string,
  style: PropTypes.object,
  title: PropTypes.string
};
function TagForm({
  autoFocus,
  children,
  className,
  dropdownFooter,
  inputRef,
  filter,
  itemLabel,
  maxItems,
  onAddItem,
  onClear,
  searchResults,
  selectedItems,
  onNotFound,
  onRemoveItem,
  onSearch,
  onSubmit,
  renderDropdownLabel,
  renderTagLabel,
  searchPlaceholder,
  subTitle,
  style,
  title
}: {
  autoFocus?: boolean;
  children?: any;
  className?: string;
  dropdownFooter?: any;
  inputRef?: any;
  filter: (value: any, index: number) => boolean;
  itemLabel: string;
  maxItems?: number;
  onAddItem: (value: any) => void;
  onClear: () => void;
  searchResults: { id: number; title: string }[];
  selectedItems: any[];
  onNotFound?: ({ messageShown }: { messageShown: boolean }) => void;
  onRemoveItem: (id: number) => void;
  onSearch: (text: string) => any;
  onSubmit?: () => void;
  renderDropdownLabel: (item: any) => any;
  renderTagLabel?: (label: string) => string;
  searchPlaceholder?: string;
  subTitle?: string;
  style?: CSSProperties;
  title?: string;
}) {
  const [searchText, setSearchText] = useState('');
  const { handleSearch, searching } = useSearch({
    onSearch,
    onEmptyQuery: () => onNotFound?.({ messageShown: false }),
    onClear,
    onSetSearchText: setSearchText
  });
  const filteredResults = useMemo(
    () => searchResults.filter(filter),
    [filter, searchResults]
  );
  const tags = useMemo(() => {
    return selectedItems.length > 0 ? (
      <div
        style={{
          marginTop: '1rem'
        }}
      >
        {selectedItems.map((item) => {
          return (
            <Tag
              key={item.id}
              label={item[itemLabel]}
              onClick={() => onRemoveItem(item.id)}
              renderTagLabel={renderTagLabel}
            />
          );
        })}
      </div>
    ) : null;
  }, [itemLabel, onRemoveItem, renderTagLabel, selectedItems]);

  return (
    <ErrorBoundary componentPath="TagForm/index">
      <form
        style={style}
        className={className}
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit?.();
        }}
      >
        <div style={{ width: '100%' }}>
          {title && <h3>{title}</h3>}
          {subTitle && <span>{subTitle}</span>}
          {tags}
          {(!maxItems || selectedItems.length < maxItems) && (
            <TagInput
              dropdownFooter={dropdownFooter}
              style={{ marginTop: selectedItems.length === 0 ? '1rem' : 0 }}
              autoFocus={autoFocus}
              inputRef={inputRef}
              loading={searching}
              value={searchText}
              onChange={handleSearch}
              onClickOutSide={() => {
                setSearchText('');
                onClear();
              }}
              onNotFound={onNotFound}
              placeholder={searchPlaceholder}
              renderDropdownLabel={renderDropdownLabel}
              searchResults={filteredResults}
              selectedItems={objectify(selectedItems)}
              onAddItem={handleAddItem}
            />
          )}
        </div>
        {children}
      </form>
    </ErrorBoundary>
  );

  function handleAddItem(item: object) {
    setSearchText('');
    onAddItem(item);
    onClear();
  }
}

export default memo(TagForm);
