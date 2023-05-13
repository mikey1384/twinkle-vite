import React from 'react';
import { Color, borderRadius } from '~/constants/css';

export default function InvalidContent() {
  return (
    <div
      style={{
        fontWeight: 'bold',
        textAlign: 'center',
        padding: '1.5rem',
        border: `1px solid ${Color.borderGray()}`,
        borderRadius
      }}
    >
      Invalid Content
    </div>
  );
}
