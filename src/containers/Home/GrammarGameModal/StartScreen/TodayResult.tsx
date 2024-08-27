import React, { useMemo, useEffect, useState } from 'react';
import Marble from './Marble';
import { Color, mobileMaxWidth } from '~/constants/css';
import { useKeyContext } from '~/contexts';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { priceTable } from '~/constants/defaultValues';
import { scoreTable, perfectScoreBonus } from '../constants';
import { css } from '@emotion/css';
import { useChain, useSpring, useSpringRef, animated } from 'react-spring';

const xpFontSize = '1.7rem';
const mobileXpFontSize = '1.5rem';
const coinFontSize = '1.5rem';
const mobileCoinFontSize = '1.3rem';

export default function TodayResult({
  earnedCoins,
  results
}: {
  earnedCoins: boolean;
  results: any[];
}) {
  const [isAllS, setIsAllS] = useState(false);
  const [showAllPerfect, setShowAllPerfect] = useState(false);
  const {
    xpNumber: { color: xpNumberColor },
    grammarGameScorePerfect: { color: colorPerfect }
  } = useKeyContext((v) => v.theme);
  const perfectScore = scoreTable.S * 10 * perfectScoreBonus;
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

  return (
    <div style={{ marginBottom: '3rem' }}>
      <p
        style={{
          fontWeight: 'bold',
          fontSize: '1.7rem'
        }}
      >{`Today's Results`}</p>
      <div
        className={css`
          margin-top: 1rem;
          margin-bottom: ${earnedCoins ? 2.7 : 1.7}rem;
          font-weight: bold;
          font-size: ${xpFontSize};
          > p {
            font-size: ${coinFontSize};
          }
          @media (max-width: ${mobileMaxWidth}) {
            font-size: ${mobileXpFontSize};
            > p {
              font-size: ${mobileCoinFontSize};
            }
          }
        `}
      >
        <animated.span
          className={css`
            ${isAllS &&
            `font-size: 2.5rem;
            `}
          `}
          style={{ color: Color[xpNumberColor]() }}
        >
          {isAllS
            ? scoreProps.number.to((val) => addCommasToNumber(Math.floor(val)))
            : addCommasToNumber(todaysScore)}
        </animated.span>{' '}
        <span style={{ color: Color.gold() }}>XP</span>
        {earnedCoins ? (
          <p style={{ color: Color.brownOrange() }}>
            ...and {addCommasToNumber(priceTable.grammarbles)} coins for
            finishing 5 games!
          </p>
        ) : null}
      </div>
      {showAllPerfect && (
        <animated.div
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
        </animated.div>
      )}
      <div>
        {firstRow.map(
          (
            marble: React.FunctionComponentElement<{
              isAllS: boolean;
              key: any;
            }>,
            index: any
          ) =>
            React.cloneElement(marble, {
              isAllS,
              key: index
            })
        )}
      </div>
      <div style={{ marginTop: '3px' }}>
        {secondRow.map(
          (
            marble: React.FunctionComponentElement<{
              isAllS: boolean;
              key: any;
            }>,
            index: any
          ) =>
            React.cloneElement(marble, {
              isAllS,
              key: index
            })
        )}
      </div>
      <div style={{ marginTop: '3px' }}>
        {thirdRow.map(
          (
            marble: React.FunctionComponentElement<{
              isAllS: boolean;
              key: any;
            }>,
            index: any
          ) =>
            React.cloneElement(marble, {
              isAllS,
              key: index
            })
        )}
      </div>
      <div style={{ marginTop: '3px' }}>
        {fourthRow.map(
          (
            marble: React.FunctionComponentElement<{
              isAllS: boolean;
              key: any;
            }>,
            index: any
          ) =>
            React.cloneElement(marble, {
              isAllS,
              key: index
            })
        )}
      </div>
      <div style={{ marginTop: '3px' }}>
        {fifthRow.map(
          (
            marble: React.FunctionComponentElement<{
              isAllS: boolean;
              key: any;
            }>,
            index: any
          ) =>
            React.cloneElement(marble, {
              isAllS,
              key: index
            })
        )}
      </div>
    </div>
  );
}
