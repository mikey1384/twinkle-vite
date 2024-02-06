import React from 'react';
import { Color } from '~/constants/css';
import { getAge } from '~/helpers';

export default function Dob({ content }: { content: string }) {
  return (
    <div>
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
  );
}
