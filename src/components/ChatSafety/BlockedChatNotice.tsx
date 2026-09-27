import React, { useLayoutEffect, useRef, useState } from 'react';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import BlockUserModal from './BlockUserModal';

// Replaces the message box in a direct chat with someone you blocked. The
// server refuses messages both ways, so an input here could only fail.
export default function BlockedChatNotice({
  user,
  onHeightChange
}: {
  user: { id: number; username: string };
  // The chat sizes its message list around the composer's reported height.
  onHeightChange?: (height: number) => void;
}) {
  const [unblockModalShown, setUnblockModalShown] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const onHeightChangeRef = useRef(onHeightChange);
  onHeightChangeRef.current = onHeightChange;

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || !onHeightChangeRef.current) return;
    function report() {
      if (!root) return;
      const composer = root.parentElement;
      const style = composer ? getComputedStyle(composer) : null;
      const chrome = style
        ? parseFloat(style.paddingTop) +
          parseFloat(style.paddingBottom) +
          parseFloat(style.borderTopWidth)
        : 0;
      onHeightChangeRef.current?.(Math.ceil(root.offsetHeight + chrome));
    }
    report();
    const observer = new ResizeObserver(report);
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={rootRef} role="status" className={noticeClass}>
      <div className={textClass}>
        <Icon icon="ban" />
        <span>
          You blocked <b>{user.username}</b>. Neither of you can send messages
          here.
        </span>
      </div>
      <button
        type="button"
        className={buttonClass}
        onClick={() => setUnblockModalShown(true)}
      >
        Unblock
      </button>
      {unblockModalShown && (
        <BlockUserModal
          user={user}
          mode="unblock"
          onHide={() => setUnblockModalShown(false)}
        />
      )}
    </div>
  );
}

const noticeClass = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.2rem;
  flex-wrap: wrap;
  box-sizing: border-box;
  width: 100%;
  padding: 0.2rem 0.4rem;
  color: #334155;
  font-size: 1.5rem;
  line-height: 1.45;
`;

const textClass = css`
  display: flex;
  align-items: center;
  gap: 0.9rem;
  min-width: 0;
  flex: 1 1 20rem;
  svg {
    flex: 0 0 auto;
    color: #b42318;
  }
`;

const buttonClass = css`
  appearance: none;
  flex: 0 0 auto;
  min-height: 44px;
  padding: 0.6rem 1.6rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #fff;
  color: #1e293b;
  font: inherit;
  font-size: 1.4rem;
  font-weight: 700;
  cursor: pointer;
  touch-action: manipulation;
  &:hover {
    background: #f1f5f9;
  }
  &:focus-visible {
    outline: 2px solid #334155;
    outline-offset: 1px;
  }
`;
