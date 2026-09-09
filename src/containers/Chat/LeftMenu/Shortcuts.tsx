import React, { useEffect, useId, useRef, useState } from 'react';
import { css } from '@emotion/css';
import { useLocation } from 'react-router-dom';
import Icon from '~/components/Icon';
import { useOutsideClick } from '~/helpers/hooks';

export default function Shortcuts({ children }: { children: React.ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const contentId = useId();
  const { pathname } = useLocation();
  useOutsideClick(rootRef, () => setExpanded(false), { enabled: expanded });
  useEffect(() => setExpanded(false), [pathname]);

  return (
    <div ref={rootRef} onKeyDown={(event) => {
      if (event.key === 'Escape' && expanded) {
        event.stopPropagation();
        setExpanded(false);
        buttonRef.current?.focus();
      }
    }}>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={expanded}
        aria-controls={contentId}
        onClick={() => setExpanded((current) => !current)}
        className={css`
          display: none;
          @media (max-height: 700px) {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 0.5rem;
            width: 100%;
            min-height: 44px;
            padding: 0.8rem 1rem;
            border: 0;
            border-bottom: 1px solid var(--chat-panel-border, #e2e8f0);
            border-radius: var(--chat-panel-radius, 14px) var(--chat-panel-radius, 14px) 0 0;
            background: transparent;
            color: #475569;
            font-size: 14px;
            cursor: pointer;
            &:hover { background: #e8eaed; }
            &:focus-visible { outline: 2px solid #64748b; outline-offset: -2px; }
          }
        `}
      >
        Shortcuts
        <Icon icon="chevron-down" style={{ transform: expanded ? 'rotate(180deg)' : undefined }} />
      </button>
      <div
        id={contentId}
        className={css`
          @media (max-height: 700px) {
            display: ${expanded ? 'block' : 'none'};
            position: absolute;
            top: 100%;
            left: 0;
            width: max(100%, 200px);
            max-height: min(60vh, 36rem);
            overflow-y: auto;
            overscroll-behavior-y: contain;
            scrollbar-width: thin;
            border-radius: 0 0 10px 10px;
            border: 1px solid var(--chat-panel-border, #e2e8f0);
            background: var(--chat-side-bg, #f8fafc);
            box-shadow: 0 8px 20px rgba(15, 23, 42, 0.12);
          }
        `}
      >
        {children}
      </div>
    </div>
  );
}
