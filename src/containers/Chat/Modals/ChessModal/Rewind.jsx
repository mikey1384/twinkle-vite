import PropTypes from 'prop-types';
import Chess from '../../Chess';

Rewind.propTypes = {
  channelId: PropTypes.number.isRequired,
  initialState: PropTypes.object.isRequired,
  myId: PropTypes.number.isRequired
};

export default function Rewind({ channelId, initialState, myId }) {
  return (
    <div>
      <Chess
        loaded
        myId={myId}
        channelId={channelId}
        initialState={initialState}
        style={{ width: '100%' }}
      />
    </div>
  );
}
