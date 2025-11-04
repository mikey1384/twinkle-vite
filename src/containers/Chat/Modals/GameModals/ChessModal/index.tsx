import React, { useEffect, useRef, useMemo, useState } from 'react';
import ConfirmModal from '~/components/Modals/ConfirmModal';
import FilterBar from '~/components/FilterBar';
import ErrorBoundary from '~/components/ErrorBoundary';
import NewModal from '~/components/NewModal';
import ModalContentWrapper from '../ModalContentWrapper';
import GameModalFooter from '../GameModalFooter';
import Game from './ChessGame';
import Rewind from './Rewind';
import localize from '~/constants/localize';
import { socket } from '~/constants/sockets/api';
import {
  useAppContext,
  useChatContext,
  useKeyContext,
  useChessContext
} from '~/contexts';
import { v1 as uuidv1 } from 'uuid';
import { getLevelCategory } from '../../../../Home/ChessPuzzleModal/helpers';

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

export default function ChessModal({
  currentChannel,
  channelId,
  myId,
  onConfirmChessMove,
  onHide,
  countdownNumber,
  onCancelRewindRequest,
  onAcceptRewind,
  onDeclineRewind,
  onScrollToBottom,
  onSpoilerClick,
  opponentId,
  opponentName,
  socketConnected
}: {
  currentChannel: any;
  channelId: number;
  myId: number;
  onConfirmChessMove: (arg0: any) => void;
  onHide: () => void;
  countdownNumber: number | null;
  onCancelRewindRequest: () => void;
  onAcceptRewind: (v: any) => void;
  onDeclineRewind: () => void;
  onScrollToBottom: () => void;
  onSpoilerClick: (v: any) => void;
  opponentId: number;
  opponentName: string;
  socketConnected: boolean;
}) {
  const [activeTab, setActiveTab] = useState('game');
  const [message, setMessage] = useState({});
  const userId = useKeyContext((v) => v.myState.userId);
  const username = useKeyContext((v) => v.myState.username);
  const profilePicUrl = useKeyContext((v) => v.myState.profilePicUrl);
  const banned = useKeyContext((v) => v.myState.banned);
  const chessThemeVersion = useChatContext((v) => v.state.chessThemeVersion);
  const rewindRequestId = useMemo(
    () => currentChannel?.gameState?.chess?.rewindRequestId,
    [currentChannel?.gameState]
  );
  const warningColor = useKeyContext((v) => v.theme.warning.color);
  const doneColor = useKeyContext((v) => v.theme.done.color);
  const setChessMoveViewTimeStamp = useAppContext(
    (v) => v.requestHelpers.setChessMoveViewTimeStamp
  );
  const onUpdateLastChessMoveViewerId = useChatContext(
    (v) => v.actions.onUpdateLastChessMoveViewerId
  );
  const onSubmitMessage = useChatContext((v) => v.actions.onSubmitMessage);
  const [initialState, setInitialState] = useState<object | null>(null);
  const [newChessState, setNewChessState] = useState<object | null>(null);
  const [confirmModalShown, setConfirmModalShown] = useState(false);
  const [userMadeLastMove, setUserMadeLastMove] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [theme, setTheme] = useState<string | null>(null);
  const maxLevelUnlocked: number =
    useChessContext((v) => v.state.stats?.maxLevelUnlocked) ?? 1;

  const allowedThemeValues = useMemo(() => {
    const category = getLevelCategory(maxLevelUnlocked);
    const order = [
      'DEFAULT',
      'INTERMEDIATE',
      'ADVANCED',
      'EXPERT',
      'LEGENDARY',
      'GENIUS'
    ] as const;
    const maxIndex =
      category === 'GENIUS'
        ? order.indexOf('GENIUS')
        : category === 'LEGENDARY'
        ? order.indexOf('LEGENDARY')
        : category === 'EXPERT'
        ? order.indexOf('EXPERT')
        : category === 'ADVANCED'
        ? order.indexOf('ADVANCED')
        : category === 'INTERMEDIATE'
        ? order.indexOf('INTERMEDIATE')
        : order.indexOf('DEFAULT');
    const base = order.slice(0, maxIndex + 1);
    return maxLevelUnlocked >= 42 ? ([...base, 'LEVEL_42'] as const) : base;
  }, [maxLevelUnlocked]);

  const boardState: any = useMemo(
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
      boardState?.move?.number > 0 &&
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
      boardState?.move?.number > 0 &&
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

  useEffect(() => {
    if (!rewindRequestId) {
      setActiveTab('game');
    }
  }, [rewindRequestId]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`tw-chat-chess-theme-${userId}`);
      setTheme(saved || null);
    } catch {}
  }, [userId, chessThemeVersion]);

  useEffect(() => {
    if (theme && !allowedThemeValues.includes(theme as any)) {
      // Clamp to a safe default if saved theme exceeds unlocked level
      setTheme(null);
    }
  }, [allowedThemeValues, theme]);

  const squareColors = useMemo(() => {
    switch (theme) {
      case 'INTERMEDIATE':
        return { light: '#dbeafe', dark: '#93c5fd' };
      case 'ADVANCED':
        return { light: '#e2e8f0', dark: '#94a3b8' };
      case 'EXPERT':
        return { light: '#ede9fe', dark: '#c4b5fd' };
      case 'LEGENDARY':
        return { light: '#fee2e2', dark: '#fca5a5' };
      case 'GENIUS':
        return { light: '#fef3c7', dark: '#fbbf24' };
      case 'LEVEL_42':
        return { light: '#e0e7ff', dark: '#556377' };
      case 'DEFAULT':
      default:
        return undefined;
    }
  }, [theme]);

  return (
    <ErrorBoundary componentPath="ChessModal">
      <NewModal
        isOpen
        onClose={onHide}
        size="lg"
        title={rewindRequestId ? undefined : chessLabel}
        header={
          rewindRequestId ? (
            <FilterBar
              style={{
                marginBottom: 0
              }}
            >
              <nav
                className={activeTab === 'game' ? 'active' : ''}
                onClick={() => setActiveTab('game')}
              >
                Chess
              </nav>
              <nav
                className={activeTab === 'rewind' ? 'active' : ''}
                onClick={() => setActiveTab('rewind')}
              >
                Rewind Request
              </nav>
            </FilterBar>
          ) : undefined
        }
        footer={
          <GameModalFooter
            showGameEndButton={gameEndButtonShown}
            showOfferDraw={drawButtonShown}
            showCancelMove={!!newChessState}
            showDoneButton={!gameFinished && !userMadeLastMove}
            drawOfferPending={drawOfferPending}
            isAbortable={isAbortable}
            gameFinished={gameFinished}
            onOpenConfirmModal={() => setConfirmModalShown(true)}
            onOfferDraw={handleOfferDraw}
            onClose={onHide}
            onCancelMove={() => setNewChessState(null)}
            onStartNewGame={() => {
              setUserMadeLastMove(false);
              setInitialState(null);
              setNewChessState(null);
              setMessage({});
            }}
            onDone={handleSubmitChessMove}
            doneDisabled={
              !newChessState || !socketConnected || banned?.chess || submitting
            }
            warningColor={warningColor}
            doneColor={doneColor}
            acceptDrawLabel={acceptDrawLabel}
            abortLabel={abortLabel}
            resignLabel={resignLabel}
            offerDrawLabel={offerDrawLabel}
            closeLabel={closeLabel}
            cancelMoveLabel={cancelMoveLabel}
            startNewGameLabel={startNewGameLabel}
            doneLabel={doneLabel}
          />
        }
      >
        <ModalContentWrapper>
          {activeTab === 'game' ? (
            <>
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
                setChessMoveViewTimeStamp={setChessMoveViewTimeStamp}
                userMadeLastMove={userMadeLastMove}
                squareColors={squareColors}
              />
            </>
          ) : (
            <Rewind
              countdownNumber={countdownNumber}
              channelId={channelId}
              myId={myId}
              onAcceptRewind={onAcceptRewind}
              onCancelRewindRequest={onCancelRewindRequest}
              onDeclineRewind={onDeclineRewind}
              rewindRequestId={rewindRequestId}
            />
          )}
        </ModalContentWrapper>
      </NewModal>
      {confirmModalShown && (
        <ConfirmModal
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
    onScrollToBottom();
    onHide();
  }

  async function handleSubmitChessMove() {
    if (!submittingRef.current) {
      submittingRef.current = true;
      setSubmitting(true);
      await onConfirmChessMove({
        ...newChessState,
        previousState: initialState
          ? {
              ...initialState,
              previousState: null
            }
          : null
      });
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
    onScrollToBottom();
    onHide();
  }
}
