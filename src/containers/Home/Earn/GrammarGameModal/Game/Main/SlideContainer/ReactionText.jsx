import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Color } from '~/constants/css';
import { useSpring, animated } from 'react-spring';
import { useKeyContext } from '~/contexts';
import { css } from '@emotion/css';

ReactionText.propTypes = {
  questions: PropTypes.array.isRequired
};

const scoreTable = {
  S: 150,
  A: 100,
  B: 70,
  C: 50,
  D: 30,
  F: 10
};
const perfectScore = 10000;

export default function ReactionText({ questions }) {
  const {
    grammarGameScorePerfect: { color: colorPerfect },
    grammarGameScoreA: { color: colorA },
    grammarGameScoreB: { color: colorB },
    grammarGameScoreC: { color: colorC },
    grammarGameScoreD: { color: colorD },
    grammarGameScoreF: { color: colorF }
  } = useKeyContext((v) => v.theme);
  const totalScore = useMemo(() => {
    const sum = questions.reduce((acc, cur) => acc + scoreTable[cur.score], 0);
    if (sum === 150 * 10) {
      return perfectScore;
    }
    return sum;
  }, [questions]);

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
        text: 'Better luck next time',
        bling: false
      };
    return {
      color: Color[colorF](),
      fontSize: '1.5rem',
      text: `Don't give up, keep trying`,
      bling: false
    };
  }, [colorA, colorB, colorC, colorD, colorF, colorPerfect, totalScore]);

  const { x } = useSpring({
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
  }, [totalScore, x]);

  const { color, fontSize, text, bling } = reactionObj;

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
          ...animationEffect
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
                  animation: bling 3s ease infinite;
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
