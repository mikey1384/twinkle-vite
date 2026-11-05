import React from 'react';
import { css } from '@emotion/css';

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
`;

export default function PublishedUpdateNotice({
  updating,
  onUpdate,
  onLater
}: {
  updating: boolean;
  onUpdate: () => void;
  onLater: () => void;
}) {
  return (
    <div className={noticeClass} role="status" aria-live="polite">
      <p><strong>New update available</strong> Save your work before updating.</p>
      <div className="actions">
        <button type="button" onClick={onLater} disabled={updating}>Later</button>
        <button type="button" className="update" onClick={onUpdate} disabled={updating}>
          {updating ? 'Updating…' : 'Update'}
        </button>
      </div>
    </div>
  );
}
