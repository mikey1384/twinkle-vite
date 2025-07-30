import React from 'react';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import NewModal from '~/components/NewModal';
import { css } from '@emotion/css';
import { tabletMaxWidth } from '~/constants/css';

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
    <NewModal
      isOpen={true}
      onClose={onHide}
      title="Chess"
      size="sm"
      modalLevel={0}
      footer={
        <Button transparent onClick={onHide}>
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
            font-family: 'Courier New', monospace;
            cursor: pointer;
            display: flex;
            background: linear-gradient(145deg, #f0f8ff, #dbeafe);
            border: 3px solid #93c5fd;
            border-top-color: #bfdbfe;
            border-left-color: #bfdbfe;
            position: relative;
            overflow: hidden;
            transition: all 0.2s;
            color: #1e40af;
            justify-content: center;
            align-items: center;
            text-align: center;
            font-weight: bold;
            font-size: 1.2rem;
            border-radius: 8px;
            padding: 1.5rem;
            box-shadow: 
              inset 2px 2px 4px rgba(255, 255, 255, 0.8),
              inset -2px -2px 4px rgba(30, 64, 175, 0.1),
              0 4px 8px rgba(30, 64, 175, 0.2);
            text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
            
            &:before {
              content: '';
              position: absolute;
              top: 0;
              left: -100%;
              width: 100%;
              height: 100%;
              background: linear-gradient(
                90deg,
                transparent,
                rgba(30, 64, 175, 0.1),
                transparent
              );
              transition: left 0.5s;
            }

            &:hover:before {
              left: 100%;
            }

            &:hover {
              background: linear-gradient(145deg, #ffffff, #f0f8ff);
              border-color: #60a5fa;
              border-top-color: #93c5fd;
              border-left-color: #93c5fd;
              box-shadow: 
                inset 2px 2px 4px rgba(255, 255, 255, 0.9),
                inset -2px -2px 4px rgba(30, 64, 175, 0.15),
                0 6px 12px rgba(30, 64, 175, 0.3);
              transform: translateY(-1px);
            }

            &:active {
              background: linear-gradient(145deg, #dbeafe, #f0f8ff);
              border-top-color: #60a5fa;
              border-left-color: #60a5fa;
              border-bottom-color: #bfdbfe;
              border-right-color: #bfdbfe;
              box-shadow: 
                inset -1px -1px 2px rgba(255, 255, 255, 0.9),
                inset 1px 1px 2px rgba(30, 64, 175, 0.2),
                0 2px 4px rgba(30, 64, 175, 0.15);
              transform: translateY(1px);
            }

            @media (max-width: ${tabletMaxWidth}) {
              font-size: 1rem;
            }
          `}
        >
          <Icon icon="puzzle-piece" />
          <span style={{ marginLeft: '1rem' }}>Play Chess Puzzles</span>
        </button>

        {unansweredChessMsgChannelId && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onNavigateToChessMessage();
            }}
            className={css`
              font-family: 'Courier New', monospace;
              cursor: pointer;
              display: flex;
              background: linear-gradient(145deg, #fff7ed, #fed7aa);
              border: 3px solid #fdba74;
              border-top-color: #fcd34d;
              border-left-color: #fcd34d;
              position: relative;
              overflow: hidden;
              transition: all 0.2s;
              color: #c2410c;
              justify-content: center;
              align-items: center;
              text-align: center;
              font-weight: bold;
              font-size: 1.2rem;
              border-radius: 8px;
              padding: 1.5rem;
              box-shadow: 
                inset 2px 2px 4px rgba(255, 255, 255, 0.8),
                inset -2px -2px 4px rgba(194, 65, 12, 0.1),
                0 4px 8px rgba(194, 65, 12, 0.2);
              text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
              
              &:before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(
                  90deg,
                  transparent,
                  rgba(194, 65, 12, 0.1),
                  transparent
                );
                transition: left 0.5s;
              }

              &:hover:before {
                left: 100%;
              }

              &:hover {
                background: linear-gradient(145deg, #ffffff, #fff7ed);
                border-color: #fb923c;
                border-top-color: #fdba74;
                border-left-color: #fdba74;
                box-shadow: 
                  inset 2px 2px 4px rgba(255, 255, 255, 0.9),
                  inset -2px -2px 4px rgba(194, 65, 12, 0.15),
                  0 6px 12px rgba(194, 65, 12, 0.3);
                transform: translateY(-1px);
              }

              &:active {
                background: linear-gradient(145deg, #fed7aa, #fff7ed);
                border-top-color: #fb923c;
                border-left-color: #fb923c;
                border-bottom-color: #fcd34d;
                border-right-color: #fcd34d;
                box-shadow: 
                  inset -1px -1px 2px rgba(255, 255, 255, 0.9),
                  inset 1px 1px 2px rgba(194, 65, 12, 0.2),
                  0 2px 4px rgba(194, 65, 12, 0.15);
                transform: translateY(1px);
              }

              @media (max-width: ${tabletMaxWidth}) {
                font-size: 1rem;
              }
            `}
          >
            <Icon icon="reply" />
            <span style={{ marginLeft: '1rem' }}>Respond to Chess Message</span>
          </button>
        )}
      </div>
    </NewModal>
  );
}
