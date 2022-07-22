import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import { borderRadius, Color } from '~/constants/css';

FailMessage.propTypes = {
  message: PropTypes.oneOfType([PropTypes.string, PropTypes.node])
};
export default function FailMessage({ message }) {
  const ComponentRef = useRef(null);

  return (
    <div
      ref={ComponentRef}
      style={{
        marginTop: '1rem',
        padding: '1rem',
        border: `1px solid ${Color.cranberry()}`,
        borderRadius,
        textAlign: 'center',
        color: '#fff',
        background: Color.rose(0.6),
        fontSize: '1.7rem'
      }}
    >
      {message}
    </div>
  );
}
