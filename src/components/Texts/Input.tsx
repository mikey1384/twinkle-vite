import React, { RefObject } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import { renderText } from '~/helpers/stringHelpers';

interface Props {
  hasError?: boolean;
  autoComplete?: string;
  inputRef?: RefObject<HTMLInputElement>;
  onChange: (value: string) => void;
  type?: string;
  className?: string;
  style?: React.CSSProperties;
  [key: string]: any;
}
export default function Input({
  hasError,
  autoComplete = 'off',
  inputRef,
  onChange,
  type = 'text',
  className,
  style,
  ...props
}: Props) {
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
          ${hasError ? 'color: red; border: 1px solid red;' : ''};
        `}`}
        ref={inputRef}
        onChange={(event) => onChange(renderText(event.target.value))}
      />
    </ErrorBoundary>
  );
}
