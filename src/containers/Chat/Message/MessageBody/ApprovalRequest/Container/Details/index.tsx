import React, { useMemo } from 'react';
import Dob from './Dob';
import Mentor from './Mentor';
import RichText from '~/components/Texts/RichText';
import { v1 as uuidv1 } from 'uuid';

export default function Details({
  content,
  displayedThemeColor,
  type,
  messageId
}: {
  content: string;
  displayedThemeColor: string;
  type: string;
  messageId: number;
}) {
  const richTextId = useMemo(() => {
    if (messageId) return messageId;
    return uuidv1();
  }, [messageId]);

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
      {type === 'mentor' && <Mentor content={content} />}
      {type === 'meetup' && (
        <RichText
          contentId={richTextId}
          contentType="chat"
          section="main"
          theme={displayedThemeColor}
        >
          {(content || '').trimEnd()}
        </RichText>
      )}
    </div>
  );
}
