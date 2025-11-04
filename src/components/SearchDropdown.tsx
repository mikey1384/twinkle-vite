import React, { useEffect } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import { Color } from '~/constants/css';
import { css } from '@emotion/css';

export default function SearchDropdown({
  innerRef,
  dropdownFooter,
  indexToHighlight,
  searchResults,
  onUpdate,
  style = {},
  onItemClick,
  renderItemLabel,
  renderItemUrl
}: {
  innerRef?: any;
  dropdownFooter?: any;
  indexToHighlight: number;
  searchResults: any[];
  onUpdate: () => void;
  style?: any;
  onItemClick: (item: any) => void;
  renderItemLabel?: (item: any) => any;
  renderItemUrl?: (item: any) => string;
}) {
  useEffect(() => {
    onUpdate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchResults]);

  return (
    <ErrorBoundary
      className={css`
        position: absolute;
        top: calc(100% + 0.4rem);
        left: 0;
        right: 0;
        background: #fff;
        border: 1px solid var(--ui-border);
        border-radius: 12px;
        box-shadow: none;
        overflow: hidden;
      `}
      componentPath="SearchDropdown"
      style={style}
    >
      <div
        ref={innerRef}
        className={css`
          width: 100%;
          display: block;
          nav {
            padding: 1rem 1.2rem;
            color: ${Color.darkerGray()};
            cursor: pointer;
          }
          @media (hover: hover) and (pointer: fine) {
            nav:hover {
              background: ${Color.highlightGray()};
            }
          }
          nav a {
            text-decoration: none;
            color: ${Color.darkerGray()};
          }
      `}
    >
        {searchResults.map((item, index) => {
          const itemStyle =
            index === indexToHighlight
              ? { background: Color.highlightGray() }
              : {};
          const href = renderItemUrl ? { href: renderItemUrl(item) } : {};
          return (
            <nav
              key={index}
              style={{
                width: '100%',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                ...itemStyle
              }}
              onClick={() => onItemClick(item)}
            >
              <a
                {...href}
                style={{
                  lineHeight: 'normal'
                }}
                onClick={(e) => e.preventDefault()}
              >
                {renderItemLabel?.(item)}
              </a>
            </nav>
          );
        })}
        {dropdownFooter && (
          <div style={{ padding: '1rem' }}>{dropdownFooter}</div>
        )}
      </div>
    </ErrorBoundary>
  );
}
