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
  howToPlayColor
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
  onDone?: () => void | Promise<void>;
  onHowToPlay?: () => void;
  doneDisabled?: boolean;
  warningColor?: string;
  doneColor?: string;
  howToPlayColor?: string;
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
          How to play
        </Button>
      )}
      {showGameEndButton && (
        <Button
          variant="ghost"
          style={{ marginRight: '1rem' }}
          color={drawOfferPending || isAbortable ? 'orange' : 'red'}
          onClick={onOpenConfirmModal || noop}
        >
          {drawOfferPending ? 'Accept draw' : isAbortable ? 'Abort' : 'Resign'}
        </Button>
      )}
      {showOfferDraw && (
        <Button
          variant="ghost"
          style={{ marginRight: '1rem' }}
          color="orange"
          onClick={onOfferDraw || noop}
        >
          Offer draw
        </Button>
      )}
      <Button variant="ghost" onClick={onClose || noop}>
        Close
      </Button>
      {showCancelMove && (
        <Button
          variant="ghost"
          style={{ marginLeft: '1rem' }}
          color={warningColor}
          onClick={onCancelMove || noop}
        >
          Cancel
        </Button>
      )}
      {gameFinished ? (
        <Button
          variant="ghost"
          style={{ marginLeft: '1rem' }}
          color="orange"
          onClick={onStartNewGame || noop}
        >
          Start new game
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
          Done
        </Button>
      ) : null}
    </>
  );

  async function handleDone() {
    if (onDone) {
      setLoading(true);
      try {
        await onDone();
      } catch {
        setLoading(false);
      }
    }
  }
}
