import PropTypes from 'prop-types';
import Chess from '../Chess';
import { css } from '@emotion/css';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';
import Icon from '~/components/Icon';

TargetChessPosition.propTypes = {
  chessState: PropTypes.object.isRequired,
  channelId: PropTypes.number.isRequired,
  gameState: PropTypes.object.isRequired,
  lastChessMessageId: PropTypes.number.isRequired,
  messageId: PropTypes.number,
  myId: PropTypes.number.isRequired,
  userId: PropTypes.number.isRequired,
  username: PropTypes.string.isRequired,
  onCancelRewindRequest: PropTypes.func.isRequired,
  onAcceptRewind: PropTypes.func.isRequired,
  onDeclineRewind: PropTypes.func.isRequired,
  onRequestRewind: PropTypes.func.isRequired
};

export default function TargetChessPosition({
  chessState,
  channelId,
  gameState,
  lastChessMessageId,
  messageId,
  myId,
  userId,
  username,
  onCancelRewindRequest,
  onAcceptRewind,
  onDeclineRewind,
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
        messageId={messageId}
        channelId={channelId}
        initialState={chessState}
        onCancelRewindRequest={onCancelRewindRequest}
        onAcceptRewind={onAcceptRewind}
        onDeclineRewind={onDeclineRewind}
        rewindRequestId={gameState.rewindRequestId}
        senderId={userId}
        senderName={username}
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
              <Icon icon="clock-rotate-left" />
              <span style={{ marginLeft: '1rem' }}>
                Propose a new game from here
              </span>
            </span>
          </div>
        )}
    </div>
  );
}
