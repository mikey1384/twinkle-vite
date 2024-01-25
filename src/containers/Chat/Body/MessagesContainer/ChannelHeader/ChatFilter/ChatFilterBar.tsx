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
    <div
      className={css`
        display: flex;
        align-items: center;
        padding: 10px;
        gap: 10px;
      `}
    >
      <div className={neumorphicButtonStyle} role="button">
        <div className={tabLabelStyle}>All</div>
      </div>
      <div className={neumorphicButtonStyle} role="button">
        <div
          className={css`
            display: flex;
            align-items: center;
            margin-right: 10px;
          `}
        >
          <Icon icon="arrow-left" className={navButtonStyle} />
          <Icon
            icon="arrow-right"
            className={`${navButtonStyle} ${css`
              margin-left: 0.5rem;
            `}`}
          />
        </div>
        <div className={tabLabelStyle}>{topic}</div>
        {canChangeTopic && (
          <Icon icon="caret-down" className={navButtonStyle} />
        )}
      </div>
    </div>
  );
}

const neumorphicButtonStyle = css`
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 8px;
  padding: 10px 15px;
  cursor: pointer;
  box-shadow: 2px 2px 5px #d1d1d1, -2px -2px 5px #ffffff;
`;

const navButtonStyle = css`
  &:hover {
    color: #007bff;
  }
`;

const tabLabelStyle = css`
  margin: 0 10px;
  font-size: 16px;
  font-weight: bold;
  &:hover {
    color: #007bff;
  }
`;
