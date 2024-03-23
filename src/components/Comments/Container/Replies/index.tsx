import React, {
  memo,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import PropTypes from 'prop-types';
import LocalContext from '../../Context';
import Reply from './Reply';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import { returnTheme, scrollElementToCenter } from '~/helpers';
import { useAppContext, useKeyContext } from '~/contexts';
import { Comment, Content, Subject } from '~/types';

Replies.propTypes = {
  comment: PropTypes.object.isRequired,
  disableReason: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  isSubjectPannelComment: PropTypes.bool,
  subject: PropTypes.object,
  onPinReply: PropTypes.func.isRequired,
  parent: PropTypes.object.isRequired,
  replies: PropTypes.array.isRequired,
  pinnedCommentId: PropTypes.number,
  rootContent: PropTypes.object,
  ReplyRefs: PropTypes.object,
  theme: PropTypes.string
};
function Replies({
  replies,
  comment,
  disableReason,
  isSubjectPannelComment,
  subject,
  onPinReply,
  parent,
  pinnedCommentId,
  rootContent,
  ReplyRefs = {},
  theme
}: {
  comment: Comment;
  disableReason?: string;
  isSubjectPannelComment?: boolean;
  subject?: Subject;
  onPinReply: (commentId: number | null) => Promise<any>;
  parent: Content;
  replies: Comment[];
  pinnedCommentId?: number;
  ReplyRefs?: Record<string, React.RefObject<any>>;
  rootContent?: Content;
  theme?: string;
}) {
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
  } = useMemo(() => returnTheme(theme || profileTheme), [profileTheme, theme]);
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
      {replies.map((reply: Comment) => {
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
      const lastReplyId = replies[0] ? replies[0].id : null;
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
    commentId: number | null;
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
