import React, { useMemo } from 'react';
import { useChain, useSpring, useSpringRef, animated } from 'react-spring';
import { css } from '@emotion/css';
import { useRoleColor } from '~/theme/useRoleColor';
import { Color } from '~/constants/css';

export default function ReactionText({ difficulty }: { difficulty: number }) {
  const perfectRole = useRoleColor('grammarGameScorePerfect', {
    fallback: 'brownOrange'
  });
  const roleA = useRoleColor('grammarGameScoreA', { fallback: 'magenta' });
  const roleB = useRoleColor('grammarGameScoreB', { fallback: 'orange' });
  const roleC = useRoleColor('grammarGameScoreC', { fallback: 'pink' });
  const roleD = useRoleColor('grammarGameScoreD', { fallback: 'logoBlue' });

  const reactionObj = useMemo(() => {
    if (difficulty === 5)
      return {
        role: perfectRole,
        fontSize: '5rem',
        text: 'LEVEL 5 CLEARED',
        bling: true
      };
    if (difficulty === 4)
      return {
        role: roleA,
        fontSize: '3.5rem',
        text: 'LEVEL 4 CLEARED',
        bling: true
      };
    if (difficulty === 3)
      return {
        role: roleB,
        fontSize: '3rem',
        text: 'LEVEL 3 CLEARED',
        bling: true
      };
    if (difficulty === 2)
      return {
        role: roleC,
        fontSize: '2.5rem',
        text: 'LEVEL 2 CLEARED',
        bling: false
      };
    if (difficulty === 1)
      return {
        role: roleD,
        fontSize: '2rem',
        text: `LEVEL 1 CLEARED`,
        bling: false
      };
    return {};
  }, [difficulty, perfectRole, roleA, roleB, roleC, roleD]);
  const effectRef = useSpringRef();
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

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        top: 0,
        textAlign: 'center'
      }}
    >
      <animated.div
        style={{
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
                  animation: bling 1.5s ease 1;
                  @keyframes bling {
                    0% {
                      background-position: 100% 0%;
                    }

                    50% {
                      background-position: 10% 10%;
                    }

                    100% {
                      background-position: 100% 0%;
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
      </animated.div>
    </div>
  );
}
