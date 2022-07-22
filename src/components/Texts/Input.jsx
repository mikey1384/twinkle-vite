import React from 'react';
import PropTypes from 'prop-types';
import ErrorBoundary from '~/components/ErrorBoundary';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import { renderText } from '~/helpers/stringHelpers';

Input.propTypes = {
  autoComplete: PropTypes.string,
  hasError: PropTypes.bool,
  inputRef: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
  onChange: PropTypes.func.isRequired,
  className: PropTypes.string,
  style: PropTypes.object,
  type: PropTypes.string
};

export default function Input({
  hasError,
  autoComplete = 'off',
  inputRef,
  onChange,
  type = 'text',
  className,
  style,
  ...props
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
          ${hasError ? 'color: red; border: 1px solid red;' : ''};
        `}`}
        ref={inputRef}
        onChange={(event) => onChange(renderText(event.target.value))}
      />
    </ErrorBoundary>
  );
}
