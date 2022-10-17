import { useMemo } from 'react';
import PropTypes from 'prop-types';
import Icon from '~/components/Icon';
import { Color } from '~/constants/css';
import { useKeyContext } from '~/contexts';
import { Link } from 'react-router-dom';

Subchannel.propTypes = {
  currentPathId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  selectedChannelId: PropTypes.number,
  subchannel: PropTypes.object.isRequired,
  subchannelPath: PropTypes.string,
  onUpdateLastSubchannelPath: PropTypes.func.isRequired
};

export default function Subchannel({
  currentPathId,
  selectedChannelId,
  subchannel,
  subchannelPath,
  onUpdateLastSubchannelPath
}) {
  const { userId } = useKeyContext((v) => v.myState);
  const subchannelSelected = useMemo(
    () => subchannelPath === subchannel.path,
    [subchannel.path, subchannelPath]
  );

  const lastMessage = useMemo(() => {
    const lastMessageId = subchannel?.messageIds[0];
    return subchannel?.messagesObj[lastMessageId];
  }, [subchannel?.messageIds, subchannel?.messagesObj]);
  const numUnreads = useMemo(() => subchannel?.numUnreads || 0, [subchannel]);
  const badgeShown = useMemo(() => {
    return (
      !subchannelSelected &&
      numUnreads > 0 &&
      lastMessage?.sender?.id !== userId
    );
  }, [lastMessage?.sender?.id, numUnreads, subchannelSelected, userId]);
  const badgeWidth = useMemo(() => {
    const numDigits = numUnreads?.toString?.()?.length || 1;
    if (numDigits === 1) {
      return '2rem';
    }
    return `${Math.min(numDigits, 4)}.5rem`;
  }, [numUnreads]);

  return (
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
            flexGrow: 1
          }}
        >
          <div>{subchannel.label}</div>
          {badgeShown && (
            <div
              style={{
                background: Color.rose(),
                display: 'flex',
                color: '#fff',
                fontWeight: 'bold',
                fontSize: '1.5rem',
                minWidth: badgeWidth,
                height: '2rem',
                borderRadius: '1rem',
                lineHeight: 1,
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              {subchannel?.numUnreads}
            </div>
          )}
        </div>
      </nav>
    </Link>
  );
}
