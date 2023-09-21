import React from 'react';
import Dob from './Dob';

export default function Details({
  content,
  type
}: {
  content: string;
  type: string;
}) {
  return (
    <div
      style={{
        width: '100%',
        marginTop: '1.5rem',
        lineHeight: 1.7,
        textAlign: 'center'
      }}
    >
      {type === 'dob' && <Dob content={content} />}
      {type === 'teacher' && <div>Teacher</div>}
    </div>
  );
}
