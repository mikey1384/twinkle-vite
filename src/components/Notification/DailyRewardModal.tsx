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

  const startReveal = () => {
    setIsRevealing(true);
    const chosen = words[Math.floor(Math.random() * words.length)];
    setChosenWord(chosen);

    const allWords = [...words, chosen, chosen]; // Duplicate the chosen word for higher probability
    let currentIndex = 0;
    let speed = 300; // initial speed in ms

    const interval = setInterval(() => {
      if (allWords[currentIndex] === chosen && speed < 100) {
        clearInterval(interval);
        setIsRevealing(false);
        setCurrentWord(chosen.word);
      } else {
        setCurrentWord(allWords[currentIndex].word);
        currentIndex = (currentIndex + 1) % allWords.length;
        speed *= 0.9; // Increase the speed
      }
    }, speed);
  };

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
          <button onClick={startReveal}>Reveal</button>
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
}
