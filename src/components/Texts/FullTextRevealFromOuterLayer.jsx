import React from 'react';
import PropTypes from 'prop-types';
import ErrorBoundary from '~/components/ErrorBoundary';
import { Color } from '~/constants/css';
import { createPortal } from 'react-dom';

FullTextRevealFromOuterLayer.propTypes = {
  className: PropTypes.string,
  style: PropTypes.object,
  textContext: PropTypes.object,
  text: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired
};

export default function FullTextRevealFromOuterLayer({
  textContext,
  style,
  text,
  className
}) {
  const { x, y, width, height } = textContext;

  return createPortal(
    <ErrorBoundary
      componentPath="FullTextRevealFromOuterLayer"
      style={{
        zIndex: 100_000_000,
        top: 0,
        position: 'fixed'
      }}
    >
      <div
        className={className}
        style={{
          position: 'absolute',
          width: `${width}px`,
          left: `${x}px`,
          top: `CALC(${y}px + ${height}px)`,
          zIndex: 10,
          padding: '0.5rem',
          minWidth: '10rem',
          background: '#fff',
          boxShadow: `0 0 1px ${Color.black(0.9)}`,
          fontWeight: 'normal',
          lineHeight: 1.5,
          wordBreak: 'keep-all',
          whiteSpace: 'pre-wrap',
          overflowWrap: 'break-word',
          ...style
        }}
      >
        {text}
      </div>
    </ErrorBoundary>,
    document.getElementById('outer-layer')
  );
}
