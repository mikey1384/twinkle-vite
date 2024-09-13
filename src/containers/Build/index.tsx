import React, { useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import Project from './Project';
import MainMenu from './MainMenu';
import { useTransition, animated } from 'react-spring';

export default function Build() {
  const [isBuildScreenShown, setIsBuildScreenShown] = useState(false);

  const transitions = useTransition(isBuildScreenShown, {
    from: { opacity: 0, transform: 'translateX(0%)' },
    enter: { opacity: 1, transform: 'translateX(0%)' },
    leave: { opacity: 0, transform: 'translateX(-100%)' }
  });

  return (
    <ErrorBoundary componentPath="App">
      {transitions((styles, item) =>
        item ? (
          <animated.div style={{ ...styles, width: '100%', height: '100%' }}>
            <Project onSetIsBuildScreenShown={setIsBuildScreenShown} />
          </animated.div>
        ) : (
          <animated.div style={{ ...styles, width: '100%', height: '100%' }}>
            <MainMenu
              onOptionSelect={(option: string) => console.log(option)}
              onSetIsBuildScreenShown={setIsBuildScreenShown}
            />
          </animated.div>
        )
      )}
    </ErrorBoundary>
  );
}
