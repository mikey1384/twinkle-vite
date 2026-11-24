import React from 'react';
import { css } from '@emotion/css';

// "New version · Reload": a newer save of this draft or branch is ready and
// the viewer is using the app, so it waits for their tap
// (hooks/usePreviewSaveFollow.ts).
const pillClass = css`
  position: absolute;
  z-index: 200;
  top: calc(env(safe-area-inset-top, 0px) + 12px);
  left: 50%;
  transform: translateX(-50%);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 44px;
  padding: 0 18px;
  border: 1px solid #285d9e;
  border-radius: 999px;
  background: #285d9e;
  color: #fff;
  box-shadow: 0 4px 14px rgba(20, 35, 61, 0.28);
  font: inherit;
  font-size: 15px;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;
  animation: preview-saved-pill-in 180ms ease-out;

  .dot {
    opacity: 0.75;
  }
  &:hover {
    background: #1f4c84;
  }
  &:focus-visible {
    outline: 3px solid #f2b73a;
    outline-offset: 2px;
  }

  @keyframes preview-saved-pill-in {
    from {
      opacity: 0;
      transform: translate(-50%, -6px);
    }
    to {
      opacity: 1;
      transform: translate(-50%, 0);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

// Build Studio: over the whole workspace, below the site header.
const fixedClass = css`
  position: fixed;
  top: calc(var(--app-shell-top-offset, 0px) + 12px);
  z-index: 1000;
`;

export default function PreviewSavedVersionPill({
  onReload,
  placement = 'absolute'
}: {
  onReload: () => void;
  placement?: 'absolute' | 'fixed';
}) {
  return (
    <button
      type="button"
      className={placement === 'fixed' ? `${pillClass} ${fixedClass}` : pillClass}
      aria-label="New version saved. Reload"
      onClick={onReload}
    >
      New version <span className="dot" aria-hidden="true">·</span> Reload
    </button>
  );
}
