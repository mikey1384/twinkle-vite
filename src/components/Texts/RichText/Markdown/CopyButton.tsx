import React from 'react';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';

function CopyButton({
  onCopy,
  isCopied
}: {
  onCopy: () => void;
  isCopied: boolean;
}) {
  return (
    <button
      onClick={onCopy}
      className={css`
        background: #24292e;
        border: none;
        color: #e1e4e8;
        padding: 5px 10px;
        border-radius: 6px;
        cursor: pointer;
        display: flex;
        align-items: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica,
          Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji';
        font-size: 12px;
        &:hover {
          background: rgba(149, 157, 165, 0.3);
        }
        @media (max-width: 600px) {
          font-size: 10px;
          padding: 3px 6px;
        }
      `}
    >
      {isCopied ? <Icon icon="check" /> : <Icon icon="copy" />}
      <span style={{ marginLeft: '5px' }}>{isCopied ? 'Copied!' : 'Copy'}</span>
    </button>
  );
}

export default CopyButton;
