import React from 'react';
import { css } from '@emotion/css';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import Icon from '~/components/Icon';
import ProfilePic from '~/components/ProfilePic';
import Textarea from '~/components/Texts/Textarea';
import UsernameText from '~/components/Texts/UsernameText';
import { mobileMaxWidth } from '~/constants/css';
import { getBuildBranchDisplayTitle } from '~/helpers/buildRelationshipHelpers';
import { timeSince } from '~/helpers/timeStampHelpers';
import type { User } from '~/types';
import type { BuildForumReply, BuildForumThread } from './types';

const detailClass = css`
  border: 1px solid var(--ui-border);
  border-radius: 8px;
  background: #fff;
  padding: 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
`;

const rowClass = css`
  display: flex;
  align-items: center;
  gap: 0.7rem;
  flex-wrap: wrap;
`;

const mutedTextClass = css`
  color: var(--chat-text);
  opacity: 0.68;
  font-size: 1.1rem;
  font-weight: 700;
`;

const listClass = css`
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
`;

const forumComposerClass = css`
  border: 1px solid rgba(65, 140, 235, 0.24);
  border-radius: 8px;
  background: rgba(65, 140, 235, 0.04);
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
`;

const forumComposerTitleClass = css`
  display: flex;
  align-items: center;
  gap: 0.45rem;
  color: var(--chat-text);
  font-weight: 900;
`;

const forumActionsClass = css`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 0.7rem;
  flex-wrap: wrap;
`;

const forumPostListClass = css`
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
`;

const forumPostClass = css`
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 8px;
  padding: 0.75rem;
  background: #fff;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 0.75rem;
  align-items: flex-start;
`;

const forumAvatarClass = css`
  width: 2.65rem;
  @media (max-width: ${mobileMaxWidth}) {
    width: 2.35rem;
  }
`;

const forumPostMainClass = css`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
`;

const forumPostHeaderClass = css`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.7rem;
`;

const forumAuthorMetaClass = css`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.12rem;
`;

const forumUsernameClass = css`
  font-weight: 900;
  font-size: 1.1rem;
  max-width: 100%;
`;

const forumTimestampClass = css`
  color: var(--chat-text);
  opacity: 0.58;
  font-size: 1.1rem;
  font-weight: 800;
`;

const forumScopeTagClass = css`
  display: inline-flex;
  align-items: center;
  min-height: 1.75rem;
  border: 1px solid rgba(148, 163, 184, 0.36);
  border-radius: 999px;
  background: #f8fafc;
  color: #334155;
  padding: 0.18rem 0.58rem;
  max-width: 14rem;
  overflow: hidden;
  text-overflow: ellipsis;
  font: inherit;
  font-size: 1.1rem;
  line-height: 1.2;
  font-weight: 900;
  white-space: nowrap;
  &.branch {
    border-color: rgba(65, 140, 235, 0.34);
    background: rgba(65, 140, 235, 0.08);
    color: #1d4ed8;
  }
  &.clickable {
    cursor: pointer;
  }
  &.clickable:hover {
    border-color: rgba(65, 140, 235, 0.56);
    background: rgba(65, 140, 235, 0.14);
  }
  @media (max-width: ${mobileMaxWidth}) {
    max-width: 10.5rem;
  }
`;

const forumPostActionsClass = css`
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
`;

const forumPostBodyClass = css`
  color: #111827;
  line-height: 1.45;
  white-space: pre-wrap;
  word-break: break-word;
`;

const forumReplyContextClass = css`
  border-left: 0.22rem solid rgba(100, 116, 139, 0.42);
  padding: 0.08rem 0 0.08rem 0.55rem;
  display: flex;
  flex-direction: column;
  gap: 0.14rem;
  color: var(--chat-text);
  max-width: 100%;
`;

const forumReplyContextLabelClass = css`
  min-width: 0;
  display: inline-flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 0;
  color: #334155;
  font-size: 1rem;
  font-weight: 800;
  line-height: 1.2;
`;

const forumReplyContextUsernameClass = css`
  font-size: 1rem;
  font-weight: 900;
`;

const forumReplyContextBodyClass = css`
  display: -webkit-box;
  color: #4b5563;
  font-size: 1.1rem;
  font-weight: 700;
  line-height: 1.25;
  opacity: 0.72;
  overflow: hidden;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  word-break: break-word;
`;

const forumReplyTargetClass = css`
  border: 1px solid rgba(65, 140, 235, 0.28);
  border-radius: 8px;
  background: rgba(65, 140, 235, 0.06);
  padding: 0.55rem 0.65rem;
  display: flex;
  flex-direction: column;
  gap: 0.24rem;
`;

const forumReplyTargetHeaderClass = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.55rem;
  color: var(--chat-text);
  font-size: 1.05rem;
  font-weight: 900;
`;

const forumReplyTargetPreviewClass = css`
  color: var(--chat-text);
  opacity: 0.72;
  font-size: 1.05rem;
  font-weight: 750;
  line-height: 1.25;
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
`;

const forumReplyTargetClearClass = css`
  border: 0;
  background: transparent;
  color: var(--chat-text);
  cursor: pointer;
  opacity: 0.62;
  padding: 0.2rem;
  font-size: 1.05rem;
  line-height: 1;
  &:hover {
    opacity: 1;
  }
`;

const forumTitleInputClass = css`
  width: 100%;
  border: 1px solid var(--ui-border);
  border-radius: 8px;
  padding: 0.65rem;
  font: inherit;
  font-weight: 900;
  &:focus {
    outline: 2px solid rgba(65, 140, 235, 0.24);
    border-color: rgba(65, 140, 235, 0.55);
  }
`;

const forumThreadButtonClass = css`
  width: 100%;
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 8px;
  background: #fff;
  padding: 0.75rem;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.75rem;
  text-align: left;
  color: var(--chat-text);
  cursor: pointer;
  &:hover {
    border-color: rgba(65, 140, 235, 0.42);
    background: rgba(65, 140, 235, 0.06);
  }
  &.recent {
    border-color: rgba(34, 197, 94, 0.48);
    background: rgba(34, 197, 94, 0.07);
    box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.12);
  }
`;

const forumThreadMainClass = css`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
`;

const forumThreadTitleClass = css`
  font-size: 1.1rem;
  font-weight: 900;
  line-height: 1.25;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  overflow-wrap: anywhere;
  word-break: break-word;
`;

const forumThreadDetailTitleClass = css`
  font-size: 1.1rem;
  font-weight: 900;
  line-height: 1.25;
  overflow-wrap: anywhere;
  word-break: break-word;
`;

const forumThreadPreviewClass = css`
  color: var(--chat-text);
  opacity: 0.72;
  font-weight: 700;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const forumThreadMetaClass = css`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-wrap: wrap;
  color: var(--chat-text);
  opacity: 0.62;
  font-size: 1.1rem;
  font-weight: 800;
`;

const forumThreadCountClass = css`
  align-self: start;
  border: 1px solid rgba(148, 163, 184, 0.34);
  border-radius: 999px;
  background: rgba(248, 250, 252, 0.9);
  color: var(--chat-text);
  padding: 0.3rem 0.55rem;
  font-size: 1.1rem;
  font-weight: 900;
  white-space: nowrap;
`;

const forumThreadPostedClass = css`
  align-self: start;
  border: 1px solid rgba(34, 197, 94, 0.38);
  border-radius: 999px;
  background: rgba(34, 197, 94, 0.1);
  color: #15803d;
  padding: 0.3rem 0.55rem;
  font-size: 1.1rem;
  font-weight: 900;
  white-space: nowrap;
`;

const forumDetailHeaderClass = css`
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
`;

const forumBackButtonClass = css`
  border: 1px solid rgba(148, 163, 184, 0.34);
  border-radius: 999px;
  background: #fff;
  color: var(--chat-text);
  padding: 0.4rem 0.7rem;
  font-weight: 900;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  cursor: pointer;
  align-self: flex-start;
  &:hover {
    border-color: rgba(65, 140, 235, 0.42);
    background: rgba(65, 140, 235, 0.08);
  }
`;

const textareaClass = css`
  width: 100%;
  min-height: 3.8rem;
  resize: vertical;
  border: 1px solid var(--ui-border);
  border-radius: 8px;
  padding: 0.65rem;
  font: inherit;
  &:focus {
    outline: 2px solid rgba(65, 140, 235, 0.24);
    border-color: rgba(65, 140, 235, 0.55);
  }
`;

const errorClass = css`
  color: #be123c;
  font-weight: 800;
  font-size: 1.1rem;
`;

export default function Forum({
  actionLoading,
  bodyInput,
  canModerate,
  error,
  loading,
  recentlyCreatedThreadId,
  replyInput,
  replyTarget,
  replies,
  selectedThread,
  showScopeTags,
  threads,
  titleInput,
  userId,
  onBackToThreads,
  onBodyInputChange,
  onCreateReply,
  onCreateThread,
  onDeleteReply,
  onDeleteThread,
  onOpenThreadBranch,
  onOpenThread,
  onReplyInputChange,
  onReplyTargetChange,
  onTitleInputChange
}: {
  actionLoading: string;
  bodyInput: string;
  canModerate: boolean;
  error: string;
  loading: boolean;
  recentlyCreatedThreadId: number;
  replyInput: string;
  replyTarget: BuildForumReply | null;
  replies: BuildForumReply[];
  selectedThread: BuildForumThread | null;
  showScopeTags: boolean;
  threads: BuildForumThread[];
  titleInput: string;
  userId: number | string | null;
  onBackToThreads: () => void;
  onBodyInputChange: (value: string) => void;
  onCreateReply: () => void;
  onCreateThread: () => void;
  onDeleteReply: (replyId: number) => void;
  onDeleteThread: (threadId: number) => void;
  onOpenThreadBranch: (thread: BuildForumThread) => void;
  onOpenThread: (threadId: number) => void;
  onReplyInputChange: (value: string) => void;
  onReplyTargetChange: (reply: BuildForumReply | null) => void;
  onTitleInputChange: (value: string) => void;
}) {
  if (selectedThread) {
    return (
      <ThreadDetail
        actionLoading={actionLoading}
        canModerate={canModerate}
        error={error}
        replyInput={replyInput}
        replyTarget={replyTarget}
        replies={replies}
        selectedThread={selectedThread}
        showScopeTags={showScopeTags}
        userId={userId}
        onBackToThreads={onBackToThreads}
        onCreateReply={onCreateReply}
        onDeleteReply={onDeleteReply}
        onDeleteThread={onDeleteThread}
        onOpenThreadBranch={onOpenThreadBranch}
        onReplyInputChange={onReplyInputChange}
        onReplyTargetChange={onReplyTargetChange}
      />
    );
  }
  return (
    <ThreadList
      actionLoading={actionLoading}
      bodyInput={bodyInput}
      canModerate={canModerate}
      error={error}
      loading={loading}
      recentlyCreatedThreadId={recentlyCreatedThreadId}
      showScopeTags={showScopeTags}
      threads={threads}
      titleInput={titleInput}
      userId={userId}
      onBodyInputChange={onBodyInputChange}
      onCreateThread={onCreateThread}
      onDeleteThread={onDeleteThread}
      onOpenThreadBranch={onOpenThreadBranch}
      onOpenThread={onOpenThread}
      onTitleInputChange={onTitleInputChange}
    />
  );
}

function ThreadDetail({
  actionLoading,
  canModerate,
  error,
  replyInput,
  replyTarget,
  replies,
  selectedThread,
  showScopeTags,
  userId,
  onBackToThreads,
  onCreateReply,
  onDeleteReply,
  onDeleteThread,
  onOpenThreadBranch,
  onReplyInputChange,
  onReplyTargetChange
}: {
  actionLoading: string;
  canModerate: boolean;
  error: string;
  replyInput: string;
  replyTarget: BuildForumReply | null;
  replies: BuildForumReply[];
  selectedThread: BuildForumThread;
  showScopeTags: boolean;
  userId: number | string | null;
  onBackToThreads: () => void;
  onCreateReply: () => void;
  onDeleteReply: (replyId: number) => void;
  onDeleteThread: (threadId: number) => void;
  onOpenThreadBranch: (thread: BuildForumThread) => void;
  onReplyInputChange: (value: string) => void;
  onReplyTargetChange: (reply: BuildForumReply | null) => void;
}) {
  const threadUser = getForumUser(selectedThread);
  const replyTargetUser = replyTarget ? getForumUser(replyTarget) : null;
  return (
    <div className={detailClass}>
      <div className={forumDetailHeaderClass}>
        <button
          type="button"
          className={forumBackButtonClass}
          onClick={onBackToThreads}
        >
          <Icon icon="arrow-left" />
          Topics
        </button>
        <div className={forumPostClass}>
          <ProfilePic
            className={forumAvatarClass}
            userId={threadUser.id}
            profilePicUrl={threadUser.profilePicUrl}
          />
          <div className={forumPostMainClass}>
            <div className={forumPostHeaderClass}>
              <div className={forumAuthorMetaClass}>
                <strong className={forumThreadDetailTitleClass}>
                  {selectedThread.title}
                </strong>
                <div className={forumThreadMetaClass}>
                  {showScopeTags ? (
                    <ForumScopeTag
                      thread={selectedThread}
                      onOpenThreadBranch={onOpenThreadBranch}
                    />
                  ) : null}
                  <span
                    onClick={(event) => event.stopPropagation()}
                    onKeyDown={(event) => event.stopPropagation()}
                  >
                    <UsernameText
                      className={forumUsernameClass}
                      user={threadUser}
                    />
                  </span>
                  {selectedThread.createdAt ? (
                    <>
                      <span>·</span>
                      <span>{timeSince(selectedThread.createdAt)}</span>
                    </>
                  ) : null}
                </div>
              </div>
              {userCanDeleteForumItem({
                item: selectedThread,
                userId,
                canModerate
              }) ? (
                <div className={forumPostActionsClass}>
                  <GameCTAButton
                    variant="neutral"
                    size="sm"
                    icon="trash-alt"
                    loading={
                      actionLoading === `delete-thread-${selectedThread.id}`
                    }
                    disabled={Boolean(actionLoading)}
                    onClick={() => onDeleteThread(selectedThread.id)}
                  />
                </div>
              ) : null}
            </div>
            {selectedThread.body ? (
              <div className={forumPostBodyClass}>{selectedThread.body}</div>
            ) : null}
          </div>
        </div>
      </div>
      <div className={rowClass}>
        <strong>Replies</strong>
        <span className={mutedTextClass}>
          {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
        </span>
      </div>
      <div className={forumPostListClass}>
        {replies.length === 0 ? (
          <span className={mutedTextClass}>No replies yet.</span>
        ) : (
          replies.map((reply) => (
            <ForumReply
              key={reply.id}
              actionLoading={actionLoading}
              canModerate={canModerate}
              reply={reply}
              userId={userId}
              onDeleteReply={onDeleteReply}
              onReplyToReply={onReplyTargetChange}
            />
          ))
        )}
      </div>
      <div className={forumComposerClass}>
        <div className={forumComposerTitleClass}>
          <Icon icon="reply" />
          Reply
        </div>
        {replyTarget && replyTargetUser ? (
          <div className={forumReplyTargetClass}>
            <div className={forumReplyTargetHeaderClass}>
              <span>
                Replying to{' '}
                <UsernameText
                  className={forumUsernameClass}
                  user={replyTargetUser}
                />
              </span>
              <button
                type="button"
                className={forumReplyTargetClearClass}
                onClick={() => onReplyTargetChange(null)}
              >
                <Icon icon="times" />
              </button>
            </div>
            <div className={forumReplyTargetPreviewClass}>
              {replyTarget.body}
            </div>
          </div>
        ) : null}
        <Textarea
          className={textareaClass}
          value={replyInput}
          onChange={(event) => onReplyInputChange(event.target.value)}
          placeholder="Add a reply..."
          minRows={2}
          maxRows={8}
        />
        <div className={forumActionsClass}>
          {error ? <span className={errorClass}>{error}</span> : null}
          <GameCTAButton
            variant="logoBlue"
            size="sm"
            icon="reply"
            loading={actionLoading === 'create-reply'}
            disabled={!replyInput.trim() || Boolean(actionLoading)}
            onClick={onCreateReply}
          >
            Reply
          </GameCTAButton>
        </div>
      </div>
    </div>
  );
}

function ThreadList({
  actionLoading,
  bodyInput,
  canModerate,
  error,
  loading,
  recentlyCreatedThreadId,
  showScopeTags,
  threads,
  titleInput,
  userId,
  onBodyInputChange,
  onCreateThread,
  onDeleteThread,
  onOpenThreadBranch,
  onOpenThread,
  onTitleInputChange
}: {
  actionLoading: string;
  bodyInput: string;
  canModerate: boolean;
  error: string;
  loading: boolean;
  recentlyCreatedThreadId: number;
  showScopeTags: boolean;
  threads: BuildForumThread[];
  titleInput: string;
  userId: number | string | null;
  onBodyInputChange: (value: string) => void;
  onCreateThread: () => void;
  onDeleteThread: (threadId: number) => void;
  onOpenThreadBranch: (thread: BuildForumThread) => void;
  onOpenThread: (threadId: number) => void;
  onTitleInputChange: (value: string) => void;
}) {
  return (
    <div className={detailClass}>
      <div className={rowClass}>
        <strong>Team Forum</strong>
        <span className={mutedTextClass}>
          {threads.length} {threads.length === 1 ? 'topic' : 'topics'}
        </span>
        {loading ? <span className={mutedTextClass}>Loading...</span> : null}
      </div>
      <div className={forumComposerClass}>
        <div className={forumComposerTitleClass}>
          <Icon icon="comments" />
          New topic
        </div>
        <input
          className={forumTitleInputClass}
          value={titleInput}
          onChange={(event) => onTitleInputChange(event.target.value)}
          placeholder="Topic title"
        />
        <Textarea
          className={textareaClass}
          value={bodyInput}
          onChange={(event) => onBodyInputChange(event.target.value)}
          placeholder="Optional details..."
          minRows={3}
          maxRows={10}
        />
        <div className={forumActionsClass}>
          {error ? <span className={errorClass}>{error}</span> : null}
          <GameCTAButton
            variant="logoBlue"
            size="sm"
            icon="comment"
            loading={actionLoading === 'create-thread'}
            disabled={!titleInput.trim() || Boolean(actionLoading)}
            onClick={onCreateThread}
          >
            Post Topic
          </GameCTAButton>
        </div>
      </div>
      <div className={listClass}>
        {threads.length === 0 ? (
          <span className={mutedTextClass}>No topics yet.</span>
        ) : (
          threads.map((thread) => (
            <ForumThread
              key={thread.id}
              actionLoading={actionLoading}
              canModerate={canModerate}
              recentlyCreated={
                Number(thread.id) === Number(recentlyCreatedThreadId)
              }
              thread={thread}
              userId={userId}
              onDeleteThread={onDeleteThread}
              onOpenThreadBranch={onOpenThreadBranch}
              onOpenThread={onOpenThread}
              showScopeTags={showScopeTags}
            />
          ))
        )}
      </div>
    </div>
  );
}

function ForumThread({
  actionLoading,
  canModerate,
  recentlyCreated,
  thread,
  userId,
  onDeleteThread,
  onOpenThread,
  onOpenThreadBranch,
  showScopeTags
}: {
  actionLoading: string;
  canModerate: boolean;
  recentlyCreated: boolean;
  thread: BuildForumThread;
  userId: number | string | null;
  onDeleteThread: (threadId: number) => void;
  onOpenThread: (threadId: number) => void;
  onOpenThreadBranch: (thread: BuildForumThread) => void;
  showScopeTags: boolean;
}) {
  const threadUser = getForumUser(thread);
  const canDeleteThread = userCanDeleteForumItem({
    item: thread,
    userId,
    canModerate
  });
  return (
    <div
      className={`${forumThreadButtonClass}${recentlyCreated ? ' recent' : ''}`}
      role="button"
      tabIndex={0}
      onClick={() => onOpenThread(thread.id)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpenThread(thread.id);
        }
      }}
    >
      <div className={forumThreadMainClass}>
        <span className={forumThreadTitleClass}>{thread.title}</span>
        {thread.body ? (
          <span className={forumThreadPreviewClass}>{thread.body}</span>
        ) : null}
        <div className={forumThreadMetaClass}>
          {showScopeTags ? (
            <ForumScopeTag
              thread={thread}
              onOpenThreadBranch={onOpenThreadBranch}
            />
          ) : null}
          <span
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <UsernameText className={forumUsernameClass} user={threadUser} />
          </span>
          {thread.createdAt ? (
            <>
              <span>·</span>
              <span>{timeSince(thread.createdAt)}</span>
            </>
          ) : null}
          {thread.lastReplyAt &&
          Number(thread.lastReplyAt) !== Number(thread.createdAt || 0) ? (
            <>
              <span>·</span>
              <span>active {timeSince(thread.lastReplyAt)}</span>
            </>
          ) : null}
        </div>
      </div>
      <div className={rowClass}>
        {recentlyCreated ? (
          <span className={forumThreadPostedClass}>Posted</span>
        ) : null}
        <span className={forumThreadCountClass}>
          {Number(thread.replyCount || 0)}{' '}
          {Number(thread.replyCount || 0) === 1 ? 'reply' : 'replies'}
        </span>
        {canDeleteThread ? (
          <span
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <GameCTAButton
              variant="neutral"
              size="sm"
              icon="trash-alt"
              loading={actionLoading === `delete-thread-${thread.id}`}
              disabled={Boolean(actionLoading)}
              onClick={() => onDeleteThread(thread.id)}
            />
          </span>
        ) : null}
      </div>
    </div>
  );
}

function ForumReply({
  actionLoading,
  canModerate,
  reply,
  userId,
  onDeleteReply,
  onReplyToReply
}: {
  actionLoading: string;
  canModerate: boolean;
  reply: BuildForumReply;
  userId: number | string | null;
  onDeleteReply: (replyId: number) => void;
  onReplyToReply: (reply: BuildForumReply) => void;
}) {
  const replyUser = getForumUser(reply);
  const replyToUser = getReplyTargetUser(reply);
  const canReplyToReply = Number(reply.userId || 0) !== Number(userId || 0);
  return (
    <article className={forumPostClass}>
      <ProfilePic
        className={forumAvatarClass}
        userId={replyUser.id}
        profilePicUrl={replyUser.profilePicUrl}
      />
      <div className={forumPostMainClass}>
        <div className={forumPostHeaderClass}>
          <div className={forumAuthorMetaClass}>
            <UsernameText className={forumUsernameClass} user={replyUser} />
            {reply.createdAt ? (
              <span className={forumTimestampClass}>
                {timeSince(reply.createdAt)}
              </span>
            ) : null}
          </div>
          {canReplyToReply ||
          userCanDeleteForumItem({ item: reply, userId, canModerate }) ? (
            <div className={forumPostActionsClass}>
              {canReplyToReply ? (
                <GameCTAButton
                  variant="neutral"
                  size="sm"
                  icon="reply"
                  disabled={Boolean(actionLoading)}
                  onClick={() => onReplyToReply(reply)}
                />
              ) : null}
              {userCanDeleteForumItem({ item: reply, userId, canModerate }) ? (
                <GameCTAButton
                  variant="neutral"
                  size="sm"
                  icon="trash-alt"
                  loading={actionLoading === `delete-reply-${reply.id}`}
                  disabled={Boolean(actionLoading)}
                  onClick={() => onDeleteReply(reply.id)}
                />
              ) : null}
            </div>
          ) : null}
        </div>
        {replyToUser ? (
          <div className={forumReplyContextClass}>
            <div className={forumReplyContextLabelClass}>
              Replying to @
              <UsernameText
                className={forumReplyContextUsernameClass}
                user={replyToUser}
              />
            </div>
            {reply.replyToBody ? (
              <div className={forumReplyContextBodyClass}>
                {reply.replyToBody}
              </div>
            ) : null}
          </div>
        ) : null}
        <div className={forumPostBodyClass}>{reply.body}</div>
      </div>
    </article>
  );
}

function userCanDeleteForumItem({
  item,
  userId,
  canModerate
}: {
  item: { userId: number };
  userId: number | string | null;
  canModerate: boolean;
}) {
  return Number(item.userId) === Number(userId) || canModerate;
}

function getForumUser(
  item: Pick<
    BuildForumThread | BuildForumReply,
    'userId' | 'username' | 'profilePicUrl'
  >
): User {
  return {
    id: Number(item.userId || 0),
    username: item.username || 'User',
    profilePicUrl: item.profilePicUrl || ''
  };
}

function ForumScopeTag({
  thread,
  onOpenThreadBranch
}: {
  thread: BuildForumThread;
  onOpenThreadBranch: (thread: BuildForumThread) => void;
}) {
  const branchId = getForumThreadBranchId(thread);
  const label = getForumThreadScopeLabel(thread);
  if (!branchId) {
    return <span className={forumScopeTagClass}>Main</span>;
  }
  const branchTitle = getForumThreadBranchTitle(thread);
  const branchNumber = getForumThreadBranchNumber(thread);
  const title = branchTitle || label;
  if (branchNumber <= 0) {
    return (
      <span className={`${forumScopeTagClass} branch`} title={title}>
        {label}
      </span>
    );
  }
  return (
    <button
      type="button"
      className={`${forumScopeTagClass} branch clickable`}
      title={title}
      aria-label={`Open ${label}`}
      onClick={(event) => {
        event.stopPropagation();
        onOpenThreadBranch(thread);
      }}
      onKeyDown={(event) => event.stopPropagation()}
    >
      {label}
    </button>
  );
}

function getForumThreadBranchId(thread: BuildForumThread) {
  return Number(thread.branchId || 0) || Number(thread.contributionBuildId || 0);
}

function getForumThreadBranchNumber(thread: BuildForumThread) {
  return Math.max(
    0,
    Math.floor(Number(thread.branchContributionBranchNumber || 0))
  );
}

function getForumThreadScopeLabel(thread: BuildForumThread) {
  if (!getForumThreadBranchId(thread)) return 'Main';
  const branchTitle = getForumThreadBranchTitle(thread);
  if (branchTitle) return branchTitle;
  const branchNumber = getForumThreadBranchNumber(thread);
  if (branchNumber > 0) return `Branch ${branchNumber}`;
  return 'Branch';
}

function getForumThreadBranchTitle(thread: BuildForumThread) {
  return getBuildBranchDisplayTitle({
    title: thread.branchTitle || '',
    username: thread.branchContributorUsername || '',
    contributionBranchNumber: getForumThreadBranchNumber(thread),
    contributionStatus: thread.branchContributionStatus || 'draft'
  });
}

function getReplyTargetUser(reply: BuildForumReply): User | null {
  const userId = Number(reply.replyToUserId || 0);
  if (!userId) return null;
  return {
    id: userId,
    profilePicUrl: reply.replyToProfilePicUrl || '',
    username: reply.replyToUsername || ''
  };
}
