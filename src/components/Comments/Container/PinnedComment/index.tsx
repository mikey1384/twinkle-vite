import React, { useEffect } from 'react';
import { useContentState } from '~/helpers/hooks';
import Comment from './Comment';
import ErrorBoundary from '~/components/ErrorBoundary';
import Icon from '~/components/Icon';
import { Color } from '~/constants/css';
import { useAppContext, useContentContext } from '~/contexts';import { Content, Subject } from '~/types';

const pinnedLabel = 'Pinned';

export default function PinnedComment({
  commentId,
  compactMode,
  parent,
  rootContent,
  subject,
  theme
}: {
  commentId: number;
  compactMode?: boolean;
  parent: Content;
  rootContent?: Content;
  subject?: Subject;
  theme?: string;
}) {
  const loadContent = useAppContext((v) => v.requestHelpers.loadContent);
  const onInitContent = useContentContext((v) => v.actions.onInitContent);
  const comment = useContentState({
    contentType: 'comment',
    contentId: commentId
  });
  useEffect(() => {
    if (!comment.loaded) {
      init();
    }

    async function init() {
      const data = await loadContent({
        contentId: commentId,
        contentType: 'comment',
        isPinnedComment: true
      });
      onInitContent({ contentId: commentId, contentType: 'comment', ...data });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comment, commentId]);

  return (
    <ErrorBoundary componentPath="Comments/PinnedComment/index">
      {comment.loaded &&
      comment.uploader &&
      !comment.isDeleted &&
      !comment.notFound &&
      !comment.isDeleteNotification ? (
        <div
          style={{
            borderBottom: '1px solid var(--ui-border)',
            marginBottom: compactMode ? '0.65rem' : '1rem',
            marginTop: compactMode ? '0.35rem' : '0.5rem',
            paddingBottom: compactMode ? '0.4rem' : '0.5rem'
          }}
        >
          <div
            style={{
              color: Color.darkerGray(),
              fontSize: compactMode ? '0.86rem' : '1.3rem',
              fontWeight: 'bold',
              lineHeight: 1,
              marginBottom: compactMode ? '0.1rem' : undefined
            }}
          >
            <Icon icon={['fas', 'thumbtack']} />
            <span style={{ marginLeft: '0.7rem' }}>{pinnedLabel}</span>
          </div>
          <Comment
            compactMode={compactMode}
            parent={parent}
            rootContent={rootContent}
            subject={subject}
            comment={comment}
            theme={theme}
          />
        </div>
      ) : null}
    </ErrorBoundary>
  );
}
