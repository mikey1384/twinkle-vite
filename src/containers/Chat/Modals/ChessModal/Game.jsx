import { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Color } from '~/constants/css';
import { useAppContext } from '~/contexts';
import Chess from '../../Chess';

Game.propTypes = {
  boardState: PropTypes.object,
  countdownNumber: PropTypes.number,
  channelId: PropTypes.number,
  currentChannel: PropTypes.object,
  initialState: PropTypes.object,
  message: PropTypes.object,
  myId: PropTypes.number,
  newChessState: PropTypes.object,
  onSetInitialState: PropTypes.func,
  onSetMessage: PropTypes.func,
  onSetNewChessState: PropTypes.func,
  onSetUserMadeLastMove: PropTypes.func,
  onSpoilerClick: PropTypes.func,
  onUpdateLastChessMoveViewerId: PropTypes.func,
  opponentId: PropTypes.number,
  opponentName: PropTypes.string,
  rewindRequestId: PropTypes.number,
  setChessMoveViewTimeStamp: PropTypes.func,
  userMadeLastMove: PropTypes.bool
};

export default function Game({
  boardState,
  countdownNumber,
  channelId,
  currentChannel,
  initialState,
  message,
  myId,
  newChessState,
  onSetInitialState,
  onSetMessage,
  onSetNewChessState,
  onSetUserMadeLastMove,
  onSpoilerClick,
  onUpdateLastChessMoveViewerId,
  opponentId,
  opponentName,
  rewindRequestId,
  setChessMoveViewTimeStamp,
  userMadeLastMove
}) {
  const fetchCurrentChessState = useAppContext(
    (v) => v.requestHelpers.fetchCurrentChessState
  );
  const [uploaderId, setUploaderId] = useState();
  const [loaded, setLoaded] = useState(false);
  const loading = useRef(null);
  useEffect(() => {
    init();
    async function init() {
      loading.current = true;
      const chessMessage = await fetchCurrentChessState({
        channelId,
        recentChessMessage: currentChannel.recentChessMessage
      });
      onSetUserMadeLastMove(chessMessage?.userId === myId);
      onSetMessage(chessMessage);
      setUploaderId(chessMessage?.userId);
      onSetInitialState(chessMessage?.chessState);
      loading.current = false;
      setLoaded(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rewindRequestId]);

  const spoilerOff = useMemo(() => {
    if (typeof countdownNumber === 'number') {
      return true;
    }
    const userIsTheLastMoveViewer =
      currentChannel.lastChessMoveViewerId === myId;
    return (
      (!loading.current && !initialState) ||
      !!userMadeLastMove ||
      userIsTheLastMoveViewer ||
      message.id < currentChannel.lastChessMessageId
    );
  }, [
    countdownNumber,
    currentChannel.lastChessMessageId,
    currentChannel.lastChessMoveViewerId,
    initialState,
    message.id,
    myId,
    userMadeLastMove
  ]);

  return (
    <div
      style={{
        borderTop: rewindRequestId ? 'none' : `1px solid ${Color.borderGray()}`,
        backgroundColor: Color.lightGray(),
        position: 'relative',
        width: '100%'
      }}
    >
      <Chess
        isFromModal
        channelId={channelId}
        countdownNumber={countdownNumber}
        interactable={!boardState?.isDraw}
        initialState={initialState}
        loaded={loaded}
        myId={myId}
        newChessState={newChessState}
        onChessMove={onSetNewChessState}
        opponentId={opponentId}
        opponentName={opponentName}
        senderId={uploaderId}
        spoilerOff={spoilerOff}
        onSpoilerClick={handleSpoilerClick}
      />
    </div>
  );

  async function handleSpoilerClick() {
    try {
      await setChessMoveViewTimeStamp({ channelId, message });
      onUpdateLastChessMoveViewerId({
        channelId,
        viewerId: myId
      });
      onSpoilerClick(message.userId);
    } catch (error) {
      console.error(error);
    }
  }
}
