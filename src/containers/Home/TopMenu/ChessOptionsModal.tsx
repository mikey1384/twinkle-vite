import React from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import Icon from '~/components/Icon';

export default function ChessOptionsModal({
  onHide,
  unansweredChessMsgChannelId,
  onNavigateToChessMessage,
  onPlayPuzzles
}: {
  onHide: () => void;
  unansweredChessMsgChannelId: number | null;
  onNavigateToChessMessage: () => void;
  onPlayPuzzles: () => void;
}) {
  return (
    <Modal small onHide={onHide}>
      <header>Chess</header>
      <main>
        <div
          style={{
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}
        >
          <Button
            style={{
              padding: '1.5rem',
              fontSize: '1.2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            skeuomorphic
            color="logoBlue"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onPlayPuzzles();
            }}
          >
            <Icon icon="puzzle-piece" />
            <span style={{ marginLeft: '1rem' }}>Play Chess Puzzles</span>
          </Button>

          {unansweredChessMsgChannelId && (
            <Button
              style={{
                padding: '1.5rem',
                fontSize: '1.2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              skeuomorphic
              color="orange"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onNavigateToChessMessage();
              }}
            >
              <Icon icon="reply" />
              <span style={{ marginLeft: '1rem' }}>
                Respond to Chess Message
              </span>
            </Button>
          )}
        </div>
      </main>
      <footer>
        <Button transparent onClick={onHide}>
          Cancel
        </Button>
      </footer>
    </Modal>
  );
}
