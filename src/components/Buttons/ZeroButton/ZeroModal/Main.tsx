import React from 'react';
import { useContentState } from '~/helpers/hooks';

export default function Main({
  contentId,
  contentType,
  content,
  onSetSelectedSection
}: {
  contentId?: number;
  contentType?: string;
  content?: string;
  onSetSelectedSection: (section: string) => void;
}) {
  const { content: contentFetchedFromContext } = useContentState({
    contentId: contentId as number,
    contentType: contentType as string
  });

  return (
    <div
      style={{
        flexDirection: 'column',
        display: 'flex'
      }}
    >
      <div>
        <p
          style={{
            whiteSpace: 'pre-wrap',
            overflowWrap: 'break-word',
            wordBreak: 'break-word',
            display: '-webkit-box',
            WebkitBoxOrient: 'vertical'
          }}
        >{`"${content || contentFetchedFromContext}"`}</p>
      </div>
      What do you want to do
      <div onClick={() => onSetSelectedSection('rewrite')}>Rewrite</div>
      <div onClick={() => onSetSelectedSection('upgrade')}>
        Upgrade AI Cards
      </div>
    </div>
  );
}
