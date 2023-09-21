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
    <div style={{ marginTop: '1.5rem', textAlign: 'center', lineHeight: 1.7 }}>
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
  );
}
