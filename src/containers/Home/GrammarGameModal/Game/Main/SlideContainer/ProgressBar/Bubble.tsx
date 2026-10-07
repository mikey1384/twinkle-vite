import React, { useMemo } from 'react';

export default function Bubble({
  index,
  isCompleted,
  isOnStreak,
  question,
  style
}: {
  index: number;
  isCompleted: boolean;
  isOnStreak: boolean;
  question: any;
  style: React.CSSProperties;
}) {
  const animationDelay = useMemo(() => {
    return isOnStreak && isCompleted ? `${(index * 350) / 5}ms` : '';
  }, [index, isCompleted, isOnStreak]);
  const grade = useMemo(() => question.score, [question.score]);
  return (
    <div
      style={{ ...style, animationDelay }}
      className={`${isOnStreak && isCompleted ? 'waving' : ''}`}
    >
      <div
        // look (glass marble, pixel letter) comes from ProgressBar's styles
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
        className={`ball gloss ${
          grade ? `graded${grade}${isOnStreak ? ' streak' : ''}` : ''
        }`}
      >
        {grade ? question.score : ''}
      </div>
    </div>
  );
}
