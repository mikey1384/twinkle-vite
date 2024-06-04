import React, { useMemo } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import Icon from '~/components/Icon';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';

export default function PinnedTopics({
  featuredTopicId,
  channelName,
  displayedThemeColor,
  topicObj,
  lastTopicId
}: {
  featuredTopicId: number;
  channelName: string;
  displayedThemeColor: string;
  topicObj: Record<string, any>;
  lastTopicId: number;
}) {
  const featuredTopic = useMemo(() => {
    return topicObj?.[featuredTopicId] || null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [featuredTopicId, topicObj?.[featuredTopicId]]);
  const lastTopic = useMemo(() => {
    return topicObj?.[lastTopicId] && lastTopicId !== featuredTopicId
      ? topicObj?.[lastTopicId]
      : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [featuredTopicId, lastTopicId, topicObj?.[lastTopicId]]);

  return (
    <ErrorBoundary componentPath="Chat/LeftMenu/Subchannels">
      <div
        className={css`
          overflow-x: hidden;
          a {
            &:hover {
              text-decoration: none;
            }
          }
          nav {
            color: ${Color.darkerGray()};
            cursor: pointer;
            width: 100%;
            padding: 0.7rem 2.5rem;
            text-align: left;
            font-size: 1.4rem;
            font-family: Helvetica;
            &:hover {
              background: ${Color.checkboxAreaGray()};
            }
            &.active {
              color: ${Color.vantaBlack()};
              background: ${Color.highlightGray()};
            }
            @media (max-width: ${mobileMaxWidth}) {
              padding: 0.7rem 1rem;
              font-size: 1.2rem;
            }
          }
        `}
        style={{
          border: `1px solid ${Color[displayedThemeColor](0.5)}`,
          padding: '0.5rem 0',
          marginTop: '2rem',
          marginLeft: '1rem',
          marginRight: '1rem',
          marginBottom: '-1rem',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <nav style={{ display: 'flex', alignItems: 'center' }}>
          <Icon icon="home" />
          <div
            style={{
              marginLeft: '1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexGrow: 1
            }}
          >
            <div>{channelName}</div>
          </div>
        </nav>
        {featuredTopic && (
          <nav
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.7rem 2.5rem'
            }}
          >
            <Icon icon="star" />
            <div
              style={{
                marginLeft: '1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexGrow: 1
              }}
            >
              <div>{featuredTopic.content}</div>
            </div>
          </nav>
        )}
        {lastTopic && (
          <nav
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.7rem 2.5rem'
            }}
          >
            <Icon icon="left-to-line" />
            <div
              style={{
                marginLeft: '1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexGrow: 1
              }}
            >
              <div>{lastTopic.content}</div>
            </div>
          </nav>
        )}
      </div>
    </ErrorBoundary>
  );
}
