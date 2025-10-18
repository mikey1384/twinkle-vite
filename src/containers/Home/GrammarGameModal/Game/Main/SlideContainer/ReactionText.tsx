import React, { useMemo } from 'react';
import { useChain, useSpring, useSpringRef, animated } from 'react-spring';
import { css } from '@emotion/css';
import { scoreTable, perfectScoreBonus } from '../../../constants';
import { useRoleColor } from '~/theme/useRoleColor';
import { Color } from '~/constants/css';

export default function ReactionText({ questions }: { questions: any[] }) {
  const perfectRole = useRoleColor('grammarGameScorePerfect', {
    fallback: 'brownOrange'
  });
  const roleA = useRoleColor('grammarGameScoreA', { fallback: 'magenta' });
  const roleB = useRoleColor('grammarGameScoreB', { fallback: 'orange' });
  const roleC = useRoleColor('grammarGameScoreC', { fallback: 'pink' });
  const roleD = useRoleColor('grammarGameScoreD', { fallback: 'logoBlue' });
  const roleF = useRoleColor('grammarGameScoreF', { fallback: 'gray' });
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
        role: perfectRole,
        fontSize: '5rem',
        text: 'PERFECT',
        bling: true
      };
    if (totalScore > scoreTable.A * 10)
      return {
        role: roleA,
        fontSize: '3.5rem',
        text: 'OUTSTANDING',
        bling: true
      };
    if (totalScore > scoreTable.B * 10)
      return {
        role: roleB,
        fontSize: '3rem',
        text: 'GREAT',
        bling: true
      };
    if (totalScore > scoreTable.C * 10)
      return {
        role: roleC,
        fontSize: '2.5rem',
        text: 'Good',
        bling: false
      };
    if (totalScore > scoreTable.D * 10)
      return {
        role: roleD,
        fontSize: '2rem',
        text: `It wasn't good but it wasn't terrible either`,
        bling: false
      };
    return {
      role: roleF,
      fontSize: '1.7rem',
      text: `You just need more practice, that's all`,
      bling: false
    };
  }, [
    perfectRole,
    roleA,
    roleB,
    roleC,
    roleD,
    roleF,
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
  const { role, fontSize, text, bling } = reactionObj;
  const baseColor = role?.getColor() || Color.logoBlue();
  const gradientStart = role?.getColor(1) || baseColor;
  const gradientMid = role?.getColor(0.5) || Color.logoBlue(0.5);

  useChain([opacityRef, effectRef]);

  const AnimatedDiv = animated('div');

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
      <AnimatedDiv
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
                    ${gradientStart} 0%,
                    ${gradientMid} 30%,
                    ${gradientStart} 100%
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
                  color: ${baseColor};
                `
          }
          style={{
            fontSize,
            fontWeight: 'bold'
          }}
        >
          {text}
        </span>
      </AnimatedDiv>
    </div>
  );
}
