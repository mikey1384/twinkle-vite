import React, { useMemo, useEffect, useState } from 'react';
import Marble from '../../Marble';
import { Color, mobileMaxWidth } from '~/constants/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { priceTable } from '~/constants/defaultValues';
import {
  scoreTable,
  perfectScoreBonus,
  fullClearBonusMultiplier,
  allPerfectBonusMultiplier
} from '../../constants';
import { css } from '@emotion/css';
import { isMobile } from '~/helpers';
import { useChain, useSpring, useSpringRef, animated } from '@react-spring/web';
import ResultLevelRow from './ResultLevelRow';
import { useRoleColor } from '~/theme/hooks/useRoleColor';
import {
  NEON,
  PIXEL_FONT,
  glassPanelCls,
  pixelStarCls,
  rgba
} from '../../ClassicArcade/theme';

const xpFontSize = '1.8rem';
const mobileXpFontSize = '1.4rem';
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
  // the scoreboard digits glow neon green, the label gold
  const xpNumberColor = NEON.green;
  const xpLabelColor = NEON.gold;
  const titleCls = css`
    text-align: center;
    font-family: ${PIXEL_FONT};
    font-size: 1.3rem;
    line-height: 1.4;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: ${NEON.cyan};
    text-shadow:
      0 0 8px ${rgba(NEON.cyanRgb, 0.8)},
      0 2px 0 #050824;
    @media (max-width: ${mobileMaxWidth}) {
      font-size: 1.1rem;
    }
  `;
  const boardCls = css`
    ${glassPanelCls};
    margin-top: 0.75rem;
    margin-bottom: 3rem;
    padding: 1.6rem 1.8rem 1.4rem;
    overflow: hidden;
    /* faint scanlines, like an arcade scoreboard */
    &::before {
      content: '';
      position: absolute;
      inset: 0;
      background: repeating-linear-gradient(
        180deg,
        rgba(255, 255, 255, 0.035) 0 1px,
        transparent 1px 4px
      );
      pointer-events: none;
    }
    @media (max-width: ${mobileMaxWidth}) {
      padding: 1.3rem 1.2rem 1.1rem;
    }
  `;
  const xpValueClass = css`
    display: inline-flex;
    align-items: baseline;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.6rem;
    margin-top: 1rem;
    font-family: ${PIXEL_FONT};
    font-weight: 400;
    line-height: 1.3;
    .xp-number {
      color: ${xpNumberColor};
      text-shadow:
        0 0 10px ${rgba(NEON.greenRgb, 0.75)},
        0 2px 0 #04140c;
      display: inline-flex;
      align-items: baseline;
    }
    .xp-label {
      color: ${xpLabelColor};
      font-size: 1rem;
      text-shadow: 0 0 6px ${rgba(NEON.goldRgb, 0.7)};
    }
  `;
  const REQUIRED_SCORE = 700;
  const allPerfectToday = useMemo(() => {
    if ((results?.length || 0) !== 5) return false;
    return results.every(
      (row: any[]) =>
        Array.isArray(row) &&
        row.length > 0 &&
        row.every((grade: string) => grade === 'S')
    );
  }, [results]);

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

  const clearedAllLevelsToday = useMemo(() => {
    if ((results?.length || 0) !== 5) return false;
    return (results || []).every((row: any[]) => {
      if (!Array.isArray(row)) return false;
      if (row.length === 0) return false;
      const sum = row.reduce(
        (acc: number, grade: string) => acc + (scoreTable[grade] || 0),
        0
      );
      return sum >= REQUIRED_SCORE;
    });
  }, [results]);

  const baseScoreToday = useMemo(() => {
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

  const todaysScore = useMemo(() => {
    let totalScore = baseScoreToday;
    if (clearedAllLevelsToday) {
      totalScore *= fullClearBonusMultiplier;
    }
    if (allPerfectToday) {
      totalScore *= allPerfectBonusMultiplier;
    }
    return totalScore;
  }, [baseScoreToday, clearedAllLevelsToday, allPerfectToday]);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    setIsAllS(allPerfectToday);
    if (allPerfectToday) {
      timeout = setTimeout(() => setShowAllPerfect(true), 1000);
    } else {
      setShowAllPerfect(false);
    }
    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [allPerfectToday]);

  const allPerfectProps = useSpring({
    number: allPerfectToday ? todaysScore : 0,
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
            position: relative;
            text-align: center;
            font-weight: bold;
            font-size: ${xpFontSize};
            color: ${NEON.ink};
            > p {
              font-size: ${coinFontSize};
              color: ${NEON.inkSoft};
            }
            @media (max-width: ${mobileMaxWidth}) {
              font-size: ${mobileXpFontSize};
              > p {
                font-size: ${mobileCoinFontSize};
              }
            }
          `}
        >
          {clearedAllLevelsToday ? (
            <div>
              <div
                className={xpValueClass}
                style={{ fontSize: '1.7rem', fontWeight: 800 }}
              >
                <span className="xp-number">
                  {addCommasToNumber(baseScoreToday)}
                </span>
                <span className="xp-label">XP</span>
              </div>
              <div
                style={{
                  marginTop: '0.2rem',
                  fontSize: '1.5rem',
                  color: NEON.inkSoft
                }}
              >
                ×{fullClearBonusMultiplier}{' '}
                <span style={{ color: NEON.inkSoft }}>
                  (all five levels cleared)
                </span>
              </div>
              {allPerfectToday && (
                <div
                  style={{
                    marginTop: '0.2rem',
                    fontSize: '1.5rem',
                    color: NEON.inkSoft
                  }}
                >
                  ×{allPerfectBonusMultiplier}{' '}
                  <span style={{ color: NEON.inkSoft }}>
                    (all perfect bonus)
                  </span>
                </div>
              )}
              <div
                className={xpValueClass}
                style={{
                  marginTop: '0.3rem',
                  fontSize: '2.2rem'
                }}
              >
                <span className="xp-number">
                  {allPerfectToday ? (
                    <AnimatedSpan
                      className={css`
                        font-size: 2.5rem;
                        display: inline-flex;
                      `}
                    >
                      {allPerfectProps.number.to((val) =>
                        addCommasToNumber(Math.floor(val))
                      )}
                    </AnimatedSpan>
                  ) : (
                    addCommasToNumber(todaysScore)
                  )}
                </span>
                <span className="xp-label">XP</span>
              </div>
            </div>
          ) : isAllS ? (
            <span className={xpValueClass} style={{ fontSize: '2.5rem' }}>
              <span className="xp-number">
                <AnimatedSpan
                  className={css`
                    font-size: 2.5rem;
                    display: inline-flex;
                  `}
                >
                  {allPerfectProps.number.to((val) =>
                    addCommasToNumber(Math.floor(val))
                  )}
                </AnimatedSpan>
              </span>
              <span className="xp-label">XP</span>
            </span>
          ) : (
            <span className={xpValueClass}>
              <span className="xp-number">
                {addCommasToNumber(todaysScore)}
              </span>
              <span className="xp-label">XP</span>
            </span>
          )}
          {(results?.length || 0) > 0 ? (
            <p style={{ marginTop: '0.6rem' }}>
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
            marginBottom: '1.5rem',
            textAlign: 'center'
          }}
        >
          <span
            className={css`
              position: relative;
              display: inline-block;
              font-family: ${PIXEL_FONT};
              font-size: 2.2rem;
              line-height: 1.4;
              color: ${NEON.gold};
              text-shadow:
                0 0 10px ${perfectColor(0.9)},
                0 0 24px ${perfectColor(0.5)},
                0 3px 0 #1a0b3d;
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 1.6rem;
              }
            `}
          >
            <span
              className={pixelStarCls(NEON.gold)}
              style={{ top: '-0.6rem', left: '-1.4rem' }}
            />
            <span
              className={pixelStarCls('#ffffff')}
              style={{ bottom: '-0.4rem', right: '-1.2rem' }}
            />
            ALL PERFECT!
          </span>
        </AnimatedDiv>
      )}
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

  function handleToggleActive(rowIndex: number) {
    if (!deviceIsMobile) return;
    setActiveRowIdx(activeRowIdx === rowIndex ? null : rowIndex);
  }
}
