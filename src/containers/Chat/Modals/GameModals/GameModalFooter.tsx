import React, { useState } from 'react';
import Button from '~/components/Button';

export default function GameModalFooter({
  // visibility flags
  showGameEndButton,
  showOfferDraw,
  showCancelMove,
  showDoneButton,
  showHowToPlay,
  // state flags
  drawOfferPending,
  isAbortable,
  gameFinished,
  // actions
  onOpenConfirmModal,
  onOfferDraw,
  onClose,
  onCancelMove,
  onStartNewGame,
  onDone,
  onHowToPlay,
  // UI state
  doneDisabled,
  // colors
  warningColor,
  doneColor,
  howToPlayColor,
  // labels
  acceptDrawLabel,
  abortLabel,
  resignLabel,
  offerDrawLabel,
  closeLabel,
  cancelMoveLabel,
  startNewGameLabel,
  doneLabel,
  howToPlayLabel
}: {
  showGameEndButton?: boolean;
  showOfferDraw?: boolean;
  showCancelMove?: boolean;
  showDoneButton?: boolean;
  showHowToPlay?: boolean;
  drawOfferPending?: boolean;
  isAbortable?: boolean;
  gameFinished?: boolean;
  onOpenConfirmModal?: () => void;
  onOfferDraw?: () => void;
  onClose: () => void;
  onCancelMove?: () => void;
  onStartNewGame?: () => void;
  onDone?: () => void;
  onHowToPlay?: () => void;
  doneDisabled?: boolean;
  warningColor?: string;
  doneColor?: string;
  howToPlayColor?: string;
  acceptDrawLabel?: string;
  abortLabel?: string;
  resignLabel?: string;
  offerDrawLabel?: string;
  closeLabel?: string;
  cancelMoveLabel?: string;
  startNewGameLabel?: string;
  doneLabel?: string;
  howToPlayLabel?: string;
}) {
  const [loading, setLoading] = useState(false);
  const noop = () => {};
  return (
    <>
      {showHowToPlay && (
        <Button
          variant="ghost"
          style={{ marginRight: '1rem' }}
          color={howToPlayColor || 'magenta'}
          onClick={onHowToPlay || noop}
        >
          {howToPlayLabel}
        </Button>
      )}
      {showGameEndButton && (
        <Button
          variant="ghost"
          style={{ marginRight: '1rem' }}
          color={drawOfferPending || isAbortable ? 'orange' : 'red'}
          onClick={onOpenConfirmModal || noop}
        >
          {drawOfferPending
            ? acceptDrawLabel
            : isAbortable
            ? abortLabel
            : resignLabel}
        </Button>
      )}
      {showOfferDraw && (
        <Button
          variant="ghost"
          style={{ marginRight: '1rem' }}
          color="orange"
          onClick={onOfferDraw || noop}
        >
          {offerDrawLabel}
        </Button>
      )}
      <Button variant="ghost" onClick={onClose || noop}>
        {closeLabel}
      </Button>
      {showCancelMove && (
        <Button
          variant="ghost"
          style={{ marginLeft: '1rem' }}
          color={warningColor}
          onClick={onCancelMove || noop}
        >
          {cancelMoveLabel}
        </Button>
      )}
      {gameFinished ? (
        <Button
          variant="ghost"
          style={{ marginLeft: '1rem' }}
          color="orange"
          onClick={onStartNewGame || noop}
        >
          {startNewGameLabel}
        </Button>
      ) : showDoneButton ? (
        <Button
          variant="ghost"
          color={doneColor}
          loading={loading}
          style={{ marginLeft: '1rem' }}
          onClick={handleDone}
          disabled={doneDisabled}
        >
          {doneLabel}
        </Button>
      ) : null}
    </>
  );

  function handleDone() {
    if (onDone) {
      setLoading(true);
      onDone();
    }
    noop();
  }
}
