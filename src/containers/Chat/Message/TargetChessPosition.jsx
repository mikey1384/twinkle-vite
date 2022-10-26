import PropTypes from 'prop-types';
import Chess from '../Chess';
import { borderRadius, Color } from '~/constants/css';

TargetChessPosition.propTypes = {
  chessState: PropTypes.object.isRequired,
  channelId: PropTypes.number.isRequired
};

export default function TargetChessPosition({ chessState, channelId }) {
  return (
    <div
      style={{
        width: '100%',
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
        channelId={channelId}
        initialState={chessState}
        style={{ marginTop: '1rem', width: '100%' }}
      />
    </div>
  );
}
