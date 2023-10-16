import React from 'react';

export default function Details({
  contentId,
  contentType,
  isRevoked
}: {
  action: string;
  contentId: number;
  contentType: string;
  isRevoked: boolean;
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
      <div>
        {contentType} ID: {contentId}
        <div style={{ color: 'red' }}>{!!isRevoked && '(Revoked)'}</div>
      </div>
    </div>
  );
}
