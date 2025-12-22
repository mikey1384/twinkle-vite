import React, { RefObject, useMemo, useRef, useState } from 'react';
import { css } from '@emotion/css';
import { Color, borderRadius } from '~/constants/css';
import Input from '../Input';
import Icon from '~/components/Icon';
import DropdownList from './DropdownList';
import { useRoleColor } from '~/theme/useRoleColor';
import { useOutsideClick } from '~/helpers/hooks';

export default function SearchInput({
  addonColor,
  borderColor,
  dropdownFooter,
  onClickOutSide,
  searchResults = [],
  autoFocus,
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
  addonColor?: string;
  borderColor?: string;
  dropdownFooter?: any;
  onClickOutSide?: () => void;
  searchResults?: any[];
  autoFocus?: boolean;
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

  useOutsideClick(SearchInputRef, onClickOutSide, {
    enabled: !!onClickOutSide && searchResults.length > 0
  });
  const { colorKey: searchColor } = useRoleColor('search', {
    fallback: 'logoBlue'
  });
  const resolvedBorderColor = useMemo(() => {
    if (!borderColor && !searchColor) return undefined;
    const appliedColor = borderColor || searchColor;
    const candidate = Color[appliedColor as keyof typeof Color];
    if (typeof candidate === 'function') return candidate();
    if (typeof candidate === 'string') return candidate;
    return appliedColor;
  }, [borderColor, searchColor]);

  const appliedAddonColor = useMemo(() => {
    if (!addonColor && !searchColor) return Color.gray();
    const appliedColor = addonColor || searchColor;
    const candidate = Color[appliedColor as keyof typeof Color];
    if (typeof candidate === 'function') return candidate();
    if (typeof candidate === 'string') return candidate;
    return appliedColor;
  }, [addonColor, searchColor]);

  return (
    <div
      className={`${css`
        position: relative;
        z-index: 400;
        width: 100%;
        svg,
        input {
          font-size: 2.3rem;
        }
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
            font-size: 1.6rem; /* keep icon size consistent regardless of parent font-size */
            color: ${appliedAddonColor};
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
        dropdownFooter={dropdownFooter}
        indexToHighlight={indexToHighlight}
        renderItemLabel={renderItemLabel}
        renderItemUrl={renderItemUrl}
        searchResults={searchResults}
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
