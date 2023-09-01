import React from 'react';
import { borderRadius, Color } from '~/constants/css';

export default function Form({
  dob,
  onSetDob
}: {
  dob: string;
  onSetDob: (dob: string) => void;
}) {
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
      <label
        style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          marginBottom: '1rem',
          color: Color.black()
        }}
      >
        Enter Your Birthdate
      </label>
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
        <input
          type="date"
          value={dob}
          onChange={(e) => onSetDob(e.target.value)}
          style={{
            padding: '0.5rem',
            fontSize: '1.3rem',
            border: `1px solid ${Color.borderGray()}`,
            borderRadius
          }}
        />
      </div>
    </div>
  );
}
