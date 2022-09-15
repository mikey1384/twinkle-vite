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
  const badgeShown = useMemo(() => {
    return (
      !subchannelSelected &&
      subchannel?.numUnreads > 0 &&
      lastMessage?.sender?.id !== userId
    );
  }, [
    lastMessage?.sender?.id,
    subchannel?.numUnreads,
    subchannelSelected,
    userId
  ]);
  const badgeWidth = useMemo(() => {
    const numDigits = subchannel?.numUnreads?.toString?.()?.length || 1;
    if (numDigits === 1) {
      return '2rem';
    }
    return `${Math.min(numDigits, 4)}.5rem`;
  }, [subchannel?.numUnreads]);

  return (
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
      <nav className={subchannelSelected ? 'active' : ''}>
        <Icon icon={subchannel.icon} />
        <span style={{ marginLeft: '1rem' }}>{subchannel.label}</span>
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
      </nav>
    </Link>
  );
}
