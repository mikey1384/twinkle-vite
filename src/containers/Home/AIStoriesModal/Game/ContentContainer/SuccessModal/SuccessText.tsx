import React, { useMemo } from 'react';
import { Color } from '~/constants/css';
import { useChain, useSpring, useSpringRef, animated } from 'react-spring';
import { useKeyContext } from '~/contexts';
import { css } from '@emotion/css';

export default function ReactionText({ difficulty }: { difficulty: number }) {
  const {
    grammarGameScorePerfect: { color: colorPerfect },
    grammarGameScoreA: { color: colorA },
    grammarGameScoreB: { color: colorB },
    grammarGameScoreC: { color: colorC },
    grammarGameScoreD: { color: colorD }
  } = useKeyContext((v) => v.theme);
  const reactionObj = useMemo(() => {
    if (difficulty === 5)
      return {
        color: colorPerfect,
        fontSize: '5rem',
        text: 'LEVEL 5 CLEARED',
        bling: true
      };
    if (difficulty === 4)
      return {
        color: colorA,
        fontSize: '3.5rem',
        text: 'LEVEL 4 CLEARED',
        bling: true
      };
    if (difficulty === 3)
      return {
        color: colorB,
        fontSize: '3rem',
        text: 'LEVEL 3 CLEARED',
        bling: true
      };
    if (difficulty === 2)
      return {
        color: colorC,
        fontSize: '2.5rem',
        text: 'LEVEL 2 CLEARED',
        bling: false
      };
    if (difficulty === 1)
      return {
        color: colorD,
        fontSize: '2rem',
        text: `LEVEL 1 CLEARED`,
        bling: false
      };
    return {};
  }, [difficulty, colorPerfect, colorA, colorB, colorC, colorD]);
  const effectRef = useSpringRef();
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
                    ${Color[color](1)} 0%,
                    ${Color[color](0.5)} 30%,
                    ${Color[color](1)} 100%
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
