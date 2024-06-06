import React, { useMemo } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import Icon from '~/components/Icon';
import { css } from '@emotion/css';
import { useAppContext, useChatContext } from '~/contexts';
import { Color, mobileMaxWidth } from '~/constants/css';

export default function PinnedTopics({
  channelId,
  featuredTopicId,
  channelName,
  displayedThemeColor,
  topicObj,
  lastTopicId,
  selectedTab,
  selectedTopicId
}: {
  selectedTab: string;
  channelId: number;
  featuredTopicId: number;
  channelName: string;
  displayedThemeColor: string;
  topicObj: Record<string, any>;
  lastTopicId: number;
  selectedTopicId: number;
}) {
  const updateLastTopicId = useAppContext(
    (v) => v.requestHelpers.updateLastTopicId
  );
  const onEnterTopic = useChatContext((v) => v.actions.onEnterTopic);
  const onSetChannelState = useChatContext((v) => v.actions.onSetChannelState);
  const featuredTopic = useMemo(() => {
    if (!featuredTopicId) return null;
    return topicObj?.[featuredTopicId] || null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [featuredTopicId, topicObj?.[featuredTopicId]]);
  const lastTopic = useMemo(() => {
    if (!lastTopicId) return null;
    return topicObj?.[lastTopicId] && lastTopicId !== featuredTopicId
      ? topicObj?.[lastTopicId]
      : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [featuredTopicId, lastTopicId, topicObj?.[lastTopicId]]);

  if (!featuredTopic && !lastTopic) return null;

  return (
    <ErrorBoundary componentPath="Chat/LeftMenu/Subchannels">
      <div
        className={css`
          width: 100%;
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
        <nav
          style={{ display: 'flex', alignItems: 'center' }}
          className={selectedTab !== 'topic' ? 'active' : ''}
          onClick={handleMainNavClick}
        >
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
            style={{ display: 'flex', alignItems: 'center' }}
            className={
              selectedTab === 'topic' && selectedTopicId === featuredTopic.id
                ? 'active'
                : ''
            }
            onClick={() => handleTopicNavClick(featuredTopic.id)}
          >
            <Icon icon="star" />
            <div
              style={{
                width: 'CALC(100% - 1rem)',
                marginLeft: '1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexGrow: 1
              }}
            >
              <div
                style={{
                  width: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {featuredTopic.content}
              </div>
            </div>
          </nav>
        )}
        {lastTopic && (
          <nav
            style={{ display: 'flex', alignItems: 'center' }}
            className={
              selectedTab === 'topic' && selectedTopicId === lastTopic.id
                ? 'active'
                : ''
            }
            onClick={() => handleTopicNavClick(lastTopic.id)}
          >
            <Icon icon="left-to-line" />
            <div
              style={{
                width: 'CALC(100% - 1rem)',
                marginLeft: '1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexGrow: 1
              }}
            >
              <div
                style={{
                  width: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {lastTopic.content}
              </div>
            </div>
          </nav>
        )}
      </div>
    </ErrorBoundary>
  );

  function handleMainNavClick() {
    onSetChannelState({
      channelId,
      newState: { selectedTab: 'all' }
    });
  }

  function handleTopicNavClick(topicId: number) {
    updateLastTopicId({
      channelId,
      topicId
    });
    onEnterTopic({ channelId, topicId });
  }
}
