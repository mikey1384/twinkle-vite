import PropTypes from 'prop-types';
import Chess from '../Chess';
import { borderRadius, Color } from '~/constants/css';

TargetChessPosition.propTypes = {
  chessState: PropTypes.object.isRequired,
  channelId: PropTypes.number.isRequired,
  myId: PropTypes.number.isRequired
};

export default function TargetChessPosition({ chessState, channelId, myId }) {
  return (
    <div
      style={{
        width: '100%',
        position: 'relative',
        marginTop: '0.5rem',
        marginBottom: '1rem',
        padding: '1rem',
        border: `1px solid ${Color.lightGray()}`,
        background: Color.wellGray(),
        display: 'flex',
        justifyContent: 'space-between',
        borderRadius
      }}
    >
      <Chess
        loaded
        myId={myId}
        channelId={channelId}
        initialState={chessState}
        style={{ width: '100%' }}
      />
      <div style={{ position: 'absolute', bottom: '1rem', right: '1rem' }}>
        menu is here
      </div>
    </div>
  );
}
