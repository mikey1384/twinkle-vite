import React, { Children, useEffect, useMemo, useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import ProgressBar from './ProgressBar';
import ReactionText from './ReactionText';
import { useSpring, animated } from 'react-spring';

export default function SlideContainer({
  children,
  isCompleted,
  isOnStreak,
  onCountdownStart,
  questions,
  selectedIndex = 0
}: {
  children: any;
  isCompleted: boolean;
  isOnStreak: boolean;
  onCountdownStart: () => void;
  questions: any;
  selectedIndex: number;
}) {
  const [streakEffectOff, setStreakEffectOff] = useState(false);
  const questionsStyle = useSpring({ opacity: isCompleted ? 0 : 1 });
  const childrenArray = useMemo(() => Children.toArray(children), [children]);
  const DisplayedSlide = useMemo(() => {
    const SlideComponent: any = childrenArray.filter(
      (_, index) => index === selectedIndex
    )[0];
    return SlideComponent
      ? React.cloneElement(SlideComponent, {
          onCountdownStart,
          index: selectedIndex,
          isCompleted
        })
      : null;
  }, [childrenArray, isCompleted, onCountdownStart, selectedIndex]);

  useEffect(() => {
    if (isCompleted) {
      setTimeout(() => setStreakEffectOff(true), 1000);
    }
  }, [isCompleted]);

  return (
    <ErrorBoundary componentPath="Earn/GrammarGameModal/Game/Main/SlideContainer">
      <div style={{ width: '100%', position: 'relative' }}>
        <animated.div
          style={{
            width: '100%',
            minHeight: '7rem',
            marginTop: '2rem',
            ...questionsStyle
          }}
        >
          {DisplayedSlide}
        </animated.div>
        {isCompleted && <ReactionText questions={questions} />}
        <ProgressBar
          questions={questions}
          isOnStreak={isOnStreak && !streakEffectOff}
          isCompleted={isCompleted}
          selectedIndex={selectedIndex}
          style={{ marginBottom: '3rem' }}
        />
      </div>
    </ErrorBoundary>
  );
}
