import React, { useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import { css } from '@emotion/css';

interface Word {
  word: string;
  ranking: number;
  color: string;
}

// Example word list with rankings
const words: Word[] = [
  { word: 'Basic', ranking: 1, color: '#ffebcd' },
  { word: 'Elementary', ranking: 2, color: '#c0f2d1' },
  { word: 'Intermediate', ranking: 3, color: '#b3d9ff' },
  { word: 'Advanced', ranking: 4, color: '#ff9999' },
  { word: 'Epic', ranking: 5, color: '#c6b2fe' }
];

export default function DailyRewardModal({ onHide }: { onHide: () => void }) {
  const [currentWord, setCurrentWord] = useState('');
  const [chosenWord, setChosenWord] = useState<Word | null>(null);
  const [isRevealing, setIsRevealing] = useState(false);

  const wordDisplayStyle = css`
    color: ${chosenWord?.color || '#000'};
    font-size: 2.5rem;
    font-weight: bold;
    margin-top: 30px;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 60px; // Keeps the layout stable
  `;

  return (
    <Modal onHide={onHide}>
      <header>Daily Reward</header>
      <main>
        {!isRevealing && !chosenWord && (
          <button onClick={handleReveal}>Reveal</button>
        )}
        <div className={wordDisplayStyle}>{currentWord}</div>
      </main>
      <footer>
        <Button transparent onClick={onHide}>
          Close
        </Button>
      </footer>
    </Modal>
  );

  function handleReveal() {
    setIsRevealing(true);
    const chosen = words[Math.floor(Math.random() * words.length)];
    setChosenWord(chosen);

    let currentIndex = 0;
    let interval = 1000; // initial speed in ms
    let isFirstIteration = true;
    let fastIterations = 0; // Counter for complete cycles at 100ms speed

    const reveal = () => {
      if (words[currentIndex] === chosen && fastIterations >= 5) {
        setIsRevealing(false);
        setCurrentWord(chosen.word);
      } else {
        setCurrentWord(words[currentIndex].word);
        currentIndex = (currentIndex + 1) % words.length;

        // Increment fastIterations at the end of each cycle when the interval is 100ms or less
        if (currentIndex === 0 && interval <= 100) {
          fastIterations++;
        }

        // Check if the first iteration is complete
        if (currentIndex === 0 && isFirstIteration) {
          isFirstIteration = false;
        } else if (!isFirstIteration && interval > 100) {
          interval *= 0.9; // Shorten the interval only after the first iteration
        }

        setTimeout(reveal, interval);
      }
    };
    setTimeout(reveal, interval);
  }
}
