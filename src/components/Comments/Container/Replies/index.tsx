import React, { memo, useContext, useEffect, useRef, useState } from 'react';
import LocalContext from '../../Context';
import Reply from './Reply';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import { useTheme } from '~/helpers/hooks';
import { scrollElementToCenter } from '~/helpers';
import { useAppContext, useKeyContext } from '~/contexts';

interface Props {
  comment: {
    id: number;
    loadMoreButton: boolean;
  };
  disableReason?: string;
  isSubjectPannelComment?: boolean;
  subject?: any;
  onPinReply?: (v: any) => void;
  parent: any;
  replies: {
    id: number;
    lastReplyId: number;
    userId: number;
    isLoadMoreButton: boolean;
    rootReplyId: number;
    commentId: number;
  }[];
  pinnedCommentId?: number;
  ReplyRefs?: any;
  rootContent?: any;
  theme?: string;
  userId?: number;
}
function Replies({
  replies,
  userId,
  comment,
  disableReason,
  isSubjectPannelComment,
  subject,
  onPinReply,
  parent,
  pinnedCommentId,
  rootContent,
  ReplyRefs,
  theme
}: Props) {
  const { profileTheme } = useKeyContext((v) => v.myState);
  const {
    onDelete,
    onLoadMoreReplies,
    onLoadRepliesOfReply,
    onReplySubmit,
    onSubmitWithAttachment
  } = useContext(LocalContext);
  const {
    loadMoreButton: { color: loadMoreButtonColor }
  } = useTheme(theme || profileTheme);
  const loadReplies = useAppContext((v) => v.requestHelpers.loadReplies);
  const [deleting, setDeleting] = useState(false);
  const [replying, setReplying] = useState(false);
  const [loadingMoreReplies, setLoadingMoreReplies] = useState(false);
  const [loadingMoreRepliesOfReply, setLoadingMoreRepliesOfReply] =
    useState(false);
  const prevReplies = useRef(replies);
  const ContainerRef = useRef(null);

  useEffect(() => {
    if (replies.length < prevReplies.current.length) {
      if (deleting) {
        setDeleting(false);
        if (replies.length === 0) {
          scrollElementToCenter(ContainerRef.current);
        } else if (
          replies[replies.length - 1].id !==
          prevReplies.current[prevReplies.current.length - 1].id
        ) {
          scrollElementToCenter(ReplyRefs[replies[replies.length - 1].id]);
        }
      }
    }
    if (replies.length > prevReplies.current.length) {
      if (replying) {
        setReplying(false);
        scrollElementToCenter(ReplyRefs[replies[replies.length - 1].id]);
      }
    }
    prevReplies.current = replies;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [replies]);

  return (
    <div ref={ContainerRef}>
      {comment.loadMoreButton && (
        <LoadMoreButton
          style={{
            marginTop: '0.5rem',
            width: '100%'
          }}
          filled
          color={loadMoreButtonColor}
          loading={loadingMoreReplies}
          onClick={handleLoadMoreReplies}
        />
      )}
      {replies.map((reply, index) => {
        return reply.isLoadMoreButton ? (
          <LoadMoreButton
            key={reply.id}
            style={{
              marginTop: '0.5rem',
              width: '100%'
            }}
            filled
            color={loadMoreButtonColor}
            loading={loadingMoreRepliesOfReply}
            onClick={() =>
              handleLoadMoreRepliesOfReply({
                lastReplyId: reply.lastReplyId,
                rootReplyId: reply.rootReplyId,
                commentId: reply.commentId,
                loadMoreButtonId: reply.id
              })
            }
          />
        ) : (
          <Reply
            innerRef={(ref) => (ReplyRefs[reply.id] = ref)}
            disableReason={disableReason}
            isSubjectPannelComment={isSubjectPannelComment}
            key={reply.id}
            comment={comment}
            reply={reply}
            deleteReply={handleDeleteReply}
            onLoadRepliesOfReply={onLoadRepliesOfReply}
            onPinReply={onPinReply}
            onSubmitWithAttachment={handleSubmitWithAttachment}
            parent={parent}
            pinnedCommentId={pinnedCommentId}
            rootContent={rootContent}
            subject={subject}
            theme={theme}
            onSubmitReply={handleSubmitReply}
          />
        );
      })}
    </div>
  );

  async function handleLoadMoreReplies() {
    try {
      setLoadingMoreReplies(true);
      const lastReplyId = replies[0] ? replies[0].id : 'undefined';
      const data = await loadReplies({ lastReplyId, commentId: comment.id });
      onLoadMoreReplies({
        ...data,
        contentType: parent.contentType,
        contentId: parent.contentId
      });
      setLoadingMoreReplies(false);
    } catch (error: any) {
      console.error(error.response, error);
    }
  }

  async function handleLoadMoreRepliesOfReply({
    lastReplyId,
    rootReplyId,
    commentId,
    loadMoreButtonId
  }: {
    lastReplyId: number;
    rootReplyId: number;
    commentId: number;
    loadMoreButtonId: number;
  }) {
    setLoadingMoreRepliesOfReply(true);
    const { replies, loadMoreButton } = await loadReplies({
      lastReplyId,
      commentId: rootReplyId,
      isReverse: true
    });
    if (replies.length > 0) {
      onLoadRepliesOfReply({
        replies,
        commentId,
        replyId: lastReplyId,
        rootReplyId,
        contentId: parent.contentId,
        contentType: parent.contentType,
        loadMoreButton,
        loadMoreButtonId
      });
    }
    setLoadingMoreRepliesOfReply(false);
  }

  function handleDeleteReply(replyId: number) {
    setDeleting(true);
    onDelete(replyId);
  }

  async function handleSubmitReply(params: any) {
    setReplying(true);
    await onReplySubmit(params);
    return Promise.resolve();
  }

  async function handleSubmitWithAttachment(params: any) {
    setReplying(true);
    // this "await" here is very important!!
    await onSubmitWithAttachment(params);
  }
}

export default memo(Replies);
