import React from 'react';

export default function Details({
  action,
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
      <div>{action}</div>
      <div>
        {contentType} ID: {contentId}
        <span style={{ color: 'red' }}>{isRevoked && ' (Revoked)'}</span>
      </div>
    </div>
  );
}
