import React, { memo, useMemo } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import Icon from '~/components/Icon';
import Subchannel from './Subchannel';
import { Link } from 'react-router-dom';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import { useAppContext, useChatContext } from '~/contexts';
import { useRoleColor } from '~/theme/hooks/useRoleColor';
import { resolveColorValue } from '~/theme/resolveColor';

function SubChannels({
  currentChannel,
  currentPathId,
  displayedThemeColor,
  selectedChannelId,
  subchannelIds,
  subchannelObj,
  subchannelPath
}: {
  currentChannel: any;
  currentPathId: string | number;
  displayedThemeColor: string;
  selectedChannelId: number;
  subchannelIds: number[];
  subchannelObj: any;
  subchannelPath?: string;
}) {
  const chatUnreadRole = useRoleColor('chatUnread', {
    fallback: 'logoBlue'
  });
  const reportError = useAppContext((v) => v.requestHelpers.reportError);
  const onUpdateLastSubchannelPath = useChatContext(
    (v) => v.actions.onUpdateLastSubchannelPath
  );
  const subchannels = useMemo(() => {
    const result = [];
    for (const subchannelId of subchannelIds) {
      const subchannel = subchannelObj[subchannelId];
      if (subchannel) {
        result.push(subchannel);
      }
    }
    if (result.length === 1) {
      reportError({
        componentPath: 'LeftMenu/Subchannels',
        message: `Only one subchannel in channel ${selectedChannelId}.\n\nSubchannelIds: ${JSON.stringify(
          subchannelIds
        )}\n\nSubchannelObj Keys: ${JSON.stringify(Object.keys(subchannelObj))}`
      });
    }
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChannelId, subchannelIds, subchannelObj]);
  const currentChannelNumUnreads = useMemo(() => {
    return currentChannel?.numUnreads || 0;
  }, [currentChannel?.numUnreads]);
  const badgeShown = useMemo(() => {
    return currentChannelNumUnreads > 0 && !!subchannelPath;
  }, [currentChannelNumUnreads, subchannelPath]);
  const chatUnreadColor = useMemo(
    () => chatUnreadRole.getColor() || Color.logoBlue(),
    [chatUnreadRole]
  );
  const borderColor = useMemo(
    () =>
      resolveColorValue(displayedThemeColor, 0.5) ??
      resolveColorValue('logoBlue', 0.5) ??
      Color.logoBlue(0.5),
    [displayedThemeColor]
  );

  return (
    <ErrorBoundary componentPath="Chat/LeftMenu/Subchannels">
      <div
        aria-label="Subchannels"
        tabIndex={0}
        className={css`
          margin-top: 1rem;
          flex: 0 1 auto;
          min-height: min(8rem, 35%);
          overflow-x: hidden;
          overflow-y: auto;
          overscroll-behavior-y: contain;
          scrollbar-width: thin;
          &:not(:last-child) {
            max-height: 45%;
          }
          a {
            flex-shrink: 0;
            &:hover {
              text-decoration: none;
            }
          }
          nav {
            color: ${Color.darkerGray()};
            cursor: pointer;
            width: 100%;
            padding: 0.7rem 1rem;
            text-align: left;
            font-size: 1.4rem;
            font-family: inherit;
            border-radius: 8px;
            -webkit-tap-highlight-color: transparent;
            touch-action: manipulation;
            @media (hover: hover) and (pointer: fine) {
              &:hover {
                background: var(--chat-hover-bg, ${Color.checkboxAreaGray()});
              }
            }
            &.active {
              color: #1e293b;
              font-weight: 600;
              background: var(--chat-title-bg, ${Color.highlightGray()});
            }
            @media (max-width: ${mobileMaxWidth}) {
              padding: 0.7rem 1rem;
              font-size: 1.2rem;
            }
          }
        `}
        style={{
          border: `1px solid var(--chat-panel-border, ${borderColor})`,
          borderRadius: '10px',
          padding: '0.5rem 0',
          marginLeft: '1rem',
          marginRight: '1rem',
          marginBottom: 0,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Link
          title="Main (Wordle)"
          aria-current={!subchannelPath ? 'page' : undefined}
          onClick={() =>
            onUpdateLastSubchannelPath({
              channelId: selectedChannelId,
              path: ''
            })
          }
          to={`/chat/${currentPathId}`}
        >
          <nav
            style={{ display: 'flex', alignItems: 'center' }}
            className={!subchannelPath ? 'active' : ''}
          >
            <Icon icon="home" />
            <div
              style={{
                marginLeft: '1rem',
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                alignItems: 'center',
                gap: '0.5rem',
                minWidth: 0,
                flexGrow: 1
              }}
            >
              <div
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                Main (Wordle)
              </div>
              {badgeShown && (
                <div
                  style={{
                    background: chatUnreadColor,
                    display: 'flex',
                    color: '#fff',
                    fontWeight: 'bold',
                    minWidth: '1.1rem',
                    height: '1.1rem',
                    borderRadius: '50%',
                    lineHeight: 1,
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                />
              )}
            </div>
          </nav>
        </Link>
        {subchannels.map((subchannel) => {
          return (
            <Subchannel
              key={subchannel.id}
              chatUnreadColor={chatUnreadColor}
              currentPathId={currentPathId}
              selectedChannelId={selectedChannelId}
              subchannel={subchannel}
              subchannelPath={subchannelPath}
              onUpdateLastSubchannelPath={onUpdateLastSubchannelPath}
            />
          );
        })}
      </div>
    </ErrorBoundary>
  );
}

export default memo(SubChannels);
