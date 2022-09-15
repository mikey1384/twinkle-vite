import PropTypes from 'prop-types';
import Icon from '~/components/Icon';
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
      <nav className={subchannelPath === subchannel.path ? 'active' : ''}>
        <Icon icon={subchannel.icon} />
        <span style={{ marginLeft: '1rem' }}>{subchannel.label}</span>
      </nav>
    </Link>
  );
}
