import { useMemo } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import PropTypes from 'prop-types';
import { useKeyContext } from '~/contexts';
import { Color } from '~/constants/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { scoreTable, perfectScoreBonus } from './constants';

FinishScreen.propTypes = {
  scoreArray: PropTypes.array
};

export default function FinishScreen({ scoreArray }) {
  const {
    grammarGameScoreS: { color: colorS },
    grammarGameScoreA: { color: colorA },
    grammarGameScoreB: { color: colorB },
    grammarGameScoreC: { color: colorC },
    grammarGameScoreD: { color: colorD },
    grammarGameScoreF: { color: colorF }
  } = useKeyContext((v) => v.theme);

  const letterColor = {
    S: colorS,
    A: colorA,
    B: colorB,
    C: colorC,
    D: colorD,
    F: colorF
  };

  const score = useMemo(() => {
    if (!scoreArray) return 0;
    const sum = scoreArray.reduce((acc, cur) => acc + scoreTable[cur], 0);
    if (sum === scoreTable.S * 10) {
      return scoreTable.S * 10 * perfectScoreBonus;
    }
    return sum;
  }, [scoreArray]);

  const numLetterGrades = useMemo(() => {
    const resultObj = { S: 0, A: 0, B: 0, C: 0, D: 0, F: 0 };
    for (let score of scoreArray) {
      if (!resultObj[score]) {
        resultObj[score] = 1;
      } else {
        resultObj[score]++;
      }
    }
    return resultObj;
  }, [scoreArray]);
  const numLetterGradesArray = useMemo(
    () => Object.entries(numLetterGrades).filter(([, number]) => number > 0),
    [numLetterGrades]
  );
  const isPerfectScore = useMemo(
    () => score === scoreTable.S * 10 * perfectScoreBonus,
    [score]
  );
  const totalScoreEquationText = useMemo(() => {
    let scoreText = '';
    if (numLetterGradesArray.length === 1) {
      scoreText = `${scoreTable[numLetterGradesArray[0][0]]} x ${
        numLetterGradesArray[0][1]
      }`;
    } else {
      scoreText = numLetterGradesArray
        .map(([letter, num]) => `(${scoreTable[letter]} × ${num})`)
        .join(' + ');
    }
    return isPerfectScore ? `${scoreText} × ${perfectScoreBonus}` : scoreText;
  }, [isPerfectScore, numLetterGradesArray]);

  return (
    <ErrorBoundary componentPath="Earn/GrammarGameModal/FinishScreen">
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <div
          style={{
            fontWeight: 'bold',
            marginTop: '1.5rem',
            fontSize: '2rem'
          }}
        >
          Game Result
        </div>
        <div style={{ fontSize: '1.7rem', marginTop: '2.5rem' }}>
          {numLetterGradesArray.map(([letter, num]) => (
            <div key={letter}>
              <span
                style={{
                  fontWeight: 'bold',
                  color: Color[letterColor[letter]]()
                }}
              >
                {letter}
              </span>{' '}
              ×{num}
            </div>
          ))}
        </div>
        <div
          style={{
            marginTop: '2.5rem',
            marginBottom: '2rem',
            textAlign: 'center'
          }}
        >
          {isPerfectScore && <div>Perfect score! You get a 5x bonus!</div>}
          <div style={{ marginTop: '1rem' }}>
            {totalScoreEquationText} = {score}
          </div>
          <div style={{ marginTop: '1rem' }}>
            You earned {addCommasToNumber(score)} XP
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
