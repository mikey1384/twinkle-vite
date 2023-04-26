import React, { useMemo } from 'react';
import { Color } from '~/constants/css';
import { useChain, useSpring, useSpringRef, animated } from 'react-spring';
import { useKeyContext } from '~/contexts';
import { css } from '@emotion/css';
import { scoreTable, perfectScoreBonus } from '../../../constants';

export default function ReactionText({ questions }: { questions: any[] }) {
  const {
    grammarGameScorePerfect: { color: colorPerfect },
    grammarGameScoreA: { color: colorA },
    grammarGameScoreB: { color: colorB },
    grammarGameScoreC: { color: colorC },
    grammarGameScoreD: { color: colorD },
    grammarGameScoreF: { color: colorF }
  } = useKeyContext((v) => v.theme);
  const perfectScore = scoreTable.S * 10 * perfectScoreBonus;
  const totalScore = useMemo(() => {
    const sum = questions.reduce((acc, cur) => acc + scoreTable[cur.score], 0);
    if (sum === scoreTable.S * 10) {
      return perfectScore;
    }
    return sum;
  }, [questions, perfectScore]);
  const reactionObj = useMemo(() => {
    if (totalScore === perfectScore)
      return {
        color: colorPerfect,
        fontSize: '5rem',
        text: 'PERFECT',
        bling: true
      };
    if (totalScore > scoreTable.A * 10)
      return {
        color: colorA,
        fontSize: '3.5rem',
        text: 'OUTSTANDING',
        bling: true
      };
    if (totalScore > scoreTable.B * 10)
      return {
        color: colorB,
        fontSize: '3rem',
        text: 'GREAT',
        bling: true
      };
    if (totalScore > scoreTable.C * 10)
      return {
        color: colorC,
        fontSize: '2.5rem',
        text: 'Good',
        bling: false
      };
    if (totalScore > scoreTable.D * 10)
      return {
        color: colorD,
        fontSize: '2rem',
        text: `It wasn't good but it wasn't terrible either`,
        bling: false
      };
    return {
      color: colorF,
      fontSize: '1.7rem',
      text: `You just need more practice, that's all`,
      bling: false
    };
  }, [
    colorA,
    colorB,
    colorC,
    colorD,
    colorF,
    colorPerfect,
    totalScore,
    perfectScore
  ]);
  const effectRef = useSpringRef();
  const { x } = useSpring({
    ref: effectRef,
    from: { x: 0 },
    x: 1,
    config: { duration: 1000 }
  });
  const animationEffect = useMemo(() => {
    if (totalScore === perfectScore) {
      return {
        opacity: x.to({ range: [0, 1], output: [0.3, 1] }),
        scale: x.to({
          range: [0, 0.25, 0.35, 0.45, 0.55, 0.65, 0.75, 1],
          output: [1, 0.8, 0.5, 1.1, 0.5, 1.1, 1.03, 1]
        })
      };
    }
    return {};
  }, [totalScore, x, perfectScore]);
  const opacityRef = useSpringRef();
  const styles = useSpring({
    ref: opacityRef,
    from: { opacity: 0 },
    to: { opacity: 1 }
  });
  const { color, fontSize, text, bling } = reactionObj;

  useChain([opacityRef, effectRef]);

  return (
    <div
      style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        top: 0,
        textAlign: 'center'
      }}
    >
      <animated.div
        style={{
          marginBottom: '5rem',
          ...animationEffect,
          ...styles
        }}
      >
        <span
          className={
            bling
              ? css`
                  background-image: linear-gradient(
                    to left,
                    ${Color[color](1)} 0%,
                    ${Color[color](0.5)} 30%,
                    ${Color[color](1)} 100%
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
                `
              : css`
                  color: ${Color[color]()};
                `
          }
          style={{
            fontSize,
            fontWeight: 'bold'
          }}
        >
          {text}
        </span>
      </animated.div>
    </div>
  );
}
