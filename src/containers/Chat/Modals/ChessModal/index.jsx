import { useRef, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import ConfirmModal from '~/components/Modals/ConfirmModal';
import Icon from '~/components/Icon';
import FilterBar from '~/components/FilterBar';
import ErrorBoundary from '~/components/ErrorBoundary';
import Game from './Game';
import Rewind from './Rewind';
import localize from '~/constants/localize';
import { socket } from '~/constants/io';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';
import { v1 as uuidv1 } from 'uuid';

const acceptDrawLabel = localize('acceptDraw');
const cancelMoveLabel = localize('cancelMove');
const chessLabel = localize('chess');
const closeLabel = localize('close');
const doneLabel = localize('done');
const offerDrawLabel = localize('offerDraw');
const offeredDrawLabel = localize('offeredDraw');
const resignLabel = localize('resign');
const abortLabel = localize('abort');
const abortChessMatchLabel = localize('abortChessMatch');
const resignChessMatchLabel = localize('resignChessMatch');
const startNewGameLabel = localize('startNewGame');

ChessModal.propTypes = {
  channelId: PropTypes.number,
  currentChannel: PropTypes.object,
  myId: PropTypes.number,
  onConfirmChessMove: PropTypes.func.isRequired,
  onHide: PropTypes.func.isRequired,
  countdownNumber: PropTypes.number,
  onSpoilerClick: PropTypes.func.isRequired,
  opponentId: PropTypes.number,
  opponentName: PropTypes.string,
  socketConnected: PropTypes.bool
};

export default function ChessModal({
  currentChannel,
  channelId,
  myId,
  onConfirmChessMove,
  onHide,
  countdownNumber,
  onSpoilerClick,
  opponentId,
  opponentName,
  socketConnected
}) {
  const [activeTab, setActiveTab] = useState('game');
  const [message, setMessage] = useState({});
  const { banned, userId, username, profilePicUrl } = useKeyContext(
    (v) => v.myState
  );
  const rewindRequestId = useMemo(
    () => currentChannel.gameState?.chess?.rewindRequestId,
    [currentChannel]
  );
  const {
    warning: { color: warningColor },
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);
  const setChessMoveViewTimeStamp = useAppContext(
    (v) => v.requestHelpers.setChessMoveViewTimeStamp
  );
  const onUpdateLastChessMoveViewerId = useChatContext(
    (v) => v.actions.onUpdateLastChessMoveViewerId
  );
  const onSubmitMessage = useChatContext((v) => v.actions.onSubmitMessage);
  const [initialState, setInitialState] = useState();
  const [newChessState, setNewChessState] = useState();
  const [confirmModalShown, setConfirmModalShown] = useState(false);
  const [userMadeLastMove, setUserMadeLastMove] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const boardState = useMemo(
    () => (initialState ? { ...initialState } : null),
    [initialState]
  );

  const gameFinished = useMemo(
    () =>
      boardState?.isCheckmate || boardState?.isStalemate || boardState?.isDraw,
    [boardState]
  );

  const gameEndButtonShown = useMemo(
    () =>
      !!boardState?.move?.number > 0 &&
      !newChessState &&
      !gameFinished &&
      !userMadeLastMove,
    [gameFinished, newChessState, boardState?.move?.number, userMadeLastMove]
  );

  const drawOffererId = useMemo(() => {
    if (currentChannel?.gameState?.chess?.drawOfferedBy) {
      return currentChannel.gameState.chess.drawOfferedBy;
    }
    return null;
  }, [currentChannel?.gameState?.chess?.drawOfferedBy]);

  const drawButtonShown = useMemo(() => {
    return (
      !drawOffererId &&
      !!boardState?.move?.number > 0 &&
      !newChessState &&
      !gameFinished &&
      userMadeLastMove
    );
  }, [
    drawOffererId,
    gameFinished,
    newChessState,
    boardState?.move?.number,
    userMadeLastMove
  ]);

  const drawOfferPending = useMemo(() => {
    return drawOffererId && drawOffererId !== myId;
  }, [drawOffererId, myId]);

  const isAbortable = useMemo(
    () => boardState?.move?.number < 4,
    [boardState?.move?.number]
  );

  return (
    <ErrorBoundary componentPath="ChessModal">
      <Modal large onHide={onHide}>
        <header style={{ padding: rewindRequestId ? '0' : '2rem' }}>
          {rewindRequestId ? (
            <FilterBar
              style={{
                marginBottom: 0
              }}
            >
              <nav
                className={activeTab === 'game' ? 'active' : null}
                onClick={() => setActiveTab('game')}
              >
                Chess
              </nav>
              <nav
                className={activeTab === 'rewind' ? 'active' : null}
                onClick={() => setActiveTab('rewind')}
              >
                Rewind Request
              </nav>
            </FilterBar>
          ) : (
            chessLabel
          )}
        </header>
        <main style={{ padding: 0 }}>
          {activeTab === 'game' ? (
            <Game
              boardState={boardState}
              channelId={channelId}
              countdownNumber={countdownNumber}
              currentChannel={currentChannel}
              initialState={initialState}
              message={message}
              myId={myId}
              newChessState={newChessState}
              onSetInitialState={setInitialState}
              onSetMessage={setMessage}
              onSetNewChessState={setNewChessState}
              onSetUserMadeLastMove={setUserMadeLastMove}
              onUpdateLastChessMoveViewerId={onUpdateLastChessMoveViewerId}
              onSpoilerClick={onSpoilerClick}
              opponentId={opponentId}
              opponentName={opponentName}
              rewindRequestId={rewindRequestId}
              setChessMoveViewTimeStamp={setChessMoveViewTimeStamp}
              userMadeLastMove={userMadeLastMove}
            />
          ) : (
            <Rewind />
          )}
        </main>
        <footer>
          {gameEndButtonShown && (
            <Button
              style={{ marginRight: '1rem' }}
              color={drawOfferPending || isAbortable ? 'orange' : 'red'}
              onClick={() => setConfirmModalShown(true)}
            >
              {drawOfferPending
                ? acceptDrawLabel
                : isAbortable
                ? abortLabel
                : resignLabel}
            </Button>
          )}
          {drawButtonShown ? (
            <Button
              style={{ marginRight: '1rem' }}
              color="orange"
              onClick={handleOfferDraw}
            >
              {offerDrawLabel}
            </Button>
          ) : null}
          <Button transparent onClick={onHide}>
            {closeLabel}
          </Button>
          {!!newChessState && (
            <Button
              style={{ marginLeft: '1rem' }}
              color={warningColor}
              onClick={() => setNewChessState(null)}
            >
              {cancelMoveLabel}
            </Button>
          )}
          {gameFinished ? (
            <Button
              style={{ marginLeft: '1rem' }}
              color="orange"
              onClick={() => {
                setUserMadeLastMove(false);
                setInitialState(null);
              }}
            >
              {startNewGameLabel}
            </Button>
          ) : !userMadeLastMove ? (
            <Button
              color={doneColor}
              style={{ marginLeft: '1rem' }}
              onClick={handleSubmitChessMove}
              disabled={
                !newChessState ||
                !socketConnected ||
                banned?.chess ||
                submitting
              }
            >
              {doneLabel}
              {(!socketConnected || submitting) && (
                <Icon style={{ marginLeft: '0.7rem' }} icon="spinner" pulse />
              )}
            </Button>
          ) : null}
        </footer>
        {confirmModalShown && (
          <ConfirmModal
            modalOverModal
            title={
              drawOfferPending
                ? acceptDrawLabel
                : isAbortable
                ? abortChessMatchLabel
                : resignChessMatchLabel
            }
            onConfirm={handleGameOver}
            onHide={() => setConfirmModalShown(false)}
          />
        )}
      </Modal>
    </ErrorBoundary>
  );

  async function handleOfferDraw() {
    const messageId = uuidv1();
    onSubmitMessage({
      messageId,
      message: {
        channelId,
        isDrawOffer: true,
        content: offeredDrawLabel,
        userId,
        username,
        profilePicUrl
      }
    });
    onHide();
  }

  async function handleSubmitChessMove() {
    if (!submittingRef.current) {
      submittingRef.current = true;
      setSubmitting(true);
      await onConfirmChessMove(newChessState);
    }
  }

  async function handleGameOver() {
    await setChessMoveViewTimeStamp({ channelId, message });
    onUpdateLastChessMoveViewerId({
      channelId,
      viewerId: myId
    });
    socket.emit('end_chess_game', {
      channel: {
        id: currentChannel.id,
        channelName: currentChannel.channelName,
        members: currentChannel.members,
        twoPeople: currentChannel.twoPeople,
        pathId: currentChannel.pathId
      },
      channelId,
      targetUserId: myId,
      ...(drawOfferPending
        ? { isDraw: true }
        : isAbortable
        ? { isAbort: true }
        : { winnerId: opponentId, isResign: true })
    });
    onHide();
  }
}
