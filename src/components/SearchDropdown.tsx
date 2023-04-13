import React, { useEffect } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import { Color } from '~/constants/css';
import { css } from '@emotion/css';

interface Props {
  innerRef?: any;
  dropdownFooter?: any;
  indexToHighlight: number;
  searchResults: any[];
  onUpdate: () => void;
  style?: any;
  onItemClick: (item: any) => void;
  renderItemLabel: (item: any) => string;
  renderItemUrl?: (item: any) => string;
}
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
}: Props) {
  useEffect(() => {
    onUpdate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchResults]);

  return (
    <ErrorBoundary
      className={css`
        position: absolute;
        top: 1rem;
        left: 0;
        right: 0;
        background: #fff;
        box-shadow: 1px 1px 5px ${Color.black()};
        top: CALC(4.3rem - 1px);
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
            padding: 1rem;
            color: ${Color.darkerGray()};
            &:hover {
              background: ${Color.highlightGray()};
            }
            a {
              text-decoration: none;
              color: ${Color.darkerGray()};
            }
          }
        `}
      >
        {searchResults.map((item, index) => {
          let itemStyle =
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
                {renderItemLabel(item)}
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
