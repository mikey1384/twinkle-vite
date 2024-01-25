import React from 'react';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';

export default function ChatFilterBar({
  canChangeTopic,
  topic
}: {
  canChangeTopic: boolean;
  topic: string;
}) {
  return (
    <div className={filterBarStyle}>
      <div className={tabStyle}>
        <div className={tabLabelStyle}>All</div>
      </div>
      <div className={tabStyle}>
        <Icon icon="arrow-back" />
        <div className={tabLabelStyle}>{topic}</div>
        <Icon icon="arrow-forward" />
      </div>
      {canChangeTopic && (
        <div className={optionsStyle}>
          <Icon icon="arrow-down" />
        </div>
      )}
    </div>
  );
}

// Emotion CSS
const filterBarStyle = css`
  display: flex;
  align-items: center;
  background: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 10px;
  border-radius: 8px;
`;

const tabStyle = css`
  display: flex;
  align-items: center;
  margin-right: 20px;
  cursor: pointer;
  &:hover {
    color: #007bff;
  }
`;

const tabLabelStyle = css`
  margin: 0 10px;
  font-size: 16px;
  font-weight: bold;
`;

const optionsStyle = css`
  margin-left: auto;
  display: flex;
  align-items: center;
  cursor: pointer;
`;
