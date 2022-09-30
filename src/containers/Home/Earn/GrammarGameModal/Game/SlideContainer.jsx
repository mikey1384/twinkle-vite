import { Children, useEffect, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import ErrorBoundary from '~/components/ErrorBoundary';
import { scrollElementToCenter } from '~/helpers';

SlideContainer.propTypes = {
  children: PropTypes.node,
  selectedIndex: PropTypes.number
};

export default function SlideContainer({ children, selectedIndex = 0 }) {
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
        innerRef: (ref) => (SlideRefs.current[selectedIndex] = ref),
        index: selectedIndex
      }
    };
  }, [childrenArray, selectedIndex]);

  useEffect(() => {
    scrollElementToCenter(SlideRefs.current[selectedIndex]);
  }, [selectedIndex]);

  return (
    <ErrorBoundary
      componentPath="Earn/GrammarGameModal/SlideContainer"
      style={{ width: '100%' }}
    >
      <div style={{ width: '100%', minHeight: '7rem' }}>{DisplayedSlide}</div>
    </ErrorBoundary>
  );
}
