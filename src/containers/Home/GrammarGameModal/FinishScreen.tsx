import React, { useMemo } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import Button from '~/components/Button';
import GradientButton from '~/components/Buttons/GradientButton';
import { useKeyContext } from '~/contexts';
import { Color } from '~/constants/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { scoreTable, perfectScoreBonus } from './constants';

const perfectScore = scoreTable.S * 10 * perfectScoreBonus;

export default function FinishScreen({
  scoreArrayRef,
  onBackToStart,
  timesPlayedToday
}: {
  scoreArrayRef: React.MutableRefObject<string[]>;
  onBackToStart: () => any;
  timesPlayedToday: number;
}) {
  const {
    grammarGameScoreS: { color: colorS },
    grammarGameScoreA: { color: colorA },
    grammarGameScoreB: { color: colorB },
    grammarGameScoreC: { color: colorC },
    grammarGameScoreD: { color: colorD },
    grammarGameScoreF: { color: colorF }
  } = useKeyContext((v) => v.theme);

  const letterColor: { [key: string]: string } = {
    S: colorS,
    A: colorA,
    B: colorB,
    C: colorC,
    D: colorD,
    F: colorF
  };

  const score = useMemo(() => {
    if (!scoreArrayRef.current) return 0;
    const sum = scoreArrayRef.current.reduce(
      (acc, cur) => acc + scoreTable[cur],
      0
    );
    if (sum === scoreTable.S * 10) {
      return perfectScore;
    }
    return sum;
  }, [scoreArrayRef]);

  const scoreFontSize = useMemo(() => {
    if (score === perfectScore) return '2rem';
    if (score > scoreTable.A * 10) return '1.7rem';
    return '1.5rem';
  }, [score]);

  const scoreFontWeight = useMemo(() => {
    if (score > scoreTable.A * 10) return 'bold';
    return 'normal';
  }, [score]);

  const numLetterGrades = useMemo(() => {
    const resultObj: { [key: string]: number } = {
      S: 0,
      A: 0,
      B: 0,
      C: 0,
      D: 0,
      F: 0
    };
    for (const score of scoreArrayRef.current) {
      if (!resultObj[score]) {
        resultObj[score] = 1;
      } else {
        resultObj[score]++;
      }
    }
    return resultObj;
  }, [scoreArrayRef]);
  const numLetterGradesArray = useMemo(
    () => Object.entries(numLetterGrades).filter(([, number]) => number > 0),
    [numLetterGrades]
  );
  const isPerfectScore = useMemo(() => score === perfectScore, [score]);

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
          <div
            style={{
              marginTop: '5rem',
              fontSize: scoreFontSize,
              fontWeight: scoreFontWeight
            }}
          >
            You earned {addCommasToNumber(score)} XP
          </div>
          <div
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              marginTop: '3rem'
            }}
          >
            {timesPlayedToday + 1 < 5 ? (
              <GradientButton
                style={{ marginTop: '1rem', fontSize: '1.7rem' }}
                onClick={onBackToStart}
              >
                Play Again
              </GradientButton>
            ) : (
              <Button
                style={{ marginTop: '1rem', fontSize: '1.7rem' }}
                onClick={onBackToStart}
                filled
                color="logoBlue"
              >
                {`See Today's Results`}
              </Button>
            )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
