import React from 'react';
import PropTypes from 'prop-types';
import ErrorBoundary from '~/components/ErrorBoundary';
import { Color } from '~/constants/css';

FullTextReveal.propTypes = {
  className: PropTypes.string,
  direction: PropTypes.string,
  show: PropTypes.bool,
  style: PropTypes.object,
  text: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired
};

export default function FullTextReveal({
  direction = 'right',
  style,
  show,
  text,
  className
}) {
  return (
    <ErrorBoundary
      componentPath="FullTextReveal"
      style={{ position: 'relative' }}
    >
      <div
        className={className}
        style={{
          float: 'left',
          marginTop: 0,
          display: show ? 'block' : 'none',
          zIndex: 10,
          padding: '0.5rem',
          top: '100%',
          right: direction === 'right' ? 'auto' : 0,
          left: direction === 'left' ? 'auto' : 0,
          minWidth: '10rem',
          width: '100%',
          position: 'absolute',
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
    </ErrorBoundary>
  );
}
