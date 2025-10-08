import React from 'react';
import Button from '~/components/Button';
import Icon from '~/components/Icon';

export default function GameModalFooter({
  // visibility flags
  showGameEndButton,
  showOfferDraw,
  showCancelMove,
  showDoneButton,
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
  // UI state
  doneDisabled,
  showSpinner,
  // colors
  warningColor,
  doneColor,
  // labels
  acceptDrawLabel,
  abortLabel,
  resignLabel,
  offerDrawLabel,
  closeLabel,
  cancelMoveLabel,
  startNewGameLabel,
  doneLabel
}: {
  showGameEndButton?: boolean;
  showOfferDraw?: boolean;
  showCancelMove?: boolean;
  showDoneButton?: boolean;
  drawOfferPending?: boolean;
  isAbortable?: boolean;
  gameFinished?: boolean;
  onOpenConfirmModal?: () => void;
  onOfferDraw?: () => void;
  onClose: () => void;
  onCancelMove?: () => void;
  onStartNewGame?: () => void;
  onDone?: () => void;
  doneDisabled?: boolean;
  showSpinner?: boolean;
  warningColor?: string;
  doneColor?: string;
  acceptDrawLabel?: string;
  abortLabel?: string;
  resignLabel?: string;
  offerDrawLabel?: string;
  closeLabel?: string;
  cancelMoveLabel?: string;
  startNewGameLabel?: string;
  doneLabel?: string;
}) {
  const noop = () => {};
  return (
    <>
      {showGameEndButton && (
        <Button
          style={{ marginRight: '1rem' }}
          color={drawOfferPending || isAbortable ? 'orange' : 'red'}
          onClick={onOpenConfirmModal || noop}
        >
          {drawOfferPending ? acceptDrawLabel : isAbortable ? abortLabel : resignLabel}
        </Button>
      )}
      {showOfferDraw && (
        <Button
          style={{ marginRight: '1rem' }}
          color="orange"
          onClick={onOfferDraw || noop}
        >
          {offerDrawLabel}
        </Button>
      )}
      <Button transparent onClick={onClose || noop}>
        {closeLabel}
      </Button>
      {showCancelMove && (
        <Button
          style={{ marginLeft: '1rem' }}
          color={warningColor}
          onClick={onCancelMove || noop}
        >
          {cancelMoveLabel}
        </Button>
      )}
      {gameFinished ? (
        <Button
          style={{ marginLeft: '1rem' }}
          color="orange"
          onClick={onStartNewGame || noop}
        >
          {startNewGameLabel}
        </Button>
      ) : showDoneButton ? (
        <Button
          color={doneColor}
          style={{ marginLeft: '1rem' }}
          onClick={onDone || noop}
          disabled={doneDisabled}
        >
          {doneLabel}
          {showSpinner && <Icon style={{ marginLeft: '0.7rem' }} icon="spinner" pulse />}
        </Button>
      ) : null}
    </>
  );
}
