import React, { useMemo, useEffect, useState } from 'react';
import Marble from '../../Marble';
import { Color, mobileMaxWidth } from '~/constants/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { priceTable } from '~/constants/defaultValues';
import { scoreTable, perfectScoreBonus } from '../../constants';
import { css } from '@emotion/css';
import { isMobile } from '~/helpers';
import { useChain, useSpring, useSpringRef, animated } from 'react-spring';
import ResultLevelRow from './ResultLevelRow';
import { useRoleColor } from '~/theme/useRoleColor';

const xpFontSize = '1.7rem';
const mobileXpFontSize = '1.5rem';
const coinFontSize = '1.5rem';
const mobileCoinFontSize = '1.3rem';

export default function TodayResult({ results }: { results: any[] }) {
  const [isAllS, setIsAllS] = useState(false);
  const [showAllPerfect, setShowAllPerfect] = useState(false);
  const deviceIsMobile = isMobile(navigator);
  const [activeRowIdx, setActiveRowIdx] = useState<number | null>(null);
  const perfectRole = useRoleColor('grammarGameScorePerfect', {
    fallback: 'brownOrange'
  });
  const perfectColor = (opacity?: number) =>
    perfectRole.getColor(opacity) || Color.brownOrange(opacity ?? 1);
  const funFont =
    "'Trebuchet MS', 'Comic Sans MS', 'Segoe UI', 'Arial Rounded MT Bold', -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif";
  const titleCls = css`
    text-align: center;
    font-weight: 800;
    font-size: 2rem;
    font-family: ${funFont};
    background-image: linear-gradient(
      90deg,
      ${Color.darkGold()} 0%,
      ${Color.gold()} 50%,
      ${Color.darkGold()} 100%
    );
    background-size: 200% auto;
    background-clip: text;
    -webkit-background-clip: text;
    color: transparent;
    animation: resultsShine 4s linear infinite;
    @keyframes resultsShine {
      0% {
        background-position: 200% center;
      }
      100% {
        background-position: 0% center;
      }
    }
  `;
  const boardCls = css`
    margin-top: 0.75rem;
    margin-bottom: 3rem;
    padding: 1.25rem 1.5rem;
    border-radius: 14px;
    background: linear-gradient(180deg, #234e3e 0%, #174032 100%);
    border: 2px solid #174437; /* darker edge */
    box-shadow: inset 0 0 60px rgba(0, 0, 0, 0.35),
      inset 0 0 0 2px rgba(255, 255, 255, 0.03), 0 4px 0 #0d1f1d;
    position: relative;
    overflow: hidden;
  `;
  const REQUIRED_SCORE = 700;

  const levelsCleared = useMemo(() => {
    try {
      return (results || []).filter((row: any[]) => {
        if (!Array.isArray(row) || row.length === 0) return false;
        const sum = row.reduce(
          (acc: number, grade: string) => acc + (scoreTable[grade] || 0),
          0
        );
        return sum >= 700;
      }).length;
    } catch {
      return 0;
    }
  }, [results]);
  const levelScores = useMemo(() => {
    return (results || []).map((row: any[]) =>
      Array.isArray(row)
        ? row.reduce(
            (acc: number, grade: string) => acc + (scoreTable[grade] || 0),
            0
          )
        : 0
    );
  }, [results]);
  const perfectScore = scoreTable.S * 10 * perfectScoreBonus;
  const levelDisplayScores = useMemo(() => {
    const perfectRaw = scoreTable.S * 10;
    return levelScores.map((s: number) =>
      s === perfectRaw ? perfectScore : s
    );
  }, [levelScores, perfectScore]);
  const firstFailedLevel = useMemo(() => {
    try {
      for (let i = 0; i < (results?.length || 0); i++) {
        const row = results[i];
        if (Array.isArray(row)) {
          if (row.length === 0) return i + 1;
          const sum = row.reduce(
            (acc: number, grade: string) => acc + (scoreTable[grade] || 0),
            0
          );
          if (sum > 0 && sum < 700) return i + 1;
        }
      }
      return 0;
    } catch {
      return 0;
    }
  }, [results]);

  const todaysScore = useMemo(() => {
    let totalScore = 0;
    for (const result of results) {
      if (!result?.length) continue;
      const sum = result.reduce(
        (acc: number, cur: number) => acc + scoreTable[cur],
        0
      );
      if (sum === scoreTable.S * 10) {
        totalScore += perfectScore;
        continue;
      }
      totalScore += sum;
    }
    return totalScore;
  }, [perfectScore, results]);

  useEffect(() => {
    const allS =
      results.length === 5 &&
      results.every(
        (row) => row?.length > 0 && row.every((grade: string) => grade === 'S')
      );
    setIsAllS(allS);
    if (allS) {
      setTimeout(() => setShowAllPerfect(true), 1000);
    }
  }, [results]);

  const allPerfectProps = useSpring({
    number: 1_000_000,
    from: { number: 0 },
    config: { duration: 2000 }
  });

  const effectRef = useSpringRef();
  const { x } = useSpring({
    ref: effectRef,
    from: { x: 0 },
    x: 1,
    config: { duration: 1000 }
  });

  const opacityRef = useSpringRef();
  const fadeInStyles = useSpring({
    ref: opacityRef,
    from: { opacity: 0 },
    to: { opacity: 1 }
  });

  const animationEffect = useMemo(() => {
    if (isAllS) {
      return {
        opacity: x.to({ range: [0, 1], output: [0.3, 1] }),
        scale: x.to({
          range: [0, 0.25, 0.35, 0.45, 0.55, 0.65, 0.75, 1],
          output: [1, 0.8, 0.5, 1.1, 0.5, 1.1, 1.03, 1]
        })
      };
    }
    return {};
  }, [isAllS, x]);

  useChain(showAllPerfect ? [opacityRef, effectRef] : []);

  const AnimatedDiv = animated('div');
  const AnimatedSpan = animated('span');

  const marblesRows = useMemo(() => {
    const buildRow = (rowIndex: number) => {
      const row = (results[rowIndex] || []).map(
        (letterGrade: string, index: number) => (
          <Marble
            key={index}
            style={{ marginLeft: index === 0 ? 0 : '0.1rem' }}
            letterGrade={letterGrade}
            isAllS={isAllS}
          />
        )
      );
      if (row.length === 0) {
        return Array(10)
          .fill(null)
          .map((_, index) => (
            <Marble
              key={index}
              style={{ marginLeft: index === 0 ? 0 : '0.1rem' }}
              isAllS={isAllS}
            />
          ));
      }
      return row;
    };
    return [0, 1, 2, 3, 4].map((i) => buildRow(i));
  }, [results, isAllS]);

  const handleToggleActive = (rowIndex: number) => {
    if (!deviceIsMobile) return;
    setActiveRowIdx(activeRowIdx === rowIndex ? null : rowIndex);
  };

  const rowsData = useMemo(() => {
    return [0, 1, 2, 3, 4].map((i) => {
      const levelNumber = i + 1;
      const hasAnyScore = (levelScores[i] || 0) > 0;
      const isPerfect = levelDisplayScores[i] === perfectScore;
      const scoreToDisplay = levelDisplayScores[i] || 0;
      const status: 'cleared' | 'next' | 'locked' | 'failed' =
        levelNumber <= levelsCleared
          ? 'cleared'
          : firstFailedLevel > 0
          ? levelNumber === firstFailedLevel
            ? 'failed'
            : 'locked'
          : levelNumber === levelsCleared + 1
          ? 'next'
          : 'locked';
      return {
        levelNumber,
        status,
        hasAnyScore,
        isPerfect,
        scoreToDisplay,
        marbles: marblesRows[i]
      };
    });
  }, [
    levelScores,
    levelDisplayScores,
    perfectScore,
    marblesRows,
    levelsCleared,
    firstFailedLevel
  ]);

  return (
    <div style={{ marginBottom: '3rem' }}>
      <div className={boardCls}>
        <div className={titleCls}>Today's Score</div>
        <div
          className={css`
            font-weight: bold;
            font-size: ${xpFontSize};
            color: #f8f8f8; /* chalk */
            text-shadow: 0 1px 0 rgba(0, 0, 0, 0.2);
            > p {
              font-size: ${coinFontSize};
              color: #f0e6d6; /* softer chalk */
            }
            @media (max-width: ${mobileMaxWidth}) {
              font-size: ${mobileXpFontSize};
              > p {
                font-size: ${mobileCoinFontSize};
              }
            }
          `}
        >
          {isAllS ? (
            <AnimatedSpan
              className={css`
                font-size: 2.5rem;
              `}
              style={{ color: '#ffffff' }}
            >
              {allPerfectProps.number.to((val) =>
                addCommasToNumber(Math.floor(val))
              )}
            </AnimatedSpan>
          ) : (
            <span
              style={{
                color: '#ffffff',
                fontSize: isAllS ? '2.5rem' : 'inherit'
              }}
            >
              {addCommasToNumber(todaysScore)}
            </span>
          )}{' '}
          <span style={{ color: '#ffd564' }}>XP</span>
          {(results?.length || 0) > 0 ? (
            <p>
              ...and{' '}
              {addCommasToNumber(
                (results?.length || 0) * priceTable.grammarbles
              )}{' '}
              coins earned!
            </p>
          ) : null}
        </div>
      </div>
      {showAllPerfect && (
        <AnimatedDiv
          style={{
            ...animationEffect,
            ...fadeInStyles,
            marginBottom: '1rem'
          }}
        >
          <span
            className={css`
              font-size: 2.5rem;
              font-weight: bold;
              background-image: linear-gradient(
                to left,
      ${perfectColor(1)} 0%,
      ${perfectColor(0.5)} 30%,
      ${perfectColor(1)} 100%
              );
              background-clip: text;
              color: transparent;
              background-size: 500% auto;
              background-position: right center;
              animation: bling 1.5s ease infinite;
              @keyframes bling {
                0% {
                  background-position: 100% 0%;
                }
                50% {
                  background-position: 10% 10%;
                }
                100% {
                  background-position: 0% 0%;
                }
              }
            `}
          >
            ALL PERFECT!
          </span>
        </AnimatedDiv>
      )}
      {/* rows */}
      {rowsData.map((row, idx) => (
        <ResultLevelRow
          key={row.levelNumber}
          levelNumber={row.levelNumber}
          marbles={row.marbles as any}
          status={row.status as any}
          isActive={activeRowIdx === idx}
          hasAnyScore={row.hasAnyScore}
          isPerfect={row.isPerfect}
          requiredScore={REQUIRED_SCORE}
          scoreToDisplay={row.scoreToDisplay}
          deviceIsMobile={deviceIsMobile}
          onToggleActive={() => handleToggleActive(idx)}
        />
      ))}
    </div>
  );
}
