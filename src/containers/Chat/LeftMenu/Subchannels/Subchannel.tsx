import React, { useMemo } from 'react';
import Icon from '~/components/Icon';
import ErrorBoundary from '~/components/ErrorBoundary';
import { Color } from '~/constants/css';
import { useKeyContext } from '~/contexts';
import { Link } from 'react-router-dom';

export default function Subchannel({
  chatUnreadColor,
  currentPathId,
  selectedChannelId,
  subchannel,
  subchannelPath = '',
  onUpdateLastSubchannelPath
}: {
  chatUnreadColor: string;
  currentPathId: string | number;
  selectedChannelId: number;
  subchannel: any;
  subchannelPath?: string;
  onUpdateLastSubchannelPath: ({
    channelId,
    path,
    currentSubchannelPath
  }: {
    channelId: number;
    path: string;
    currentSubchannelPath: string;
  }) => void;
}) {
  const userId = useKeyContext((v) => v.myState.userId);
  const subchannelSelected = useMemo(
    () => subchannelPath === subchannel.path,
    [subchannel.path, subchannelPath]
  );

  const lastMessage = useMemo(() => {
    const lastMessageId = subchannel?.messageIds?.[0];
    return subchannel?.messagesObj?.[lastMessageId];
  }, [subchannel?.messageIds, subchannel?.messagesObj]);
  const numUnreads = useMemo(() => subchannel?.numUnreads || 0, [subchannel]);
  const badgeShown = useMemo(() => {
    return (
      !subchannelSelected &&
      numUnreads > 0 &&
      lastMessage?.sender?.id !== userId
    );
  }, [lastMessage?.sender?.id, numUnreads, subchannelSelected, userId]);

  return (
    <ErrorBoundary componentPath="Chat/LeftMenu/Subchannels/Subchannel">
      <Link
        key={subchannel.id}
        to={`/chat/${currentPathId}/${subchannel.path}`}
        onClick={() =>
          onUpdateLastSubchannelPath({
            channelId: selectedChannelId,
            path: subchannel.path,
            currentSubchannelPath: subchannelPath
          })
        }
      >
        <nav
          style={{
            display: 'flex',
            alignItems: 'center'
          }}
          className={subchannelSelected ? 'active' : ''}
        >
          <Icon icon={subchannel.icon} />
          <div
            style={{
              marginLeft: '1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexGrow: 1
            }}
          >
            <div>{subchannel.label}</div>
            {badgeShown && (
              <div
                style={{
                  background: Color[chatUnreadColor]?.(),
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
    </ErrorBoundary>
  );
}
