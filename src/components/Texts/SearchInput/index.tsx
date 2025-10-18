import React, { RefObject, useMemo, useRef, useState } from 'react';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
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
  const resolvedAddonColor = useMemo(() => {
    if (!addonColor) return undefined;
    const candidate = Color[addonColor as keyof typeof Color];
    if (typeof candidate === 'function') return candidate();
    if (typeof candidate === 'string') return candidate;
    return addonColor;
  }, [addonColor]);
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
        display: flex;
        align-items: center;
        width: 100%;
        height: 4.3rem;
        position: relative;
        z-index: 400;
        .addon {
          height: 100%;
          border: 1px solid
            ${resolvedAddonColor || Color.darkerBorderGray()};
          padding: 0 1rem;
          display: flex;
          align-items: center;
          font-size: 1.5rem;
        }
        input {
          height: 100%;
          border: 1px solid
            ${resolvedBorderColor || Color.darkerBorderGray()};
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
            ? resolvedAddonColor || Color.borderGray()
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
        onChange={onChange}
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
