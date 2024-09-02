import React, { useState, useEffect } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import { css } from '@emotion/css';
import CodeEditor from './CodeEditor';
import DraggableWindow from './DraggableWindow';
import Simulator from './Simulator';

export default function Build() {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  useEffect(() => {
    const updateWindowSize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };

    window.addEventListener('resize', updateWindowSize);
    return () => window.removeEventListener('resize', updateWindowSize);
  }, []);

  const initialPosition = {
    x: Math.max(0, windowSize.width - 320),
    y: 20
  };

  return (
    <ErrorBoundary componentPath="Build/index">
      <div
        className={css`
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          overflow: hidden;
          display: flex; // Add this
        `}
      >
        <div
          className={css`
            flex: 1;
            overflow: hidden;
          `}
        >
          <CodeEditor />
        </div>
        <div
          className={css`
            width: 50%;
            border-left: 1px solid #ccc;
          `}
        >
          <Simulator />
        </div>
      </div>
      <DraggableWindow initialPosition={initialPosition} />
    </ErrorBoundary>
  );
}
