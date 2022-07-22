import React, { useEffect, useRef, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import Chess from '../Chess';
import ConfirmModal from '~/components/Modals/ConfirmModal';
import Icon from '~/components/Icon';
import { Color } from '~/constants/css';
import { socket } from '~/constants/io';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';
import { v1 as uuidv1 } from 'uuid';
import ErrorBoundary from '~/components/ErrorBoundary';
import localize from '~/constants/localize';

const acceptDrawLabel = localize('acceptDraw');
const cancelMoveLabel = localize('cancelMove');
const chessLabel = localize('chess');
const closeLabel = localize('close');
const doneLabel = localize('done');
const offerDrawLabel = localize('offerDraw');
const offeredDrawLabel = localize('offeredDraw');
const resignLabel = localize('resign');
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
  const { banned, userId, username, profilePicUrl } = useKeyContext(
    (v) => v.myState
  );
  const {
    warning: { color: warningColor },
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);
  const fetchCurrentChessState = useAppContext(
    (v) => v.requestHelpers.fetchCurrentChessState
  );
  const setChessMoveViewTimeStamp = useAppContext(
    (v) => v.requestHelpers.setChessMoveViewTimeStamp
  );
  const onSubmitMessage = useChatContext((v) => v.actions.onSubmitMessage);
  const onUpdateChessMoveViewTimeStamp = useChatContext(
    (v) => v.actions.onUpdateChessMoveViewTimeStamp
  );
  const [initialState, setInitialState] = useState();
  const [viewTimeStamp, setViewTimeStamp] = useState();
  const [message, setMessage] = useState();
  const [uploaderId, setUploaderId] = useState();
  const [loaded, setLoaded] = useState(false);
  const [newChessState, setNewChessState] = useState();
  const [confirmModalShown, setConfirmModalShown] = useState(false);
  const [spoilerOff, setSpoilerOff] = useState(false);
  const [userMadeLastMove, setUserMadeLastMove] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const loading = useRef(null);

  useEffect(() => {
    init();
    async function init() {
      loading.current = true;
      const chessMessage = await fetchCurrentChessState({
        channelId,
        recentChessMessage: currentChannel.recentChessMessage
      });
      setUserMadeLastMove(chessMessage?.userId === myId);
      setMessage(chessMessage);
      setUploaderId(chessMessage?.userId);
      setInitialState(chessMessage?.chessState);
      setViewTimeStamp(chessMessage?.moveViewTimeStamp);
      loading.current = false;
      setLoaded(true);
    }
    return function cleanUp() {
      loading.current = true;
      setInitialState(undefined);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof countdownNumber === 'number') {
      setSpoilerOff(true);
    }
  }, [channelId, countdownNumber]);

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

  return (
    <ErrorBoundary componentPath="ChessModal">
      <Modal large onHide={onHide}>
        <header>{chessLabel}</header>
        <main style={{ padding: 0 }}>
          <div
            style={{
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
              onChessMove={setNewChessState}
              opponentId={opponentId}
              opponentName={opponentName}
              senderId={uploaderId}
              spoilerOff={
                spoilerOff ||
                (!loading.current && !initialState) ||
                !!userMadeLastMove ||
                !!viewTimeStamp
              }
              onSpoilerClick={handleSpoilerClick}
            />
          </div>
        </main>
        <footer style={{ border: 0 }}>
          {gameEndButtonShown && (
            <Button
              style={{ marginRight: '1rem' }}
              color={drawOfferPending ? 'orange' : 'red'}
              onClick={() => setConfirmModalShown(true)}
            >
              {drawOfferPending ? acceptDrawLabel : resignLabel}
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
              onClick={() => setNewChessState(undefined)}
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
                setInitialState(undefined);
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
            title={drawOfferPending ? acceptDrawLabel : resignChessMatchLabel}
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

  async function handleSpoilerClick() {
    try {
      await setChessMoveViewTimeStamp({ channelId, message });
      setSpoilerOff(true);
      onUpdateChessMoveViewTimeStamp(channelId);
      onSpoilerClick(message.userId);
    } catch (error) {
      console.error(error);
    }
  }

  async function handleSubmitChessMove() {
    if (!submittingRef.current) {
      submittingRef.current = true;
      setSubmitting(true);
      await onConfirmChessMove(newChessState);
    }
  }

  function handleGameOver() {
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
        : { winnerId: opponentId, isResign: true })
    });
    onHide();
  }
}
