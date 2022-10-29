import PropTypes from 'prop-types';
import Chess from '../Chess';
import { css } from '@emotion/css';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';

TargetChessPosition.propTypes = {
  chessState: PropTypes.object.isRequired,
  channelId: PropTypes.number.isRequired,
  lastChessMessageId: PropTypes.number.isRequired,
  myId: PropTypes.number.isRequired,
  onRequestRewind: PropTypes.func.isRequired
};

export default function TargetChessPosition({
  chessState,
  channelId,
  lastChessMessageId,
  myId,
  onRequestRewind
}) {
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
      {!chessState.isRewindRequest &&
        Number(chessState.messageId) !== Number(lastChessMessageId) && (
          <div
            style={{
              position: 'absolute',
              bottom: '1rem',
              right: '1rem',
              border: `1px solid ${Color.black()}`,
              background: '#fff'
            }}
            className={`unselectable ${css`
              cursor: pointer;
              opacity: 0.8;
              padding: 1rem;
              color: ${Color.black()};
              &:hover {
                opacity: 1;
                color: ${Color.vantaBlack()};
              }
              @media (max-width: ${mobileMaxWidth}) {
                padding: 0.7rem;
                opacity: 1;
              }
            `}`}
            onClick={() =>
              onRequestRewind({ ...chessState, isRewindRequest: true })
            }
          >
            <span
              className={css`
                font-size: 1.7rem;
                font-weight: bold;
                @media (max-width: ${mobileMaxWidth}) {
                  font-size: 1.3rem;
                }
              `}
            >
              Propose a new game from here
            </span>
          </div>
        )}
    </div>
  );
}
