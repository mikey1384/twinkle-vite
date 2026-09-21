import React, { createContext, useContext } from 'react';
import Icon from '~/components/Icon';
import { getBuildFeedbackComment } from '~/helpers/buildCommentFeedback';

export const LumineCommentContext = createContext<{
  buildId: number;
  opening: boolean;
  onUseComment: (comment: any, parentComment?: any) => void;
} | null>(null);

// Only the app page provides this context. A build comment embedded on Home,
// a profile or a standalone comment page does not acquire this action.
export function useLumineCommentMenuItem({
  comment,
  parentComment,
  rootContent,
  style
}: {
  comment: any;
  parentComment?: any;
  rootContent?: { contentType?: string; contentId?: number; id?: number };
  style?: React.CSSProperties;
}) {
  const context = useContext(LumineCommentContext);
  if (
    !context ||
    rootContent?.contentType !== 'build' ||
    Number(rootContent.contentId || rootContent.id) !== context.buildId ||
    !getBuildFeedbackComment(comment)
  )
    return null;
  return {
    label: (
      <>
        <Icon icon="sparkles" />
        <span>Use in Lumine</span>
      </>
    ),
    disabled: context.opening,
    onClick: () => context.onUseComment(comment, parentComment),
    style: { ...style, gap: '0.5rem' }
  };
}
