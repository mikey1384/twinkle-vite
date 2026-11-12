import React from 'react';
import DeletedMessage from '~/components/Deleted/Message';
import DeletedPost from '~/components/Deleted/Post';
import { Color } from '~/constants/css';
import { useReplyCardPresentation } from '../../../ReplyCardPresentation';

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
  const inReply = useReplyCardPresentation();
  return (
    <div
      style={{
        width: '100%',
        marginTop: inReply ? '0.7rem' : '1.5rem',
        lineHeight: 1.7,
        textAlign: 'center'
      }}
    >
      <div style={{ padding: '0 1rem' }}>
        {contentType === 'chat' ? (
          <DeletedMessage messageId={contentId} />
        ) : (
          <DeletedPost contentId={contentId} contentType={contentType} />
        )}
        <div
          style={{
            color: Color.darkGray(),
            marginTop: '1rem',
            fontWeight: 'bold'
          }}
        >
          {!!isRevoked && '(Revoked)'}
        </div>
      </div>
    </div>
  );
}
