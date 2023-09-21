import React from 'react';
import { Color } from '~/constants/css';
import { getAge } from '~/helpers';

export default function Details({
  content,
  type
}: {
  content: string;
  type: string;
}) {
  return (
    <div style={{ width: '100%', marginTop: '1.5rem', lineHeight: 1.7 }}>
      <div style={{ textAlign: 'center' }}>
        <p
          style={{
            color: Color.black(),
            fontWeight: 'bold',
            fontSize: '1.6rem'
          }}
        >
          {content} {type}
        </p>
        <p style={{ fontSize: '1.2rem', color: Color.darkerGray() }}>
          ({getAge(content)} years old)
        </p>
      </div>
    </div>
  );
}
