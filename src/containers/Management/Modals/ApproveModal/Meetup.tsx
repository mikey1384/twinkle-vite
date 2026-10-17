import React from 'react';
import { Color } from '~/constants/css';

// A Bridge Builder unlock waiting for the administrator: the member reached
// 7 people, but no check-in looked like two phones in one place
// (twinkle-api meetupCheckins.ts); the content lists who counted. Older items
// are what a member wrote in the retired free-text form.
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
        Bridge Builder unlock to confirm
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
