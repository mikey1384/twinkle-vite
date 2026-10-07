import React, { useMemo } from 'react';
import { useChain, useSpring, useSpringRef, animated } from '@react-spring/web';
import { css } from '@emotion/css';
import { scoreTable, perfectScoreBonus } from '../../../constants';
import { useRoleColor } from '~/theme/hooks/useRoleColor';
import { Color } from '~/constants/css';
import {
  PIXEL_FONT,
  pixelStarCls,
  pop,
  twinkle
} from '../../../ClassicArcade/theme';

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
  const glowColor = role?.getColor(0.6) || Color.logoBlue(0.6);
  const isPerfect = totalScore === perfectScore;
  // Pixel type runs wide: one-word cheers scale to fit the screen, the
  // longer encouragement lines wrap at a smaller size.
  const isShout = text.length <= 12;
  const pixelSize = isShout
    ? `min(${fontSize}, calc((100vw - 6rem) / ${text.length}))`
    : '1.5rem';

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
        textAlign: 'center',
        padding: '0 1.5rem'
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
          className={css`
            position: relative;
            display: inline-block;
            font-family: ${PIXEL_FONT};
            line-height: ${isShout ? 1.2 : 1.8};
            color: ${bling ? '#ffffff' : baseColor};
            text-shadow:
              0 0 ${bling ? 6 : 4}px ${baseColor},
              0 0 ${bling ? 18 : 10}px ${glowColor},
              ${bling ? `0 0 34px ${glowColor},` : ''} 0 4px 0 #120734;
            animation: ${pop} 520ms cubic-bezier(0.2, 0.8, 0.3, 1.2) both;
          `}
          style={{ fontSize: pixelSize }}
        >
          {isPerfect
            ? STARS.map((star, i) => (
                <span
                  key={i}
                  aria-hidden
                  className={css`
                    ${pixelStarCls(star.color, 4)};
                    top: ${star.top};
                    left: ${star.left};
                    animation: ${twinkle} 0.9s ease-in-out ${star.delay} 3;
                  `}
                />
              ))
            : null}
          {text}
        </span>
      </AnimatedDiv>
    </div>
  );
}

// star sparkles around PERFECT
const STARS = [
  { top: '-1.4rem', left: '-1.6rem', color: '#ffd54a', delay: '0s' },
  { top: '-1.8rem', left: '62%', color: '#ffffff', delay: '0.25s' },
  { top: '110%', left: '18%', color: '#4ff3ff', delay: '0.5s' },
  { top: '30%', left: '104%', color: '#ffd54a', delay: '0.15s' },
  { top: '120%', left: '88%', color: '#ff7ae0', delay: '0.4s' }
];
