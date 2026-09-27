import React from 'react';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';

// Stands in for a message from a member you blocked, in group chats only.
export default function BlockedMessageNotice({
  onShow
}: {
  onShow: () => void;
}) {
  return (
    <div data-blocked-message className={noticeClass}>
      <Icon icon="ban" />
      <span>Message from a blocked member</span>
      <button type="button" className={showButtonClass} onClick={onShow}>
        Show
      </button>
    </div>
  );
}

const noticeClass = css`
  display: flex;
  align-items: center;
  gap: 0.8rem;
  width: 100%;
  box-sizing: border-box;
  min-height: 44px;
  padding: 0.4rem 1rem 0.4rem 1.6rem;
  color: #64748b;
  font-size: 1.4rem;
  font-style: italic;
  svg {
    flex: 0 0 auto;
    font-size: 1.3rem;
  }
`;

const showButtonClass = css`
  appearance: none;
  min-height: 36px;
  min-width: 44px;
  padding: 0.3rem 1rem;
  border: 1px solid #dce3ed;
  border-radius: 8px;
  background: #fff;
  color: #334155;
  font: inherit;
  font-size: 1.3rem;
  font-style: normal;
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
