import React, { useState, useEffect } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import ChessPuzzle from './ChessPuzzle';
import { LichessPuzzle } from './helpers/puzzleHelpers';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';

export default function ChessPuzzleModal({ onHide }: { onHide: () => void }) {
  const [puzzle, setPuzzle] = useState<LichessPuzzle | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchRandomPuzzle = async () => {
    setLoading(true);
    try {
      // For now, use a sample puzzle. Later this can be replaced with API call
      const samplePuzzle: LichessPuzzle = {
        id: `puzzle_${Date.now()}`,
        fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 4 4',
        moves: ['d1h5', 'g6h5'], // Queen to h5 threatens mate, black must respond
        rating: 1200,
        ratingDeviation: 100,
        popularity: 85,
        nbPlays: 1500,
        themes: ['mateIn2', 'attack'],
        gameUrl: ''
      };

      setPuzzle(samplePuzzle);
    } catch (error) {
      console.error('Failed to fetch puzzle:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePuzzleComplete = (result: {
    solved: boolean;
    xpEarned: number;
    timeSpent: number;
    attemptsUsed: number;
  }) => {
    // Show completion message
    console.log('Puzzle completed:', result);

    // Auto-load next puzzle after a delay
    setTimeout(() => {
      fetchRandomPuzzle();
    }, 3000);
  };

  const handleGiveUp = () => {
    // Load new puzzle
    setTimeout(() => {
      fetchRandomPuzzle();
    }, 1000);
  };

  // Load initial puzzle
  useEffect(() => {
    fetchRandomPuzzle();
  }, []);

  return (
    <Modal
      large
      closeWhenClickedOutside={false}
      onHide={onHide}
      modalStyle={{
        height: '85vh',
        maxHeight: '900px'
      }}
    >
      <header>Chess Puzzles</header>
      <main
        className={css`
          padding: 1rem !important;
          overflow-y: auto;
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;

          box-sizing: border-box;
        `}
      >
        {loading ? (
          <div
            className={css`
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              height: 400px;
              gap: 1rem;
            `}
          >
            <div
              className={css`
                font-size: 3rem;
                animation: spin 2s linear infinite;

                @keyframes spin {
                  from {
                    transform: rotate(0deg);
                  }
                  to {
                    transform: rotate(360deg);
                  }
                }
              `}
            >
              ♞
            </div>
            <div
              className={css`
                font-size: 1.375rem;
                font-weight: 600;
                color: ${Color.darkerGray()};
              `}
            >
              Loading chess puzzle...
            </div>
          </div>
        ) : puzzle ? (
          <div
            className={css`
              width: 100%;
              max-width: 800px;
              height: 100%;
              padding: 1rem;
              display: flex;
              flex-direction: column;
              justify-content: center;

              box-sizing: border-box;
            `}
          >
            <ChessPuzzle
              puzzle={puzzle}
              onPuzzleComplete={handlePuzzleComplete}
              onGiveUp={handleGiveUp}
              onNewPuzzle={fetchRandomPuzzle}
              loading={loading}
            />
          </div>
        ) : (
          <div
            className={css`
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              height: 400px;
              gap: 1rem;
            `}
          >
            <div>Failed to load puzzle</div>
            <Button onClick={fetchRandomPuzzle} color="logoBlue">
              Try Again
            </Button>
          </div>
        )}
      </main>
      <footer>
        <Button transparent onClick={onHide}>
          Close
        </Button>
      </footer>
    </Modal>
  );
}
