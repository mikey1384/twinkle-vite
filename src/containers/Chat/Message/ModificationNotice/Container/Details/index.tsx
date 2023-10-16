import React from 'react';

export default function Details({
  content,
  type
}: {
  content: Record<string, any> | null;
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
      details go here type: {type} {'//'} content: {JSON.stringify(content)}
    </div>
  );
}
