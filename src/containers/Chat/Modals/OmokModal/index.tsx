import React, { useEffect, useMemo, useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import Omok from '../../Omok';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';
import NewModal from '~/components/NewModal';
import ModalContentWrapper from '../components/ModalContentWrapper';
import GameModalFooter from '../components/GameModalFooter';
import localize from '~/constants/localize';
import ConfirmModal from '~/components/Modals/ConfirmModal';

interface OmokModalProps {
  currentChannel: any;
  channelId: number;
  myId: number;
  opponentId: number;
  opponentName: string;
  countdownNumber?: number;
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
  const [loadError, setLoadError] = useState<string | null>(null);
  const [newOmokState, setNewOmokState] = useState<any>(null);
  const doneColor = useKeyContext((v) => v.theme.done.color);
  const warningColor = useKeyContext((v) => v.theme.warning.color);
  const [confirmModalShown, setConfirmModalShown] = useState(false);

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
      } catch (error: any) {
        if (!ignore) {
          setLoadError(error?.message || 'Failed to load omok board.');
          setLoaded(true);
        }
      }
    }
    init();
    return () => {
      ignore = true;
    };
    // Align with Chess: fetch current board once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initialState = useMemo(() => message?.omokState, [message]);

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

  const closeLabel = localize('close');
  const cancelMoveLabel = localize('cancelMove');
  const startNewGameLabel = localize('startNewGame');
  const doneLabel = 'Confirm move';

  const gameFinished = useMemo(
    () => Boolean(initialState?.winnerId),
    [initialState?.winnerId]
  );

  return (
    <ErrorBoundary componentPath="Chat/Modals/OmokModal">
      <NewModal
        isOpen
        size="lg"
        title="Omok"
        onClose={onHide}
        footer={
          <GameModalFooter
            showGameEndButton
            showOfferDraw={false}
            showCancelMove={!!newOmokState}
            showDoneButton
            drawOfferPending={false}
            isAbortable={false}
            gameFinished={gameFinished}
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
            showSpinner={!socketConnected || submitting}
            warningColor={warningColor}
            doneColor={doneColor}
            acceptDrawLabel={''}
            abortLabel={''}
            resignLabel={''}
            offerDrawLabel={''}
            closeLabel={closeLabel}
            cancelMoveLabel={cancelMoveLabel}
            startNewGameLabel={startNewGameLabel}
            doneLabel={doneLabel}
          />
        }
      >
        {!loaded ? (
          <div style={{ padding: '1.5rem', textAlign: 'center' }}>
            Loading board…
          </div>
        ) : loadError ? (
          <div
            style={{ padding: '1.5rem', textAlign: 'center', color: '#d94848' }}
          >
            {loadError}
          </div>
        ) : (
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
              spoilerOff={true}
              interactable
              loaded={loaded && socketConnected}
              onConfirmMove={handleConfirmMove}
              onCancelPendingMove={() => setSubmitting(false)}
              onSpoilerClick={handleSpoilerClick}
              newOmokState={newOmokState}
              onSetNewOmokState={setNewOmokState}
            />
          </ModalContentWrapper>
        )}
      </NewModal>
      {confirmModalShown && (
        <ConfirmModal
          title="Resign Omok Match"
          onConfirm={() => setConfirmModalShown(false)}
          onHide={() => setConfirmModalShown(false)}
        />
      )}
    </ErrorBoundary>
  );
}
