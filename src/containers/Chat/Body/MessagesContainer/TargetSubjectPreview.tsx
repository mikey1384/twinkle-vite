import React from 'react';
import Icon from '~/components/Icon';
import { defaultChatSubject } from '~/constants/defaultValues';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';

export default function TargetSubjectPreview({
  legacyTopicObj,
  onClose
}: {
  legacyTopicObj: any;
  onClose: any;
}) {
  return (
    <div
      role="region"
      aria-label="Replying to topic"
      style={{
        height: '8rem',
        width: '100%',
        position: 'relative',
        padding: '0.5rem 0 1rem',
        marginBottom: '2px'
      }}
    >
      <button
        type="button"
        aria-label="Cancel topic reply"
        className={css`
          position: absolute;
          right: 0.6rem;
          top: 1rem;
          width: 3.2rem;
          height: 3.2rem;
          display: grid;
          place-items: center;
          color: var(--chat-muted-text, #64748b);
          background: transparent;
          border: 0;
          border-radius: 8px;
          cursor: pointer;
          &:hover {
            background: var(--chat-hover-bg, #edf2f8);
          }
          &:focus-visible {
            outline: 2px solid var(--chat-focus-ring, #475569);
          }
          @media (max-width: ${mobileMaxWidth}) {
            width: 44px;
            height: 44px;
            top: 4px;
            right: 0;
          }
        `}
        onClick={onClose}
      >
        <Icon icon="times" />
      </button>
      <div
        style={{
          padding: '0.5rem max(44px, 4.2rem) 0.5rem 1rem',
          height: '100%',
          width: '100%',
          minWidth: 0,
          background: 'var(--chat-panel-bg, #fff)',
          border: '1px solid var(--chat-panel-border, #e2e8f0)',
          borderLeft: '3px solid var(--theme-bg, #418ceb)',
          borderRadius: '10px',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <span
          style={{
            fontSize: 'max(11px, 1.1rem)',
            fontWeight: 600,
            lineHeight: 1.3,
            color: 'var(--chat-muted-text, #64748b)'
          }}
        >
          Replying to topic
        </span>
        <div
          className={css`
            min-height: 0;
            overflow-y: auto;
            overflow-x: hidden;
            overflow-wrap: anywhere;
            scrollbar-width: thin;
            overscroll-behavior: contain;
            font-size: max(13px, 1.3rem);
          `}
        >
          {legacyTopicObj?.content || defaultChatSubject}
        </div>
      </div>
    </div>
  );
}
