# Chess Puzzle Modal

A React-based chess puzzle system with never-ending puzzle flow, Web Worker-powered engine analysis, and robust error handling.

## Architecture

### Components

- `ChessPuzzleModal` - Main modal container with error boundary
- `ChessPuzzle` - Core puzzle game logic and UI
- `ChessBoard` - Interactive chess board component
- `ChessErrorBoundary` - Error boundary for graceful error handling

### Hooks

- `useChessPuzzle` - Data management hook for puzzle fetching and submission
- `useChessEngine` - Web Worker hook for chess engine analysis

### Types

- `PuzzleResult` - Result data structure for completed puzzles
- `PuzzleStatus` - Puzzle state enumeration
- `MoveResult` - Move validation result structure

## Features

### Never-ending Puzzle Flow

1. Client requests puzzle with `GET /api/chess/puzzle?token=xyz`
2. Player completes puzzle
3. Client submits with `POST /api/chess/attempt`
4. Server responds with next puzzle immediately (no extra round-trip)
5. UI swaps to new puzzle seamlessly

### Performance Optimizations

- **Web Worker**: Heavy chess engine calculations moved off main thread
- **Immutable Updates**: Efficient board state management
- **Memoized Components**: Reduced re-renders with React.memo
- **Development Guards**: Console logs only in development mode
- **Simplified Logic**: Removed unnecessary opponent tracking for puzzle mode

### Error Handling

- **Error Boundary**: Catches and displays user-friendly error messages
- **Retry Logic**: Automatic fallback to new puzzle on API failures
- **Graceful Degradation**: System continues working even if engine fails

## Usage

```tsx
import ChessPuzzleModal from './ChessPuzzleModal';

function App() {
  const [showPuzzles, setShowPuzzles] = useState(false);

  return (
    <>
      <button onClick={() => setShowPuzzles(true)}>Play Chess Puzzles</button>

      {showPuzzles && <ChessPuzzleModal onHide={() => setShowPuzzles(false)} />}
    </>
  );
}
```

## API Integration

### Current (Mock)

The system currently uses mock data for development. Replace the mock calls in `useChessPuzzle.ts`:

```typescript
// Replace this mock implementation
const samplePuzzle: LichessPuzzle = {
  /* mock data */
};

// With actual API calls
const res = await fetch('/api/chess/puzzle', { credentials: 'include' });
const data = await res.json();
```

### Future (Production)

- `GET /api/chess/puzzle` - Fetch puzzle based on user rating
- `POST /api/chess/attempt` - Submit attempt and get next puzzle
- Glicko-2 rating system integration
- XP and streak tracking

## Development

### Running Locally

1. Ensure `public/engineWorker.js` is accessible
2. Start development server
3. Open chess puzzle modal
4. Check browser console for debug logs (development mode only)

### Testing

- Test error boundary by throwing errors in components
- Test Web Worker by monitoring network tab (no main thread blocking)
- Test never-ending flow by completing multiple puzzles

## File Structure

```
ChessPuzzleModal/
├── index.tsx                 # Main modal component
├── ChessPuzzle.tsx          # Core puzzle logic
├── ChessBoard.tsx           # Interactive board
├── components/
│   └── ChessErrorBoundary.tsx
├── hooks/
│   ├── useChessPuzzle.ts    # Data management
│   └── useChessEngine.ts    # Web Worker engine
├── helpers/
│   ├── puzzleHelpers.ts     # Puzzle conversion utilities
│   └── chessLogic.ts        # Chess game logic
├── types/
│   └── index.ts             # Type definitions
└── README.md                # This file
```
