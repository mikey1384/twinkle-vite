import React, { RefObject, useMemo, useRef, useState } from 'react';
import { css } from '@emotion/css';
import { Color, borderRadius } from '~/constants/css';
import Input from '../Input';
import Icon from '~/components/Icon';
import DropdownList from './DropdownList';

export default function SearchInput({
  onClickOutSide,
  searchResults = [],
  addonColor,
  autoFocus,
  borderColor,
  className,
  innerRef,
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
}: {
  onClickOutSide?: () => void;
  searchResults?: any[];
  addonColor?: string;
  autoFocus?: boolean;
  borderColor?: string;
  className?: string;
  innerRef?: RefObject<any>;
  inputHeight?: string;
  onChange: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
  onFocus?: () => void;
  onSelect?: (item: any) => void;
  renderItemLabel?: (item: any) => any;
  renderItemUrl?: (item: any) => string;
  style?: any;
  value?: string;
}) {
  const [indexToHighlight, setIndexToHighlight] = useState(0);
  const SearchInputRef = useRef(null);
  const resolvedBorderColor = useMemo(() => {
    if (!borderColor) return undefined;
    const candidate = Color[borderColor as keyof typeof Color];
    if (typeof candidate === 'function') return candidate();
    if (typeof candidate === 'string') return candidate;
    return borderColor;
  }, [borderColor]);

  return (
    <div
      className={`${css`
        position: relative;
        z-index: 400;
        width: 100%;
      `} ${className || ''}`}
      ref={SearchInputRef}
      style={style}
    >
      <div
        className={css`
          position: relative;
          width: 100%;
          height: ${inputHeight || '4.3rem'};
          display: flex;
          align-items: center;
          background: #fff;
          border: 1px solid ${resolvedBorderColor || 'var(--ui-border)'};
          border-radius: ${borderRadius};
          transition: border-color 0.18s ease;
          &:focus-within {
            border-color: var(--ui-border-strong);
          }
        `}
      >
        <Icon
          icon="search"
          className={css`
            position: absolute;
            left: 1rem;
            color: ${addonColor
              ? (Color[addonColor as keyof typeof Color] || Color.gray)()
              : Color.gray()};
          `}
        />
        <Input
          style={{
            height: inputHeight || '100%',
            width: '100%',
            paddingLeft: '4.2rem',
            border: 'none',
            background: 'transparent',
            boxShadow: 'none'
          }}
          autoFocus={autoFocus}
          inputRef={innerRef}
          onFocus={onFocus && onFocus}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
        />
      </div>
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

  function onKeyDown(event: any) {
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
        const item = searchResults[index];
        onSelect?.(item);
      }

      if (event.keyCode === 9) {
        onClear?.();
      }
    }
  }
}
