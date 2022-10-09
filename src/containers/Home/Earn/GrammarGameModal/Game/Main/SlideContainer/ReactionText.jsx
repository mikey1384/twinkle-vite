import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Color } from '~/constants/css';
import { useSpring, animated } from 'react-spring';

ReactionText.propTypes = {
  questions: PropTypes.array.isRequired
};

export default function ReactionText({ questions }) {
  const totalScore = useMemo(() => {
    const scoreTable = {
      S: 150,
      A: 100,
      B: 70,
      C: 50,
      D: 30,
      F: 0
    };
    const sum = questions.reduce((acc, cur) => acc + scoreTable[cur.score], 0);
    if (sum === 150 * 10) {
      return 10000;
    }
  }, [questions]);

  const reactionText = useMemo(() => {
    return 'AWESOME';
  }, []);

  const reactionFontSize = useMemo(() => {
    if (totalScore === 10000) return '5rem';
    if (totalScore > 1500) return '3.5rem';
    if (totalScore > 1000) return '3rem';
    if (totalScore > 500) return '2.5rem';
    if (totalScore > 300) return '2rem';
    return '1.5rem';
  }, [totalScore]);

  const reactionColor = useMemo(() => {
    return Color.gold();
  }, []);

  const animationOutput = useMemo(() => {
    return [1, 0.8, 0.5, 1.1, 0.5, 1.1, 1.03, 1];
  }, []);

  const { x } = useSpring({
    from: { x: 0 },
    x: 1,
    config: { duration: 1000 }
  });

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
          fontSize: reactionFontSize,
          color: reactionColor,
          fontWeight: 'bold',
          opacity: x.to({ range: [0, 1], output: [0.3, 1] }),
          scale: x.to({
            range: [0, 0.25, 0.35, 0.45, 0.55, 0.65, 0.75, 1],
            output: animationOutput
          })
        }}
      >
        {reactionText}
      </animated.div>
    </div>
  );
}
