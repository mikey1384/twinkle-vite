import { useMemo } from 'react';
import { Color } from '~/constants/css';

export default function ReactionText() {
  const reactionFontSize = useMemo(() => {
    return '3rem';
  }, []);

  const reactionColor = useMemo(() => {
    return Color.gold();
  }, []);

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
      <div
        style={{
          marginBottom: '5rem',
          fontSize: reactionFontSize,
          color: reactionColor
        }}
      >
        AWESOME
      </div>
    </div>
  );
}
