import React, { useState } from 'react';
import { css } from '@emotion/css';
import { Link } from 'react-router-dom';
import { formatUpdateNoteLabel } from '~/helpers/buildUpdateNote';
import type { BuildUpdateNote } from './hooks/useUpdateNote';

const noticeClass = css`
  position: absolute;
  z-index: 200;
  top: calc(env(safe-area-inset-top, 0px) + 12px);
  left: 50%;
  transform: translateX(-50%);
  box-sizing: border-box;
  width: min(480px, calc(100% - 24px));
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  border: 1px solid #b8c8e2;
  border-radius: 12px;
  background: #fff;
  color: #14233d;
  box-shadow: 0 6px 19px rgba(0, 0, 0, 0.2);
  font-size: 16px;
  line-height: 1.35;

  p { margin: 0; flex: 1 1 224px; }
  strong { display: block; }
  .actions { display: flex; gap: 8px; margin-left: auto; }
  button {
    min-height: 44px;
    padding: 7px 13px;
    border: 1px solid #355985;
    border-radius: 8px;
    background: #fff;
    color: #18385d;
    font: inherit;
    font-weight: 700;
    cursor: pointer;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
    -webkit-tap-highlight-color: transparent;
  }
  .update { background: #285d9e; border-color: #285d9e; color: #fff; }
  button:disabled { opacity: 0.65; cursor: default; }
  button:focus-visible { outline: 3px solid #f2b73a; outline-offset: 2px; }
  .whats-new {
    display: inline;
    min-height: 0;
    margin-left: 6px;
    padding: 0;
    border: 0;
    background: none;
    color: #285d9e;
    font-weight: 700;
    text-decoration: underline;
    text-underline-offset: 2px;
  }
  .note {
    flex: 1 1 100%;
    box-sizing: border-box;
    max-height: min(40vh, 260px);
    overflow-y: auto;
    padding: 10px 12px;
    border-radius: 8px;
    background: #f1f5fb;
    font-size: 15px;
  }
  .note-text { margin: 0; white-space: pre-wrap; overflow-wrap: anywhere; }
  .note-meta {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 6px;
    color: #4b5d78;
    font-size: 13px;
    font-weight: 700;
  }
  .note-meta a { color: #285d9e; }
`;

export default function PublishedUpdateNotice({
  updating,
  onUpdate,
  onLater,
  note = null,
  onWhatsNew,
  defaultNoteOpen = false
}: {
  updating: boolean;
  onUpdate: () => void;
  onLater: () => void;
  // The owner's update note for the new version; without one the notice is
  // exactly as before.
  note?: BuildUpdateNote | null;
  onWhatsNew?: () => void;
  defaultNoteOpen?: boolean;
}) {
  const [noteOpen, setNoteOpen] = useState(defaultNoteOpen);
  return (
    <div className={noticeClass} role="status" aria-live="polite">
      <p>
        <strong>New update available</strong> Save your work before updating.
        {note ? (
          <button
            type="button"
            className="whats-new"
            aria-expanded={noteOpen}
            onClick={() => {
              if (!noteOpen) onWhatsNew?.();
              setNoteOpen((open) => !open);
            }}
          >
            {noteOpen ? 'Hide' : "What's new"}
          </button>
        ) : null}
      </p>
      {note && noteOpen ? (
        <div className="note">
          <div className="note-meta">
            <span>
              {formatUpdateNoteLabel(note.updateNumber)}
              {note.username ? ` · ${note.username}` : ''}
            </span>
            <Link to={`/comments/${note.commentId}`}>Comments</Link>
          </div>
          <p className="note-text">{note.content}</p>
        </div>
      ) : null}
      <div className="actions">
        <button type="button" onClick={onLater} disabled={updating}>Later</button>
        <button type="button" className="update" onClick={onUpdate} disabled={updating}>
          {updating ? 'Updating…' : 'Update'}
        </button>
      </div>
    </div>
  );
}
