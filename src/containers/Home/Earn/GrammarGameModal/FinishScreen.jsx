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
    let scoreText = <div style={{ display: 'inline' }}></div>;
    if (numLetterGradesArray.length === 1) {
      const letter = numLetterGradesArray[0][0];
      scoreText = (
        <div style={{ display: 'inline' }}>
          <b
            style={{
              color: Color[letterColor[letter]]()
            }}
          >
            {scoreTable[letter]}
          </b>{' '}
          × <span>{numLetterGradesArray[0][1]}</span>
        </div>
      );
    } else {
      scoreText = (
        <div style={{ display: 'inline' }}>
          {numLetterGradesArray.map(([letter, number], index) => {
            return (
              <div style={{ display: 'inline' }} key={letter}>
                (
                <b
                  style={{
                    color: Color[letterColor[letter]]()
                  }}
                >
                  {scoreTable[letter]}
                </b>{' '}
                × {number})
                {index < numLetterGradesArray.length - 1 ? ' + ' : ''}
              </div>
            );
          })}
        </div>
      );
    }
    return isPerfectScore ? (
      <div style={{ display: 'inline' }}>
        {scoreText} ×{' '}
        {<b style={{ color: Color.magenta() }}>{perfectScoreBonus}</b>}
      </div>
    ) : (
      scoreText
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
              <b
                style={{
                  color: Color[letterColor[letter]]()
                }}
              >
                {letter}
              </b>{' '}
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
          {isPerfectScore && (
            <div>
              Perfect score! You get a{' '}
              <b style={{ color: Color.magenta() }}>{perfectScoreBonus}x</b>{' '}
              bonus!
            </div>
          )}
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
