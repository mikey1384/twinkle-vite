import React from 'react';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import Modal from '~/components/Modal';
import { css } from '@emotion/css';
import { tabletMaxWidth } from '~/constants/css';

export default function ChessOptionsModal({
  onHide,
  onStartTargetChess,
  unansweredChessMsgChannelId,
  targetUsername,
  onNavigateToChessMessage,
  onPlayPuzzles
}: {
  onHide: () => void;
  onStartTargetChess?: () => void;
  unansweredChessMsgChannelId?: number | null;
  targetUsername?: string;
  onNavigateToChessMessage?: () => void;
  onPlayPuzzles: () => void;
}) {
  return (
    <Modal
      modalKey="ChessOptionsModal"
      isOpen={true}
      onClose={onHide}
      title="Chess"
      size="sm"
      modalLevel={0}
      footer={
        <Button variant="ghost" onClick={onHide}>
          Cancel
        </Button>
      }
    >
      <div
        style={{
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}
      >
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onPlayPuzzles();
          }}
          className={css`
            cursor: pointer;
            display: flex;
            background: #3b82f6;
            border: 2px solid #2563eb;
            color: white;
            justify-content: center;
            align-items: center;
            text-align: center;
            font-weight: 600;
            font-size: 1.1rem;
            border-radius: 6px;
            padding: 1.5rem;
            gap: 0.5rem;
            transition: all 0.15s ease;
            box-shadow: 0 2px 0 #1d4ed8;

            &:hover {
              background: #2563eb;
              transform: translateY(1px);
              box-shadow: 0 1px 0 #1d4ed8;
            }

            &:active {
              background: #1d4ed8;
              transform: translateY(2px);
              box-shadow: none;
            }

            @media (max-width: ${tabletMaxWidth}) {
              font-size: 1.1rem;
              padding: 1.25rem;
            }
          `}
        >
          <Icon icon="puzzle-piece" />
          <span style={{ marginLeft: '1rem' }}>Play Chess Puzzles</span>
        </button>

        {onStartTargetChess && targetUsername && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onStartTargetChess();
            }}
            className={css`
              cursor: pointer;
              display: flex;
              background: #475569;
              border: 2px solid #334155;
              color: white;
              justify-content: center;
              align-items: center;
              text-align: center;
              font-weight: 600;
              font-size: 1.1rem;
              border-radius: 6px;
              padding: 1.5rem;
              gap: 0.5rem;
              transition: all 0.15s ease;
              box-shadow: 0 2px 0 #1e293b;

              &:hover {
                background: #334155;
                transform: translateY(1px);
                box-shadow: 0 1px 0 #1e293b;
              }

              &:active {
                background: #1e293b;
                transform: translateY(2px);
                box-shadow: none;
              }

              @media (max-width: ${tabletMaxWidth}) {
                font-size: 1.1rem;
                padding: 1.25rem;
              }
            `}
          >
            <Icon icon="chess" />
            <span style={{ marginLeft: '1rem' }}>
              Send Chess Move to {targetUsername}
            </span>
          </button>
        )}

        {unansweredChessMsgChannelId && onNavigateToChessMessage && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onNavigateToChessMessage();
            }}
            className={css`
              cursor: pointer;
              display: flex;
              background: #f59e0b;
              border: 2px solid #d97706;
              color: white;
              justify-content: center;
              align-items: center;
              text-align: center;
              font-weight: 600;
              font-size: 1.1rem;
              border-radius: 6px;
              padding: 1.5rem;
              gap: 0.5rem;
              transition: all 0.15s ease;
              box-shadow: 0 2px 0 #b45309;

              &:hover {
                background: #d97706;
                transform: translateY(1px);
                box-shadow: 0 1px 0 #b45309;
              }

              &:active {
                background: #b45309;
                transform: translateY(2px);
                box-shadow: none;
              }

              @media (max-width: ${tabletMaxWidth}) {
                font-size: 1.1rem;
                padding: 1.25rem;
              }
            `}
          >
            <Icon icon="reply" />
            <span style={{ marginLeft: '1rem' }}>Respond to Chess Message</span>
          </button>
        )}
      </div>
    </Modal>
  );
}
