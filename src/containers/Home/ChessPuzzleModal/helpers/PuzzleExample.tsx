import React, { useState, useEffect } from 'react';
import ChessPuzzle from '../ChessPuzzle';
import { LichessPuzzle } from '../helpers/puzzleHelpers';

// Example of how to use the ChessPuzzle component with Lichess API
export default function PuzzleExample() {
  const [puzzle, setPuzzle] = useState<LichessPuzzle | null>(null);
  const [loading, setLoading] = useState(false);
  const [totalXP, setTotalXP] = useState(0);
  const [puzzlesSolved, setPuzzlesSolved] = useState(0);

  const fetchRandomPuzzle = async () => {
    setLoading(true);
    try {
      // Lichess API endpoint for random puzzle
      const response = await fetch('https://lichess.org/api/puzzle/daily');
      const data = await response.json();

      // Transform the response to match our LichessPuzzle interface
      const lichessPuzzle: LichessPuzzle = {
        id: data.puzzle.id,
        fen: data.puzzle.fen,
        moves: data.puzzle.solution, // Lichess calls it 'solution' instead of 'moves'
        rating: data.puzzle.rating,
        ratingDeviation: data.puzzle.ratingDeviation || 100,
        popularity: data.puzzle.popularity || 50,
        nbPlays: data.puzzle.nbPlays || 1000,
        themes: data.puzzle.themes || ['middlegame'],
        gameUrl: data.game?.id ? `https://lichess.org/${data.game.id}` : ''
      };

      setPuzzle(lichessPuzzle);
    } catch (error) {
      console.error('Failed to fetch puzzle:', error);

      // Fallback: Use a sample puzzle if API fails
      const samplePuzzle: LichessPuzzle = {
        id: 'sample001',
        fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 4 4',
        moves: ['d1h5', 'g6h5'], // Sample: Queen to h5 threatens mate, black must block
        rating: 1200,
        ratingDeviation: 100,
        popularity: 85,
        nbPlays: 1500,
        themes: ['mateIn2', 'attack'],
        gameUrl: ''
      };

      setPuzzle(samplePuzzle);
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

    // Optionally auto-load next puzzle after a delay
    setTimeout(() => {
      fetchRandomPuzzle();
    }, 3000);
  };

  const handleGiveUp = () => {
    // Optionally show solution or explanation
    console.log('User gave up on puzzle');

    // Load new puzzle
    setTimeout(() => {
      fetchRandomPuzzle();
    }, 1000);
  };

  // Load initial puzzle
  useEffect(() => {
    fetchRandomPuzzle();
  }, []);

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '400px',
          background: '#f5f5f5',
          borderRadius: '8px'
        }}
      >
        <div>Loading chess puzzle...</div>
      </div>
    );
  }

  if (!puzzle) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '400px',
          background: '#f5f5f5',
          borderRadius: '8px',
          gap: '1rem'
        }}
      >
        <div>Failed to load puzzle</div>
        <button
          onClick={fetchRandomPuzzle}
          style={{
            background: '#007bff',
            color: 'white',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1rem' }}>
      {/* Stats Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
          padding: '1rem',
          background: '#e3f2fd',
          borderRadius: '8px'
        }}
      >
        <h2 style={{ margin: 0 }}>Chess Puzzles</h2>
        <div style={{ display: 'flex', gap: '2rem' }}>
          <div>
            <strong>Puzzles Solved:</strong> {puzzlesSolved}
          </div>
          <div>
            <strong>Total XP:</strong> {totalXP}
          </div>
        </div>
      </div>

      {/* Puzzle Component */}
      <ChessPuzzle
        puzzle={puzzle}
        onPuzzleComplete={handlePuzzleComplete}
        onGiveUp={handleGiveUp}
      />

      {/* Control Buttons */}
      <div
        style={{
          marginTop: '1rem',
          display: 'flex',
          justifyContent: 'center',
          gap: '0.5rem'
        }}
      >
        <button
          onClick={fetchRandomPuzzle}
          disabled={loading}
          style={{
            background: '#28a745',
            color: 'white',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? 'Loading...' : 'New Puzzle'}
        </button>
      </div>

      {/* XP Calculation Info */}
      <div
        style={{
          marginTop: '1rem',
          padding: '1rem',
          background: '#f8f9fa',
          borderRadius: '8px',
          fontSize: '0.875rem',
          color: '#6c757d'
        }}
      >
        <h4 style={{ margin: '0 0 0.5rem 0' }}>XP Rewards:</h4>
        <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
          <li>Easy puzzles: 50 XP (rating &lt; 1200)</li>
          <li>Medium puzzles: 100 XP (rating 1200-1600)</li>
          <li>Hard puzzles: 200 XP (rating 1600-2000)</li>
          <li>Expert puzzles: 400 XP (rating &gt; 2000)</li>
          <li>Speed bonus: +50% for solving in &lt;30s, +20% for &lt;60s</li>
          <li>Multiple attempts reduce XP (max 3 attempts)</li>
        </ul>
      </div>
    </div>
  );
}

/*
Example usage in your app:

import PuzzleExample from './containers/Chat/Chess/examples/PuzzleExample';

// In your component or page:
<PuzzleExample />

*/
