import PropTypes from 'prop-types';
import Chess from '../../Chess';
import Icon from '~/components/Icon';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';

ChessTarget.propTypes = {
  myId: PropTypes.number.isRequired,
  channelId: PropTypes.number.isRequired,
  chessTarget: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired
};

export default function ChessTarget({ myId, channelId, chessTarget, onClose }) {
  return (
    <div
      className={css`
        height: 509px;
        @media (max-width: ${mobileMaxWidth}) {
          height: 317px;
        }
      `}
      style={{ position: 'relative' }}
    >
      <Icon
        icon="times"
        size="lg"
        style={{
          position: 'absolute',
          right: '1.7rem',
          zIndex: 1,
          top: 'CALC(50% - 2rem)',
          cursor: 'pointer'
        }}
        onClick={onClose}
      />
      <Chess
        loaded
        myId={myId}
        channelId={channelId}
        initialState={chessTarget}
        style={{ width: '100%' }}
      />
    </div>
  );
}
