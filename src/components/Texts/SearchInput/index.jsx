import PropTypes from 'prop-types';
import React, { useRef, useState } from 'react';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import Input from '../Input';
import Icon from '~/components/Icon';
import DropdownList from './DropdownList';

SearchInput.propTypes = {
  addonColor: PropTypes.string,
  autoFocus: PropTypes.bool,
  borderColor: PropTypes.string,
  className: PropTypes.string,
  innerRef: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
  inputHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  onChange: PropTypes.func.isRequired,
  onClear: PropTypes.func,
  onClickOutSide: PropTypes.func,
  onFocus: PropTypes.func,
  onSelect: PropTypes.func,
  placeholder: PropTypes.string,
  renderItemLabel: PropTypes.func,
  renderItemUrl: PropTypes.func,
  searchResults: PropTypes.array,
  style: PropTypes.object,
  value: PropTypes.string
};

export default function SearchInput({
  onClickOutSide,
  searchResults = [],
  addonColor,
  autoFocus,
  borderColor,
  className,
  innerRef = () => {},
  inputHeight,
  onChange,
  placeholder,
  onClear,
  onFocus,
  onSelect,
  renderItemLabel,
  renderItemUrl,
  style,
  value = ''
}) {
  const [indexToHighlight, setIndexToHighlight] = useState(0);
  const SearchInputRef = useRef(null);

  return (
    <div
      className={`${css`
        display: flex;
        align-items: center;
        width: 100%;
        height: 4.3rem;
        position: relative;
        z-index: 400;
        .addon {
          height: 100%;
          border: 1px solid
            ${addonColor ? Color[addonColor]() : Color.darkerBorderGray()};
          padding: 0 1rem;
          display: flex;
          align-items: center;
          font-size: 1.5rem;
        }
        input {
          height: 100%;
          border: 1px solid
            ${borderColor ? Color[borderColor]() : Color.darkerBorderGray()};
          border-left: none;
        }
      `} ${className}`}
      ref={SearchInputRef}
      style={style}
    >
      <div
        className="addon"
        style={{
          height: inputHeight,
          width: '3.5rem',
          display: 'flex',
          justifyContent: 'center',
          backgroundColor: addonColor
            ? Color[addonColor]()
            : Color.borderGray(),
          color: addonColor ? '#fff' : ''
        }}
      >
        <Icon icon="search" />
      </div>
      <Input
        style={{ height: inputHeight, width: 'CALC(100% - 3.5rem)' }}
        autoFocus={autoFocus}
        inputRef={innerRef}
        onFocus={onFocus && onFocus}
        placeholder={placeholder}
        value={value}
        onChange={(text) => onChange(text)}
        onKeyDown={onKeyDown}
      />
      <DropdownList
        indexToHighlight={indexToHighlight}
        renderItemLabel={renderItemLabel}
        renderItemUrl={renderItemUrl}
        searchResults={searchResults}
        onClickOutSide={onClickOutSide}
        onSelect={onSelect}
        onSetIndexToHighlight={setIndexToHighlight}
      />
    </div>
  );

  function onKeyDown(event) {
    let index = indexToHighlight;
    if (searchResults.length > 0) {
      if (event.keyCode === 40) {
        event.preventDefault();
        let highlightIndex = Math.min(++index, searchResults.length - 1);
        setIndexToHighlight(highlightIndex);
      }

      if (event.keyCode === 38) {
        event.preventDefault();
        let highlightIndex = Math.max(--index, 0);
        setIndexToHighlight(highlightIndex);
      }

      if (event.keyCode === 13) {
        event.preventDefault();
        let item = searchResults[index];
        onSelect(item);
      }

      if (event.keyCode === 9) {
        onClear?.();
      }
    }
  }
}
