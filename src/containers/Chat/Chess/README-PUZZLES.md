# Chess Puzzle Integration for Twinkle

This document explains how to integrate Lichess chess puzzles with your existing Twinkle chess component to create an XP-based puzzle solving feature.

## 🎯 What's Included

### 1. **Translation Layer** (`helpers/puzzleHelpers.ts`)

- Converts Lichess puzzle data (FEN, UCI moves) to your chess component format
- Handles coordinate conversion between UCI notation and square indices
- Calculates XP rewards based on difficulty and performance
- Support for both white and black player perspectives

### 2. **Puzzle Component** (`ChessPuzzle.tsx`)

- Ready-to-use React component that wraps your existing Chess component
- Handles puzzle state, move validation, and progression
- Beautiful UI with difficulty indicators, hints, and status messages
- Tracks attempts, time spent, and calculates XP rewards

### 3. **Example Implementation** (`examples/PuzzleExample.tsx`)

- Complete working example with Lichess API integration
- Fallback sample puzzle for offline testing
- Stats tracking (puzzles solved, total XP)
- Auto-progression to next puzzle

## 🚀 Quick Start

### Basic Usage

```tsx
import ChessPuzzle from './containers/Chat/Chess/ChessPuzzle';
import { LichessPuzzle } from './containers/Chat/Chess/helpers/puzzleHelpers';

const puzzle: LichessPuzzle = {
  id: 'abc123',
  fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 4 4',
  moves: ['d1h5', 'g6h5'], // UCI notation: first move is opponent's, rest is solution
  rating: 1200,
  themes: ['mateIn2', 'attack']
  // ... other fields
};

<ChessPuzzle
  puzzle={puzzle}
  onPuzzleComplete={(result) => {
    console.log(`XP earned: ${result.xpEarned}`);
  }}
/>;
```

### Fetching from Lichess API

```tsx
// Daily puzzle
const response = await fetch('https://lichess.org/api/puzzle/daily');
const data = await response.json();

// Random puzzle by theme
const response = await fetch('https://lichess.org/api/puzzle?themes=mateIn2');
const data = await response.json();
```

## 🎮 How It Works

### Puzzle Flow

1. **Setup**: Loads FEN position and converts to your board format
2. **Opponent Move**: Automatically plays the first move from the solution
3. **Player Turn**: User must find the correct sequence of moves
4. **Validation**: Each move is checked against the expected solution
5. **Completion**: XP is awarded based on performance

### Move Validation

- Compares user moves in UCI format (`e2e4`) with expected solution
- Allows up to 3 attempts before marking puzzle as failed
- Tracks time spent for bonus XP calculation

### XP Calculation

```typescript
const xp = calculatePuzzleXP({
  difficulty: 'medium', // based on puzzle rating
  solved: true,
  attemptsUsed: 1,
  timeSpent: 25 // seconds
});
// Result: 150 XP (100 base + 50% speed bonus)
```

## 📊 XP Reward System

| Difficulty | Rating Range | Base XP | Speed Bonus | Max XP |
| ---------- | ------------ | ------- | ----------- | ------ |
| Easy       | < 1200       | 50      | +25 (50%)   | 75     |
| Medium     | 1200-1600    | 100     | +50 (50%)   | 150    |
| Hard       | 1600-2000    | 200     | +100 (50%)  | 300    |
| Expert     | > 2000       | 400     | +200 (50%)  | 600    |

**Bonuses:**

- **Speed**: +50% for solving in <30s, +20% for <60s
- **First Try**: Full XP for solving without hints or wrong moves

**Penalties:**

- **Multiple Attempts**: -20% XP per additional attempt
- **Failed Puzzle**: 0 XP

## 🔧 Customization

### Custom Difficulty Mapping

```typescript
export function getPuzzleDifficulty(
  rating: number
): 'easy' | 'medium' | 'hard' | 'expert' {
  if (rating < 1000) return 'easy'; // Adjust thresholds
  if (rating < 1400) return 'medium'; // to match your users
  if (rating < 1800) return 'hard';
  return 'expert';
}
```

### Custom XP Rewards

```typescript
const baseXP = {
  easy: 25, // Lower rewards
  medium: 50, // for easier puzzles
  hard: 100,
  expert: 200
};
```

### Theming Integration

The puzzle component uses your existing Twinkle color system from `~/constants/css`.

## 🔌 API Integration

### Lichess Endpoints

- **Daily Puzzle**: `https://lichess.org/api/puzzle/daily`
- **Random Puzzle**: `https://lichess.org/api/puzzle`
- **By Theme**: `https://lichess.org/api/puzzle?themes=endgame,mateIn2`
- **By Rating**: `https://lichess.org/api/puzzle?rating=1500`

### Alternative APIs

- **Chess.com**: Requires authentication, more limited
- **ChessKid**: Educational focus, simpler puzzles
- **Self-hosted**: Create your own puzzle database

## 🧪 Testing

### Sample Puzzle for Development

```typescript
const testPuzzle: LichessPuzzle = {
  id: 'test001',
  fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 4 4',
  moves: ['d1h5', 'g6h5'], // Queen to h5, black blocks with g6
  rating: 1200,
  themes: ['mateIn2']
  // ... other required fields
};
```

## 💡 Integration Tips

1. **Gradual Rollout**: Start with easier puzzles for new users
2. **Progress Tracking**: Store user's puzzle rating and adapt difficulty
3. **Daily Challenges**: Feature a "Puzzle of the Day" with bonus XP
4. **Leaderboards**: Track top puzzle solvers for community engagement
5. **Achievement System**: Unlock badges for solving streaks, fast times, etc.

## 🔄 Data Flow

```
Lichess API → puzzleHelpers.ts → ChessPuzzle.tsx → Chess.tsx
     ↓              ↓                   ↓              ↓
  Raw Data → Converted Format → UI State → Board State
```

Your existing Chess component remains unchanged - the puzzle system just provides it with properly formatted initial states and validates the resulting moves.

## 🎉 Perfect Integration!

The beauty of this approach is that **your existing Chess component works perfectly** with Lichess puzzles. The translation layer handles all the format conversion, so you get:

- ✅ Full compatibility with your current chess implementation
- ✅ Zero breaking changes to existing chess games
- ✅ Rich puzzle data from the world's largest chess platform
- ✅ Built-in XP system ready for your gamification features
- ✅ Beautiful, responsive UI that matches Twinkle's design

Ready to give your users an amazing chess puzzle experience! 🚀
