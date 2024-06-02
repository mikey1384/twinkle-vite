import React, { RefObject } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import { renderText } from '~/helpers/stringHelpers';

export default function Input({
  hasError,
  autoComplete = 'off',
  inputRef,
  onChange,
  errorMessage,
  type = 'text',
  className,
  isHighlighted,
  style,
  ...props
}: {
  hasError?: boolean;
  autoComplete?: string;
  inputRef?: RefObject<any>;
  onChange: (value: any) => void;
  type?: string;
  className?: string;
  isHighlighted?: boolean;
  errorMessage?: string;
  style?: React.CSSProperties;
  [key: string]: any;
}) {
  return (
    <ErrorBoundary componentPath="Input">
      {autoComplete === 'off' && (
        <input
          autoComplete="on"
          style={{ display: 'none' }}
          className="chrome-is-so-stupid"
        />
      )}
      <input
        {...props}
        type={type}
        style={{
          lineHeight: '2rem',
          padding: '1rem',
          ...style
        }}
        className={`${
          className ||
          css`
            width: 100%;
          `
        } ${css`
          border: 1px solid ${Color.darkerBorderGray()};
          font-size: 1.7rem;
          &:focus {
            outline: none;
            ::placeholder {
              color: ${Color.lighterGray()};
            }
          }
          ::placeholder {
            color: ${Color.gray()};
          }
          ${isHighlighted
            ? `border: 2px solid ${Color.limeGreen(0.8)};`
            : hasError
            ? 'color: red; border: 1px solid red;'
            : ''};
        `}`}
        ref={inputRef}
        onChange={(event) => onChange(renderText(event.target.value))}
      />
      {hasError && errorMessage && (
        <p
          className={css`
            color: red;
            font-size: 1.3rem;
            margin-top: 0.5rem;
          `}
        >
          {errorMessage}
        </p>
      )}
    </ErrorBoundary>
  );
}
