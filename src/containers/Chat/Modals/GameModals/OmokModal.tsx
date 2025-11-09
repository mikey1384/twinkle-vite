import React, { useEffect, useMemo, useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import Omok from '../../Omok';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';
import NewModal from '~/components/NewModal';
import ModalContentWrapper from './ModalContentWrapper';
import GameModalFooter from './GameModalFooter';
import localize from '~/constants/localize';
import { socket } from '~/constants/sockets/api';
import ConfirmModal from '~/components/Modals/ConfirmModal';

interface OmokModalProps {
  currentChannel: any;
  channelId: number;
  myId: number;
  opponentId: number;
  opponentName: string;
  countdownNumber?: number | null;
  onConfirmOmokMove: (params: {
    state: any;
    moveNumber: number;
    isWinning: boolean;
    previousState?: any;
    message?: any;
  }) => Promise<void> | void;
  onHide: () => void;
  onSpoilerClick: (senderId: number) => void;
  onScrollToBottom: () => void;
  socketConnected: boolean;
}

export default function OmokModal({
  currentChannel,
  channelId,
  myId,
  opponentId,
  opponentName,
  countdownNumber,
  onConfirmOmokMove,
  onHide,
  onSpoilerClick,
  onScrollToBottom,
  socketConnected
}: OmokModalProps) {
  const fetchCurrentOmokState = useAppContext(
    (v) => v.requestHelpers.fetchCurrentOmokState
  );
  const setOmokMoveViewTimeStamp = useAppContext(
    (v) => v.requestHelpers.setOmokMoveViewTimeStamp
  );
  const onUpdateRecentOmokMessage = useChatContext(
    (v) => v.actions.onUpdateRecentOmokMessage
  );
  const onUpdateLastOmokMoveViewerId = useChatContext(
    (v) => v.actions.onUpdateLastOmokMoveViewerId
  );

  const [message, setMessage] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newOmokState, setNewOmokState] = useState<any>(null);
  const doneColor = useKeyContext((v) => v.theme.done.color);
  const warningColor = useKeyContext((v) => v.theme.warning.color);
  const [confirmModalShown, setConfirmModalShown] = useState(false);
  const [howToPlayShown, setHowToPlayShown] = useState(false);

  const initialState = useMemo(() => message?.omokState, [message]);

  const userMadeLastMove = useMemo(
    () => initialState?.move?.by === myId,
    [initialState?.move?.by, myId]
  );

  const spoilerOff = useMemo(() => {
    if (typeof countdownNumber === 'number') {
      return true;
    }
    const userIsTheLastMoveViewer =
      currentChannel.lastOmokMoveViewerId === myId;
    const isOlderMessage =
      message?.id &&
      currentChannel.lastOmokMessageId &&
      message.id < currentChannel.lastOmokMessageId;
    return (
      userMadeLastMove || userIsTheLastMoveViewer || Boolean(isOlderMessage)
    );
  }, [
    countdownNumber,
    currentChannel.lastOmokMessageId,
    currentChannel.lastOmokMoveViewerId,
    message?.id,
    myId,
    userMadeLastMove
  ]);

  const handleConfirmMove = async ({
    state,
    moveNumber,
    isWinning,
    previousState
  }: {
    state: any;
    moveNumber: number;
    isWinning: boolean;
    previousState?: any;
  }) => {
    try {
      setSubmitting(true);
      await onConfirmOmokMove({
        state,
        moveNumber,
        isWinning,
        previousState,
        message
      });
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const closeLabel = localize('close');
  const cancelMoveLabel = localize('cancelMove');
  const startNewGameLabel = localize('startNewGame');
  const resignLabel = localize('resign');
  const abortLabel = 'Abort';
  const doneLabel = 'Confirm move';

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const data = await fetchCurrentOmokState({
          channelId,
          recentOmokMessage: currentChannel.recentOmokMessage
        });
        if (!ignore) {
          if (data) {
            setMessage(data);
            onUpdateRecentOmokMessage({ channelId, message: data });
          }
          setLoaded(true);
        }
      } catch (error) {
        console.error(error);
        if (!ignore) {
          setLoaded(true);
        }
      }
    }
    init();
    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const gameEndButtonShown = useMemo(
    () =>
      (initialState?.move?.number || 0) > 0 &&
      !newOmokState &&
      !userMadeLastMove,
    [newOmokState, initialState?.move?.number, userMadeLastMove]
  );

  // Allow abort early in the game (before 4 half-moves), matching chess behavior
  const isAbortable = useMemo(
    () => (initialState?.move?.number || 0) < 4,
    [initialState?.move?.number]
  );

  const handleSpoilerClick = async (senderId: number) => {
    try {
      if (message) {
        await setOmokMoveViewTimeStamp({
          channelId,
          message,
          gameType: 'omok'
        });
        onUpdateLastOmokMoveViewerId({ channelId, viewerId: myId });
      }
      onSpoilerClick(senderId);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <ErrorBoundary componentPath="Chat/Modals/OmokModal">
      <NewModal
        isOpen
        size="lg"
        title="Omok"
        onClose={onHide}
        footer={
          <GameModalFooter
            showGameEndButton={gameEndButtonShown}
            showOfferDraw={false}
            showCancelMove={!!newOmokState}
            showDoneButton={!userMadeLastMove}
            drawOfferPending={false}
            isAbortable={isAbortable}
            gameFinished={false}
            onOpenConfirmModal={() => setConfirmModalShown(true)}
            onOfferDraw={() => {}}
            onClose={onHide}
            onCancelMove={() => setNewOmokState(null)}
            onStartNewGame={() => {
              setNewOmokState(null);
              setMessage(null);
            }}
            onDone={() =>
              handleConfirmMove({
                state: newOmokState,
                moveNumber: newOmokState?.move?.number,
                isWinning: Boolean(newOmokState?.winnerId),
                previousState: initialState
              })
            }
            doneDisabled={!newOmokState || !socketConnected || submitting}
            warningColor={warningColor}
            doneColor={doneColor}
            acceptDrawLabel={''}
            abortLabel={abortLabel}
            resignLabel={resignLabel}
            offerDrawLabel={''}
            closeLabel={closeLabel}
            cancelMoveLabel={cancelMoveLabel}
            startNewGameLabel={startNewGameLabel}
            doneLabel={doneLabel}
            showHowToPlay
            howToPlayLabel="How to play"
            onHowToPlay={() => setHowToPlayShown(true)}
          />
        }
      >
        <ModalContentWrapper>
          <Omok
            channelId={channelId}
            myId={myId}
            senderId={message?.userId}
            messageId={message?.id}
            opponentId={opponentId}
            opponentName={opponentName}
            initialState={initialState}
            countdownNumber={countdownNumber}
            spoilerOff={spoilerOff}
            interactable
            loaded={loaded && socketConnected}
            isFromModal
            isDraw={!!message?.isDraw}
            isAbort={!!message?.isAbort}
            onConfirmMove={handleConfirmMove}
            onCancelPendingMove={() => setSubmitting(false)}
            onSpoilerClick={handleSpoilerClick}
            newOmokState={newOmokState}
            onSetNewOmokState={setNewOmokState}
          />
        </ModalContentWrapper>
      </NewModal>
      {confirmModalShown && (
        <ConfirmModal
          title={isAbortable ? 'Abort Omok Match' : 'Resign Omok Match'}
          onConfirm={handleGameOver}
          onHide={() => setConfirmModalShown(false)}
        />
      )}
      {howToPlayShown && (
        <NewModal
          isOpen
          size="sm"
          title="How to Play Twinkle Omok"
          onClose={() => setHowToPlayShown(false)}
        >
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
          >
            <section>
              <h4 style={{ margin: 0 }}>Goal</h4>
              <p style={{ marginTop: '0.5rem' }}>
                Place five of your stones in an unbroken line horizontally,
                vertically, or diagonally before your opponent does.
              </p>
            </section>
            <section>
              <h4 style={{ margin: 0 }}>Turn Order</h4>
              <p style={{ marginTop: '0.5rem' }}>
                Black moves first. Players then alternate one stone at a time on
                empty intersections.
              </p>
            </section>
            <section>
              <h4 style={{ margin: 0 }}>Special Rules</h4>
              <ul
                style={{
                  marginTop: '0.5rem',
                  marginBottom: 0,
                  paddingLeft: '1.5rem'
                }}
              >
                <li>
                  <strong>Double three (black only):</strong> Black cannot make
                  a move that simultaneously creates two open three
                  (three-in-a-row with space on both ends) threats.
                </li>
                <li>
                  <strong>Overlines (black only):</strong> Black cannot place a
                  stone that forms a continuous line longer than five. White may
                  create overlines and they still count as wins.
                </li>
              </ul>
            </section>
            <section>
              <h4 style={{ margin: 0 }}>Winning</h4>
              <p style={{ marginTop: '0.5rem' }}>
                The first player to complete a legal five-in-a-row wins
                immediately. If a winning move violates a rule above, it is
                rejected and the player must choose a different spot.
              </p>
            </section>
          </div>
        </NewModal>
      )}
    </ErrorBoundary>
  );

  async function handleGameOver() {
    try {
      if (message) {
        await setOmokMoveViewTimeStamp({ channelId, message });
        onUpdateLastOmokMoveViewerId({ channelId, viewerId: myId });
      }
      // Use unified event name with gameType for omok
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
        gameType: 'omok',
        ...(isAbortable
          ? { isAbort: true }
          : { winnerId: opponentId, isResign: true })
      });
      onScrollToBottom();
      onHide();
    } catch (error) {
      console.error(error);
    } finally {
      setConfirmModalShown(false);
    }
  }
}
