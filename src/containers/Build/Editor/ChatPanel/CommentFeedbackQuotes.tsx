import React from 'react';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import type { BuildCommentFeedback } from '~/helpers/buildCommentFeedback';

export default function CommentFeedbackQuotes({
  feedback,
  disabled,
  onRemove
}: {
  feedback: BuildCommentFeedback[];
  disabled: boolean;
  onRemove: (commentId: number) => void;
}) {
  if (!feedback.length) return null;
  return (
    <div aria-label="App feedback attached" className={quotesClass}>
      {feedback.map((entry) => (
        <div
          key={`${entry.buildId}:${entry.comment.id}`}
          className={quoteClass}
        >
          <div className="feedback-heading">
            <a
              href={`/comments/${entry.comment.id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Icon icon="comment-alt" />
              <span>
                {entry.comment.username} · {entry.buildTitle}
              </span>
            </a>
            <button
              type="button"
              aria-label={`Remove feedback from ${entry.comment.username}`}
              disabled={disabled}
              onClick={() => onRemove(entry.comment.id)}
            >
              <Icon icon="xmark" />
            </button>
          </div>
          {entry.parentComment ? (
            <div className="feedback-parent">
              Original comment · {entry.parentComment.username}:{' '}
              {entry.parentComment.content || entry.parentComment.fileName}
            </div>
          ) : null}
          <div className="feedback-text">
            {entry.comment.content || entry.comment.fileName}
          </div>
          {entry.comment.content && entry.comment.fileName ? (
            <div className="feedback-parent">
              <Icon icon="paperclip" /> {entry.comment.fileName}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

const quotesClass = css`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 16rem;
  overflow-y: auto;
  margin-bottom: 0.65rem;
`;
const quoteClass = css`
  border-left: 3px solid #9dbbe8;
  border-radius: 4px;
  padding: 0.45rem 0.65rem;
  background: #f3f6fb;
  color: #38506f;
  font-size: max(12px, 1.2rem);
  line-height: 1.5;
  overflow-wrap: anywhere;
  .feedback-heading {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    a {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex: 1;
      min-width: 0;
      color: inherit;
      font-weight: 600;
      span {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      svg {
        flex-shrink: 0;
      }
    }
    button {
      flex-shrink: 0;
      display: grid;
      place-items: center;
      width: max(28px, 2.8rem);
      height: max(28px, 2.8rem);
      border: 0;
      border-radius: 4px;
      background: transparent;
      color: inherit;
      cursor: pointer;
      &:hover:not(:disabled) {
        background: #e3ebf7;
      }
      &:focus-visible {
        outline: 2px solid #75a3f6;
      }
      &:disabled {
        opacity: 0.5;
        cursor: default;
      }
    }
  }
  .feedback-text,
  .feedback-parent {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
    white-space: pre-wrap;
  }
  .feedback-parent {
    color: #64748b;
    -webkit-line-clamp: 1;
    margin-bottom: 0.2rem;
  }
`;
