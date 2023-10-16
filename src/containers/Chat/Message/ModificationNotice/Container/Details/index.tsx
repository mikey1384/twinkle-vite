import React from 'react';
import DeletedMessage from '~/components/Deleted/DeletedMessage';
import DeletedPost from '~/components/Deleted/DeletedPost';

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
        {contentType === 'chat' ? (
          <DeletedMessage messageId={contentId} />
        ) : (
          <DeletedPost contentId={contentId} contentType={contentType} />
        )}
        <div style={{ color: 'red' }}>{!!isRevoked && '(Revoked)'}</div>
      </div>
    </div>
  );
}
