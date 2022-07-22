import React from 'react';
import PropTypes from 'prop-types';
import PreviewErrorBoundary from './PreviewErrorBoundary';
import { css } from '@emotion/css';

Preview.propTypes = {
  style: PropTypes.object,
  children: PropTypes.node
};

export default function Preview({ style, children }) {
  return (
    <PreviewErrorBoundary
      style={{
        width: '100%',
        ...style
      }}
      className={css`
        font-size: 1rem;
        p {
          font-size: 1rem;
          font-family: none;
          font-weight: normal;
          display: block;
          margin-block-start: 1rem;
          margin-block-end: 1rem;
          margin-inline-start: 0px;
          margin-inline-end: 0px;
        }
        h1 {
          display: block;
          font-size: 3rem;
          margin-block-start: 0.67rem;
          margin-block-end: 0.67rem;
          margin-inline-start: 0px;
          margin-inline-end: 0px;
          font-weight: bold;
        }
        h2 {
          display: block;
          font-size: 2rem;
          margin-block-start: 0.83rem;
          margin-block-end: 0.83rem;
          margin-inline-start: 0px;
          margin-inline-end: 0px;
          font-weight: bold;
        }
      `}
    >
      {children}
    </PreviewErrorBoundary>
  );
}
