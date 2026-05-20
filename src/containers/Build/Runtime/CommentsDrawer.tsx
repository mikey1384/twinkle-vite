import React from 'react';
import { css } from '@emotion/css';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import Comments from '~/components/Comments';
import Icon from '~/components/Icon';
import { mobileMaxWidth } from '~/constants/css';
import type { Content } from '~/types';

const RUNTIME_COMMENTS_LOAD_LIMIT = 20;

const commentsDrawerClass = css`
  width: 100%;
  height: 100%;
  min-height: 0;
  min-width: 0;
  background: #fff;
  border-left: 1px solid transparent;
  box-shadow: none;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  opacity: 0;
  pointer-events: none;
  transform: translateX(0.8rem);
  visibility: hidden;
  transition:
    opacity 0.18s ease-out,
    transform 0.24s cubic-bezier(0.22, 1, 0.36, 1),
    border-color 0.18s ease-out,
    box-shadow 0.18s ease-out,
    visibility 0s linear 0.24s;

  &[data-visible='true'] {
    border-left-color: rgba(148, 163, 184, 0.35);
    box-shadow: -0.8rem 0 2rem rgba(15, 23, 42, 0.08);
    opacity: 1;
    pointer-events: auto;
    transform: translateX(0);
    visibility: visible;
    transition:
      opacity 0.18s ease-out,
      transform 0.24s cubic-bezier(0.22, 1, 0.36, 1),
      border-color 0.18s ease-out,
      box-shadow 0.18s ease-out,
      visibility 0s;
  }

  @media (max-width: 760px) {
    border-left: 0;
    border-top: 1px solid transparent;
    transform: translateY(0.65rem);

    &[data-visible='true'] {
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 40;
      height: min(48vh, 34rem);
      max-height: calc(100vh - 5rem);
      border-top-color: rgba(148, 163, 184, 0.35);
      box-shadow: 0 -0.8rem 2rem rgba(15, 23, 42, 0.08);
      transform: translateY(0);
    }
  }
`;

const commentsDrawerHeaderClass = css`
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 1rem;
  padding: 1rem 1.05rem 0.85rem;
  border-bottom: 1px solid rgba(148, 163, 184, 0.28);
`;

const commentsDrawerTitleWrapClass = css`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.22rem;
`;

const commentsDrawerTitleClass = css`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
  margin: 0;
  color: #172033;
  font-size: 1.1rem;
  font-weight: 900;
  line-height: 1.15;
`;

const commentsDrawerSubtitleClass = css`
  max-width: 100%;
  color: #64748b;
  font-size: 1.1rem;
  font-weight: 800;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const commentsDrawerBodyClass = css`
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 0.9rem 1.05rem 1.2rem;
`;

const commentsDrawerErrorClass = css`
  margin-bottom: 0.85rem;
  padding: 0.75rem;
  border: 1px solid rgba(244, 63, 94, 0.32);
  border-radius: 8px;
  background: rgba(255, 241, 242, 0.88);
  color: #be123c;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  font-size: 1.1rem;
  font-weight: 800;
`;

const runtimeCommentsClass = css`
  padding: 0;
  color: #1f2937;
  font-size: 1.1rem;

  .comment__container {
    padding-top: 0.55rem;
    margin-bottom: 0.65rem;
    font-size: 1.1rem;
  }

  .content-wrapper {
    align-items: flex-start;
  }

  .content-wrapper > div:first-of-type {
    flex: 0 0 3rem;
    width: 3rem;
    margin-top: 0.45rem;
  }

  .content-wrapper > div:first-of-type > div {
    width: 2.35rem;
  }

  .content-wrapper > section {
    min-width: 0;
    margin-left: 0.65rem;
  }

  .username {
    font-size: 1.1rem;
    font-weight: 800;
  }

  .timestamp,
  .timestamp > a {
    font-size: 1.1rem;
  }

  .to {
    font-size: 1.1rem;
    line-height: 1.35;
  }

  .comment__content {
    padding-top: 0.45rem;
    font-size: 1.1rem;
    line-height: 1.5;
  }

  .comment__content-spacer {
    height: 0.35rem !important;
  }

  .comment__likes {
    margin-top: 0.15rem;
    font-size: 1.1rem;
    line-height: 1.25;
  }

  .comment__actions {
    align-items: center;
    gap: 0.45rem;
    margin-top: 0.1rem;
  }

  .comment__actions > div:first-of-type {
    min-width: 0;
  }

  .comment__buttons {
    gap: 0.25rem;
    flex-wrap: wrap;
  }

  .comment__buttons button {
    min-height: 0;
    padding: 0.42rem 0.68rem;
    font-size: 1.1rem;
    margin-left: 0 !important;
    border-radius: 8px;
  }

  .comment__buttons button span {
    margin-left: 0.35rem !important;
  }

  .comment__secondary-actions {
    flex: 0 0 auto;
    gap: 0.35rem;
  }

  .comment__secondary-actions > button {
    width: 2.5rem !important;
    height: 2.5rem !important;
    min-height: 0 !important;
    padding: 0 !important;
    margin-left: 0 !important;
    border-radius: 9px !important;
    font-size: 1.1rem !important;
  }

  .comment__secondary-actions > button > span {
    gap: 0 !important;
  }

  .comment__secondary-actions > button > span > span {
    display: none;
  }

  .comment__secondary-actions img {
    width: 1rem !important;
    height: 1rem !important;
  }

  .dropdown-wrapper {
    top: 0.1rem;
    right: 0;
  }

  .dropdown-wrapper button {
    width: 2.2rem !important;
    height: 2.2rem !important;
    min-height: 0 !important;
    padding: 0 !important;
    border-radius: 8px !important;
    font-size: 1.1rem !important;
  }

  textarea {
    padding: 0.75rem;
    font-size: 1.1rem !important;
    line-height: 1.38;
  }

  button {
    max-width: 100%;
  }

  @media (max-width: ${mobileMaxWidth}) {
    .content-wrapper > div:first-of-type {
      flex-basis: 2.75rem;
      width: 2.75rem;
    }

    .content-wrapper > div:first-of-type > div {
      width: 2.15rem;
    }
  }
`;

const runtimeCommentsInputFormClass = css`
  gap: 0.55rem;
  align-items: flex-start !important;

  > div:first-of-type {
    min-width: 0;
  }

  textarea {
    min-height: 3.4rem !important;
    padding: 0.65rem 0.78rem !important;
    border-radius: 10px !important;
    font-size: 1.1rem !important;
    line-height: 1.35 !important;
  }

  > div:first-of-type > div:nth-of-type(2) {
    gap: 0.55rem !important;
    margin-top: 0.35rem !important;
    margin-bottom: 0.15rem !important;
    align-items: center !important;
    justify-content: flex-end !important;
  }

  > div:first-of-type > div:nth-of-type(2) > div {
    color: #94a3b8 !important;
    font-size: 1.1rem !important;
    line-height: 1.15 !important;
    white-space: nowrap;
  }

  > div:first-of-type > div:nth-of-type(2) > button {
    min-height: 2.4rem !important;
    padding: 0.55rem 0.8rem !important;
    border-radius: 8px !important;
    font-size: 1.1rem !important;
    line-height: 1.1 !important;
    box-shadow: 0 1px 0 rgba(22, 163, 74, 0.24) !important;
  }

  > div:last-child:not(:first-child) {
    flex: 0 0 auto;
    max-width: 6.6rem;
    margin-left: 0.55rem !important;
    font-size: 1.1rem !important;
    line-height: 1.15 !important;
  }

  > div:last-child:not(:first-child) > svg:first-child {
    width: 1.25rem !important;
    height: 1.25rem !important;
    top: -0.45rem !important;
    right: -0.35rem !important;
    padding: 0.12rem !important;
  }

  > div:last-child:not(:first-child) > div {
    width: 6.2rem !important;
    height: 3.45rem !important;
  }

  > div:last-child:not(:first-child) > div > div {
    margin-top: 0.15rem;
    font-size: 1.1rem !important;
    line-height: 1.15 !important;
  }

  > div:last-child > button {
    width: 2.65rem !important;
    height: 2.65rem !important;
    margin-left: 0.55rem !important;
    padding: 0 !important;
    border-radius: 10px !important;
  }

  > div:last-child > button svg {
    width: 1rem;
    height: 1rem;
  }
`;

export default function CommentsDrawer({
  comments,
  error,
  loaded,
  loading,
  loadMoreButton,
  parent,
  inputAreaInnerRef,
  active,
  userId,
  visible,
  onCommentSubmit,
  onDelete,
  onEditDone,
  onLikeClick,
  onLoadMoreComments,
  onLoadMoreReplies,
  onLoadRepliesOfReply,
  onReplySubmit,
  onRetry,
  onRewardCommentEdit
}: {
  comments: any[];
  error: string;
  loaded: boolean;
  loading: boolean;
  loadMoreButton: any;
  parent: Content | null;
  inputAreaInnerRef?: React.RefObject<any>;
  active: boolean;
  userId: number;
  visible: boolean;
  onCommentSubmit: (data: any) => void;
  onDelete: (commentId: number) => void;
  onEditDone: (...args: any[]) => void;
  onLikeClick: (...args: any[]) => void;
  onLoadMoreComments: (...args: any[]) => void;
  onLoadMoreReplies: (...args: any[]) => void;
  onLoadRepliesOfReply: (...args: any[]) => void;
  onReplySubmit: (data: any) => void;
  onRetry: () => void;
  onRewardCommentEdit: (...args: any[]) => void;
}) {
  if (!parent) return null;
  return (
    <aside
      aria-hidden={!visible}
      aria-labelledby="runtime-comments-title"
      className={commentsDrawerClass}
      data-visible={visible ? 'true' : 'false'}
      role="complementary"
    >
      <div className={commentsDrawerHeaderClass}>
        <div className={commentsDrawerTitleWrapClass}>
          <h2 className={commentsDrawerTitleClass} id="runtime-comments-title">
            <Icon icon="comments" />
            <span>Comments</span>
          </h2>
          <div className={commentsDrawerSubtitleClass}>{parent.title}</div>
        </div>
      </div>
      <div className={commentsDrawerBodyClass}>
        {error ? (
          <div className={commentsDrawerErrorClass} role="alert">
            <span>{error}</span>
            <GameCTAButton
              onClick={onRetry}
              variant="pink"
              size="sm"
              icon="redo"
              loading={loading}
            >
              Retry
            </GameCTAButton>
          </div>
        ) : null}
        {active && (visible || loaded) ? (
          <Comments
            alwaysShowInput
            autoExpand
            autoFocus={visible}
            comments={comments}
            commentsLoadLimit={RUNTIME_COMMENTS_LOAD_LIMIT}
            commentsShown
            compactMode
            className={runtimeCommentsClass}
            inputFormClassName={runtimeCommentsInputFormClass}
            inputAreaInnerRef={inputAreaInnerRef}
            inputTypeLabel="comment"
            isLoading={loading}
            loadMoreButton={loadMoreButton}
            numInputRows={2}
            onCommentSubmit={onCommentSubmit}
            onDelete={onDelete}
            onEditDone={onEditDone}
            onLikeClick={onLikeClick}
            onLoadMoreComments={onLoadMoreComments}
            onLoadMoreReplies={onLoadMoreReplies}
            onLoadRepliesOfReply={onLoadRepliesOfReply}
            onReplySubmit={onReplySubmit}
            onRewardCommentEdit={onRewardCommentEdit}
            parent={parent}
            rootContent={parent}
            submitButtonLabel="Post"
            theme="logoBlue"
            userId={userId}
          />
        ) : null}
      </div>
    </aside>
  );
}
