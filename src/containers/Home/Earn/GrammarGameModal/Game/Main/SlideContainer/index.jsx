import { Children, useEffect, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import ErrorBoundary from '~/components/ErrorBoundary';
import ProgressBar from './ProgressBar';
import { Color } from '~/constants/css';
import { useSpring, animated } from 'react-spring';
import { scrollElementToCenter } from '~/helpers';

SlideContainer.propTypes = {
  children: PropTypes.node,
  isCompleted: PropTypes.bool,
  isOnStreak: PropTypes.bool,
  onCountdownStart: PropTypes.func,
  questions: PropTypes.array,
  selectedIndex: PropTypes.number
};

export default function SlideContainer({
  children,
  isCompleted,
  isOnStreak,
  onCountdownStart,
  questions,
  selectedIndex = 0
}) {
  const questionsStyle = useSpring({ opacity: isCompleted ? 0 : 1 });
  const SlideRefs = useRef({});
  const childrenArray = useMemo(() => Children.toArray(children), [children]);
  const DisplayedSlide = useMemo(() => {
    const SlideComponent = childrenArray.filter(
      (child, index) => index === selectedIndex
    )[0];
    return {
      ...SlideComponent,
      props: {
        ...SlideComponent?.props,
        onCountdownStart,
        innerRef: (ref) => (SlideRefs.current[selectedIndex] = ref),
        index: selectedIndex,
        isCompleted
      }
    };
  }, [childrenArray, isCompleted, onCountdownStart, selectedIndex]);

  useEffect(() => {
    scrollElementToCenter(SlideRefs.current[selectedIndex]);
  }, [selectedIndex]);

  const reactionFontSize = useMemo(() => {
    return '3rem';
  }, []);

  const reactionColor = useMemo(() => {
    return Color.brownOrange();
  }, []);

  return (
    <ErrorBoundary componentPath="Earn/GrammarGameModal/SlideContainer">
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
        {isCompleted && (
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
        )}
        <ProgressBar
          questions={questions}
          isOnStreak={isOnStreak}
          isCompleted={isCompleted}
          selectedIndex={selectedIndex}
          style={{ marginBottom: '3rem' }}
        />
      </div>
    </ErrorBoundary>
  );
}
