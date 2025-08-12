import React, { useMemo, useEffect, useState } from 'react';
import Marble from './Marble';
import { Color, mobileMaxWidth } from '~/constants/css';
import { useKeyContext } from '~/contexts';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { priceTable } from '~/constants/defaultValues';
import { scoreTable, perfectScoreBonus } from '../constants';
import { css } from '@emotion/css';
import { isMobile } from '~/helpers';
import Icon from '~/components/Icon';
import { useChain, useSpring, useSpringRef, animated } from 'react-spring';

const xpFontSize = '1.7rem';
const mobileXpFontSize = '1.5rem';
const coinFontSize = '1.5rem';
const mobileCoinFontSize = '1.3rem';

export default function TodayResult({ results }: { results: any[] }) {
  const [isAllS, setIsAllS] = useState(false);
  const [showAllPerfect, setShowAllPerfect] = useState(false);
  const deviceIsMobile = isMobile(navigator);
  const [activeRowIdx, setActiveRowIdx] = useState<number | null>(null);
  // using fixed chalk colors on board
  const colorPerfect = useKeyContext(
    (v) => v.theme.grammarGameScorePerfect.color
  );
  // Heading styling
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
  // deprecated header layout (replaced by in-row layout)
  const levelRowCls = css`
    display: grid;
    grid-template-columns: 7.5rem calc(30rem + 0.9rem) 8rem; /* label | 10 balls area | status */
    align-items: center;
    gap: 1rem;
    margin: 0.6rem 0;
    @media (max-width: 900px) {
      grid-template-columns: 6.2rem 24rem 7.5rem;
    }
    @media (max-width: ${mobileMaxWidth}) {
      grid-template-columns: 5.2rem 21rem 7rem;
    }
  `;
  const marblesRowCls = css`
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding-left: 0.25rem;
    padding-right: 1rem; /* nudge left away from status badge */
    @media (max-width: ${mobileMaxWidth}) {
      padding-right: 0.8rem;
    }
    ${!deviceIsMobile
      ? `
    &:hover [data-overlay='1'] { opacity: 1; }
    `
      : ''}
  `;
  const overlayLabelBaseCls = css`
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    font-weight: 900;
    letter-spacing: 0.3px;
    pointer-events: none;
    z-index: 1;
    color: #ffffff;
    padding: 0.2rem 0.6rem;
    line-height: 1.1;
    border-radius: 9999px;
    border: 2px solid transparent;
    box-shadow: 0 2px 0 rgba(0, 0, 0, 0.25);
    text-shadow: 0 1px 0 rgba(0, 0, 0, 0.2);
    opacity: 0;
    transition: opacity 150ms ease;
  `;
  const overlayPerfectCls = css`
    background-image: linear-gradient(
      90deg,
      #ffcb32 0%,
      #ffd564 50%,
      #ffcb32 100%
    );
    border-color: #e3a40f;
    box-shadow: 0 2px 0 #c4890a;
  `;
  const REQUIRED_SCORE = 900;
  const getOverlayBg = (status: 'cleared' | 'next' | 'locked' | 'failed') => {
    switch (status) {
      case 'cleared':
        return '#16a34a';
      case 'failed':
        return '#dc2626';
      case 'next':
        return '#f59e0b';
      case 'locked':
      default:
        return '#64748b';
    }
  };
  const getOverlayBorder = (
    status: 'cleared' | 'next' | 'locked' | 'failed'
  ) => {
    switch (status) {
      case 'cleared':
        return '#15803d';
      case 'failed':
        return '#b91c1c';
      case 'next':
        return '#d97706';
      case 'locked':
      default:
        return '#475569';
    }
  };
  const levelTitleBaseCls = css`
    font-weight: 900;
    font-family: ${funFont};
    letter-spacing: 0.6px;
    font-size: 1.2rem;
    justify-self: center; /* center within its grid column */
  `;
  const getLevelLabelColor = (level: number) => {
    switch (level) {
      case 1:
        return '#418CEB'; // logoBlue
      case 2:
        return '#F3677B'; // pink variant tone
      case 3:
        return '#FF9A00'; // orange
      case 4:
        return '#EC4899'; // magenta
      case 5:
      default:
        return '#FFD564'; // gold
    }
  };
  const getStatusPillCls = (status: 'cleared' | 'next' | 'locked' | 'failed') =>
    css`
      display: grid;
      grid-template-columns: 1.1rem auto 1.1rem;
      align-items: center;
      justify-items: center;
      column-gap: 0.3rem;
      padding: 0.25rem 0.6rem;
      border-radius: 9999px;
      font-weight: 700;
      font-size: 0.85rem;
      color: #fff;
      ${status === 'cleared'
        ? `background: #22c55e; border: 2px solid #16a34a; box-shadow: 0 2px 0 #15803d;`
        : status === 'next'
        ? `background: #ffcb32; border: 2px solid #e3a40f; box-shadow: 0 2px 0 #c4890a; color: #1a1a1a;`
        : status === 'failed'
        ? `background: #ef4444; border: 2px solid #dc2626; box-shadow: 0 2px 0 #b91c1c;`
        : `background: #94a3b8; border: 2px solid #64748b; box-shadow: 0 2px 0 #475569;`};
      & > :first-child {
        grid-column: 1;
      }
      &::after {
        content: '';
        grid-column: 3;
        width: 1.1rem;
        height: 1rem;
      }
    `;
  const badgeTextCls = css`
    grid-column: 2;
  `;
  // const failedRowOutlineCls = css`
  //   box-shadow: inset 0 0 0 2px rgba(239, 68, 68, 0.35);
  //   border-radius: 12px;
  //   padding: 0.15rem;
  // `;
  const getRowDimCls = (dim: boolean) =>
    css`
      ${dim ? 'filter: grayscale(0.25) brightness(0.85);' : ''}
    `;
  const marblesInnerCls = css`
    display: inline-flex;
    align-items: center;
    gap: 0.1rem;
  `;

  const levelsCleared = useMemo(() => {
    try {
      return (results || []).filter((row: any[]) => {
        if (!Array.isArray(row) || row.length === 0) return false;
        const sum = row.reduce(
          (acc: number, grade: string) => acc + (scoreTable[grade] || 0),
          0
        );
        return sum >= 900;
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
    const idx = levelScores.findIndex((sum: number) => sum > 0 && sum < 900);
    return idx >= 0 ? idx + 1 : 0;
  }, [levelScores]);
  const hasFailedToday = firstFailedLevel > 0;
  // const currentLevel = Math.min(levelsCleared + 1, 5);
  const getLevelStatus = (
    level: number
  ): 'cleared' | 'next' | 'locked' | 'failed' => {
    if (level <= levelsCleared) return 'cleared';
    if (hasFailedToday) return level === firstFailedLevel ? 'failed' : 'locked';
    return level === levelsCleared + 1 ? 'next' : 'locked';
  };
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
  const firstRow = useMemo(() => {
    const row = (results[0] || []).map((letterGrade: string, index: number) => (
      <Marble
        key={index}
        style={{ marginLeft: index === 0 ? 0 : '0.1rem' }}
        letterGrade={letterGrade}
        isAllS={isAllS}
      />
    ));
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
  }, [results, isAllS]);
  const secondRow = useMemo(() => {
    const row = (results[1] || []).map((letterGrade: string, index: number) => (
      <Marble
        key={index}
        style={{ marginLeft: index === 0 ? 0 : '0.1rem' }}
        letterGrade={letterGrade}
        isAllS={isAllS}
      />
    ));
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
  }, [results, isAllS]);
  const thirdRow = useMemo(() => {
    const row = (results[2] || []).map((letterGrade: string, index: number) => (
      <Marble
        key={index}
        style={{ marginLeft: index === 0 ? 0 : '0.1rem' }}
        letterGrade={letterGrade}
        isAllS={isAllS}
      />
    ));
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
  }, [results, isAllS]);
  const fourthRow = useMemo(() => {
    const row = (results[3] || []).map((letterGrade: string, index: number) => (
      <Marble
        key={index}
        style={{ marginLeft: index === 0 ? 0 : '0.1rem' }}
        letterGrade={letterGrade}
        isAllS={isAllS}
      />
    ));
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
  }, [results, isAllS]);
  const fifthRow = useMemo(() => {
    const row = (results[4] || []).map((letterGrade: string, index: number) => (
      <Marble
        key={index}
        style={{ marginLeft: index === 0 ? 0 : '0.1rem' }}
        letterGrade={letterGrade}
        isAllS={isAllS}
      />
    ));
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
  }, [results, isAllS]);

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

  const scoreProps = useSpring({
    number: isAllS ? todaysScore : 0,
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

  return (
    <div style={{ marginBottom: '3rem' }}>
      <div className={boardCls}>
        <div className={titleCls}>Today's Results</div>
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
              {scoreProps.number.to((val) =>
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
              coins earned today!
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
                ${Color[colorPerfect](1)} 0%,
                ${Color[colorPerfect](0.5)} 30%,
                ${Color[colorPerfect](1)} 100%
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
      <div className={levelRowCls}>
        <span
          className={levelTitleBaseCls}
          style={{ color: getLevelLabelColor(1) }}
        >
          lvl 1
        </span>
        <div
          className={marblesRowCls}
          onClick={() => deviceIsMobile && setActiveRowIdx(0)}
        >
          {levelScores[0] > 0 &&
            (levelDisplayScores[0] === perfectScore ? (
              <span
                className={`${overlayLabelBaseCls} ${overlayPerfectCls}`}
                data-overlay="1"
                style={{
                  opacity: deviceIsMobile && activeRowIdx === 0 ? 1 : undefined
                }}
              >
                {addCommasToNumber(levelDisplayScores[0])} / {REQUIRED_SCORE}
              </span>
            ) : (
              <span
                className={overlayLabelBaseCls}
                data-overlay="1"
                style={{
                  opacity: deviceIsMobile && activeRowIdx === 0 ? 1 : undefined,
                  background: getOverlayBg(getLevelStatus(1)),
                  borderColor: getOverlayBorder(getLevelStatus(1))
                }}
              >
                {addCommasToNumber(levelDisplayScores[0])} / {REQUIRED_SCORE}
              </span>
            ))}
          <div
            className={`${marblesInnerCls} ${getRowDimCls(
              getLevelStatus(1) !== 'cleared'
            )}`}
          >
            {firstRow.map((marble: any, index: any) =>
              React.cloneElement(marble, { isAllS, key: index })
            )}
          </div>
        </div>
        {(() => {
          const status = getLevelStatus(1);
          return (
            <span className={getStatusPillCls(status)}>
              <Icon
                icon={
                  status === 'cleared'
                    ? 'check'
                    : status === 'next'
                    ? 'play'
                    : status === 'failed'
                    ? 'times'
                    : 'lock'
                }
              />
              <span className={badgeTextCls}>
                {status === 'cleared'
                  ? 'Cleared'
                  : status === 'next'
                  ? 'Next'
                  : status === 'failed'
                  ? 'Failed'
                  : 'Locked'}
              </span>
            </span>
          );
        })()}
      </div>
      <div className={levelRowCls}>
        <span
          className={levelTitleBaseCls}
          style={{ color: getLevelLabelColor(2) }}
        >
          lvl 2
        </span>
        <div
          className={marblesRowCls}
          onClick={() => deviceIsMobile && setActiveRowIdx(1)}
        >
          {levelScores[1] > 0 &&
            (levelDisplayScores[1] === perfectScore ? (
              <span
                className={`${overlayLabelBaseCls} ${overlayPerfectCls}`}
                data-overlay="1"
                style={{
                  opacity: deviceIsMobile && activeRowIdx === 1 ? 1 : undefined
                }}
              >
                {addCommasToNumber(levelDisplayScores[1])} / {REQUIRED_SCORE}
              </span>
            ) : (
              <span
                className={overlayLabelBaseCls}
                data-overlay="1"
                style={{
                  opacity: deviceIsMobile && activeRowIdx === 1 ? 1 : undefined,
                  background: getOverlayBg(getLevelStatus(2)),
                  borderColor: getOverlayBorder(getLevelStatus(2))
                }}
              >
                {addCommasToNumber(levelDisplayScores[1])} / {REQUIRED_SCORE}
              </span>
            ))}
          <div
            className={`${marblesInnerCls} ${getRowDimCls(
              getLevelStatus(2) !== 'cleared'
            )}`}
          >
            {secondRow.map((marble: any, index: any) =>
              React.cloneElement(marble, { isAllS, key: index })
            )}
          </div>
        </div>
        {(() => {
          const status = getLevelStatus(2);
          return (
            <span className={getStatusPillCls(status)}>
              <Icon
                icon={
                  status === 'cleared'
                    ? 'check'
                    : status === 'next'
                    ? 'play'
                    : status === 'failed'
                    ? 'times'
                    : 'lock'
                }
              />
              <span className={badgeTextCls}>
                {status === 'cleared'
                  ? 'Cleared'
                  : status === 'next'
                  ? 'Next'
                  : status === 'failed'
                  ? 'Failed'
                  : 'Locked'}
              </span>
            </span>
          );
        })()}
      </div>
      <div className={levelRowCls}>
        <span
          className={levelTitleBaseCls}
          style={{ color: getLevelLabelColor(3) }}
        >
          lvl 3
        </span>
        <div
          className={marblesRowCls}
          onClick={() => deviceIsMobile && setActiveRowIdx(2)}
        >
          {levelScores[2] > 0 &&
            (levelDisplayScores[2] === perfectScore ? (
              <span
                className={`${overlayLabelBaseCls} ${overlayPerfectCls}`}
                data-overlay="1"
                style={{
                  opacity: deviceIsMobile && activeRowIdx === 2 ? 1 : undefined
                }}
              >
                {addCommasToNumber(levelDisplayScores[2])} / {REQUIRED_SCORE}
              </span>
            ) : (
              <span
                className={overlayLabelBaseCls}
                data-overlay="1"
                style={{
                  opacity: deviceIsMobile && activeRowIdx === 2 ? 1 : undefined,
                  background: getOverlayBg(getLevelStatus(3)),
                  borderColor: getOverlayBorder(getLevelStatus(3))
                }}
              >
                {addCommasToNumber(levelDisplayScores[2])} / {REQUIRED_SCORE}
              </span>
            ))}
          <div
            className={`${marblesInnerCls} ${getRowDimCls(
              getLevelStatus(3) !== 'cleared'
            )}`}
          >
            {thirdRow.map((marble: any, index: any) =>
              React.cloneElement(marble, { isAllS, key: index })
            )}
          </div>
        </div>
        {(() => {
          const status = getLevelStatus(3);
          return (
            <span className={getStatusPillCls(status)}>
              <Icon
                icon={
                  status === 'cleared'
                    ? 'check'
                    : status === 'next'
                    ? 'play'
                    : 'lock'
                }
              />
              <span className={badgeTextCls}>
                {status === 'cleared'
                  ? 'Cleared'
                  : status === 'next'
                  ? 'Next'
                  : 'Locked'}
              </span>
            </span>
          );
        })()}
      </div>
      <div className={levelRowCls}>
        <span
          className={levelTitleBaseCls}
          style={{ color: getLevelLabelColor(4) }}
        >
          lvl 4
        </span>
        <div
          className={marblesRowCls}
          onClick={() => deviceIsMobile && setActiveRowIdx(3)}
        >
          {levelScores[3] > 0 &&
            (levelDisplayScores[3] === perfectScore ? (
              <span
                className={`${overlayLabelBaseCls} ${overlayPerfectCls}`}
                data-overlay="1"
                style={{
                  opacity: deviceIsMobile && activeRowIdx === 3 ? 1 : undefined
                }}
              >
                {addCommasToNumber(levelDisplayScores[3])} / {REQUIRED_SCORE}
              </span>
            ) : (
              <span
                className={overlayLabelBaseCls}
                data-overlay="1"
                style={{
                  opacity: deviceIsMobile && activeRowIdx === 3 ? 1 : undefined,
                  background: getOverlayBg(getLevelStatus(4)),
                  borderColor: getOverlayBorder(getLevelStatus(4))
                }}
              >
                {addCommasToNumber(levelDisplayScores[3])} / {REQUIRED_SCORE}
              </span>
            ))}
          <div
            className={`${marblesInnerCls} ${getRowDimCls(
              getLevelStatus(4) !== 'cleared'
            )}`}
          >
            {fourthRow.map((marble: any, index: any) =>
              React.cloneElement(marble, { isAllS, key: index })
            )}
          </div>
        </div>
        {(() => {
          const status = getLevelStatus(4);
          return (
            <span className={getStatusPillCls(status)}>
              <Icon
                icon={
                  status === 'cleared'
                    ? 'check'
                    : status === 'next'
                    ? 'play'
                    : 'lock'
                }
              />
              <span className={badgeTextCls}>
                {status === 'cleared'
                  ? 'Cleared'
                  : status === 'next'
                  ? 'Next'
                  : 'Locked'}
              </span>
            </span>
          );
        })()}
      </div>
      <div className={levelRowCls}>
        <span
          className={levelTitleBaseCls}
          style={{ color: getLevelLabelColor(5) }}
        >
          lvl 5
        </span>
        <div
          className={marblesRowCls}
          onClick={() => deviceIsMobile && setActiveRowIdx(4)}
        >
          {levelScores[4] > 0 &&
            (levelDisplayScores[4] === perfectScore ? (
              <span
                className={`${overlayLabelBaseCls} ${overlayPerfectCls}`}
                data-overlay="1"
                style={{
                  opacity: deviceIsMobile && activeRowIdx === 4 ? 1 : undefined
                }}
              >
                {addCommasToNumber(levelDisplayScores[4])} / {REQUIRED_SCORE}
              </span>
            ) : (
              <span
                className={overlayLabelBaseCls}
                data-overlay="1"
                style={{
                  opacity: deviceIsMobile && activeRowIdx === 4 ? 1 : undefined,
                  background: getOverlayBg(getLevelStatus(5)),
                  borderColor: getOverlayBorder(getLevelStatus(5))
                }}
              >
                {addCommasToNumber(levelDisplayScores[4])} / {REQUIRED_SCORE}
              </span>
            ))}
          <div
            className={`${marblesInnerCls} ${getRowDimCls(
              getLevelStatus(5) !== 'cleared'
            )}`}
          >
            {fifthRow.map((marble: any, index: any) =>
              React.cloneElement(marble, { isAllS, key: index })
            )}
          </div>
        </div>
        {(() => {
          const status = getLevelStatus(5);
          return (
            <span className={getStatusPillCls(status)}>
              <Icon
                icon={
                  status === 'cleared'
                    ? 'check'
                    : status === 'next'
                    ? 'play'
                    : 'lock'
                }
              />
              <span className={badgeTextCls}>
                {status === 'cleared'
                  ? 'Cleared'
                  : status === 'next'
                  ? 'Next'
                  : 'Locked'}
              </span>
            </span>
          );
        })()}
      </div>
    </div>
  );
}
