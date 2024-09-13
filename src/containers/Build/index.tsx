import React, { useState, useEffect } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import Loading from '~/components/Loading';
import Project from './Project';
import MainMenu from './MainMenu';
import { useTransition, animated } from 'react-spring';

export default function App() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [showBuildScreen, setShowBuildScreen] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setIsLoaded(true);
    }, 1000);
  }, []);

  const transitions = useTransition(showBuildScreen, {
    from: { opacity: 0, transform: 'translateX(0%)' },
    enter: { opacity: 1, transform: 'translateX(0%)' },
    leave: { opacity: 0, transform: 'translateX(-100%)' }
  });

  if (!isLoaded) {
    return <Loading text="Loading..." />;
  }

  return (
    <ErrorBoundary componentPath="App">
      {transitions((styles, item) =>
        item ? (
          <animated.div style={{ ...styles, width: '100%', height: '100%' }}>
            <Project />
          </animated.div>
        ) : (
          <animated.div style={{ ...styles, width: '100%', height: '100%' }}>
            <MainMenu onOptionSelect={handleOptionSelect} />
          </animated.div>
        )
      )}
    </ErrorBoundary>
  );

  function handleOptionSelect(option: string) {
    if (option === 'new' || option === 'load') {
      setShowBuildScreen(true);
    }
  }
}
