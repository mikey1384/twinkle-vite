import React, { useEffect, useRef } from 'react';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';

const workspaceClass = css`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: #fff;
`;
const backClass = css`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 0.7rem;
  min-height: 44px;
  padding: 1rem 1.4rem;
  border: 0;
  border-bottom: 1px solid #e3e7ef;
  background: #f8fafc;
  color: #1d4ed8;
  font: inherit;
  font-weight: 700;
  text-align: left;
  cursor: pointer;
  &:hover {
    background: #eef4ff;
  }
  &:focus-visible {
    outline: 2px solid #2563eb;
    outline-offset: -2px;
  }
`;

export default function RoadmapWorkspace({
  children,
  returnFocusRef,
  onClose
}: {
  children: React.ReactNode;
  returnFocusRef: React.RefObject<HTMLButtonElement | null>;
  onClose: () => void;
}) {
  const backRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const previous = returnFocusRef.current;
    backRef.current?.focus();
    return () => {
      if (previous instanceof HTMLElement && previous.isConnected)
        previous.focus();
    };
  }, [returnFocusRef]);
  return (
    <div
      className={workspaceClass}
      role="region"
      aria-label="Build plan workspace"
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.stopPropagation();
          onClose();
        }
      }}
    >
      <button
        ref={backRef}
        type="button"
        className={backClass}
        onClick={onClose}
      >
        <Icon icon="arrow-left" /> Back to conversation
      </button>
      {children}
    </div>
  );
}
