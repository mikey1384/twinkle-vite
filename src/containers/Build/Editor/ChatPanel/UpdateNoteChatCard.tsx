import React, { useEffect, useState } from 'react';
import { css } from '@emotion/css';
import { Link } from 'react-router-dom';
import Textarea from '~/components/Texts/Textarea';
import { Color } from '~/constants/css';
import { WEBSITE_AGENT_UI_ATTRIBUTE } from '~/helpers/websiteAgentPage';
import { formatUpdateNoteLabel } from '~/helpers/buildUpdateNote';

// The card under Lumine's reply when the owner asked for an update note in
// the build chat. Nothing posts until the owner presses Post.

export const UPDATE_NOTE_CHAT_MAX_CHARS = 1500;

export interface UpdateNoteChatDraft {
  id: number;
  // where the draft was written: the chat, the add-note link, or the update
  // dialog (shown here when the page closed before it could be reviewed)
  source: 'chat' | 'link' | 'dialog';
  content: string;
  targetArtifactVersionId: number;
  updateNumber: number;
}

const cardClass = css`
  align-self: flex-start;
  box-sizing: border-box;
  width: min(100%, 52rem);
  max-width: 85%;
  padding: 0.85rem 1.05rem;
  border-radius: 12px;
  background: var(--chat-bg);
  color: var(--chat-text);
  border: 1px solid ${Color.logoBlue(0.35)};
  font-size: var(--build-workshop-message-font-size);
  line-height: 1.48;
  display: grid;
  gap: 0.65rem;
  @media (max-width: 480px) {
    max-width: 100%;
  }
`;

const titleClass = css`
  font-weight: 800;
  color: ${Color.logoBlue()};
`;

const buttonRowClass = css`
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  button {
    border-radius: 999px;
    padding: 0.5rem 0.9rem;
    font-size: var(--build-workshop-choice-font-size);
    font-weight: 800;
    cursor: pointer;
    &:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }
  }
  .post {
    border: 1px solid ${Color.green(0.24)};
    background: ${Color.green(0.12)};
    color: ${Color.green()};
  }
  .later {
    border: 1px solid rgba(148, 163, 184, 0.28);
    background: rgba(148, 163, 184, 0.1);
    color: #334155;
  }
`;

const mutedClass = css`
  color: ${Color.gray()};
`;

export default function UpdateNoteChatCard({
  draft,
  posting,
  error,
  posted,
  onPost,
  onDismiss
}: {
  draft: UpdateNoteChatDraft | null;
  posting: boolean;
  error: string;
  posted: { commentId: number; updateNumber: number } | null;
  onPost: (content: string) => void;
  onDismiss: () => void;
}) {
  const [text, setText] = useState(draft?.content || '');
  useEffect(() => {
    setText(draft?.content || '');
  }, [draft?.id, draft?.content]);

  if (posted) {
    return (
      <div {...{ [WEBSITE_AGENT_UI_ATTRIBUTE]: '' }} className={cardClass}>
        <div className={titleClass}>
          Update note posted · {formatUpdateNoteLabel(posted.updateNumber)}
        </div>
        <div>
          It's in your app's comments.{' '}
          {posted.commentId ? (
            <Link to={`/comments/${posted.commentId}`}>See it</Link>
          ) : null}
        </div>
      </div>
    );
  }
  if (!draft) return null;
  const trimmed = text.trim();
  return (
    // A choice the owner makes: Zero and Ciel never tap it for them.
    <div {...{ [WEBSITE_AGENT_UI_ATTRIBUTE]: '' }} className={cardClass}>
      <div className={titleClass}>
        {draft.source === 'chat' ? 'Update note' : 'Your note is ready'} ·{' '}
        {formatUpdateNoteLabel(draft.updateNumber)}
      </div>
      <Textarea
        aria-label="Update note"
        value={text}
        minRows={3}
        maxRows={8}
        maxLength={UPDATE_NOTE_CHAT_MAX_CHARS}
        disabled={posting}
        onChange={(event) => setText(event.target.value)}
      />
      {error ? <div className={mutedClass}>{error}</div> : null}
      <div className={buttonRowClass}>
        <button
          type="button"
          className="post"
          disabled={posting || !trimmed}
          aria-busy={posting || undefined}
          onClick={() => onPost(trimmed)}
        >
          {posting ? 'Posting…' : 'Post'}
        </button>
        <button
          type="button"
          className="later"
          disabled={posting}
          onClick={onDismiss}
        >
          Not now
        </button>
      </div>
    </div>
  );
}
