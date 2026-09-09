import React, { memo, useMemo } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import Icon from '~/components/Icon';
import Subchannel from './Subchannel';
import { Link } from 'react-router-dom';
import { css, cx } from '@emotion/css';
import { Color } from '~/constants/css';
import { useAppContext, useChatContext } from '~/contexts';
import { useRoleColor } from '~/theme/hooks/useRoleColor';
import { resolveColorValue } from '~/theme/resolveColor';
import { chatSubnavRowClass } from '../../containers';
import { contextGroupClass, contextRowClass } from '../styles';

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
        className={cx(css`
          margin-top: 1rem;
          border: 1px solid var(--chat-panel-border, ${borderColor});
          border-radius: 10px;
          padding: 0.5rem 0;
          margin-inline: 1rem;
          display: flex;
          flex-direction: column;
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
        `, contextGroupClass)}
      >
        <Link
          title="Main (Wordle)"
          className={cx(chatSubnavRowClass, contextRowClass, !subchannelPath && 'active')}
          aria-current={!subchannelPath ? 'page' : undefined}
          onClick={() =>
            onUpdateLastSubchannelPath({
              channelId: selectedChannelId,
              path: ''
            })
          }
          to={`/chat/${currentPathId}`}
        >
            <Icon icon="home" />
              <span className="chat-context-label">
                Main (Wordle)
              </span>
              {badgeShown && (
                <div
                  role="img"
                  aria-label="Unread messages"
                  style={{
                    background: chatUnreadColor,
                    display: 'flex',
                    color: '#fff',
                    fontWeight: 'bold',
                    minWidth: '1.1rem',
                    flexShrink: 0,
                    height: '1.1rem',
                    borderRadius: '50%',
                    lineHeight: 1,
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                />
              )}
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
