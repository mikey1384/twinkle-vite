import React from 'react';
import { Color } from '~/constants/css';
import { getAge } from '~/helpers';

export default function Dob({
  username,
  content
}: {
  username: string;
  content: string;
}) {
  return (
    <div>
      <div
        style={{
          fontWeight: 'bold',
          fontSize: '2rem',
          color: Color.logoBlue()
        }}
      >
        {username}
      </div>
      <div
        style={{
          marginTop: '1.5rem',
          textAlign: 'center',
          lineHeight: 1.7
        }}
      >
        <p
          style={{
            color: Color.black(),
            fontWeight: 'bold',
            fontSize: '1.6rem'
          }}
        >
          {content}
        </p>
        <p style={{ fontSize: '1.2rem', color: Color.darkerGray() }}>
          ({getAge(content)} years old)
        </p>
      </div>
    </div>
  );
}
