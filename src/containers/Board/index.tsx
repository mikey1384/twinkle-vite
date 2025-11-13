import React from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import { css } from '@emotion/css';
import PhaserBoard from './renderer/PhaserBoard';

export default function Board() {
  return (
    <ErrorBoundary componentPath="Board/index">
      <div className={pageClass}>
        <section className={boardFrameClass}>
          <header className={headerClass}>
            <h1>prototype board</h1>
            <p>grass tiles only · fog of war · phaser</p>
          </header>
          <div className={boardStageClass}>
            <PhaserBoard rows={17} cols={17} zoom={3} />
          </div>
        </section>
      </div>
    </ErrorBoundary>
  );
}

const pageClass = css`
  min-height: calc(100vh - 4.5rem);
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: clamp(1.5rem, 3vw, 3rem);
  background: #030712;
`;

const boardFrameClass = css`
  width: min(94vw, 70rem);
  background: linear-gradient(145deg, rgba(9, 22, 38, 0.9), rgba(1, 5, 10, 0.9));
  border-radius: 1.25rem;
  border: 1px solid rgba(255, 255, 255, 0.06);
  padding: clamp(1.2rem, 2.2vw, 1.6rem);
  box-shadow: 0 25px 55px rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
`;

const headerClass = css`
  text-align: center;
  color: #edf6ff;
  h1 {
    text-transform: uppercase;
    letter-spacing: 0.35rem;
    font-size: clamp(1.1rem, 2vw, 1.4rem);
    font-weight: 700;
    margin-bottom: 0.15rem;
  }
  p {
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.2rem;
    color: rgba(255, 255, 255, 0.65);
  }
`;

const boardStageClass = css`
  width: 100%;
  height: min(70vh, 70vw);
  display: grid;
  place-items: center;
`;
