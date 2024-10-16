import React from 'react';
import PropTypes from 'prop-types';
import zeroFull from './zero-full.png';

ZeroPic.propTypes = {
  style: PropTypes.object
};
export default function ZeroPic({ style }: { style?: React.CSSProperties }) {
  return (
    <div
      style={{
        display: 'block',
        position: 'relative',
        userSelect: 'none',
        borderRadius: '50%',
        paddingBottom: '100%',
        ...style
      }}
    >
      <img
        alt="Thumbnail"
        style={{
          display: 'block',
          position: 'absolute',
          width: '100%',
          height: '100%',
          borderRadius: '50%'
        }}
        src={zeroFull}
      />
    </div>
  );
}
