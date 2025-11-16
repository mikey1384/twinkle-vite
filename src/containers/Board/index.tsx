import React, { useCallback, useEffect, useRef } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import PhaserBoard, { BoardControls } from './renderer/PhaserBoard';

export default function Board() {
  const moveCameraRef = useRef<
    ((deltaRow: number, deltaCol: number) => void) | null
  >(null);

  const handleBoardReady = useCallback((controls: BoardControls) => {
    moveCameraRef.current = controls.moveCamera;
  }, []);

  const handleMove = useCallback((deltaRow: number, deltaCol: number) => {
    moveCameraRef.current?.(deltaRow, deltaCol);
  }, []);

  useEffect(() => {
    return () => {
      moveCameraRef.current = null;
    };
  }, []);

  return (
    <ErrorBoundary componentPath="Board/index">
      <div className={pageClass}>
        <div className={boardStageClass}>
          <PhaserBoard rows={17} cols={17} zoom={3} onReady={handleBoardReady} />
          <CameraControls onMove={handleMove} />
        </div>
      </div>
    </ErrorBoundary>
  );
}

const pageClass = css`
  min-height: calc(100vh - 4.5rem);
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: stretch;
  background: radial-gradient(circle at top, #071326, #03050c 60%);
  padding: 0;
  @media (max-width: ${mobileMaxWidth}) {
    min-height: 100vh;
  }
`;

const boardStageClass = css`
  flex: 1;
  height: calc(100vh - 4.5rem);
  display: flex;
  align-items: stretch;
  justify-content: center;
  position: relative;
  overflow: hidden;
  @media (max-width: ${mobileMaxWidth}) {
    height: 100vh;
  }
`;

const controlsWrapperClass = css`
  position: absolute;
  bottom: clamp(1rem, 2vw, 2.5rem);
  right: clamp(1rem, 2vw, 2.5rem);
  width: clamp(6rem, 14vw, 8rem);
  height: clamp(6rem, 14vw, 8rem);
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  gap: 0.3rem;
  pointer-events: none;
`;

const controlButtonClass = css`
  pointer-events: auto;
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 0.75rem;
  background: rgba(3, 7, 18, 0.65);
  color: rgba(255, 255, 255, 0.85);
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s ease, transform 0.15s ease;
  backdrop-filter: blur(12px);
  &:hover {
    background: rgba(12, 35, 68, 0.85);
    transform: translateY(-1px);
  }
  &:active {
    transform: translateY(1px);
  }
`;

interface CameraControlsProps {
  onMove: (deltaRow: number, deltaCol: number) => void;
}

function CameraControls({ onMove }: CameraControlsProps) {
  return (
    <div className={controlsWrapperClass}>
      <span />
      <button
        className={controlButtonClass}
        aria-label="Move up"
        onClick={() => onMove(-1, 0)}
      >
        ↑
      </button>
      <span />
      <button
        className={controlButtonClass}
        aria-label="Move left"
        onClick={() => onMove(0, -1)}
      >
        ←
      </button>
      <span />
      <button
        className={controlButtonClass}
        aria-label="Move right"
        onClick={() => onMove(0, 1)}
      >
        →
      </button>
      <span />
      <button
        className={controlButtonClass}
        aria-label="Move down"
        onClick={() => onMove(1, 0)}
      >
        ↓
      </button>
      <span />
    </div>
  );
}
