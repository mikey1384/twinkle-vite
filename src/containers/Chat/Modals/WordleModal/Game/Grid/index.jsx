import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { MAX_GUESSES } from '../../constants/settings';
import CompletedRow from './CompletedRow';
import CurrentRow from './CurrentRow';
import EmptyRow from './EmptyRow';
import { gridContainer } from './Styles';

Grid.propTypes = {
  guesses: PropTypes.array,
  currentGuess: PropTypes.string,
  isRevealing: PropTypes.bool,
  isWaving: PropTypes.bool,
  currentRowClassName: PropTypes.string,
  maxWordLength: PropTypes.number,
  solution: PropTypes.string
};

export default function Grid({
  guesses,
  currentGuess,
  isRevealing,
  isWaving,
  currentRowClassName,
  maxWordLength,
  solution
}) {
  const empties = useMemo(
    () =>
      guesses.length < MAX_GUESSES - 1
        ? Array(MAX_GUESSES - 1 - guesses.length).fill()
        : [],
    [guesses.length]
  );

  return (
    <div className={gridContainer}>
      {guesses.map((guess, i) => (
        <CompletedRow
          key={i}
          guess={guess}
          isRevealing={isRevealing && guesses.length - 1 === i}
          isWaving={isWaving && guesses.length - 1 === i}
          solution={solution}
        />
      ))}
      {guesses.length < MAX_GUESSES && (
        <CurrentRow
          guess={currentGuess}
          className={currentRowClassName}
          maxWordLength={maxWordLength}
        />
      )}
      {empties.map((_, i) => (
        <EmptyRow key={i} maxWordLength={maxWordLength} />
      ))}
    </div>
  );
}
