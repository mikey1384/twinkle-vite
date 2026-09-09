import React, { useMemo } from 'react';
import Icon from '~/components/Icon';
import ErrorBoundary from '~/components/ErrorBoundary';
import { Link } from 'react-router-dom';
import { canonicalUnreadBadgeIsShown } from '~/helpers/chatUnreadProjection';
import { cx } from '@emotion/css';
import { chatSubnavRowClass } from '../../containers';
import { contextRowClass } from '../styles';

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
    path
  }: {
    channelId: number;
    path: string;
  }) => void;
}) {
  const subchannelSelected = useMemo(
    () => subchannelPath === subchannel.path,
    [subchannel.path, subchannelPath]
  );

  const numUnreads = useMemo(() => subchannel?.numUnreads || 0, [subchannel]);
  // An active subchannel is the scope being read, so its badge is not useful as
  // a navigation cue. The canonical count remains untouched until the writer
  // confirms the read acknowledgement.
  const badgeShown =
    !subchannelSelected && canonicalUnreadBadgeIsShown(numUnreads);

  return (
    <ErrorBoundary componentPath="Chat/LeftMenu/Subchannels/Subchannel">
      <Link
        key={subchannel.id}
        title={subchannel.label}
        className={cx(chatSubnavRowClass, contextRowClass, subchannelSelected && 'active')}
        aria-current={subchannelSelected ? 'page' : undefined}
        to={`/chat/${currentPathId}/${subchannel.path}`}
        onClick={() =>
          onUpdateLastSubchannelPath({
            channelId: selectedChannelId,
            path: subchannel.path
          })
        }
      >
          <Icon icon={subchannel.icon} />
            <span className="chat-context-label">
              {subchannel.label}
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
    </ErrorBoundary>
  );
}
