import React, { useEffect, useRef, useState } from 'react';
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
  onOpenConfirmModal,
  onOfferDraw,
  onClose,
  onCancelMove,
  onStartNewGame,
  onDone,
  onHowToPlay,
  doneDisabled,
  actionsDisabled,
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
  actionsDisabled?: boolean;
  warningColor?: string;
  doneColor?: string;
  howToPlayColor?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const pending = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const noop = () => {};

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        justifyContent: 'flex-end',
        alignItems: 'center',
        width: '100%',
        minWidth: 0
      }}
    >
      {error && (
        <p
          role="alert"
          style={{ width: '100%', fontSize: '14px', lineHeight: 1.5 }}
        >
          {error}
        </p>
      )}
      {showHowToPlay && (
        <Button
          variant="ghost"
          style={{ minHeight: '44px', fontSize: '14px' }}
          color={howToPlayColor || 'magenta'}
          onClick={onHowToPlay || noop}
        >
          How to play
        </Button>
      )}
      {showGameEndButton && (
        <Button
          variant="ghost"
          style={{ minHeight: '44px', fontSize: '14px' }}
          color={drawOfferPending || isAbortable ? 'orange' : 'red'}
          onClick={onOpenConfirmModal || noop}
          disabled={actionsDisabled || loading}
        >
          {drawOfferPending ? 'Accept draw' : isAbortable ? 'Abort' : 'Resign'}
        </Button>
      )}
      {showOfferDraw && (
        <Button
          variant="ghost"
          style={{ minHeight: '44px', fontSize: '14px' }}
          color="orange"
          onClick={onOfferDraw || noop}
          disabled={actionsDisabled || loading}
        >
          Offer draw
        </Button>
      )}
      <Button
        variant="ghost"
        style={{ minHeight: '44px', fontSize: '14px' }}
        onClick={onClose || noop}
      >
        Close
      </Button>
      {showCancelMove && (
        <Button
          variant="ghost"
          style={{ minHeight: '44px', fontSize: '14px' }}
          color={warningColor}
          onClick={onCancelMove || noop}
          disabled={actionsDisabled || loading}
        >
          Cancel
        </Button>
      )}
      {gameFinished ? (
        <Button
          variant="ghost"
          style={{ minHeight: '44px', fontSize: '14px' }}
          color="orange"
          onClick={onStartNewGame || noop}
          disabled={actionsDisabled || loading}
        >
          Start new game
        </Button>
      ) : showDoneButton ? (
        <Button
          variant="ghost"
          color={doneColor}
          loading={loading}
          style={{ minHeight: '44px', fontSize: '14px' }}
          onClick={handleDone}
          disabled={actionsDisabled || doneDisabled || loading || !onDone}
        >
          Done
        </Button>
      ) : null}
    </div>
  );

  async function handleDone() {
    if (
      onDone &&
      !actionsDisabled &&
      !doneDisabled &&
      !pending.current &&
      mounted.current
    ) {
      pending.current = true;
      setError('');
      setLoading(true);
      try {
        await onDone();
      } catch {
        if (mounted.current)
          setError(
            'Could not confirm your move. Check the game before trying again.'
          );
      } finally {
        pending.current = false;
        if (mounted.current) setLoading(false);
      }
    }
  }
}
