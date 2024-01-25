import React, { useState } from 'react';
import { css } from '@emotion/css';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';
import Icon from '~/components/Icon';

const getThemeStyles = (theme: string) => {
  const themeColors: Record<string, any> = {
    logoBlue: { bg: Color.logoBlue(), text: '#fff' },
    green: { bg: Color.green(), text: '#fff' },
    orange: { bg: Color.orange(), text: '#fff' },
    rose: { bg: Color.rose(), text: '#fff' },
    pink: { bg: Color.pink(), text: '#fff' },
    purple: { bg: Color.purple(), text: '#fff' },
    black: { bg: Color.black(), text: '#fff' },
    red: { bg: Color.red(), text: '#fff' },
    darkBlue: { bg: Color.darkBlue(), text: '#fff' },
    vantaBlack: { bg: Color.vantaBlack(), text: '#fff' },
    gold: { bg: Color.gold(), text: '#fff' }
  };

  return themeColors[theme] || { bg: Color.gray(), text: '#000' };
};

export default function ChatFilterBar({
  canChangeTopic,
  themeColor = 'logoBlue',
  topic
}: {
  canChangeTopic: boolean;
  themeColor: string;
  topic: string;
}) {
  const [selectedTab, setSelectedTab] = useState('All');
  const themeStyles = getThemeStyles(themeColor);

  const tabLabelStyle = css`
    margin: 0 10px;
    font-weight: bold;
  `;

  const handleTabClick = (tabName: string) => {
    setSelectedTab(tabName);
  };

  return (
    <div
      className={css`
        display: flex;
        height: 4rem;
        align-items: center;
        font-size: 1.5rem;
        gap: 1.5rem;
        @media (max-width: ${mobileMaxWidth}) {
          font-size: 1.2rem;
        }
      `}
    >
      <div
        className={css`
          height: 100%;
          padding: 0 1.2rem;
          border-radius: ${borderRadius};
          display: flex;
          align-items: center;
          background: #fff;
          cursor: pointer;
          box-shadow: 2px 2px 5px #d1d1d1, -2px -2px 5px #ffffff;
          ${selectedTab === 'All'
            ? `background-color: ${themeStyles.bg};`
            : ''};
          ${selectedTab === 'All' ? `color: ${themeStyles.text};` : ''};
          @media (max-width: ${mobileMaxWidth}) {
            padding: 0;
            border-radius: 4px;
          }
        `}
        onClick={() => handleTabClick('All')}
      >
        <span className={tabLabelStyle}>All</span>
      </div>
      <div
        className={css`
          height: 100%;
          border-radius: ${borderRadius};
          display: flex;
          align-items: center;
          background: #fff;
          cursor: pointer;
          box-shadow: 2px 2px 5px #d1d1d1, -2px -2px 5px #ffffff;
          @media (max-width: ${mobileMaxWidth}) {
            border-radius: 4px;
          }
        `}
      >
        <div
          className={css`
            display: flex;
            align-items: center;
            padding: 0 1.2rem;
          `}
        >
          <Icon
            icon="arrow-left"
            className={css`
              &:hover {
                color: #007bff;
              }
            `}
          />
          <Icon
            icon="arrow-right"
            className={css`
              margin-left: 0.5rem;
              &:hover {
                color: #007bff;
              }
            `}
          />
        </div>
        <div
          onClick={() => handleTabClick('Topic')}
          className={css`
            background: #fff;
            height: 100%;
            display: flex;
            align-items: center;
            ${selectedTab === 'Topic'
              ? `background-color: ${themeStyles.bg};`
              : ''}
            ${selectedTab === 'Topic' ? `color: ${themeStyles.text};` : ''}
          `}
        >
          <span className={tabLabelStyle}>{topic || 'Topics'}</span>
        </div>
        {canChangeTopic && (
          <div
            className={css`
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100%;
              padding: 0 1.2rem;
              &:hover {
                color: #007bff;
              }
            `}
          >
            <Icon icon="caret-down" />
          </div>
        )}
      </div>
    </div>
  );
}
