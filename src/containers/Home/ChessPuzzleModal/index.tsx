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
  const [totalXP, setTotalXP] = useState(0);
  const [puzzlesSolved, setPuzzlesSolved] = useState(0);

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
    if (result.solved) {
      setTotalXP((prev) => prev + result.xpEarned);
      setPuzzlesSolved((prev) => prev + 1);
    }

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
      <header>
        <div
          className={css`
            display: flex;
            justify-content: space-between;
            align-items: center;
            width: 100%;
          `}
        >
          <span>Chess Puzzles</span>
          <div
            className={css`
              display: flex;
              gap: 2rem;
              font-size: 1.3rem;
              color: ${Color.darkerGray()};
            `}
          >
            <div>
              <strong>Solved:</strong> {puzzlesSolved}
            </div>
            <div>
              <strong>XP:</strong> {totalXP}
            </div>
          </div>
        </div>
      </header>
      <main
        className={css`
          padding: 1rem !important;
          overflow-y: auto;
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          align-items: center;
        `}
      >
        {loading ? (
          <div
            className={css`
              display: flex;
              justify-content: center;
              align-items: center;
              height: 400px;
              font-size: 1.5rem;
              color: ${Color.darkerGray()};
            `}
          >
            Loading chess puzzle...
          </div>
        ) : puzzle ? (
          <div style={{ width: '100%', maxWidth: '800px' }}>
            <ChessPuzzle
              puzzle={puzzle}
              onPuzzleComplete={handlePuzzleComplete}
              onGiveUp={handleGiveUp}
            />

            {/* Control Buttons */}
            <div
              className={css`
                margin-top: 1.5rem;
                display: flex;
                justify-content: center;
                gap: 1rem;
              `}
            >
              <Button
                onClick={fetchRandomPuzzle}
                disabled={loading}
                color="logoBlue"
                style={{
                  opacity: loading ? 0.6 : 1
                }}
              >
                {loading ? 'Loading...' : 'New Puzzle'}
              </Button>
            </div>
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
