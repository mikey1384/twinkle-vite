import React from 'react';
import { Color } from '~/constants/css';

export default function Submitted() {
  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column'
      }}
    >
      <p
        style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          marginBottom: '1rem',
          color: Color.black()
        }}
      >
        Your birthdate has been submitted for approval
      </p>
    </div>
  );
}
