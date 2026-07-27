import React from 'react';
import CloneButtons from '~/components/Buttons/CloneButtons';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import { useContentContext, useKeyContext, useMissionContext } from '~/contexts';

export default function SharedPromptCloneBand({
  contentId,
  content,
  myClones,
  uploaderId
}: {
  contentId: number;
  content?: string;
  myClones?: { target: 'zero' | 'ciel'; channelId: number; topicId: number }[];
  uploaderId: number;
}) {
  const userId = useKeyContext((v) => v.myState.userId);
  const onEditContent = useContentContext((v) => v.actions.onEditContent);
  const onUpdateSharedPromptClone = useMissionContext(
    (v) => v.actions.onUpdateSharedPromptClone
  );

  // CloneButtons renders nothing in these cases, so the band would otherwise
  // show up as a bare separator line
  if (!userId || uploaderId === userId) {
    return null;
  }

  return (
    <div
      className={css`
        margin-top: 1.2rem;
        padding-top: 1rem;
        display: flex;
        justify-content: center;
        border-top: 1px solid ${Color.borderGray()};
      `}
    >
      <CloneButtons
        layout="paired"
        sharedTopicId={contentId}
        sharedTopicTitle={content}
        uploaderId={uploaderId}
        myClones={myClones}
        onCloneSuccess={handleCloneSuccess}
      />
    </div>
  );

  function handleCloneSuccess({
    target,
    topicId,
    channelId
  }: {
    sharedTopicId: number;
    target: 'zero' | 'ciel';
    topicId: number;
    channelId: number;
    title: string;
  }) {
    const existingClones = Array.isArray(myClones) ? myClones : [];
    const updatedClones = [
      ...existingClones.filter((clone) => clone.target !== target),
      { target, topicId, channelId }
    ];

    onEditContent({
      contentType: 'sharedTopic',
      contentId,
      data: { myClones: updatedClones }
    });

    onUpdateSharedPromptClone({
      promptId: contentId,
      target,
      channelId,
      topicId
    });
  }
}
