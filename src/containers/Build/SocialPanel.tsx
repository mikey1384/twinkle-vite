import React, { useEffect, useState } from 'react';
import ProfilePic from '~/components/ProfilePic';
import Textarea from '~/components/Texts/Textarea';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import { useAppContext, useKeyContext } from '~/contexts';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import { timeSince } from '~/helpers/timeStampHelpers';

const displayFontFamily =
  "'Trebuchet MS', 'Comic Sans MS', 'Segoe UI', 'Arial Rounded MT Bold', -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif";

interface Like {
  id: number;
  username: string;
  profilePicUrl?: string;
}

interface Comment {
  id: number;
  content: string;
  userId: number;
  username: string;
  profilePicUrl?: string;
  timeStamp: number;
  numReplies: number;
  likes: Like[];
}

interface SocialPanelProps {
  buildId: number;
  buildTitle: string;
  ownerId: number;
  isOwner: boolean;
}

export default function SocialPanel({
  buildId,
  buildTitle,
  isOwner
}: SocialPanelProps) {
  const { userId, twinkleCoins } = useKeyContext((v) => v.myState);
  const starBuild = useAppContext((v) => v.requestHelpers.starBuild);
  const loadBuildComments = useAppContext(
    (v) => v.requestHelpers.loadBuildComments
  );
  const postBuildComment = useAppContext(
    (v) => v.requestHelpers.postBuildComment
  );
  const rewardBuild = useAppContext((v) => v.requestHelpers.rewardBuild);
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);

  const [likes, setLikes] = useState<Like[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [loadingMoreComments, setLoadingMoreComments] = useState(false);
  const [loadMoreButton, setLoadMoreButton] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [starring, setStarring] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [rewardModalOpen, setRewardModalOpen] = useState(false);
  const [rewardAmount, setRewardAmount] = useState(10);
  const [rewardComment, setRewardComment] = useState('');
  const [submittingReward, setSubmittingReward] = useState(false);

  const isStarred = likes.some((like) => like.id === userId);

  function normalizeComment(raw: any): Comment {
    const uploader = raw?.uploader || {};
    return {
      id: raw?.id,
      content: raw?.content || '',
      userId: raw?.userId || uploader.id,
      username: raw?.username || uploader.username || 'Unknown',
      profilePicUrl: raw?.profilePicUrl || uploader.profilePicUrl,
      timeStamp: raw?.timeStamp || raw?.createdAt || 0,
      numReplies: raw?.numReplies || 0,
      likes: raw?.likes || []
    };
  }

  function normalizeComments(items: any[] = []) {
    return items.map((item) => normalizeComment(item));
  }

  useEffect(() => {
    handleLoadComments();

    async function handleLoadComments() {
      setLoadingComments(true);
      try {
        const data = await loadBuildComments({ buildId });
        setComments(normalizeComments(data?.comments || []));
        setLikes(data?.likes || []);
        setLoadMoreButton(data?.loadMoreButton || false);
      } catch (error) {
        console.error('Failed to load comments:', error);
      }
      setLoadingComments(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildId]);

  async function handleStar() {
    if (!userId || starring) return;
    setStarring(true);
    try {
      const data = await starBuild(buildId);
      setLikes(data?.likes || []);
    } catch (error) {
      console.error('Failed to star build:', error);
    }
    setStarring(false);
  }

  async function handleSubmitComment() {
    if (!userId || submittingComment || !commentText.trim()) return;
    setSubmittingComment(true);
    try {
      const data = await postBuildComment({
        buildId,
        content: commentText.trim()
      });
      if (data?.comment) {
        setComments((prev) => [normalizeComment(data.comment), ...prev]);
        setCommentText('');
      }
    } catch (error) {
      console.error('Failed to post comment:', error);
    }
    setSubmittingComment(false);
  }

  async function handleLoadMoreComments() {
    if (loadingMoreComments || !loadMoreButton) return;
    setLoadingMoreComments(true);
    try {
      const lastComment = comments[comments.length - 1];
      const data = await loadBuildComments({
        buildId,
        lastCommentId: lastComment?.id
      });
      setComments((prev) => [...prev, ...normalizeComments(data?.comments || [])]);
      setLoadMoreButton(data?.loadMoreButton || false);
    } catch (error) {
      console.error('Failed to load more comments:', error);
    }
    setLoadingMoreComments(false);
  }

  async function handleSubmitReward() {
    if (!userId || submittingReward || isOwner) return;
    if (rewardAmount < 1 || rewardAmount > (twinkleCoins || 0)) return;

    setSubmittingReward(true);
    try {
      const data = await rewardBuild({
        buildId,
        rewardAmount,
        rewardComment: rewardComment.trim() || undefined
      });
      if (data?.success) {
        const nextBalance = data.newCoinBalance ?? data.netCoins;
        if (typeof nextBalance === 'number') {
          onSetUserState({ userId, newState: { twinkleCoins: nextBalance } });
        }
        setRewardModalOpen(false);
        setRewardAmount(10);
        setRewardComment('');
      }
    } catch (error) {
      console.error('Failed to reward build:', error);
    }
    setSubmittingReward(false);
  }

  return (
    <div
      className={css`
        width: 320px;
        min-width: 320px;
        background: #fff;
        border-left: 1px solid var(--ui-border);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        @media (max-width: ${mobileMaxWidth}) {
          width: 100%;
          min-width: 100%;
          border-left: none;
          border-top: 1px solid var(--ui-border);
        }
      `}
    >
      <div
        className={css`
          padding: 1rem;
          border-bottom: 1px solid var(--ui-border);
          display: flex;
          gap: 0.5rem;
          background: #fff;
        `}
      >
        <GameCTAButton
          onClick={handleStar}
          disabled={!userId || starring}
          loading={starring}
          variant={isStarred ? 'gold' : 'logoBlue'}
          size="md"
          icon="star"
          style={{ flex: 1 }}
        >
          {isStarred ? 'Starred' : 'Star'} ({likes.length})
        </GameCTAButton>
        {!isOwner && userId && (
          <GameCTAButton
            onClick={() => setRewardModalOpen(true)}
            variant="magenta"
            size="md"
            icon="gift"
          >
            Reward
          </GameCTAButton>
        )}
      </div>

      <div
        className={css`
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
        `}
      >
        <h4
          className={css`
            margin: 0 0 1rem 0;
            font-size: 1.12rem;
            font-weight: 900;
            color: var(--chat-text);
            font-family: ${displayFontFamily};
          `}
        >
          Comments
        </h4>

        {userId && (
          <div
            className={css`
              margin-bottom: 1rem;
            `}
          >
            <Textarea
              value={commentText}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setCommentText(e.target.value)
              }
              placeholder="Add a comment..."
              minRows={2}
              style={{
                width: '100%',
                marginBottom: '0.5rem'
              }}
            />
            <div
              className={css`
                display: flex;
                justify-content: flex-end;
              `}
            >
              <GameCTAButton
                variant="logoBlue"
                size="md"
                icon="paper-plane"
                disabled={!commentText.trim() || submittingComment}
                loading={submittingComment}
                onClick={handleSubmitComment}
              >
                {submittingComment ? 'Posting...' : 'Post'}
              </GameCTAButton>
            </div>
          </div>
        )}

        {loadingComments ? (
          <div
            className={css`
              text-align: center;
              padding: 1rem;
              color: var(--chat-text);
              opacity: 0.6;
            `}
          >
            Loading comments...
          </div>
        ) : comments.length === 0 ? (
          <div
            className={css`
              text-align: center;
              padding: 2rem 1rem;
              color: var(--chat-text);
              opacity: 0.6;
            `}
          >
            No comments yet. Be the first to comment!
          </div>
        ) : (
          <>
            {comments.map((comment) => (
              <div
                key={comment.id}
                className={css`
                  padding: 0.75rem 0;
                  border-bottom: 1px solid var(--ui-border);
                  &:last-child {
                    border-bottom: none;
                  }
                `}
              >
                <div
                  className={css`
                    display: flex;
                    align-items: flex-start;
                    gap: 0.6rem;
                  `}
                >
                  <ProfilePic
                    userId={comment.userId}
                    profilePicUrl={comment.profilePicUrl || ''}
                    style={{ width: '32px', height: '32px' }}
                  />
                  <div
                    className={css`
                      flex: 1;
                      min-width: 0;
                    `}
                  >
                    <div
                      className={css`
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                        margin-bottom: 0.25rem;
                      `}
                    >
                      <span
                        className={css`
                          font-weight: 700;
                          font-size: 0.9rem;
                          color: var(--chat-text);
                        `}
                      >
                        {comment.username}
                      </span>
                      <span
                        className={css`
                          font-size: 0.75rem;
                          color: var(--chat-text);
                          opacity: 0.5;
                        `}
                      >
                        {timeSince(comment.timeStamp)}
                      </span>
                    </div>
                    <p
                      className={css`
                        margin: 0;
                        font-size: 0.9rem;
                        color: var(--chat-text);
                        line-height: 1.4;
                        white-space: pre-wrap;
                        word-break: break-word;
                      `}
                    >
                      {comment.content}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {loadMoreButton && (
              <div
                className={css`
                  margin-top: 1rem;
                  text-align: center;
                `}
              >
                <LoadMoreButton
                  loading={loadingMoreComments}
                  onClick={handleLoadMoreComments}
                />
              </div>
            )}
          </>
        )}
      </div>

      {rewardModalOpen && (
        <div
          className={css`
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
          `}
          onClick={() => setRewardModalOpen(false)}
        >
          <div
            className={css`
              background: #fff;
              border-radius: 16px;
              padding: 1.5rem;
              width: 90%;
              max-width: 400px;
              border: 1px solid var(--ui-border);
              box-shadow: 0 10px 26px rgba(0, 0, 0, 0.18);
            `}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              className={css`
                margin: 0 0 1rem 0;
                font-size: 1.45rem;
                font-weight: 900;
                color: var(--chat-text);
                font-family: ${displayFontFamily};
              `}
            >
              Reward this build
            </h3>
            <p
              className={css`
                margin: 0 0 1rem 0;
                font-size: 0.9rem;
                color: var(--chat-text);
                opacity: 0.7;
              `}
            >
              Send Twinkle Coins to appreciate {buildTitle}
            </p>
            <div
              className={css`
                margin-bottom: 1rem;
              `}
            >
              <label
                className={css`
                  display: block;
                  margin-bottom: 0.5rem;
                  font-weight: 600;
                  font-size: 0.9rem;
                  color: var(--chat-text);
                `}
              >
                Amount (You have {twinkleCoins || 0} coins)
              </label>
              <input
                type="number"
                min={1}
                max={twinkleCoins || 0}
                value={rewardAmount}
                onChange={(e) => setRewardAmount(parseInt(e.target.value) || 0)}
                className={css`
                  width: 100%;
                  padding: 0.6rem;
                  border: 1px solid var(--ui-border);
                  border-radius: 8px;
                  font-size: 1rem;
                  &:focus {
                    outline: none;
                    border-color: var(--theme-border);
                  }
                `}
              />
            </div>
            <div
              className={css`
                margin-bottom: 1.5rem;
              `}
            >
              <label
                className={css`
                  display: block;
                  margin-bottom: 0.5rem;
                  font-weight: 600;
                  font-size: 0.9rem;
                  color: var(--chat-text);
                `}
              >
                Message (optional)
              </label>
              <textarea
                value={rewardComment}
                onChange={(e) => setRewardComment(e.target.value)}
                placeholder="Add a message..."
                className={css`
                  width: 100%;
                  padding: 0.6rem;
                  border: 1px solid var(--ui-border);
                  border-radius: 8px;
                  font-size: 0.9rem;
                  resize: none;
                  min-height: 80px;
                  &:focus {
                    outline: none;
                    border-color: var(--theme-border);
                  }
                `}
              />
            </div>
            <div
              className={css`
                display: flex;
                gap: 0.75rem;
              `}
            >
              <GameCTAButton
                onClick={() => setRewardModalOpen(false)}
                variant="neutral"
                size="md"
                style={{ flex: 1 }}
              >
                Cancel
              </GameCTAButton>
              <GameCTAButton
                onClick={handleSubmitReward}
                disabled={
                  submittingReward ||
                  rewardAmount < 1 ||
                  rewardAmount > (twinkleCoins || 0)
                }
                loading={submittingReward}
                variant="gold"
                size="md"
                icon="gift"
                style={{ flex: 1 }}
              >
                {submittingReward ? 'Sending...' : `Send ${rewardAmount} Coins`}
              </GameCTAButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
