import React from 'react';
import StatBar from './StatBar';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import AttemptResult from './AttemptResult';
import ErrorBoundary from '~/components/ErrorBoundary';
import { borderRadius, Color } from '~/constants/css';
import { WordleBonus } from '~/containers/Chat/Body/Collect/Vocabulary/WordBattle/Wordle';

const wordLevelObj: Record<string, any> = {
  1: {
    label: 'basic',
    textColor: 'vantaBlack',
    difficultyColor: 'logoBlue',
    backgroundColor: 'white'
  },
  2: {
    label: 'elementary',
    textColor: 'vantaBlack',
    difficultyColor: 'pink',
    backgroundColor: 'white'
  },
  3: {
    label: 'intermediate',
    textColor: 'vantaBlack',
    difficultyColor: 'orange',
    backgroundColor: 'white'
  },
  4: {
    label: 'advanced',
    textColor: 'vantaBlack',
    difficultyColor: 'cranberry',
    backgroundColor: 'white'
  },
  5: {
    label: 'epic',
    textColor: 'white',
    difficultyColor: 'gold',
    backgroundColor: 'black'
  }
};

export default function OverviewModal({
  attemptState,
  channelId,
  isGameOver,
  isSolved,
  numGuesses,
  solution,
  wordLevel,
  wordleStats,
  onHide
}: {
  attemptState: any;
  channelId?: number;
  isGameOver: boolean;
  isSolved: boolean;
  numGuesses: number;
  solution: string;
  wordLevel: number;
  wordleStats: any;
  onHide: () => void;
}) {
  const footer = (
    <Button variant="ghost" onClick={onHide}>
      Close
    </Button>
  );

  return (
    <Modal
      modalKey="OverviewModal"
      isOpen={true}
      onClose={onHide}
      modalLevel={1}
      size="sm"
      hasHeader
      title={isGameOver ? 'Overview' : 'Your Statistics'}
      footer={footer}
    >
      <ErrorBoundary componentPath="Chat/Modals/WordleModal/OverviewModal">
        <main
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {isGameOver && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                padding: '0.3rem 1rem 1rem 1rem',
                borderRadius,
                boxShadow: `0 0 2px ${Color.borderGray()}`,
                border: '1px solid var(--ui-border)',
                background: Color[wordLevelObj[wordLevel].backgroundColor]()
              }}
            >
              <div
                style={{
                  fontWeight: 'bold',
                  fontSize: '2.5rem',
                  textAlign: 'center',
                  color: Color[wordLevelObj[wordLevel].textColor]()
                }}
              >
                {solution}
              </div>
              <div style={{ fontWeight: 'bold', lineHeight: 1.1 }}>
                <span
                  style={{ color: Color[wordLevelObj[wordLevel].textColor]() }}
                >
                  Level:{' '}
                </span>
                <span
                  style={{
                    color: Color[wordLevelObj[wordLevel].difficultyColor](),
                    textTransform: 'capitalize'
                  }}
                >
                  {wordLevelObj[wordLevel].label}
                </span>
              </div>
            </div>
          )}
          {isGameOver && (
            <AttemptResult
              style={{ marginTop: '4rem' }}
              isSolved={isSolved}
              numGuesses={numGuesses}
              attemptState={attemptState}
            />
          )}
          {/* The win stays a celebration; the word's monster is an optional
              bonus below it (also after a miss: a second chance at the word). */}
          {isGameOver && !!channelId && (
            <WordleBonus channelId={channelId} isSolved={isSolved} />
          )}
          <StatBar
            style={{ marginTop: isGameOver ? '3.5rem' : 0 }}
            isGameOver={isGameOver}
            stats={wordleStats}
          />
        </main>
      </ErrorBoundary>
    </Modal>
  );
}
