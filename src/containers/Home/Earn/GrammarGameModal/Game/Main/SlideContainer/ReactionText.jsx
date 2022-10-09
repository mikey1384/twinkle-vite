import { useMemo } from 'react';
import { Color } from '~/constants/css';
import { useSpring, animated } from 'react-spring';

export default function ReactionText() {
  const reactionFontSize = useMemo(() => {
    return '3rem';
  }, []);

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
        AWESOME
      </animated.div>
    </div>
  );
}
