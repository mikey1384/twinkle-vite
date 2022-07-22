import React, { memo, useMemo, useState } from 'react';
import { useSearch } from '~/helpers/hooks';
import PropTypes from 'prop-types';
import TagInput from './TagInput';
import Tag from './Tag';
import ErrorBoundary from '~/components/ErrorBoundary';
import { objectify } from '~/helpers';

TagForm.propTypes = {
  autoFocus: PropTypes.bool,
  className: PropTypes.string,
  dropdownFooter: PropTypes.node,
  inputRef: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
  itemLabel: PropTypes.string.isRequired,
  maxItems: PropTypes.number,
  searchPlaceholder: PropTypes.string.isRequired,
  searchResults: PropTypes.array.isRequired,
  selectedItems: PropTypes.array.isRequired,
  filter: PropTypes.func.isRequired,
  onSearch: PropTypes.func.isRequired,
  onClear: PropTypes.func.isRequired,
  onAddItem: PropTypes.func.isRequired,
  onRemoveItem: PropTypes.func.isRequired,
  children: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.array,
    PropTypes.node
  ]),
  onNotFound: PropTypes.func,
  onSubmit: PropTypes.oneOfType([PropTypes.bool, PropTypes.func]),
  renderDropdownLabel: PropTypes.func.isRequired,
  renderTagLabel: PropTypes.func,
  subTitle: PropTypes.node,
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
        {selectedItems.map((item, index) => {
          return (
            <Tag
              key={item.id}
              index={index}
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

  function handleAddItem(item) {
    setSearchText('');
    onAddItem(item);
    onClear();
  }
}

export default memo(TagForm);
