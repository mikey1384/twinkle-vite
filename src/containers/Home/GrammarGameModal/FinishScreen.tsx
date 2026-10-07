import React, { useMemo } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import { Color, mobileMaxWidth } from '~/constants/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { scoreTable, perfectScoreBonus } from './constants';
import { useRoleColor } from '~/theme/hooks/useRoleColor';
import { css } from '@emotion/css';
import Marble from './Marble';
import {
  NEON,
  PIXEL_FONT,
  glassPanelCls,
  pixelStarCls,
  pop,
  rgba
} from './ClassicArcade/theme';

const perfectScore = scoreTable.S * 10 * perfectScoreBonus;

export default function FinishScreen({
  scoreArrayRef,
  onBackToStart,
  timesPlayedToday
}: {
  scoreArrayRef: React.RefObject<string[]>;
  onBackToStart: () => any;
  timesPlayedToday: number;
}) {
  const roleS = useRoleColor('grammarGameScoreS', { fallback: 'gold' });
  const roleA = useRoleColor('grammarGameScoreA', { fallback: 'magenta' });
  const roleB = useRoleColor('grammarGameScoreB', { fallback: 'orange' });
  const roleC = useRoleColor('grammarGameScoreC', { fallback: 'pink' });
  const roleD = useRoleColor('grammarGameScoreD', { fallback: 'logoBlue' });
  const roleF = useRoleColor('grammarGameScoreF', { fallback: 'gray' });

  const letterColor: { [key: string]: string } = {
    S: roleS.colorKey,
    A: roleA.colorKey,
    B: roleB.colorKey,
    C: roleC.colorKey,
    D: roleD.colorKey,
    F: roleF.colorKey
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
        className={css`
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2.5rem 2rem 3rem;
          @media (max-width: ${mobileMaxWidth}) {
            padding: 2rem 0.75rem 2.5rem;
          }
        `}
      >
        <div
          className={css`
            ${glassPanelCls};
            width: 100%;
            max-width: 56rem;
            padding: 2.4rem 2rem 2.2rem;
            text-align: center;
            @media (max-width: ${mobileMaxWidth}) {
              padding: 2rem 1.2rem 1.8rem;
            }
          `}
        >
          <span
            aria-hidden
            className={pixelStarCls(NEON.gold)}
            style={{ top: '1.4rem', left: '1.6rem' }}
          />
          <span
            aria-hidden
            className={pixelStarCls(NEON.cyan)}
            style={{ top: '2rem', right: '1.8rem' }}
          />
          <div
            className={css`
              font-family: ${PIXEL_FONT};
              font-size: 2rem;
              line-height: 1.3;
              text-transform: uppercase;
              color: ${NEON.cyan};
              text-shadow:
                0 0 10px ${rgba(NEON.cyanRgb, 0.8)},
                0 3px 0 #050824;
              animation: ${pop} 480ms ease-out both;
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 1.5rem;
              }
            `}
          >
            Game Result
          </div>
          {/* this round's ten marbles, in the order they were won */}
          <div
            className={css`
              display: flex;
              justify-content: center;
              flex-wrap: wrap;
              gap: 0.3rem;
              margin-top: 2rem;
              padding: 0.6rem 0.9rem;
              border-radius: 9999px;
              background: rgba(8, 10, 40, 0.7);
              border: 1px solid ${rgba(NEON.violetRgb, 0.45)};
              box-shadow: inset 0 0 12px rgba(0, 0, 0, 0.5);
            `}
          >
            {(scoreArrayRef.current || []).map((grade, index) => (
              <Marble key={index} letterGrade={grade} />
            ))}
          </div>
          <div
            className={css`
              display: flex;
              justify-content: center;
              flex-wrap: wrap;
              gap: 0.8rem 1.6rem;
              margin-top: 2rem;
              font-family: ${PIXEL_FONT};
              font-size: 1.2rem;
            `}
          >
            {numLetterGradesArray.map(([letter, num]) => (
              <div
                key={letter}
                className={css`
                  display: inline-flex;
                  align-items: center;
                  gap: 0.6rem;
                `}
              >
                <Marble letterGrade={letter} />
                <span>×{num}</span>
              </div>
            ))}
          </div>
          <div
            className={css`
              margin-top: 2.2rem;
              font-size: 1.6rem;
              line-height: 1.6;
              color: ${NEON.inkSoft};
              b {
                text-shadow: 0 0 6px currentColor;
              }
            `}
          >
            {isPerfectScore && (
              <div style={{ color: NEON.ink }}>
                Perfect score! You get a{' '}
                <b style={{ color: '#ff7ae0' }}>{perfectScoreBonus}x</b> bonus!
              </div>
            )}
            <div style={{ marginTop: '1rem' }}>
              {totalScoreEquationText} = {score}
            </div>
          </div>
          <div
            className={css`
              margin-top: 2.6rem;
              font-family: ${PIXEL_FONT};
              line-height: 1.6;
              color: ${NEON.ink};
              .xp {
                color: ${NEON.green};
                text-shadow:
                  0 0 10px ${rgba(NEON.greenRgb, 0.75)},
                  0 2px 0 #04140c;
              }
            `}
            // pixel type runs large; keep the old size steps, a notch down
            style={{ fontSize: `calc(${scoreFontSize} * 0.8)` }}
          >
            You earned <span className="xp">{addCommasToNumber(score)} XP</span>
          </div>
        </div>
        <div
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            marginTop: '2.5rem'
          }}
        >
          {timesPlayedToday + 1 < 5 ? (
            <GameCTAButton
              icon="play"
              variant="magenta"
              size="xl"
              shiny
              arcade
              onClick={onBackToStart}
            >
              Play Again
            </GameCTAButton>
          ) : (
            <GameCTAButton
              icon="chart-line"
              variant="logoBlue"
              size="xl"
              arcade
              onClick={onBackToStart}
            >
              {`See Today's Score`}
            </GameCTAButton>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}
