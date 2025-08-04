import React, { useRef } from 'react';
import { borderRadius, Color } from '~/constants/css';

export default function FailMessage({
  message
}: {
  message: string | React.ReactNode;
}) {
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
