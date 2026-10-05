import React from 'react';
import { Color } from '~/constants/css';

// A meetup achievement request: what the member wrote about the meetup.
export default function Meetup({
  username,
  content
}: {
  username: string;
  content: string;
}) {
  const details = String(content || '').trim();
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
      <p
        style={{
          marginTop: '0.5rem',
          fontSize: '1.2rem',
          color: Color.darkerGray()
        }}
      >
        Meetup achievement request
      </p>
      <p
        style={{
          marginTop: '1.5rem',
          fontSize: '1.5rem',
          whiteSpace: 'pre-wrap',
          overflowWrap: 'anywhere',
          color: details ? Color.black() : Color.darkerGray(),
          fontStyle: details ? 'normal' : 'italic'
        }}
      >
        {details || 'No details were given.'}
      </p>
    </div>
  );
}
