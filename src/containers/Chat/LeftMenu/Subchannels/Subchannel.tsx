import React, { useMemo } from 'react';
import Icon from '~/components/Icon';
import ErrorBoundary from '~/components/ErrorBoundary';
import { Link } from 'react-router-dom';
import { canonicalUnreadBadgeIsShown } from '~/helpers/chatUnreadProjection';

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
        to={`/chat/${currentPathId}/${subchannel.path}`}
        onClick={() =>
          onUpdateLastSubchannelPath({
            channelId: selectedChannelId,
            path: subchannel.path
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
              {subchannel.label}
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
    </ErrorBoundary>
  );
}
