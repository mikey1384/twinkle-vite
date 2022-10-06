import { Children, useEffect, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import ErrorBoundary from '~/components/ErrorBoundary';
import ProgressBar from './ProgressBar';
import { scrollElementToCenter } from '~/helpers';

SlideContainer.propTypes = {
  children: PropTypes.node,
  isOnStreak: PropTypes.bool,
  onCountdownStart: PropTypes.func,
  questions: PropTypes.array,
  selectedIndex: PropTypes.number
};

export default function SlideContainer({
  children,
  isOnStreak,
  onCountdownStart,
  questions,
  selectedIndex = 0
}) {
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
        index: selectedIndex
      }
    };
  }, [childrenArray, onCountdownStart, selectedIndex]);

  useEffect(() => {
    scrollElementToCenter(SlideRefs.current[selectedIndex]);
  }, [selectedIndex]);

  return (
    <ErrorBoundary
      componentPath="Earn/GrammarGameModal/SlideContainer"
      style={{ width: '100%' }}
    >
      <div style={{ width: '100%', minHeight: '7rem', marginTop: '2rem' }}>
        {DisplayedSlide}
      </div>
      <ProgressBar
        questions={questions}
        isOnStreak={isOnStreak}
        style={{ marginBottom: '3rem' }}
      />
    </ErrorBoundary>
  );
}
