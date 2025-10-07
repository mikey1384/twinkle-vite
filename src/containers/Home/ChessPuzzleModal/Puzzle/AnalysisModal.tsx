import React from 'react';
import { css } from '@emotion/css';
import { tabletMaxWidth } from '~/constants/css';
import Icon from '~/components/Icon';

interface MoveAnalysis {
  userMove: string;
  expectedMove?: string;
  engineSuggestion?: string;
  evaluation?: number;
  mate?: number;
  isCorrect: boolean;
  timestamp: number;
  isEngine?: boolean;
  fen?: string;
}

interface AnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  moveHistory: MoveAnalysis[];
  puzzleResult?: 'solved' | 'failed' | 'gave_up';
  onExploreFrom?: (plyIndex: number) => void;
  onExploreFinal?: () => void;
  canExplore?: boolean;
}

export default function AnalysisModal({
  isOpen,
  onClose,
  moveHistory,
  puzzleResult,
  onExploreFrom,
  onExploreFinal,
  canExplore
}: AnalysisModalProps) {
  if (!isOpen) return null;

  const getResultIcon = () => {
    switch (puzzleResult) {
      case 'solved':
        return '🎉';
      case 'failed':
        return '❌';
      case 'gave_up':
        return '🏳️';
      default:
        return '📊';
    }
  };

  const getResultText = () => {
    switch (puzzleResult) {
      case 'solved':
        return 'Puzzle Solved!';
      case 'failed':
        return 'Puzzle Failed';
      case 'gave_up':
        return 'Gave Up';
      default:
        return 'Analysis';
    }
  };

  return (
    <div className={overlayCSS}>
      <div className={modalCSS}>
        <div className={headerCSS}>
          <div className={titleCSS}>
            <span style={{ marginRight: '0.5rem' }}>{getResultIcon()}</span>
            {getResultText()}
          </div>
          <button onClick={onClose} className={closeButtonCSS}>
            <Icon icon="times" />
          </button>
        </div>

        <div className={contentCSS}>
          {moveHistory.length === 0 ? (
            <div className={emptyStateCSS}>
              <span>📝</span>
              <p>No moves were made in this puzzle</p>
            </div>
          ) : (
            <div className={moveListCSS}>
              <div className={moveHeaderCSS}>
                <span>Move Analysis</span>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {canExplore && (
                    <button
                      className={css`
                        font-size: 0.85rem;
                        font-weight: 700;
                        color: #111827;
                        background: #e5e7eb;
                        border: 1px solid #d1d5db;
                        border-radius: 6px;
                        padding: 0.25rem 0.5rem;
                        cursor: pointer;
                        @media (hover: hover) and (pointer: fine) {
                          &:hover {
                            background: #f3f4f6;
                          }
                        }
                      `}
                      onClick={() => onExploreFinal?.()}
                    >
                      Explore final position
                    </button>
                  )}
                  <span className={moveCountCSS}>
                    {moveHistory.length} move
                    {moveHistory.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {moveHistory.map((move, index) => (
                <div
                  key={index}
                  className={
                    move.isEngine
                      ? engineMoveItemCSS
                      : moveItemCSS(move.isCorrect)
                  }
                >
                  <div className={moveNumberCSS}>{index + 1}</div>

                  <div className={moveDetailsCSS}>
                    <div className={userMoveCSS}>
                      <span className={moveLabelCSS}>
                        {move.isEngine ? 'Engine move:' : 'Your move:'}
                      </span>
                      <span className={moveValueCSS(move.isCorrect)}>
                        {move.userMove}
                      </span>
                      <span className={moveStatusCSS}>
                        {move.isEngine ? '🤖' : move.isCorrect ? '✓' : '✗'}
                      </span>
                    </div>

                    {!move.isEngine && move.expectedMove && (
                      <div className={expectedMoveCSS}>
                        <span className={moveLabelCSS}>Expected:</span>
                        <span className={moveValueCSS(true)}>
                          {move.expectedMove}
                        </span>
                      </div>
                    )}

                    {!move.isEngine &&
                      move.engineSuggestion &&
                      move.engineSuggestion !== move.expectedMove && (
                        <div className={engineMoveCSS}>
                          <span className={moveLabelCSS}>Engine suggests:</span>
                          <span className={moveValueCSS(true)}>
                            {move.engineSuggestion}
                          </span>
                        </div>
                      )}

                    {(move.evaluation !== undefined ||
                      move.mate !== undefined) && (
                      <div className={evaluationCSS}>
                        <span className={moveLabelCSS}>Evaluation:</span>
                        <span
                          className={evaluationValueCSS(move.evaluation || 0)}
                        >
                          {move.mate !== undefined
                            ? move.mate === 0
                              ? 'Checkmate'
                              : `Mate in ${Math.abs(move.mate)}`
                            : move.evaluation !== undefined &&
                              move.evaluation !== null
                            ? `${
                                move.evaluation > 0 ? '+' : ''
                              }${move.evaluation.toFixed(2)}`
                            : '—'}
                        </span>
                      </div>
                    )}
                    {canExplore && (
                      <div style={{ marginTop: '0.25rem' }}>
                        <button
                          className={css`
                            font-size: 0.8rem;
                            font-weight: 700;
                            color: #0f172a;
                            background: #e2e8f0;
                            border: 1px solid #cbd5e1;
                            border-radius: 6px;
                            padding: 0.2rem 0.5rem;
                            cursor: pointer;
                            @media (hover: hover) and (pointer: fine) {
                              &:hover {
                                background: #eef2f7;
                              }
                            }
                          `}
                          onClick={() => onExploreFrom?.(index + 1)}
                        >
                          Explore from here
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={footerCSS}>
          <button onClick={onClose} className={closeFooterButtonCSS}>
            Close Analysis
          </button>
        </div>
      </div>
    </div>
  );
}

const overlayCSS = css`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`;

const modalCSS = css`
  background: white;
  border-radius: 12px;
  max-width: 600px;
  width: 100%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);

  @media (max-width: ${tabletMaxWidth}) {
    max-height: 90vh;
    margin: 0.5rem;
  }
`;

const headerCSS = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
`;

const titleCSS = css`
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  display: flex;
  align-items: center;
`;

const closeButtonCSS = css`
  cursor: pointer;
  background: none;
  border: none;
  font-size: 1.25rem;
  color: #6b7280;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.15s ease;

  @media (hover: hover) and (pointer: fine) {
    &:hover {
      background: #f3f4f6;
      color: #374151;
    }
  }
`;

const contentCSS = css`
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
`;

const emptyStateCSS = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
  color: #6b7280;

  span {
    font-size: 3rem;
    margin-bottom: 1rem;
  }

  p {
    font-size: 1.1rem;
    margin: 0;
  }
`;

const moveListCSS = css`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const moveHeaderCSS = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #e5e7eb;
  font-weight: 600;
  color: #374151;
`;

const moveCountCSS = css`
  font-size: 0.9rem;
  color: #6b7280;
  background: #f3f4f6;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
`;

const moveItemCSS = (isCorrect: boolean) => css`
  display: flex;
  gap: 1rem;
  padding: 1rem;
  border-radius: 8px;
  border: 2px solid ${isCorrect ? '#22c55e' : '#ef4444'};
  background: ${isCorrect ? '#f0fdf4' : '#fef2f2'};
`;

const engineMoveItemCSS = css`
  display: flex;
  gap: 1rem;
  padding: 1rem;
  border-radius: 8px;
  border: 2px solid #3b82f6;
  background: #eff6ff;
`;

const moveNumberCSS = css`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  background: #374151;
  color: white;
  border-radius: 50%;
  font-weight: 600;
  font-size: 0.9rem;
  flex-shrink: 0;
`;

const moveDetailsCSS = css`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const userMoveCSS = css`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const expectedMoveCSS = css`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.9rem;
`;

const engineMoveCSS = css`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.9rem;
`;

const evaluationCSS = css`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.9rem;
`;

const moveLabelCSS = css`
  color: #6b7280;
  font-weight: 500;
  min-width: 6rem;
`;

const moveValueCSS = (isCorrect: boolean) => css`
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-weight: 600;
  color: ${isCorrect ? '#059669' : '#dc2626'};
  background: ${isCorrect ? '#ecfdf5' : '#fef2f2'};
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  border: 1px solid ${isCorrect ? '#a7f3d0' : '#fecaca'};
`;

const moveStatusCSS = css`
  font-size: 1.1rem;
  margin-left: auto;
`;

const evaluationValueCSS = (evaluation: number) => css`
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-weight: 600;
  color: ${evaluation > 0 ? '#059669' : evaluation < 0 ? '#dc2626' : '#6b7280'};
  background: ${evaluation > 0
    ? '#ecfdf5'
    : evaluation < 0
    ? '#fef2f2'
    : '#f9fafb'};
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  border: 1px solid
    ${evaluation > 0 ? '#a7f3d0' : evaluation < 0 ? '#fecaca' : '#e5e7eb'};
`;

const footerCSS = css`
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: center;
`;

const closeFooterButtonCSS = css`
  cursor: pointer;
  background: #374151;
  border: 2px solid #1f2937;
  color: white;
  font-weight: 600;
  font-size: 1rem;
  border-radius: 6px;
  padding: 0.75rem 2rem;
  transition: all 0.15s ease;
  box-shadow: 0 2px 0 #1f2937;

  @media (hover: hover) and (pointer: fine) {
    &:hover {
      background: #1f2937;
      transform: translateY(1px);
      box-shadow: 0 1px 0 #1f2937;
    }
  }

  &:active {
    background: #111827;
    transform: translateY(2px);
    box-shadow: none;
  }
`;
